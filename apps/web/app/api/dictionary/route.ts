import { db } from "@repo/database";
import { and, eq, gt } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { toJSONSchema } from "zod";
import { auth } from "@/lib/auth";
import { routeLogger } from "@/lib/logger";

const log = routeLogger("dictionary");

import { userVocabulary, vocabularyCache } from "@repo/database";
import { classifyDictionaryEntry } from "@/lib/dictionary/classify-entry";

import { ALLOWED_QUERY_PATTERN, normalizeDictionaryQuery } from "@/lib/dictionary/normalize-query";
import { buildDictionaryInstructions } from "@/lib/dictionary/prompt";
import { openAiClient } from "@/lib/openai/client";
import { openAiConfig } from "@/lib/openai/config";
import { normalizeVocabulary, type Vocabulary, VocabularySchema } from "@/lib/schemas/vocabulary";

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
        const missingShortMeanings = cachedData.senses.every(
          (s) => !s.shortMeaningsVi || s.shortMeaningsVi.length === 0,
        );
        const isBadEntry =
          cachedData.isNotEnglish || !isHeadwordConsistentWithQuery(cachedData.headword, cacheKey);

        if (isBadEntry) {
          // Purge: LLM may also return isNotEnglish and short-circuit before the upsert.
          await db.delete(vocabularyCache).where(eq(vocabularyCache.query, cacheKey));
          // Fall through to LLM call below
        } else if (missingShortMeanings) {
          // Legacy entry without short Vietnamese glosses — fall through to LLM.
          // The upsert at the end of this handler will overwrite the row in place,
          // so the regenerated entry stays cached for subsequent lookups.
        } else {
          const saved = session ? await upsertUserVocabulary(session.user.id, cacheKey) : false;
          return NextResponse.json({ data: cachedData, cached: true, saved });
        }
      }
    }

    const entryType = classifyDictionaryEntry(normalized);
    // We use json_object (not strict json_schema) so OpenRouter can route to the
    // fastest provider for this model. The exact shape is enforced two ways:
    // the JSON Schema is embedded in the prompt, and the result is Zod-validated.
    const schemaJson = JSON.stringify(toJSONSchema(VocabularySchema));
    const instructions = `${buildDictionaryInstructions(entryType)}

Return a single JSON object that conforms exactly to this JSON Schema (same field names, nesting, and types):
${schemaJson}`;

    let parsed: Vocabulary | null = null;
    for (let attempt = 0; attempt < 2 && !parsed; attempt++) {
      const startedAt = Date.now();
      const completion = await openAiClient.chat.completions.create({
        model: openAiConfig.dictionaryModel,
        messages: [
          { role: "system", content: instructions },
          { role: "user", content: normalized },
        ],
        response_format: { type: "json_object" },
        temperature: 0.2,
        // OpenRouter-specific: prefer the highest-throughput provider for this model.
        ...({ provider: { sort: "throughput" } } as object),
      });
      const durationMs = Date.now() - startedAt;

      log.info(
        {
          query: cacheKey,
          attempt: attempt + 1,
          model: openAiConfig.dictionaryModel,
          durationMs,
          promptTokens: completion.usage?.prompt_tokens,
          completionTokens: completion.usage?.completion_tokens,
          totalTokens: completion.usage?.total_tokens,
        },
        "dictionary.llm.timing",
      );

      const content = completion.choices[0]?.message?.content;
      if (!content) continue;

      try {
        parsed = VocabularySchema.parse(JSON.parse(content));
      } catch (parseErr) {
        log.warn({ err: parseErr, attempt: attempt + 1 }, "dictionary.parse.failed");
      }
    }

    if (!parsed) {
      throw new Error("Failed to produce a valid dictionary entry");
    }

    if (parsed.isNotEnglish) {
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
    return NextResponse.json({ data: parsed, cached: false, saved });
  } catch (error) {
    log.error({ err: error }, "dictionary.error");
    return NextResponse.json(
      { error: "Không thể tra cứu mục này lúc này. Vui lòng thử lại sau." },
      { status: 500 },
    );
  }
}
