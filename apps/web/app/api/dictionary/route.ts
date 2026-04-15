import { NextResponse } from "next/server";
import { toJSONSchema } from "zod";
import { and, eq, gt } from "drizzle-orm";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { vocabularyCache, userVocabulary } from "@/lib/db/schema";
import { openAiClient } from "@/lib/openai/client";
import { openAiConfig } from "@/lib/openai/config";
import { VocabularySchema, normalizeVocabulary, type Vocabulary } from "@/lib/schemas/vocabulary";
import { ALLOWED_QUERY_PATTERN, normalizeDictionaryQuery } from "@/lib/dictionary/normalize-query";
import { classifyDictionaryEntry } from "@/lib/dictionary/classify-entry";
import { buildDictionaryInstructions } from "@/lib/dictionary/prompt";
import { getNearbyWords } from "@/lib/dictionary/nearby-words";

/**
 * Returns true if the headword is plausibly related to the query.
 * Catches cases where the LLM translated a non-English word (e.g. "meo" → "cat"):
 * the two strings would share almost no characters.
 * Allows legitimate variation such as British/American spellings ("colour"/"color"),
 * irregular forms ("ran"/"run"), or multi-word entries.
 */
function isHeadwordConsistentWithQuery(headword: string, query: string): boolean {
  const h = headword.toLowerCase().replace(/\s+/g, "");
  const q = query.toLowerCase().replace(/\s+/g, "");
  if (h === q) return true;
  const setH = new Set(h);
  const setQ = new Set(q);
  const overlap = [...setH].filter((c) => setQ.has(c)).length;
  return overlap / Math.min(setH.size, setQ.size) >= 0.5;
}

async function upsertUserVocabulary(userId: string, query: string): Promise<boolean> {
  const [row] = await db
    .insert(userVocabulary)
    .values({ userId, query, saved: false, lookedUpAt: new Date() })
    .onConflictDoUpdate({
      target: [userVocabulary.userId, userVocabulary.query],
      set: { lookedUpAt: new Date() },
    })
    .returning({ saved: userVocabulary.saved });
  return row?.saved ?? false;
}

export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    const body = (await req.json().catch(() => null)) as { word?: unknown } | null;
    const rawQuery = typeof body?.word === "string" ? body.word : "";
    const { normalized, cacheKey } = normalizeDictionaryQuery(rawQuery);

    if (!normalized) {
      return NextResponse.json(
        { error: "Vui lòng nhập từ hoặc cụm từ tiếng Anh trước khi tra cứu." },
        { status: 400 },
      );
    }

    if (!ALLOWED_QUERY_PATTERN.test(normalized)) {
      return NextResponse.json(
        { error: "Chỉ hỗ trợ từ hoặc cụm từ tiếng Anh hợp lệ." },
        { status: 400 },
      );
    }

    const [hit] = await db
      .select({ data: vocabularyCache.data })
      .from(vocabularyCache)
      .where(and(eq(vocabularyCache.query, cacheKey), gt(vocabularyCache.expiresAt, new Date())))
      .limit(1);

    if (hit) {
      let cachedData: Vocabulary | null = null;
      try {
        cachedData = normalizeVocabulary(hit.data);
      } catch {
        await db.delete(vocabularyCache).where(eq(vocabularyCache.query, cacheKey));
      }

      if (cachedData) {
        const isBadEntry =
          cachedData.overviewVi.startsWith("[NOT_ENGLISH]") ||
          !isHeadwordConsistentWithQuery(cachedData.headword, cacheKey);

        if (isBadEntry) {
          // Purge the stale entry so the LLM gets a chance to re-evaluate
          await db.delete(vocabularyCache).where(eq(vocabularyCache.query, cacheKey));
          // Fall through to LLM call below
        } else {
          const saved = session ? await upsertUserVocabulary(session.user.id, cacheKey) : false;
          const nearbyWords = getNearbyWords(cacheKey);
          return NextResponse.json({ data: { ...cachedData, nearbyWords }, cached: true, saved });
        }
      }
    }

    const entryType = classifyDictionaryEntry(normalized);
    const response = await openAiClient.responses.create({
      model: openAiConfig.dictionaryModel,
      instructions: buildDictionaryInstructions(entryType),
      input: normalized,
      text: {
        format: {
          type: "json_schema",
          name: "dictionary_entry",
          strict: true,
          schema: toJSONSchema(VocabularySchema),
        },
      },
    });

    const parsed = VocabularySchema.parse(JSON.parse(response.output_text));

    if (parsed.overviewVi.startsWith("[NOT_ENGLISH]")) {
      return NextResponse.json(
        { error: "Vui lòng nhập từ hoặc cụm từ tiếng Anh hợp lệ." },
        { status: 400 },
      );
    }

    const expiresAt = new Date(Date.now() + openAiConfig.dictionaryCacheTtlMs);

    await db
      .insert(vocabularyCache)
      .values({ query: cacheKey, data: parsed, expiresAt })
      .onConflictDoUpdate({
        target: vocabularyCache.query,
        set: { data: parsed, expiresAt },
      });

    const saved = session ? await upsertUserVocabulary(session.user.id, cacheKey) : false;
    const nearbyWords = getNearbyWords(normalized);

    return NextResponse.json({ data: { ...parsed, nearbyWords }, cached: false, saved });
  } catch (error) {
    console.error("Dictionary API error:", error);
    return NextResponse.json(
      { error: "Không thể tra cứu mục này lúc này. Vui lòng thử lại sau." },
      { status: 500 },
    );
  }
}
