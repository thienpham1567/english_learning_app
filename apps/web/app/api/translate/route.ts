import { db, vocabularyCache } from "@repo/database";
import { createHash } from "crypto";
import { and, eq, gt } from "drizzle-orm";
import { NextResponse } from "next/server";
import { toJSONSchema } from "zod";
import { routeLogger } from "@/lib/logger";
import { openAiClient } from "@/lib/openai/client";
import { openAiConfig } from "@/lib/openai/config";
import { TranslationSchema } from "@/lib/schemas/translation";
import { buildTranslationInstructions } from "@/lib/translation/prompt";

const log = routeLogger("translate");

const CACHE_TTL_MS = 14 * 24 * 60 * 60 * 1000; // 14 days

function hashKey(text: string, context: string): string {
  return `translate:${createHash("sha256").update(`${text}||${context}`).digest("hex").slice(0, 32)}`;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => null)) as {
      text?: unknown;
      context?: unknown;
    } | null;

    const text = typeof body?.text === "string" ? body.text.trim() : "";
    const context = typeof body?.context === "string" ? body.context.trim() : "";

    if (!text || text.length < 3) {
      return NextResponse.json({ error: "Vui lòng cung cấp câu cần dịch." }, { status: 400 });
    }

    if (text.length > 500) {
      return NextResponse.json({ error: "Câu quá dài. Tối đa 500 ký tự." }, { status: 400 });
    }

    // ── Check cache ──────────────────────────────────────────────────────

    const cacheKey = hashKey(text, context);

    const [hit] = await db
      .select({ data: vocabularyCache.data })
      .from(vocabularyCache)
      .where(and(eq(vocabularyCache.query, cacheKey), gt(vocabularyCache.expiresAt, new Date())))
      .limit(1);

    if (hit) {
      try {
        const cached = TranslationSchema.parse(hit.data);
        return NextResponse.json(cached);
      } catch {
        // Invalid cache entry — delete and regenerate
        await db.delete(vocabularyCache).where(eq(vocabularyCache.query, cacheKey));
      }
    }

    // ── Call LLM ─────────────────────────────────────────────────────────

    const userMessage = context
      ? `Translate this sentence:\n"${text}"\n\nSurrounding context:\n"${context}"`
      : `Translate this sentence:\n"${text}"`;

    const response = await openAiClient.responses.create({
      model: openAiConfig.chatModel,
      instructions: buildTranslationInstructions(),
      input: userMessage,
      text: {
        format: {
          type: "json_schema",
          name: "translation_result",
          strict: true,
          schema: toJSONSchema(TranslationSchema),
        },
      },
    });

    const parsed = TranslationSchema.parse(JSON.parse(response.output_text));

    // ── Cache result ─────────────────────────────────────────────────────

    const expiresAt = new Date(Date.now() + CACHE_TTL_MS);

    await db
      .insert(vocabularyCache)
      .values({ query: cacheKey, data: parsed, expiresAt })
      .onConflictDoUpdate({
        target: vocabularyCache.query,
        set: { data: parsed, expiresAt },
      });

    return NextResponse.json(parsed);
  } catch (error) {
    log.error({ err: error }, "translate.error");
    return NextResponse.json(
      { error: "Không thể dịch câu này lúc này. Vui lòng thử lại sau." },
      { status: 500 },
    );
  }
}
