import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { synthesizeTtsForVoice, VOICES, parseAccent } from "@/lib/tts/groq";

/**
 * POST /api/reading/audio/paragraph
 * Body: { text: string, voice?: string, accent?: "us"|"uk"|"au" }
 *
 * Synthesises Groq Orpheus TTS for a single paragraph.
 * Returns WAV audio as a binary response.
 */

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_MS = 60_000;

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Rate limit
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

  try {
    const body = await request.json() as { text?: string; voice?: string; accent?: string };
    const text = body.text?.trim();

    if (!text || text.length < 2) {
      return Response.json({ error: "Text is required" }, { status: 400 });
    }
    if (text.length > 2000) {
      return Response.json({ error: "Text too long (max 2000 chars)" }, { status: 400 });
    }

    const accent = parseAccent(body.accent);
    const voice = body.voice || VOICES[accent];

    console.log(`[Paragraph TTS] voice=${voice}, text=${text.length} chars`);

    const audioBuffer = await synthesizeTtsForVoice({
      text,
      voice,
      format: "wav",
      speed: 0.9,
    });

    return new Response(new Uint8Array(audioBuffer), {
      headers: {
        "Content-Type": "audio/wav",
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[Paragraph TTS] Error: ${message}`);
    return Response.json({ error: `TTS failed: ${message}` }, { status: 502 });
  }
}
