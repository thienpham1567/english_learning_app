import { headers } from "next/headers";
import { eq, and, isNull } from "drizzle-orm";

import { auth } from "@/lib/auth";
import { db } from "@repo/database";
import { readingSession, readingPassage } from "@repo/database";

/**
 * POST /api/reading/session/heartbeat
 *
 * Upserts a reading session. Creates one if no active session exists for
 * this (user, passage), otherwise updates endedAt/scrollPct/clickCount.
 *
 * Body: { passageId, scrollPct, clickCount }
 */
export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const body = await request.json().catch(() => null);
  const passageId = body?.passageId;
  const scrollPct = Math.min(100, Math.max(0, Number(body?.scrollPct) || 0));
  const clickCount = Math.max(0, Number(body?.clickCount) || 0);

  if (!passageId || typeof passageId !== "string") {
    return Response.json({ error: "passageId required" }, { status: 400 });
  }

  // Verify passage exists and get word count
  const [passage] = await db
    .select({ id: readingPassage.id, wordCount: readingPassage.wordCount })
    .from(readingPassage)
    .where(eq(readingPassage.id, passageId))
    .limit(1);

  if (!passage) {
    return Response.json({ error: "Passage not found" }, { status: 404 });
  }

  // Find active session (no completedAt) for this user+passage
  const [existing] = await db
    .select()
    .from(readingSession)
    .where(
      and(
        eq(readingSession.userId, userId),
        eq(readingSession.passageId, passageId),
        isNull(readingSession.completedAt),
      ),
    )
    .limit(1);

  const now = new Date();

  if (existing) {
    // Check if session is stale (>5 min since last heartbeat)
    const lastBeat = existing.endedAt ?? existing.startedAt;
    const staleMs = 5 * 60 * 1000;
    if (now.getTime() - new Date(lastBeat).getTime() > staleMs) {
      // Close stale session and create new one
      await db
        .update(readingSession)
        .set({ endedAt: new Date(new Date(lastBeat).getTime() + staleMs) })
        .where(eq(readingSession.id, existing.id));

      const [newSession] = await db
        .insert(readingSession)
        .values({ userId, passageId, wordCount: passage.wordCount, scrollPct, clickCount })
        .returning({ id: readingSession.id });

      return Response.json({ sessionId: newSession.id, action: "created" });
    }

    // Update existing session
    await db
      .update(readingSession)
      .set({ endedAt: now, scrollPct: Math.max(existing.scrollPct, scrollPct), clickCount })
      .where(eq(readingSession.id, existing.id));

    return Response.json({ sessionId: existing.id, action: "updated" });
  }

  // Create new session
  const [newSession] = await db
    .insert(readingSession)
    .values({ userId, passageId, wordCount: passage.wordCount, scrollPct, clickCount })
    .returning({ id: readingSession.id });

  return Response.json({ sessionId: newSession.id, action: "created" });
}
