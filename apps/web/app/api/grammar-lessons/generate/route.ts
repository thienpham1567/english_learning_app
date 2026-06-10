import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { routeLogger } from "@/lib/logger";

const log = routeLogger("grammar-lessons/generate");

import { db, grammarLessonCache, grammarLessonProgress } from "@repo/database";
import { buildGrammarLessonPrompt, CONTEXT_PACKS } from "@/lib/grammar-lessons/prompt";
import {
  GrammarLessonGenerateRequestSchema,
  GrammarLessonSchema,
} from "@/lib/grammar-lessons/schema";
import { openAiClient } from "@/lib/openai/client";
import { openAiConfig } from "@/lib/openai/config";

/**
 * POST /api/grammar-lessons/generate
 *
 * AI-generates a grammar lesson with explanation, examples, mistakes, and exercises.
 * Body: { topic: string, topicTitle: string, examMode: string, level: string }
 */
export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = GrammarLessonGenerateRequestSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { topic, topicTitle, examMode, level, focusNote, forceRefresh } = parsed.data;
  const lessonVersion = "5";
  const now = new Date();

  const [existingProgress] = await db
    .select({ id: grammarLessonProgress.id, status: grammarLessonProgress.status })
    .from(grammarLessonProgress)
    .where(
      and(
        eq(grammarLessonProgress.userId, session.user.id),
        eq(grammarLessonProgress.topicId, topic),
        eq(grammarLessonProgress.examMode, examMode),
      ),
    )
    .limit(1);

  if (!existingProgress) {
    await db.insert(grammarLessonProgress).values({
      userId: session.user.id,
      topicId: topic,
      examMode,
      level,
      status: "in_progress",
      lastStudiedAt: now,
      updatedAt: now,
    });
  } else if (existingProgress.status !== "completed") {
    await db
      .update(grammarLessonProgress)
      .set({ level, lastStudiedAt: now, updatedAt: now })
      .where(eq(grammarLessonProgress.id, existingProgress.id));
  }

  if (!forceRefresh) {
    const [cached] = await db
      .select({ content: grammarLessonCache.content })
      .from(grammarLessonCache)
      .where(
        and(
          eq(grammarLessonCache.topicId, topic),
          eq(grammarLessonCache.examMode, examMode),
          eq(grammarLessonCache.level, level),
          eq(grammarLessonCache.lessonVersion, lessonVersion),
        ),
      )
      .limit(1);

    const cachedLesson = cached ? GrammarLessonSchema.safeParse(cached.content) : null;
    if (cachedLesson?.success) {
      return Response.json(cachedLesson.data);
    }
  }

  // Grammar is taught as shared, exam-agnostic General English — independent of
  // the app's global exam mode (examMode is still used for cache/progress keys).
  const focusedSystemPrompt = buildGrammarLessonPrompt({
    topicTitle,
    level,
    context: CONTEXT_PACKS.general,
    focusNote,
  });

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const completion = await openAiClient.chat.completions.create({
        model: openAiConfig.chatModel,
        temperature: 0.5,
        max_tokens: 8000,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: focusedSystemPrompt },
          {
            role: "user",
            content: `Generate the complete grammar lesson for "${topicTitle}" (${level}) as a single valid JSON object. Return JSON only.`,
          },
        ],
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) continue;

      const lessonJson = JSON.parse(content);
      const lesson = GrammarLessonSchema.safeParse(lessonJson);
      if (!lesson.success) {
        log.warn({ errors: lesson.error.flatten() }, "grammar-lessons.generate.validation.failed");
        continue;
      }

      await db
        .insert(grammarLessonCache)
        .values({
          topicId: topic,
          topicTitle,
          examMode,
          level,
          lessonVersion,
          content: lesson.data,
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: [
            grammarLessonCache.topicId,
            grammarLessonCache.examMode,
            grammarLessonCache.level,
            grammarLessonCache.lessonVersion,
          ],
          set: {
            topicTitle,
            content: lesson.data,
            updatedAt: new Date(),
          },
        });

      return Response.json(lesson.data);
    } catch (err) {
      log.error({ err, attempt: attempt + 1 }, "grammar-lessons.generate.failed");
    }
  }

  return Response.json({ error: "Lesson generation failed" }, { status: 502 });
}
