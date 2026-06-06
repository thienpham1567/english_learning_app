/**
 * ElevenLabs Text-to-Speech API client.
 *
 * Endpoint: POST https://api.elevenlabs.io/v1/text-to-speech/{voice_id}
 * Auth: xi-api-key header
 * Model: eleven_flash_v2_5 (fast, uses 0.5 credits/char → doubles free quota)
 *
 * Requires: ELEVENLABS_API_KEY env var.
 */

const ELEVENLABS_BASE_URL = "https://api.elevenlabs.io/v1/text-to-speech";
const ELEVENLABS_MODEL = "eleven_flash_v2_5";
const MAX_RETRIES = 2;

export function isElevenLabsAvailable(): boolean {
  return !!process.env.ELEVENLABS_API_KEY;
}

export async function synthesizeElevenLabsTts(args: {
  text: string;
  voiceId: string;
  speed?: number;
  signal?: AbortSignal;
}): Promise<ArrayBuffer> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    throw new Error("[ElevenLabs TTS] ELEVENLABS_API_KEY is not set");
  }

  const url = `${ELEVENLABS_BASE_URL}/${args.voiceId}`;
  const speed = Math.max(0.25, Math.min(args.speed ?? 1, 4.0));

  const startMs = Date.now();
  console.log(
    `[ElevenLabs TTS] Request: voiceId=${args.voiceId}, speed=${speed}, text="${args.text.slice(0, 60)}..."`,
  );

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
        accept: "audio/mpeg",
      },
      body: JSON.stringify({
        text: args.text,
        model_id: ELEVENLABS_MODEL,
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.0,
          use_speaker_boost: true,
        },
      }),
      signal: args.signal,
    });

    if (res.status === 429 && attempt < MAX_RETRIES) {
      const retryAfter = Number(res.headers.get("retry-after")) || 5;
      console.warn(
        `[ElevenLabs TTS] 429 rate-limited — retrying in ${retryAfter}s (attempt ${attempt + 1}/${MAX_RETRIES})`,
      );
      await new Promise((r) => setTimeout(r, retryAfter * 1000));
      continue;
    }

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      const elapsed = Date.now() - startMs;
      console.error(`[ElevenLabs TTS] ERROR ${res.status} (${elapsed}ms): ${errText}`);
      throw new Error(`ElevenLabs TTS ${res.status}: ${errText}`);
    }

    const audioBuffer = await res.arrayBuffer();
    const elapsed = Date.now() - startMs;
    console.log(
      `[ElevenLabs TTS] OK (${elapsed}ms): ${audioBuffer.byteLength} bytes, voiceId=${args.voiceId}`,
    );
    return audioBuffer;
  }

  throw new Error("ElevenLabs TTS: exhausted retries");
}
