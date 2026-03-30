import { headers } from "next/headers";
import { desc, eq, sql } from "drizzle-orm";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { userVocabulary, vocabularyCache } from "@/lib/db/schema";
import { normalizeVocabularyEntryType } from "@/lib/schemas/vocabulary";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = await db
    .select({
      id: userVocabulary.id,
      query: userVocabulary.query,
      saved: userVocabulary.saved,
      lookedUpAt: userVocabulary.lookedUpAt,
      headword: sql<string>`${vocabularyCache.data}->>'headword'`,
      level: sql<string | null>`${vocabularyCache.data}->>'level'`,
      entryType: sql<string>`${vocabularyCache.data}->>'entryType'`,
    })
    .from(userVocabulary)
    .leftJoin(vocabularyCache, eq(userVocabulary.query, vocabularyCache.query))
    .where(eq(userVocabulary.userId, session.user.id))
    .orderBy(desc(userVocabulary.lookedUpAt));

  return Response.json(
    rows.map((row) => ({
      ...row,
      entryType: normalizeVocabularyEntryType(row.entryType),
    })),
  );
}
