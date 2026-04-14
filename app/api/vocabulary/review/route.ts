import { headers } from "next/headers";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { userVocabulary } from "@/lib/db/schema";
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

  for (const { query, quality } of results) {
    // Fetch current SRS state from user_vocabulary
    const [existing] = await db
      .select()
      .from(userVocabulary)
      .where(
        and(
          eq(userVocabulary.userId, userId),
          eq(userVocabulary.query, query),
        ),
      )
      .limit(1);

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

    // Update user_vocabulary with new SRS state
    await db
      .update(userVocabulary)
      .set({
        easeFactor: nextState.easeFactor,
        interval: nextState.interval,
        reviewCount: nextState.repetitions,
        nextReview: new Date(nextState.nextReview),
        masteryLevel: newMastery,
      })
      .where(
        and(
          eq(userVocabulary.userId, userId),
          eq(userVocabulary.query, query),
        ),
      );

    wordResults.push({
      query,
      correct: isCorrect,
      masteryLevel: newMastery,
      nextReview: nextState.nextReview,
      interval: nextState.interval,
    });
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
