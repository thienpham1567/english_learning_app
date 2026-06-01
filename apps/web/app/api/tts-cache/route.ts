import { db, ttsAudioCache } from "@repo/database";
import { and, asc, count, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { routeLogger } from "@/lib/logger";

const log = routeLogger("tts-cache");

const MAX_ENTRIES_PER_USER = 500;

/**
 * GET /api/tts-cache?key=<cacheKey>
 *
 * Look up cached TTS audio by cache key.
 * Returns { hit: true, audioBase64, mimeType } or { hit: false }.
 */
export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const key = url.searchParams.get("key");
  if (!key) return Response.json({ hit: false });

  try {
    const rows = await db
      .select({
        audioBase64: ttsAudioCache.audioBase64,
        mimeType: ttsAudioCache.mimeType,
        id: ttsAudioCache.id,
      })
      .from(ttsAudioCache)
      .where(and(eq(ttsAudioCache.userId, session.user.id), eq(ttsAudioCache.cacheKey, key)))
      .limit(1);

    if (rows.length === 0) {
      return Response.json({ hit: false });
    }

    // Update lastUsedAt (fire-and-forget)
    db.update(ttsAudioCache)
      .set({ lastUsedAt: new Date() })
      .where(eq(ttsAudioCache.id, rows[0].id))
      .catch(() => {});

    return Response.json({
      hit: true,
      audioBase64: rows[0].audioBase64,
      mimeType: rows[0].mimeType,
    });
  } catch (err) {
    log.error({ err }, "tts-cache.get.failed");
    return Response.json({ hit: false });
  }
}

/**
 * POST /api/tts-cache
 *
 * Store TTS audio in DB cache.
 * Body: { cacheKey, audioBase64, mimeType, textPreview, voiceRole, speed, sizeBytes }
 */
export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  if (!body?.cacheKey || !body?.audioBase64) {
    return Response.json({ error: "Missing required fields" }, { status: 400 });
  }

  try {
    // Upsert: if key already exists, update it
    await db
      .insert(ttsAudioCache)
      .values({
        userId: session.user.id,
        cacheKey: body.cacheKey,
        audioBase64: body.audioBase64,
        mimeType: body.mimeType || "audio/wav",
        textPreview: body.textPreview || null,
        voiceRole: body.voiceRole || "",
        speed: body.speed || 1.0,
        sizeBytes: body.sizeBytes || 0,
      })
      .onConflictDoUpdate({
        target: [ttsAudioCache.userId, ttsAudioCache.cacheKey],
        set: {
          audioBase64: body.audioBase64,
          mimeType: body.mimeType || "audio/wav",
          sizeBytes: body.sizeBytes || 0,
          lastUsedAt: new Date(),
        },
      });

    // Evict old entries if over limit (fire-and-forget)
    evictOldEntries(session.user.id).catch(() => {});

    return Response.json({ ok: true });
  } catch (err) {
    log.error({ err }, "tts-cache.save.failed");
    return Response.json({ error: "Failed to cache audio" }, { status: 500 });
  }
}

/**
 * DELETE /api/tts-cache
 *
 * Clear all cached audio for this user.
 */
export async function DELETE() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  await db.delete(ttsAudioCache).where(eq(ttsAudioCache.userId, session.user.id));
  return Response.json({ ok: true });
}

/** Evict oldest entries (by lastUsedAt) when exceeding MAX_ENTRIES_PER_USER */
async function evictOldEntries(userId: string) {
  const [{ value: total }] = await db
    .select({ value: count() })
    .from(ttsAudioCache)
    .where(eq(ttsAudioCache.userId, userId));

  if (total <= MAX_ENTRIES_PER_USER) return;

  const toDelete = total - MAX_ENTRIES_PER_USER;

  // Get oldest IDs
  const oldestRows = await db
    .select({ id: ttsAudioCache.id })
    .from(ttsAudioCache)
    .where(eq(ttsAudioCache.userId, userId))
    .orderBy(asc(ttsAudioCache.lastUsedAt))
    .limit(toDelete);

  for (const row of oldestRows) {
    await db.delete(ttsAudioCache).where(eq(ttsAudioCache.id, row.id));
  }
}
