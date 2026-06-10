/**
 * Kokoro TTS — self-hosted fallback via Kokoro-FastAPI.
 *
 * Kokoro-FastAPI exposes an OpenAI-compatible endpoint:
 *   POST {KOKORO_TTS_URL} with { model, input, voice, response_format, speed }
 *
 * Used as a fallback when Groq Orpheus TTS is rate-limited (429 exhausted).
 * Requires: KOKORO_TTS_URL env var (e.g. "http://localhost:8880/v1/audio/speech").
 *
 * @see https://github.com/remsky/Kokoro-FastAPI
 */

/**
 * Map Groq Orpheus voice names → Kokoro voice packs.
 *
 * Kokoro naming convention:
 *   - a = American, b = British
 *   - f = female, m = male
 *   - e.g. af_heart = American female "heart"
 *
 * Groq voices: austin, autumn, daniel, diana, troy, hannah
 */
const KOKORO_VOICE_MAP: Record<string, string> = {
  // US voices
  austin: "am_adam", // American male
  autumn: "af_heart", // American female
  // UK voices
  daniel: "bm_george", // British male
  diana: "bf_emma", // British female
  // AU voices (Kokoro has no native AU — use closest alternatives)
  troy: "am_michael", // Male fallback
  hannah: "af_bella", // Female fallback
};

const KOKORO_MODEL = "kokoro";

/**
 * Check whether Kokoro TTS is configured (KOKORO_TTS_URL is set).
 */
export function isKokoroAvailable(): boolean {
  return !!process.env.KOKORO_TTS_URL;
}

/**
 * Synthesize speech via Kokoro-FastAPI.
 *
 * Drop-in replacement for `synthesizeTtsForVoice` — same args & return type.
 * Does NOT apply RPM limiting (self-hosted = no rate limits).
 * Handles long text by relying on Kokoro-FastAPI's built-in chunking.
 */
export async function synthesizeKokoroTts(args: {
  text: string;
  voice: string;
  format?: "wav" | "mp3";
  speed?: number;
  signal?: AbortSignal;
}): Promise<ArrayBuffer> {
  const url = process.env.KOKORO_TTS_URL;
  if (!url) {
    throw new Error("[Kokoro TTS] KOKORO_TTS_URL is not set");
  }

  const apiKey = process.env.KOKORO_API_KEY || "not-needed";
  // If voice is already a native Kokoro ID (e.g., "am_adam", "bf_emma"), use directly.
  // Otherwise, map from Groq voice name (e.g., "austin" → "am_adam").
  const isNativeKokoroId = /^[ab][fm]_/.test(args.voice);
  const kokoroVoice = isNativeKokoroId ? args.voice : KOKORO_VOICE_MAP[args.voice] || "af_heart";
  const speed = Math.max(0.25, Math.min(args.speed ?? 1, 4.0));
  const format = args.format ?? "wav";

  const startMs = Date.now();
  console.log(
    `[Kokoro TTS] Request: voice=${args.voice}→${kokoroVoice}, format=${format}, speed=${speed}, text="${args.text.slice(0, 60)}..."`,
  );

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: KOKORO_MODEL,
      input: args.text,
      voice: kokoroVoice,
      response_format: format,
      speed,
    }),
    signal: args.signal,
  });

  const elapsed = Date.now() - startMs;

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    console.error(`[Kokoro TTS] ERROR ${res.status} (${elapsed}ms): ${errText}`);
    throw new Error(`Kokoro TTS ${res.status}: ${errText}`);
  }

  const audioBuffer = await res.arrayBuffer();
  console.log(
    `[Kokoro TTS] OK (${elapsed}ms): ${audioBuffer.byteLength} bytes, voice=${kokoroVoice}`,
  );
  return audioBuffer;
}
