import { NextResponse } from "next/server";
import { toJSONSchema } from "zod";
import { and, eq, gt } from "drizzle-orm";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { vocabularyCache, userVocabulary } from "@/lib/db/schema";
import { openAiClient } from "@/lib/openai/client";
import { openAiConfig } from "@/lib/openai/config";
import { VocabularySchema } from "@/lib/schemas/vocabulary";
import { normalizeDictionaryQuery } from "@/lib/dictionary/normalize-query";
import { classifyDictionaryEntry } from "@/lib/dictionary/classify-entry";
import { buildDictionaryInstructions } from "@/lib/dictionary/prompt";

const allowedQueryPattern = /^[A-Za-z][A-Za-z\s'-]{0,79}$/;

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

    if (!allowedQueryPattern.test(normalized)) {
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
      const saved = session ? await upsertUserVocabulary(session.user.id, cacheKey) : false;
      return NextResponse.json({ data: hit.data, cached: true, saved });
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
    console.error("Dictionary API error:", error);
    return NextResponse.json(
      { error: "Không thể tra cứu mục này lúc này. Vui lòng thử lại sau." },
      { status: 500 },
    );
  }
}
