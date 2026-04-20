/**
 * Text-to-Speech via Groq Orpheus API.
 *
 * Uses the OpenAI-compatible endpoint: https://api.groq.com/openai/v1/audio/speech
 * Model: playai-tts (Orpheus v1 English)
 * Requires: GROQ_API_KEY env var.
 */

export type Accent = "us" | "uk" | "au";
export const ACCENTS: readonly Accent[] = ["us", "uk", "au"];
export const DEFAULT_ACCENT: Accent = "us";

export function parseAccent(value: unknown): Accent {
  return value === "uk" || value === "au" || value === "us" ? value : DEFAULT_ACCENT;
}

/**
 * Named voice roles used by multi-speaker dialogues (Story 19.3.1).
 * Each role is `${accent}-${gender}` and maps to a concrete Groq playai-tts voice.
 * Roles should remain stable — the voice-name mapping can be tuned without
 * breaking callers that only reference roles.
 */
export type VoiceRole = "us-m" | "us-f" | "uk-m" | "uk-f" | "au-m" | "au-f";

export const VOICE_ROLES: readonly VoiceRole[] = [
  "us-m",
  "us-f",
  "uk-m",
  "uk-f",
  "au-m",
  "au-f",
];

export const VOICE_BY_ROLE: Record<VoiceRole, string> = {
  "us-m": "atlas",
  "us-f": "celeste",
  "uk-m": "briggs",
  "uk-f": "tara",
  "au-m": "calum",
  "au-f": "hannah",
};

/** Friendly display name used by the UI speaker legend. */
export const ROLE_DISPLAY_NAME: Record<VoiceRole, string> = {
  "us-m": "US Male",
  "us-f": "US Female",
  "uk-m": "UK Male",
  "uk-f": "UK Female",
  "au-m": "AU Male",
  "au-f": "AU Female",
};

/** Legacy accent → default voice (single-speaker path). */
const VOICES: Record<Accent, string> = {
  us: VOICE_BY_ROLE["us-m"],
  uk: VOICE_BY_ROLE["uk-f"],
  au: VOICE_BY_ROLE["au-f"],
};

/**
 * Bump this whenever `VOICE_BY_ROLE` mappings change so cached audio is
 * invalidated (`apps/web/.cache/listening/<id>-<voiceSetVersion>.mp3`).
 */
export const VOICE_SET_VERSION = "v1";

const GROQ_TTS_URL = "https://api.groq.com/openai/v1/audio/speech";
const GROQ_TTS_MODEL = "playai-tts";

export type TtsResponseFormat = "wav" | "mp3";

export async function synthesizeTts(args: {
  text: string;
  accent: Accent;
  speed?: number;
  signal?: AbortSignal;
}): Promise<ArrayBuffer> {
  return synthesizeTtsForVoice({
    text: args.text,
    voice: VOICES[args.accent] ?? VOICES.us,
    format: "wav",
    speed: args.speed,
    signal: args.signal,
  });
}

/**
 * Low-level Groq TTS call keyed by explicit voice name.
 * Used by the multi-speaker dialogue path, which needs MP3 for frame-level
 * byte concatenation across turns.
 */
export async function synthesizeTtsForVoice(args: {
  text: string;
  voice: string;
  format?: TtsResponseFormat;
  speed?: number;
  signal?: AbortSignal;
}): Promise<ArrayBuffer> {
  const key = process.env.GROQ_API_KEY;
  if (!key) throw new Error("Missing GROQ_API_KEY");

  const speed = Math.max(0.25, Math.min(args.speed ?? 1, 4.0));

  const res = await fetch(GROQ_TTS_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: GROQ_TTS_MODEL,
      input: args.text,
      voice: args.voice,
      response_format: args.format ?? "wav",
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

export function getVoiceForRole(role: VoiceRole): string {
  return VOICE_BY_ROLE[role];
}
