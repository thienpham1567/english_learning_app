import { headers } from "next/headers";
import { and, eq } from "drizzle-orm";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { userVocabulary, vocabularyCache } from "@/lib/db/schema";

/**
 * POST /api/vocabulary/save
 *
 * Quick-save a word to the user's vocabulary list.
 * Used by WordOfTheDay and other components that need to save
 * a word without the user having looked it up in the dictionary.
 *
 * Body: { query: string }
 *
 * The word must already exist in vocabulary_cache (FK constraint).
 * If the user already has this word, marks it as saved.
 */
export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const query = body?.query;

  if (!query || typeof query !== "string") {
    return Response.json({ error: "query is required" }, { status: 400 });
  }

  const userId = session.user.id;

  // Verify word exists in cache
  const [cached] = await db
    .select({ query: vocabularyCache.query })
    .from(vocabularyCache)
    .where(eq(vocabularyCache.query, query))
    .limit(1);

  if (!cached) {
    return Response.json({ error: "Word not found in cache" }, { status: 404 });
  }

  // Upsert: insert or update saved=true
  const [result] = await db
    .insert(userVocabulary)
    .values({ userId, query, saved: true })
    .onConflictDoUpdate({
      target: [userVocabulary.userId, userVocabulary.query],
      set: { saved: true },
    })
    .returning({ id: userVocabulary.id, query: userVocabulary.query, saved: userVocabulary.saved });

  return Response.json(result);
}
