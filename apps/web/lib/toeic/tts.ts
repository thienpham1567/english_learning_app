/**
 * Groq PlayAI TTS wrapper.
 * Used by seed scripts (Part 2, dictation) to generate audio clips.
 *
 * Voices (PlayAI on Groq): Arista, Atlas, Briggs (US accents — all freely available).
 */

import fs from "node:fs/promises";
import path from "node:path";
import Groq from "groq-sdk";

const TTS_MODEL = "canopylabs/orpheus-v1-english";

/** Picked 3 voices for diversity: 2 female (diana, hannah) + 1 male (daniel). */
export const VOICES = ["diana", "hannah", "daniel"] as const;
export type Voice = (typeof VOICES)[number];

let client: Groq | null = null;
function getClient(): Groq {
  if (!client) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) throw new Error("Missing GROQ_API_KEY");
    client = new Groq({ apiKey });
  }
  return client;
}

export type SynthesizeOptions = {
  text: string;
  voice: Voice;
  /** Absolute path where the audio file will be saved. */
  outputPath: string;
};

/**
 * Synthesize speech with Groq PlayAI TTS and write to file.
 * Returns the bytes written.
 */
export async function synthesizeToFile(opts: SynthesizeOptions): Promise<number> {
  const groq = getClient();
  const res = await groq.audio.speech.create({
    model: TTS_MODEL,
    voice: opts.voice,
    input: opts.text,
    response_format: "wav",
  });
  const buf = Buffer.from(await res.arrayBuffer());
  await fs.mkdir(path.dirname(opts.outputPath), { recursive: true });
  await fs.writeFile(opts.outputPath, buf);
  return buf.byteLength;
}

/**
 * Round-robin voice picker (deterministic per index for reproducibility).
 */
export function pickVoice(idx: number): Voice {
  return VOICES[idx % VOICES.length];
}
