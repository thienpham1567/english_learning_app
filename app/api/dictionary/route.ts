import { NextResponse } from "next/server";
import { toJSONSchema } from "zod";
import { openAiClient } from "@/lib/openai/client";
import { openAiConfig } from "@/lib/openai/config";
import { VocabularySchema } from "@/lib/schemas/vocabulary";
import { normalizeDictionaryQuery } from "@/lib/dictionary/normalize-query";
import { classifyDictionaryEntry } from "@/lib/dictionary/classify-entry";
import { dictionaryCache } from "@/lib/dictionary/cache";
import { buildDictionaryInstructions } from "@/lib/dictionary/prompt";

const allowedQueryPattern = /^[A-Za-z][A-Za-z\s'-]{0,79}$/;

export async function POST(req: Request) {
  try {
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

    const cached = dictionaryCache.get(cacheKey);
    if (cached) {
      return NextResponse.json({ data: cached, cached: true });
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
    dictionaryCache.set(cacheKey, parsed, openAiConfig.dictionaryCacheTtlMs);

    return NextResponse.json({ data: parsed, cached: false });
  } catch (error) {
    console.error("Dictionary API error:", error);
    return NextResponse.json(
      { error: "Không thể tra cứu mục này lúc này. Vui lòng thử lại sau." },
      { status: 500 },
    );
  }
}
