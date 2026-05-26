import { db, errorLog } from "@repo/database";
import { and, desc, eq, isNull, lte, or, sql } from "drizzle-orm";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { routeLogger } from "@/lib/logger";

const log = routeLogger("errors/review");

/**
 * SM-2 algorithm — compute next review interval.
 *
 * Grade 0-5:
 *   0 = complete blackout
 *   1 = barely remember
 *   2 = remembered with difficulty
 *   3 = recalled with effort
 *   4 = recalled easily
 *   5 = perfect recall
 */
function sm2(grade: number, prevInterval: number, prevEaseFactor: number, reviewCount: number) {
  const g = Math.max(0, Math.min(5, grade));

  // Ease factor adjustment
  let ef = prevEaseFactor + (0.1 - (5 - g) * (0.08 + (5 - g) * 0.02));
  if (ef < 1.3) ef = 1.3;

  let interval: number;
  if (g < 3) {
    // Failed — reset
    interval = 1;
  } else if (reviewCount <= 1) {
    interval = 1;
  } else if (reviewCount === 2) {
    interval = 6;
  } else {
    interval = Math.round(prevInterval * ef);
  }

  // Cap at 365 days
  if (interval > 365) interval = 365;

  return { interval, easeFactor: ef };
}

/**
 * GET /api/errors/review
 *
 * Fetch errors due for SRS review (nextReviewAt <= now, or never reviewed).
 * Returns up to 20 errors, ordered by priority.
 */
export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const now = new Date();

  // Fetch errors that are:
  // 1. Not resolved AND due for review (nextReviewAt <= now)
  // 2. Not resolved AND never scheduled for review (nextReviewAt IS NULL, meaning new errors)
  const [dueErrors, countResult] = await Promise.all([
    db
      .select({
        id: errorLog.id,
        sourceModule: errorLog.sourceModule,
        questionStem: errorLog.questionStem,
        options: errorLog.options,
        userAnswer: errorLog.userAnswer,
        correctAnswer: errorLog.correctAnswer,
        explanationEn: errorLog.explanationEn,
        explanationVi: errorLog.explanationVi,
        grammarTopic: errorLog.grammarTopic,
        isResolved: errorLog.isResolved,
        deepExplanation: errorLog.deepExplanation,
        reviewCount: errorLog.reviewCount,
        nextReviewAt: errorLog.nextReviewAt,
        lastReviewedAt: errorLog.lastReviewedAt,
        createdAt: errorLog.createdAt,
      })
      .from(errorLog)
      .where(
        and(
          eq(errorLog.userId, session.user.id),
          eq(errorLog.isResolved, false),
          or(lte(errorLog.nextReviewAt, now), isNull(errorLog.nextReviewAt)),
        ),
      )
      .orderBy(
        // Prioritize: never-reviewed first, then by due date
        sql`CASE WHEN ${errorLog.nextReviewAt} IS NULL THEN 0 ELSE 1 END`,
        desc(errorLog.createdAt),
      )
      .limit(20),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(errorLog)
      .where(
        and(
          eq(errorLog.userId, session.user.id),
          eq(errorLog.isResolved, false),
          or(lte(errorLog.nextReviewAt, now), isNull(errorLog.nextReviewAt)),
        ),
      ),
  ]);

  return Response.json({
    errors: dueErrors,
    dueCount: countResult[0]?.count ?? 0,
  });
}

/**
 * POST /api/errors/review
 *
 * Submit a review grade for an error. Updates SRS fields using SM-2 algorithm.
 * Body: { errorId: string, grade: 0-5 }
 */
export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json().catch(() => null)) as {
    errorId?: string;
    grade?: number;
  } | null;

  if (!body?.errorId || typeof body.grade !== "number" || body.grade < 0 || body.grade > 5) {
    return Response.json({ error: "Invalid body: need errorId and grade (0-5)" }, { status: 400 });
  }

  const { errorId, grade } = body;

  // Fetch current error
  const [entry] = await db
    .select({
      id: errorLog.id,
      reviewCount: errorLog.reviewCount,
      nextReviewAt: errorLog.nextReviewAt,
    })
    .from(errorLog)
    .where(and(eq(errorLog.id, errorId), eq(errorLog.userId, session.user.id)))
    .limit(1);

  if (!entry) {
    return Response.json({ error: "Error not found" }, { status: 404 });
  }

  // Compute current interval from lastReview
  const prevInterval = entry.reviewCount <= 1 ? 1 : 6;
  const prevEaseFactor = 2.5; // Could store per-error, but SM-2 default works fine

  const { interval, easeFactor } = sm2(grade, prevInterval, prevEaseFactor, entry.reviewCount + 1);

  const now = new Date();
  const nextReview = new Date(now.getTime() + interval * 24 * 60 * 60 * 1000);

  // If grade >= 4 and reviewed 3+ times, auto-resolve
  const shouldResolve = grade >= 4 && entry.reviewCount >= 2;

  await db
    .update(errorLog)
    .set({
      reviewCount: entry.reviewCount + 1,
      lastReviewedAt: now,
      nextReviewAt: nextReview,
      ...(shouldResolve ? { isResolved: true, resolvedAt: now } : {}),
    })
    .where(eq(errorLog.id, errorId));

  log.info(
    {
      userId: session.user.id,
      errorId,
      grade,
      interval,
      nextReview: nextReview.toISOString(),
      resolved: shouldResolve,
    },
    "review.graded",
  );

  return Response.json({
    interval,
    easeFactor,
    nextReviewAt: nextReview.toISOString(),
    resolved: shouldResolve,
  });
}
