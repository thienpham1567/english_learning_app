import { headers } from "next/headers";
import { eq, and, sql } from "drizzle-orm";

import { auth } from "@/lib/auth";
import { db } from "@repo/database";
import { userVocabulary, vocabularyCache, flashcardProgress } from "@repo/database";

type VocabDataShape = {
  headword: string;
  phonetic?: string | null;
  phoneticsUs?: string | null;
  phoneticsUk?: string | null;
  partOfSpeech?: string | null;
  level?: string | null;
  overviewVi: string;
  overviewEn: string;
  senses?: unknown;
};

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
      data: vocabularyCache.data,
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

  const cards = rows.map((row) => {
    const data = row.data as VocabDataShape;
    return {
      query: row.query,
      headword: data.headword,
      phonetic: data.phonetic ?? null,
      phoneticsUs: data.phoneticsUs ?? null,
      phoneticsUk: data.phoneticsUk ?? null,
      partOfSpeech: data.partOfSpeech ?? null,
      level: data.level ?? null,
      overviewVi: data.overviewVi,
      overviewEn: data.overviewEn,
      senses: data.senses,
    };
  });

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
