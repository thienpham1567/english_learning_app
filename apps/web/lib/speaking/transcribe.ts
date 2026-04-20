/**
 * Server-side transcription helper for the speaking feature.
 *
 * Speaking free-talk recordings can be up to 150s, so this helper uses a
 * larger audio/duration ceiling than the shared /voice/transcribe endpoint
 * (which is capped at 25s / 1MB for short dictation use cases).
 */

const MAX_AUDIO_BYTES = 3_500_000; // ~3.5MB — enough for 150s of opus audio
const MAX_DURATION_MS = 150_000;

const ALLOWED_AUDIO_MIME = new Set([
  "audio/webm",
  "audio/webm;codecs=opus",
  "audio/mp4",
  "audio/mpeg",
  "audio/wav",
  "audio/x-wav",
]);

export type TranscribeSuccess = {
  ok: true;
  text: string;
  durationMs: number;
};

export type TranscribeError = {
  ok: false;
  status: number;
  error: string;
};

export type TranscribeResult = TranscribeSuccess | TranscribeError;

export async function transcribeSpeakingAudio(
  audioFile: File,
  durationMs: number,
): Promise<TranscribeResult> {
  if (audioFile.size > MAX_AUDIO_BYTES) {
    return { ok: false, status: 413, error: "Audio too large (max ~3.5MB)" };
  }

  const mimeBase = (audioFile.type || "").split(";")[0]?.trim().toLowerCase() ?? "";
  const mimeFull = (audioFile.type || "").trim().toLowerCase();
  if (!ALLOWED_AUDIO_MIME.has(mimeFull) && !ALLOWED_AUDIO_MIME.has(mimeBase)) {
    return {
      ok: false,
      status: 415,
      error: `Unsupported audio type: ${audioFile.type || "unknown"}`,
    };
  }

  if (!Number.isFinite(durationMs) || durationMs <= 0 || durationMs > MAX_DURATION_MS) {
    return {
      ok: false,
      status: 400,
      error: `Invalid durationMs (must be 1..${MAX_DURATION_MS})`,
    };
  }

  const groqKey = process.env.GROQ_API_KEY;
  const openaiKey = process.env.OPENAI_DIRECT_API_KEY;

  const provider = groqKey
    ? {
        key: groqKey,
        url: "https://api.groq.com/openai/v1/audio/transcriptions",
        model: "whisper-large-v3-turbo",
        name: "Groq",
      }
    : openaiKey
      ? {
          key: openaiKey,
          url: "https://api.openai.com/v1/audio/transcriptions",
          model: "whisper-1",
          name: "OpenAI",
        }
      : null;

  if (!provider) {
    return {
      ok: false,
      status: 500,
      error: "No transcription API key configured",
    };
  }

  const whisperForm = new FormData();
  whisperForm.append("file", audioFile, audioFile.name || "audio.webm");
  whisperForm.append("model", provider.model);
  whisperForm.append("language", "en");
  whisperForm.append("response_format", "json");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60_000);

  try {
    const response = await fetch(provider.url, {
      method: "POST",
      headers: { Authorization: `Bearer ${provider.key}` },
      body: whisperForm,
      signal: controller.signal,
    });

    if (!response.ok) {
      console.error(`[${provider.name} Whisper] HTTP`, response.status);
      return { ok: false, status: 502, error: "Transcription failed" };
    }

    const result = (await response.json()) as { text?: string };
    const text = (result.text ?? "").trim();
    return { ok: true, text, durationMs };
  } catch (err) {
    const aborted = err instanceof Error && err.name === "AbortError";
    console.error(`[${provider.name} Whisper] ${aborted ? "timeout" : "error"}`);
    return {
      ok: false,
      status: aborted ? 504 : 502,
      error: aborted ? "Transcription timed out" : "Transcription failed",
    };
  } finally {
    clearTimeout(timeout);
  }
}
