import { headers } from "next/headers";
import { eq, and } from "drizzle-orm";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { errorLog } from "@/lib/db/schema";

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

    for (const { errorId, correct } of results) {
      // Fetch current state
      const [entry] = await db
        .select()
        .from(errorLog)
        .where(and(eq(errorLog.id, errorId), eq(errorLog.userId, session.user.id)))
        .limit(1);

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
            .where(eq(errorLog.id, errorId));
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
            .where(eq(errorLog.id, errorId));
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
          .where(eq(errorLog.id, errorId));
        rescheduled++;
      }
    }

    return Response.json({
      total: results.length,
      resolved,
      rescheduled,
    });
  } catch (err) {
    console.error("[review-quiz/submit] Error:", err);
    return Response.json({ error: "Failed to submit review" }, { status: 500 });
  }
}
