/**
 * Text-to-Speech via Groq Orpheus API.
 *
 * Uses the OpenAI-compatible endpoint: https://api.groq.com/openai/v1/audio/speech
 * Model: playai-tts (Orpheus v1 English)
 * Requires: GROQ_API_KEY env var.
 */

const VOICES: Record<string, string> = {
  us: "atlas",    // clear American male
  uk: "tara",     // British-sounding female
  au: "hannah",   // neutral female (closest to AU)
} as const;

export type Accent = "us" | "uk" | "au";
export const ACCENTS: readonly Accent[] = ["us", "uk", "au"];
export const DEFAULT_ACCENT: Accent = "us";

export function parseAccent(value: unknown): Accent {
  return value === "uk" || value === "au" || value === "us" ? value : DEFAULT_ACCENT;
}

const GROQ_TTS_URL = "https://api.groq.com/openai/v1/audio/speech";
const GROQ_TTS_MODEL = "playai-tts";

export async function synthesizeTts(args: {
  text: string;
  accent: Accent;
  speed?: number;
  signal?: AbortSignal;
}): Promise<ArrayBuffer> {
  const key = process.env.GROQ_API_KEY;
  if (!key) throw new Error("Missing GROQ_API_KEY");

  const voice = VOICES[args.accent] ?? VOICES.us;
  const speed = Math.max(0.25, Math.min(args.speed ?? 1, 4.0));

  const res = await fetch(GROQ_TTS_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: GROQ_TTS_MODEL,
      input: args.text,
      voice,
      response_format: "wav",
      speed,
    }),
    signal: args.signal,
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`Groq TTS ${res.status}: ${errText}`);
  }

  return res.arrayBuffer();
}
