import { headers } from "next/headers";
import { eq, and, isNull } from "drizzle-orm";

import { auth } from "@/lib/auth";
import { db } from "@repo/database";
import { readingSession } from "@repo/database";

/**
 * POST /api/reading/session/finish
 *
 * Marks the active session for a passage as completed (AC2).
 * Sets completedAt = now. Session counts toward word totals only when completed.
 *
 * Body: { passageId, scrollPct?, clickCount? }
 */
export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const body = await request.json().catch(() => null);
  const passageId = body?.passageId;
  const scrollPct = body?.scrollPct != null ? Math.min(100, Math.max(0, Number(body.scrollPct))) : undefined;
  const clickCount = body?.clickCount != null ? Math.max(0, Number(body.clickCount)) : undefined;

  if (!passageId || typeof passageId !== "string") {
    return Response.json({ error: "passageId required" }, { status: 400 });
  }

  // Find active (uncompleted) session
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

  if (!existing) {
    return Response.json({ error: "No active session found" }, { status: 404 });
  }

  const now = new Date();
  await db
    .update(readingSession)
    .set({
      endedAt: now,
      completedAt: now,
      ...(scrollPct !== undefined ? { scrollPct: Math.max(existing.scrollPct, scrollPct) } : {}),
      ...(clickCount !== undefined ? { clickCount } : {}),
    })
    .where(eq(readingSession.id, existing.id));

  return Response.json({ sessionId: existing.id, wordCount: existing.wordCount, completed: true });
}
