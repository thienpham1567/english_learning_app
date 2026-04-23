/**
 * Text-to-Speech via Groq Orpheus API.
 *
 * Uses the OpenAI-compatible endpoint: https://api.groq.com/openai/v1/audio/speech
 * Model: canopylabs/orpheus-v1-english (Orpheus v1 English)
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
 * Each role is `${accent}-${gender}` and maps to a concrete Groq Orpheus voice.
 * Roles should remain stable — the voice-name mapping can be tuned without
 * breaking callers that only reference roles.
 *
 * Available English voices: autumn, diana, hannah, austin, daniel, troy
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
  "us-m": "austin",
  "us-f": "autumn",
  "uk-m": "daniel",
  "uk-f": "diana",
  "au-m": "troy",
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
export const VOICES: Record<Accent, string> = {
  us: VOICE_BY_ROLE["us-m"],
  uk: VOICE_BY_ROLE["uk-f"],
  au: VOICE_BY_ROLE["au-f"],
};

/**
 * Bump this whenever `VOICE_BY_ROLE` mappings change so cached audio is
 * invalidated (`apps/web/.cache/listening/<id>-<voiceSetVersion>.mp3`).
 */
export const VOICE_SET_VERSION = "v2";

const GROQ_TTS_URL = "https://api.groq.com/openai/v1/audio/speech";
const GROQ_TTS_MODEL = "canopylabs/orpheus-v1-english";

/**
 * Groq on_demand tier caps Orpheus at 10 RPM. We serialize all TTS calls
 * through a tiny FIFO with a max in-flight count and enforce a minimum
 * gap between request starts so bursts of chunks don't all 429 at once.
 * Retries honor the `retry-after` header on 429 responses.
 */
const TTS_MAX_IN_FLIGHT = 2;
const TTS_MIN_GAP_MS = 6500; // ≈ 9 RPM, under Groq's 10 RPM on_demand cap
const TTS_MAX_RETRIES = 5;

let ttsInFlight = 0;
let ttsLastStartMs = 0;
const ttsQueue: Array<() => void> = [];

function acquireTtsSlot(): Promise<void> {
  return new Promise((resolve) => {
    const tryRun = async () => {
      if (ttsInFlight >= TTS_MAX_IN_FLIGHT) {
        ttsQueue.push(tryRun);
        return;
      }
      const waitGap = Math.max(0, TTS_MIN_GAP_MS - (Date.now() - ttsLastStartMs));
      if (waitGap > 0) await new Promise((r) => setTimeout(r, waitGap));
      ttsInFlight++;
      ttsLastStartMs = Date.now();
      resolve();
    };
    void tryRun();
  });
}

function releaseTtsSlot(): void {
  ttsInFlight = Math.max(0, ttsInFlight - 1);
  const next = ttsQueue.shift();
  if (next) void next();
}

export type TtsResponseFormat = "wav";

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
  if (!key) {
    console.error("[Groq TTS] GROQ_API_KEY is not set!");
    throw new Error("Missing GROQ_API_KEY");
  }

  // Orpheus API has a 200-char input limit — chunk longer texts
  const MAX_CHARS = 200;
  if (args.text.length > MAX_CHARS) {
    const chunks = splitTextIntoChunks(args.text, MAX_CHARS);
    console.log(`[Groq TTS] Chunking text: ${args.text.length} chars → ${chunks.length} chunks, voice=${args.voice}`);
    const buffers = await Promise.all(
      chunks.map((chunk, i) => {
        console.log(`[Groq TTS]   Chunk ${i + 1}/${chunks.length}: ${chunk.length} chars`);
        return synthesizeTtsForVoice({ ...args, text: chunk });
      }),
    );
    const result = concatArrayBuffers(buffers);
    console.log(`[Groq TTS] All ${chunks.length} chunks done, total ${result.byteLength} bytes`);
    return result;
  }

  const speed = Math.max(0.25, Math.min(args.speed ?? 1, 4.0));

  for (let attempt = 0; attempt <= TTS_MAX_RETRIES; attempt++) {
    await acquireTtsSlot();
    const startMs = Date.now();
    console.log(`[Groq TTS] Request (attempt ${attempt + 1}): voice=${args.voice}, format=${args.format ?? "wav"}, speed=${speed}, text="${args.text.slice(0, 60)}..."`);

    let res: Response;
    try {
      res = await fetch(GROQ_TTS_URL, {
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
    } finally {
      releaseTtsSlot();
    }

    const elapsed = Date.now() - startMs;

    if (res.status === 429 && attempt < TTS_MAX_RETRIES) {
      const retryAfter = Number(res.headers.get("retry-after")) || 7;
      console.warn(`[Groq TTS] 429 rate-limited — retrying in ${retryAfter}s (attempt ${attempt + 1}/${TTS_MAX_RETRIES})`);
      await new Promise((r) => setTimeout(r, retryAfter * 1000));
      continue;
    }

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      console.error(`[Groq TTS] ERROR ${res.status} (${elapsed}ms): ${errText}`);
      throw new Error(`Groq TTS ${res.status}: ${errText}`);
    }

    const audioBuffer = await res.arrayBuffer();
    console.log(`[Groq TTS] OK (${elapsed}ms): ${audioBuffer.byteLength} bytes, voice=${args.voice}`);
    return audioBuffer;
  }

  throw new Error("Groq TTS: exhausted retries");
}

/** Split text at sentence boundaries to stay within maxLen. */
function splitTextIntoChunks(text: string, maxLen: number): string[] {
  const sentences = text.match(/[^.!?]+[.!?]+|[^.!?]+$/g) ?? [text];
  const chunks: string[] = [];
  let current = "";

  for (const sentence of sentences) {
    const trimmed = sentence.trim();
    if (!trimmed) continue;

    if (current.length + trimmed.length + 1 <= maxLen) {
      current = current ? `${current} ${trimmed}` : trimmed;
    } else {
      if (current) chunks.push(current);
      // If a single sentence exceeds maxLen, force-split it
      if (trimmed.length > maxLen) {
        for (let i = 0; i < trimmed.length; i += maxLen) {
          chunks.push(trimmed.slice(i, i + maxLen));
        }
        current = "";
      } else {
        current = trimmed;
      }
    }
  }
  if (current) chunks.push(current);
  return chunks.length > 0 ? chunks : [text.slice(0, maxLen)];
}

function concatArrayBuffers(buffers: ArrayBuffer[]): ArrayBuffer {
  const total = buffers.reduce((sum, b) => sum + b.byteLength, 0);
  const result = new Uint8Array(total);
  let offset = 0;
  for (const buf of buffers) {
    result.set(new Uint8Array(buf), offset);
    offset += buf.byteLength;
  }
  return result.buffer;
}

export function getVoiceForRole(role: VoiceRole): string {
  return VOICE_BY_ROLE[role];
}
