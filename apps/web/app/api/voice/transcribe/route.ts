import { headers } from "next/headers";
import { auth } from "@/lib/auth";

/**
 * POST /api/voice/transcribe
 *
 * Transcribes audio via Groq Whisper (preferred, free) with OpenAI Whisper fallback.
 * Returns { text, durationSec, words } where words may be empty on older fallback paths.
 *
 * Priority: GROQ_API_KEY → OPENAI_DIRECT_API_KEY
 * Groq free tier: 7,200 requests/day, Whisper Large V3 Turbo (~10x faster than OpenAI).
 *
 * Rate limited to 10 calls per user per minute.
 * Accepts multipart: `audio` (<=1MB, allowed MIME), `durationMs` (<=25000).
 */

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_MS = 60_000;

const MAX_AUDIO_BYTES = 1_000_000;
const MAX_DURATION_MS = 25_000;

const ALLOWED_AUDIO_MIME = new Set([
  "audio/webm",
  "audio/webm;codecs=opus",
  "audio/mp4",
  "audio/mpeg",
  "audio/wav",
  "audio/x-wav",
]);

type WhisperWord = { word: string; start: number; end: number };
type WhisperVerbose = {
  text: string;
  duration?: number;
  words?: WhisperWord[];
};

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = Date.now();
  const userId = session.user.id;
  const entry = rateLimitMap.get(userId);
  if (entry && entry.resetAt > now) {
    if (entry.count >= RATE_LIMIT_MAX) {
      return Response.json({ error: "Rate limit exceeded. Try again later." }, { status: 429 });
    }
    entry.count++;
  } else {
    rateLimitMap.set(userId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
  }

  const groqKey = process.env.GROQ_API_KEY;
  const openaiKey = process.env.OPENAI_DIRECT_API_KEY;

  const provider = groqKey
    ? { key: groqKey, url: "https://api.groq.com/openai/v1/audio/transcriptions", model: "whisper-large-v3-turbo", name: "Groq" }
    : openaiKey
      ? { key: openaiKey, url: "https://api.openai.com/v1/audio/transcriptions", model: "whisper-1", name: "OpenAI" }
      : null;

  if (!provider) {
    return Response.json(
      { error: "No transcription API key configured (GROQ_API_KEY or OPENAI_DIRECT_API_KEY)" },
      { status: 500 },
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return Response.json({ error: "Invalid multipart body" }, { status: 400 });
  }

  const audioFile = formData.get("audio");
  if (!(audioFile instanceof File)) {
    return Response.json({ error: "No audio file provided" }, { status: 400 });
  }

  if (audioFile.size > MAX_AUDIO_BYTES) {
    return Response.json({ error: "Audio too large (max 1MB)" }, { status: 413 });
  }

  const mimeBase = (audioFile.type || "").split(";")[0]?.trim().toLowerCase() ?? "";
  const mimeFull = (audioFile.type || "").trim().toLowerCase();
  if (!ALLOWED_AUDIO_MIME.has(mimeFull) && !ALLOWED_AUDIO_MIME.has(mimeBase)) {
    return Response.json({ error: `Unsupported audio type: ${audioFile.type || "unknown"}` }, { status: 415 });
  }

  const durationRaw = formData.get("durationMs");
  const durationMs = typeof durationRaw === "string" ? Number(durationRaw) : NaN;
  if (!Number.isFinite(durationMs) || durationMs <= 0 || durationMs > MAX_DURATION_MS) {
    return Response.json(
      { error: `Invalid or missing durationMs (must be 1..${MAX_DURATION_MS})` },
      { status: 400 },
    );
  }

  try {
    const whisperForm = new FormData();
    whisperForm.append("file", audioFile, audioFile.name || "audio.webm");
    whisperForm.append("model", provider.model);
    whisperForm.append("language", "en");
    whisperForm.append("response_format", "verbose_json");
    whisperForm.append("timestamp_granularities[]", "word");

    const response = await fetch(provider.url, {
      method: "POST",
      headers: { Authorization: `Bearer ${provider.key}` },
      body: whisperForm,
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      console.error(`[${provider.name} Whisper] Error:`, response.status, errorText);
      return Response.json({ error: "Transcription failed" }, { status: 502 });
    }

    const result = (await response.json()) as WhisperVerbose;
    const words = Array.isArray(result.words)
      ? result.words.map((w) => ({
          word: w.word,
          startMs: Math.round((w.start ?? 0) * 1000),
          endMs: Math.round((w.end ?? 0) * 1000),
        }))
      : [];

    return Response.json({
      text: result.text,
      durationSec: typeof result.duration === "number" ? result.duration : durationMs / 1000,
      words,
    });
  } catch (err) {
    console.error(`[${provider.name} Whisper] Unexpected error:`, err);
    return Response.json({ error: "Internal error" }, { status: 500 });
  }
}
