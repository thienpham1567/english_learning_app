import { headers } from "next/headers";
import { eq, and, sql } from "drizzle-orm";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { userVocabulary, vocabularyCache } from "@/lib/db/schema";

/**
 * GET /api/word-of-the-day
 *
 * Returns a daily word based on user ID + date seed.
 * Priority: unsaved TOEIC words from cache → random cache entry.
 */
export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const today = new Date().toISOString().slice(0, 10);

  // Deterministic seed from date + userId for daily variation
  const seed = hashCode(`${today}-${userId}`);

  // Try to find an unsaved word from cache (not yet in user_vocabulary)
  const unsavedWords = await db
    .select({
      query: vocabularyCache.query,
      data: vocabularyCache.data,
    })
    .from(vocabularyCache)
    .leftJoin(
      userVocabulary,
      and(
        eq(userVocabulary.query, vocabularyCache.query),
        eq(userVocabulary.userId, userId),
        eq(userVocabulary.saved, true),
      ),
    )
    .where(sql`${userVocabulary.query} IS NULL`)
    .limit(50);

  let wordQuery: string | null = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let wordData: Record<string, any> | null = null;

  if (unsavedWords.length > 0) {
    const idx = Math.abs(seed) % unsavedWords.length;
    const row = unsavedWords[idx];
    wordQuery = row.query;
    wordData = row.data as Record<string, unknown>;
  } else {
    // Fallback: pick from all cache entries
    const allWords = await db
      .select({
        query: vocabularyCache.query,
        data: vocabularyCache.data,
      })
      .from(vocabularyCache)
      .limit(50);

    if (allWords.length > 0) {
      const idx = Math.abs(seed) % allWords.length;
      const row = allWords[idx];
      wordQuery = row.query;
      wordData = row.data as Record<string, unknown>;
    }
  }

  if (!wordQuery || !wordData) {
    return Response.json({ word: null });
  }

  // Check if user already saved this word
  const [savedCheck] = await db
    .select({ saved: userVocabulary.saved })
    .from(userVocabulary)
    .where(
      and(
        eq(userVocabulary.userId, userId),
        eq(userVocabulary.query, wordQuery),
      ),
    )
    .limit(1);

  return Response.json({
    word: {
      query: wordQuery,
      headword: wordData.headword ?? wordQuery,
      overviewVi: wordData.overviewVi ?? "",
      overviewEn: wordData.overviewEn ?? "",
      partOfSpeech: wordData.partOfSpeech ?? null,
      level: wordData.level ?? null,
      pronunciation: wordData.pronunciation ?? null,
      example: wordData.example ?? null,
      saved: savedCheck?.saved ?? false,
    },
    date: today,
  });
}

/**
 * Simple string hash for deterministic seeding.
 */
function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return hash;
}
