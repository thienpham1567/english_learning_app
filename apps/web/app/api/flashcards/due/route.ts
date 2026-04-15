import { headers } from "next/headers";
import { eq, and, sql, asc } from "drizzle-orm";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { userVocabulary, vocabularyCache, flashcardProgress } from "@/lib/db/schema";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const now = new Date();

  // Get saved vocabulary with flashcard progress.
  // Cards are due when:  nextReview <= now  OR  no flashcard_progress row exists (new card).
  const rows = await db
    .select({
      query: userVocabulary.query,
      headword: sql<string>`${vocabularyCache.data}->>'headword'`,
      phonetic: sql<string | null>`${vocabularyCache.data}->>'phonetic'`,
      phoneticsUs: sql<string | null>`${vocabularyCache.data}->>'phoneticsUs'`,
      phoneticsUk: sql<string | null>`${vocabularyCache.data}->>'phoneticsUk'`,
      partOfSpeech: sql<string | null>`${vocabularyCache.data}->>'partOfSpeech'`,
      level: sql<string | null>`${vocabularyCache.data}->>'level'`,
      overviewVi: sql<string>`${vocabularyCache.data}->>'overviewVi'`,
      overviewEn: sql<string>`${vocabularyCache.data}->>'overviewEn'`,
      senses: sql<string>`${vocabularyCache.data}->'senses'`,
      nextReview: flashcardProgress.nextReview,
    })
    .from(userVocabulary)
    .innerJoin(vocabularyCache, eq(userVocabulary.query, vocabularyCache.query))
    .leftJoin(
      flashcardProgress,
      and(eq(flashcardProgress.userId, userId), eq(flashcardProgress.query, userVocabulary.query)),
    )
    .where(
      and(
        eq(userVocabulary.userId, userId),
        eq(userVocabulary.saved, true),
        sql`(${flashcardProgress.nextReview} IS NULL OR ${flashcardProgress.nextReview} <= ${now})`,
      ),
    )
    .orderBy(sql`${flashcardProgress.nextReview} ASC NULLS FIRST`)
    .limit(20);

  const cards = rows.map((row) => ({
    query: row.query,
    headword: row.headword,
    phonetic: row.phonetic,
    phoneticsUs: row.phoneticsUs,
    phoneticsUk: row.phoneticsUk,
    partOfSpeech: row.partOfSpeech,
    level: row.level,
    overviewVi: row.overviewVi,
    overviewEn: row.overviewEn,
    senses: typeof row.senses === "string" ? JSON.parse(row.senses) : row.senses,
  }));

  // Also get next review time for "all done" countdown
  const nextReviewRow = await db
    .select({ nextReview: flashcardProgress.nextReview })
    .from(flashcardProgress)
    .innerJoin(
      userVocabulary,
      and(
        eq(flashcardProgress.query, userVocabulary.query),
        eq(flashcardProgress.userId, userId),
        eq(userVocabulary.userId, userId),
        eq(userVocabulary.saved, true),
      ),
    )
    .where(and(eq(flashcardProgress.userId, userId), sql`${flashcardProgress.nextReview} > ${now}`))
    .orderBy(flashcardProgress.nextReview)
    .limit(1);

  return Response.json({
    cards,
    nextReviewAt: nextReviewRow[0]?.nextReview?.toISOString() ?? null,
  });
}
