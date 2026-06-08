import { db, morphemeLessonCache } from "@repo/database";
import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { routeLogger } from "@/lib/logger";
import { buildMorphemeLessonPrompt } from "@/lib/morphology/prompt";
import { MorphemeGenerateRequestSchema, MorphemeLessonSchema } from "@/lib/morphology/schema";
import { completeJson, LlmJsonError } from "@/lib/openai/complete-json";
import { openAiConfig } from "@/lib/openai/config";

const log = routeLogger("morphology/generate");
const LESSON_VERSION = "1";

/**
 * POST /api/morphology/generate
 *
 * AI-generates a morpheme lesson (meaning, origin, word family, exercises),
 * cached per morpheme + version. Body matches MorphemeGenerateRequestSchema.
 */
export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = MorphemeGenerateRequestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { morphemeId, morpheme, type, gloss, forceRefresh } = parsed.data;

  if (!forceRefresh) {
    const [cached] = await db
      .select({ content: morphemeLessonCache.content })
      .from(morphemeLessonCache)
      .where(
        and(
          eq(morphemeLessonCache.morphemeId, morphemeId),
          eq(morphemeLessonCache.lessonVersion, LESSON_VERSION),
        ),
      )
      .limit(1);

    const cachedLesson = cached ? MorphemeLessonSchema.safeParse(cached.content) : null;
    if (cachedLesson?.success) return Response.json(cachedLesson.data);
  }

  try {
    const lesson = await completeJson({
      model: openAiConfig.chatModel,
      system: buildMorphemeLessonPrompt({ morpheme, type, gloss }),
      user: `Generate the complete morpheme lesson for "${morpheme}" as a single valid JSON object. Return JSON only.`,
      schema: MorphemeLessonSchema,
      temperature: 0.5,
      maxTokens: 6000,
    });

    await db
      .insert(morphemeLessonCache)
      .values({
        morphemeId,
        morphemeType: type,
        lessonVersion: LESSON_VERSION,
        content: lesson,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [morphemeLessonCache.morphemeId, morphemeLessonCache.lessonVersion],
        set: { content: lesson, morphemeType: type, updatedAt: new Date() },
      });

    return Response.json(lesson);
  } catch (err) {
    const kind = err instanceof LlmJsonError ? err.kind : "unknown";
    log.error({ err, kind, morphemeId }, "morphology.generate.failed");
    return Response.json({ error: "Lesson generation failed" }, { status: 502 });
  }
}
