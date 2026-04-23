import { headers } from "next/headers";
import { promises as fs } from "fs";
import path from "path";
import { eq } from "drizzle-orm";

import { auth } from "@/lib/auth";
import { db } from "@repo/database";
import { listeningExercise } from "@repo/database";
import type { DialogueTurn } from "@repo/database";
import {
  parseAccent,
  synthesizeTts,
  synthesizeTtsForVoice,
  VOICE_SET_VERSION,
  VOICES,
  VOICE_BY_ROLE,
} from "@/lib/tts/groq";

/**
 * GET /api/listening/audio/[id]?accent=us|uk|au
 *
 * Streams TTS audio for a listening passage.
 * - Legacy single-voice path: Groq Orpheus WAV, accent from query string.
 * - Dialogue path (Story 19.3.1): when `dialogue_turns_json` is present,
 *   synthesize per-turn MP3 with each turn's assigned voice and concatenate
 *   MP3 frames server-side. Cached per `(exerciseId, voiceSetVersion)` on
 *   disk at `apps/web/.cache/listening/` (opt-in, dev-safe).
 */

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 60_000;

const DIALOGUE_CACHE_DIR = path.join(
  process.env.VERCEL ? "/tmp" : path.join(process.cwd(), ".cache"),
  "listening",
);
const DIALOGUE_DISK_CACHE_ENABLED = process.env.LISTENING_DIALOGUE_DISK_CACHE === "1";

async function readCachedDialogue(id: string): Promise<Buffer | null> {
  if (!DIALOGUE_DISK_CACHE_ENABLED) return null;
  try {
    const file = path.join(DIALOGUE_CACHE_DIR, `${id}-${VOICE_SET_VERSION}.wav`);
    return await fs.readFile(file);
  } catch {
    return null;
  }
}

async function writeCachedDialogue(id: string, buf: Buffer): Promise<void> {
  if (!DIALOGUE_DISK_CACHE_ENABLED) return;
  try {
    await fs.mkdir(DIALOGUE_CACHE_DIR, { recursive: true });
    const file = path.join(DIALOGUE_CACHE_DIR, `${id}-${VOICE_SET_VERSION}.wav`);
    await fs.writeFile(file, buf);
  } catch (err) {
    console.warn("[Listening Audio] Failed to write dialogue cache:", err);
  }
}

/** Concatenate multiple WAV buffers by stripping headers from all but the first. */
function concatWavBuffers(parts: Buffer[]): Buffer {
  if (parts.length === 0) return Buffer.alloc(0);
  if (parts.length === 1) return parts[0];

  const WAV_HEADER_SIZE = 44;
  // First part keeps its header, subsequent parts strip the 44-byte header
  const pcmParts = parts.map((p, i) => (i === 0 ? p : p.subarray(WAV_HEADER_SIZE)));
  const result = Buffer.concat(pcmParts);

  // Fix the RIFF chunk size (bytes 4-7) and data chunk size (bytes 40-43)
  const totalSize = result.length;
  result.writeUInt32LE(totalSize - 8, 4);           // RIFF chunk size
  result.writeUInt32LE(totalSize - WAV_HEADER_SIZE, 40); // data chunk size

  return result;
}

async function buildDialogueAudio(turns: DialogueTurn[]): Promise<Buffer> {
  console.log(`[Listening Audio] Building dialogue: ${turns.length} turns`);
  const startMs = Date.now();
  const parts = await Promise.all(
    turns.map((turn, i) => {
      console.log(`[Listening Audio]   Turn ${i + 1}: voice=${turn.voiceName}, text="${turn.text.slice(0, 50)}..."`);
      return synthesizeTtsForVoice({
        text: turn.text,
        voice: turn.voiceName,
        format: "wav",
        speed: 0.95,
      }).then((ab) => Buffer.from(ab));
    }),
  );
  const result = concatWavBuffers(parts);
  console.log(`[Listening Audio] Dialogue built in ${Date.now() - startMs}ms, total ${result.length} bytes`);
  return result;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
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

  const { id } = await params;
  const url = new URL(request.url);
  const voiceParam = url.searchParams.get("voice");
  const accent = parseAccent(url.searchParams.get("accent"));

  // Resolve voice: explicit voice name > accent default
  const allVoiceNames = Object.values(VOICE_BY_ROLE);
  const voice = (voiceParam && allVoiceNames.includes(voiceParam))
    ? voiceParam
    : VOICES[accent];

  try {
    const [exercise] = await db
      .select({
        passage: listeningExercise.passage,
        userId: listeningExercise.userId,
        dialogueTurnsJson: listeningExercise.dialogueTurnsJson,
      })
      .from(listeningExercise)
      .where(eq(listeningExercise.id, id))
      .limit(1);

    if (!exercise) {
      console.warn(`[Listening Audio] Exercise not found: ${id}`);
      return Response.json({ error: "Exercise not found" }, { status: 404 });
    }
    if (exercise.userId !== session.user.id) {
      console.warn(`[Listening Audio] Forbidden: user=${session.user.id}, exercise.user=${exercise.userId}`);
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const turns = exercise.dialogueTurnsJson;
    console.log(`[Listening Audio] id=${id}, voice=${voice}, dialogue=${Array.isArray(turns) ? turns.length + " turns" : "no"}, passage=${exercise.passage.length} chars`);

    if (Array.isArray(turns) && turns.length > 0) {
      const cached = await readCachedDialogue(id);
      console.log(`[Listening Audio] Dialogue cache: ${cached ? "HIT" : "MISS"}`);
      const buf = cached ?? (await buildDialogueAudio(turns));
      if (!cached) await writeCachedDialogue(id, buf);

      return new Response(new Uint8Array(buf), {
        headers: {
          "Content-Type": "audio/wav",
          "Cache-Control": "public, max-age=604800",
          "X-Voice-Set-Version": VOICE_SET_VERSION,
        },
      });
    }

    // Single-speaker path — WAV format (Groq Orpheus only supports WAV)
    console.log(`[Listening Audio] Single-speaker path: voice=${voice}`);
    const cacheFile = DIALOGUE_DISK_CACHE_ENABLED
      ? path.join(DIALOGUE_CACHE_DIR, `single-${id}-${voice}-${VOICE_SET_VERSION}.wav`)
      : null;

    let buf: Buffer | null = null;
    if (cacheFile) {
      try { buf = await fs.readFile(cacheFile); console.log(`[Listening Audio] Single cache HIT: ${buf.length} bytes`); } catch { /* miss */ }
    }

    if (!buf) {
      console.log(`[Listening Audio] Calling Groq TTS for single-speaker...`);
      const startMs = Date.now();
      const audio = await synthesizeTtsForVoice({
        text: exercise.passage,
        voice,
        format: "wav",
        speed: 0.9,
      });
      buf = Buffer.from(audio);
      console.log(`[Listening Audio] Single TTS done in ${Date.now() - startMs}ms, ${buf.length} bytes`);
      if (cacheFile) {
        try {
          await fs.mkdir(DIALOGUE_CACHE_DIR, { recursive: true });
          await fs.writeFile(cacheFile, buf);
        } catch { /* ignore cache write fail */ }
      }
    }

    return new Response(new Uint8Array(buf), {
      headers: {
        "Content-Type": "audio/wav",
        "Cache-Control": "public, max-age=604800",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const stack = err instanceof Error ? err.stack : undefined;
    console.error("[Listening Audio] Error:", message);
    if (stack) console.error("[Listening Audio] Stack:", stack);
    return Response.json({ error: `Audio generation failed: ${message}` }, { status: 502 });
  }
}
