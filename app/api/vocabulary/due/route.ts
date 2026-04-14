import { headers } from "next/headers";
import { eq, and, sql, lte, notInArray } from "drizzle-orm";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { userVocabulary, vocabularyCache } from "@/lib/db/schema";

/**
 * GET /api/vocabulary/due
 *
 * Returns saved vocabulary words that are due for SRS review.
 * Uses the `next_review` column added in Story 12.1 migration.
 */
export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();

  const dueWords = await db
    .select({
      query: userVocabulary.query,
      easeFactor: userVocabulary.easeFactor,
      interval: userVocabulary.interval,
      reviewCount: userVocabulary.reviewCount,
      masteryLevel: userVocabulary.masteryLevel,
      headword: sql<string>`${vocabularyCache.data}->>'headword'`,
      overviewVi: sql<string>`${vocabularyCache.data}->>'overviewVi'`,
      overviewEn: sql<string>`${vocabularyCache.data}->>'overviewEn'`,
      partOfSpeech: sql<string | null>`${vocabularyCache.data}->>'partOfSpeech'`,
      level: sql<string | null>`${vocabularyCache.data}->>'level'`,
    })
    .from(userVocabulary)
    .innerJoin(vocabularyCache, eq(userVocabulary.query, vocabularyCache.query))
    .where(
      and(
        eq(userVocabulary.userId, session.user.id),
        eq(userVocabulary.saved, true),
        lte(userVocabulary.nextReview, now),
      ),
    )
    .orderBy(userVocabulary.nextReview)
    .limit(15);

  // Fetch distractor candidates, excluding due words to avoid duplicate answers (F2 fix)
  const dueQueries = dueWords.map((w) => w.query);
  const distractors = await db
    .select({
      query: userVocabulary.query,
      headword: sql<string>`${vocabularyCache.data}->>'headword'`,
      overviewVi: sql<string>`${vocabularyCache.data}->>'overviewVi'`,
      level: sql<string | null>`${vocabularyCache.data}->>'level'`,
    })
    .from(userVocabulary)
    .innerJoin(vocabularyCache, eq(userVocabulary.query, vocabularyCache.query))
    .where(
      and(
        eq(userVocabulary.userId, session.user.id),
        eq(userVocabulary.saved, true),
        dueQueries.length > 0 ? notInArray(userVocabulary.query, dueQueries) : undefined,
      ),
    )
    .orderBy(sql`RANDOM()`)
    .limit(30);

  return Response.json({
    dueCount: dueWords.length,
    words: dueWords,
    distractors,
  });
}
