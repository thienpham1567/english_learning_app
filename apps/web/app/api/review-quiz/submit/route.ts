import { headers } from "next/headers";
import { eq, and, inArray } from "drizzle-orm";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { errorLog, activityLog } from "@/lib/db/schema";

// SRS intervals (Leitner): 1d, 3d, 7d, 14d → resolved
const SRS_INTERVALS_DAYS = [1, 3, 7, 14];

/**
 * POST /api/review-quiz/submit
 *
 * Submit review answers. Updates SRS state for each reviewed error.
 * Body: { results: Array<{ errorId: string, correct: boolean }> }
 */
export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { results } = body;

    if (!Array.isArray(results) || results.length === 0) {
      return Response.json({ error: "No results to submit" }, { status: 400 });
    }

    let resolved = 0;
    let rescheduled = 0;

    // Batch fetch all entries to avoid N+1 SELECTs
    const ids = results.map((r: { errorId: string }) => r.errorId);
    const entries = await db
      .select()
      .from(errorLog)
      .where(and(inArray(errorLog.id, ids), eq(errorLog.userId, session.user.id)));
    const entryMap = new Map(entries.map((e) => [e.id, e]));

    for (const { errorId, correct } of results) {
      const entry = entryMap.get(errorId);
      if (!entry) continue;

      const now = new Date();

      if (correct) {
        const newCount = entry.reviewCount + 1;

        if (newCount >= SRS_INTERVALS_DAYS.length) {
          // Mastered! Mark resolved
          await db
            .update(errorLog)
            .set({
              isResolved: true,
              resolvedAt: now,
              reviewCount: newCount,
              lastReviewedAt: now,
              nextReviewAt: null,
            })
            .where(and(eq(errorLog.id, errorId), eq(errorLog.userId, session.user.id)));
          resolved++;
        } else {
          // Schedule next review
          const nextDays = SRS_INTERVALS_DAYS[newCount];
          const nextReviewAt = new Date(now.getTime() + nextDays * 24 * 60 * 60 * 1000);
          await db
            .update(errorLog)
            .set({
              reviewCount: newCount,
              lastReviewedAt: now,
              nextReviewAt,
            })
            .where(and(eq(errorLog.id, errorId), eq(errorLog.userId, session.user.id)));
          rescheduled++;
        }
      } else {
        // Wrong again — reset to review_count=0, retry in 1 day
        const nextReviewAt = new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000);
        await db
          .update(errorLog)
          .set({
            reviewCount: 0,
            lastReviewedAt: now,
            nextReviewAt,
          })
          .where(and(eq(errorLog.id, errorId), eq(errorLog.userId, session.user.id)));
        rescheduled++;
      }
    }

    // Award XP for review session (5 XP per correct answer)
    const totalCorrect = results.filter((r: { correct: boolean }) => r.correct).length;
    const xp = totalCorrect * 5;

    if (xp > 0) {
      await db.insert(activityLog).values({
        userId: session.user.id,
        activityType: "grammar_quiz", // closest existing type
        xpEarned: xp,
        metadata: { source: "review-quiz", reviewed: results.length, correct: totalCorrect },
      });
    }

    return Response.json({
      total: results.length,
      resolved,
      rescheduled,
      xpEarned: xp,
    });
  } catch (err) {
    console.error("[review-quiz/submit] Error:", err);
    return Response.json({ error: "Failed to submit review" }, { status: 500 });
  }
}
