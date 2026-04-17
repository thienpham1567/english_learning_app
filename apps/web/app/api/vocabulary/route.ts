import { headers } from "next/headers";
import { desc, eq, sql, and } from "drizzle-orm";

import { auth } from "@/lib/auth";
import { db } from "@repo/database";
import { userVocabulary, vocabularyCache, flashcardProgress } from "@repo/database";
import { normalizeVocabularyEntryType } from "@/lib/schemas/vocabulary";

const DEFAULT_LIMIT = 200;
const MAX_LIMIT = 500;

export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const limit = Math.min(
    Math.max(parseInt(url.searchParams.get("limit") ?? `${DEFAULT_LIMIT}`, 10) || DEFAULT_LIMIT, 1),
    MAX_LIMIT,
  );
  const offset = Math.max(parseInt(url.searchParams.get("offset") ?? "0", 10) || 0, 0);

  // Project only the JSONB keys needed by the list view to avoid hydrating
  // the full vocabularyCache.data blob per row.
  const rows = await db
    .select({
      id: userVocabulary.id,
      query: userVocabulary.query,
      saved: userVocabulary.saved,
      lookedUpAt: userVocabulary.lookedUpAt,
      headword: sql<string>`${vocabularyCache.data}->>'headword'`,
      level: sql<string | null>`${vocabularyCache.data}->>'level'`,
      entryType: sql<string>`${vocabularyCache.data}->>'entryType'`,
      mastery: sql<string>`CASE
        WHEN ${flashcardProgress.userId} IS NULL THEN 'new'
        WHEN ${flashcardProgress.interval} < 21 THEN 'learning'
        ELSE 'mastered'
      END`,
    })
    .from(userVocabulary)
    .leftJoin(vocabularyCache, eq(userVocabulary.query, vocabularyCache.query))
    .leftJoin(
      flashcardProgress,
      and(
        eq(flashcardProgress.userId, userVocabulary.userId),
        eq(flashcardProgress.query, userVocabulary.query),
      ),
    )
    .where(eq(userVocabulary.userId, session.user.id))
    .orderBy(desc(userVocabulary.lookedUpAt))
    .limit(limit)
    .offset(offset);

  return Response.json(
    rows.map((row) => ({
      ...row,
      entryType: normalizeVocabularyEntryType(row.entryType),
    })),
  );
}
