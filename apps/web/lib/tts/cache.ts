import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";

import { VOICE_SET_VERSION } from "@/lib/tts/groq";

/**
 * Shared disk cache for generated TTS audio.
 *
 * On Vercel, only `/tmp` is writable and is per-instance + ephemeral — but a
 * warm instance still avoids redundant Groq token spend across repeated
 * playback. Locally it persists under `apps/web/.cache/`.
 *
 * Keys are hashed to keep filenames filesystem-safe regardless of input.
 */

const BASE_CACHE_DIR = process.env.VERCEL
  ? "/tmp"
  : path.join(process.cwd(), ".cache");

export function ttsCacheDir(namespace: string): string {
  return path.join(BASE_CACHE_DIR, `tts-${namespace}`);
}

function hashKey(key: string): string {
  return crypto.createHash("sha1").update(key).digest("hex").slice(0, 24);
}

export function ttsCacheFile(namespace: string, key: string, ext: "wav" | "mp3" = "wav"): string {
  return path.join(ttsCacheDir(namespace), `${hashKey(key)}-${VOICE_SET_VERSION}.${ext}`);
}

export async function readTtsCache(namespace: string, key: string, ext: "wav" | "mp3" = "wav"): Promise<Buffer | null> {
  try {
    return await fs.readFile(ttsCacheFile(namespace, key, ext));
  } catch {
    return null;
  }
}

export async function writeTtsCache(namespace: string, key: string, buf: Buffer, ext: "wav" | "mp3" = "wav"): Promise<void> {
  try {
    await fs.mkdir(ttsCacheDir(namespace), { recursive: true });
    await fs.writeFile(ttsCacheFile(namespace, key, ext), buf);
  } catch (err) {
    console.warn(`[TTS Cache:${namespace}] Failed to write cache:`, err);
  }
}
