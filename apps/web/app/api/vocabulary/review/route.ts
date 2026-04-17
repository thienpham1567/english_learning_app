import { headers } from "next/headers";
import { eq, and, inArray, sql } from "drizzle-orm";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { db } from "@repo/database";
import { userVocabulary } from "@repo/database";
import { computeSm2, defaultSm2State, deriveMastery } from "@/lib/srs";
import { awardXP, XP_VALUES } from "@/lib/xp";
import { logActivity } from "@/lib/activity-log";

const ReviewBodySchema = z.object({
  results: z.array(
    z.object({
      query: z.string().min(1),
      quality: z.number().int().min(0).max(5),
    }),
  ).min(1),
});

/**
 * POST /api/vocabulary/review
 *
 * Submit vocabulary review results. Updates SM-2 state for each reviewed word
 * in the user_vocabulary table.
 */
export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = ReviewBodySchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { results } = parsed.data;
  const userId = session.user.id;
  let correctCount = 0;
  const wordResults: Array<{
    query: string;
    correct: boolean;
    masteryLevel: string;
    nextReview: string;
    interval: number;
  }> = [];

  // Batch fetch all entries to avoid N+1 SELECTs (F1 fix)
  const queries = results.map((r) => r.query);
  const entries = await db
    .select()
    .from(userVocabulary)
    .where(
      and(
        eq(userVocabulary.userId, userId),
        inArray(userVocabulary.query, queries),
      ),
    );
  const entryMap = new Map(entries.map((e) => [e.query, e]));

  // Compute next SRS state for every reviewed word in memory first,
  // then issue a single batch UPDATE instead of N sequential ones.
  type PendingUpdate = {
    query: string;
    easeFactor: number;
    interval: number;
    reviewCount: number;
    nextReview: Date;
    masteryLevel: string;
  };
  const pending: PendingUpdate[] = [];

  for (const { query, quality } of results) {
    const existing = entryMap.get(query);
    if (!existing) continue;

    const prevState = {
      easeFactor: existing.easeFactor,
      interval: existing.interval,
      repetitions: existing.reviewCount,
      nextReview: existing.nextReview.toISOString(),
    };

    // Use default state if word was never reviewed (next_review is far future)
    const state = existing.reviewCount === 0 && existing.interval === 0
      ? defaultSm2State()
      : prevState;

    const nextState = computeSm2(state, quality);
    const newMastery = deriveMastery(nextState.interval, nextState.repetitions);
    const isCorrect = quality >= 3;
    if (isCorrect) correctCount++;

    pending.push({
      query,
      easeFactor: nextState.easeFactor,
      interval: nextState.interval,
      reviewCount: nextState.repetitions,
      nextReview: new Date(nextState.nextReview),
      masteryLevel: newMastery,
    });

    wordResults.push({
      query,
      correct: isCorrect,
      masteryLevel: newMastery,
      nextReview: nextState.nextReview,
      interval: nextState.interval,
    });
  }

  // Single UPDATE with CASE expressions keyed by query.
  if (pending.length > 0) {
    const queries = pending.map((p) => p.query);
    const easeCase = sql.join(
      [sql`CASE`, ...pending.map((p) => sql`WHEN ${userVocabulary.query} = ${p.query} THEN ${p.easeFactor}::real`), sql`END`],
      sql` `,
    );
    const intervalCase = sql.join(
      [sql`CASE`, ...pending.map((p) => sql`WHEN ${userVocabulary.query} = ${p.query} THEN ${p.interval}::int`), sql`END`],
      sql` `,
    );
    const reviewCountCase = sql.join(
      [sql`CASE`, ...pending.map((p) => sql`WHEN ${userVocabulary.query} = ${p.query} THEN ${p.reviewCount}::int`), sql`END`],
      sql` `,
    );
    const nextReviewCase = sql.join(
      [sql`CASE`, ...pending.map((p) => sql`WHEN ${userVocabulary.query} = ${p.query} THEN ${p.nextReview.toISOString()}::timestamptz`), sql`END`],
      sql` `,
    );
    const masteryCase = sql.join(
      [sql`CASE`, ...pending.map((p) => sql`WHEN ${userVocabulary.query} = ${p.query} THEN ${p.masteryLevel}::text`), sql`END`],
      sql` `,
    );

    await db
      .update(userVocabulary)
      .set({
        easeFactor: easeCase,
        interval: intervalCase,
        reviewCount: reviewCountCase,
        nextReview: nextReviewCase,
        masteryLevel: masteryCase,
      })
      .where(
        and(
          eq(userVocabulary.userId, userId),
          inArray(userVocabulary.query, queries),
        ),
      );
  }

  // Award XP: 5 per word reviewed
  const xp = correctCount * XP_VALUES.FLASHCARD_REVIEW;
  if (xp > 0) {
    void awardXP(userId, xp).catch(() => {});
    logActivity(userId, "flashcard_review", xp, {
      source: "vocabulary-review",
      reviewed: results.length,
      correct: correctCount,
    });
  }

  return Response.json({
    total: results.length,
    correct: correctCount,
    accuracy: results.length > 0 ? Math.round((correctCount / results.length) * 100) : 0,
    xpEarned: xp,
    words: wordResults,
  });
}
