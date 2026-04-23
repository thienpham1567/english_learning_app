import { headers } from "next/headers";
import { and, eq } from "drizzle-orm";

import { auth } from "@/lib/auth";
import { GrammarLessonGenerateRequestSchema, GrammarLessonSchema } from "@/lib/grammar-lessons/schema";
import { openAiClient } from "@/lib/openai/client";
import { openAiConfig } from "@/lib/openai/config";
import { db, grammarLessonCache, grammarLessonProgress } from "@repo/database";

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

  const { topic, topicTitle, examMode, level, forceRefresh } = parsed.data;
  const lessonVersion = "2";
  const now = new Date();

  const [existingProgress] = await db
    .select({ id: grammarLessonProgress.id, status: grammarLessonProgress.status })
    .from(grammarLessonProgress)
    .where(and(
      eq(grammarLessonProgress.userId, session.user.id),
      eq(grammarLessonProgress.topicId, topic),
      eq(grammarLessonProgress.examMode, examMode),
    ))
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
      .where(and(
        eq(grammarLessonCache.topicId, topic),
        eq(grammarLessonCache.examMode, examMode),
        eq(grammarLessonCache.level, level),
        eq(grammarLessonCache.lessonVersion, lessonVersion),
      ))
      .limit(1);

    const cachedLesson = cached ? GrammarLessonSchema.safeParse(cached.content) : null;
    if (cachedLesson?.success) {
      return Response.json(cachedLesson.data);
    }
  }

  const examContext = examMode === "ielts"
    ? "IELTS Academic writing and speaking contexts"
    : "TOEIC business and workplace contexts";

  const systemPrompt = `You are an English grammar teacher for Vietnamese learners preparing for ${examContext}.
Generate a complete grammar lesson for the topic: "${topicTitle}" at ${level || "B1"} level.

Return ONLY valid JSON with this structure:
{
  "title": "${topicTitle}",
  "titleVi": "Vietnamese translation of the topic name",
  "formula": "Grammar formula/structure (e.g., S + have/has + V3/ed)",
  "explanation": "Clear Vietnamese explanation of the grammar rule (3-4 sentences). Use simple language.",
  "examples": [
    { "en": "English sentence", "vi": "Vietnamese translation", "highlight": "key grammar part" },
    { "en": "...", "vi": "...", "highlight": "..." },
    { "en": "...", "vi": "...", "highlight": "..." }
  ],
  "commonMistakes": [
    { "wrong": "Incorrect sentence", "correct": "Correct sentence", "note": "Vietnamese explanation of why it's wrong" },
    { "wrong": "...", "correct": "...", "note": "..." }
  ],
  "exercises": [
    { "id": "1", "type": "multiple_choice", "sentence": "Fill-in sentence with ___ blank", "answer": "correct answer", "options": ["option1", "option2", "option3", "option4"], "explanation": "Vietnamese explanation of why this is correct", "instructionVi": "Chọn đáp án đúng." },
    { "id": "2", "type": "multiple_choice", "sentence": "...", "answer": "...", "options": ["...", "...", "...", "..."], "explanation": "...", "instructionVi": "Chọn đáp án đúng." },
    { "id": "3", "type": "multiple_choice", "sentence": "...", "answer": "...", "options": ["...", "...", "...", "..."], "explanation": "...", "instructionVi": "Chọn đáp án đúng." },
    { "id": "4", "type": "error_correction", "sentence": "Incorrect sentence to fix", "answer": "Correct full sentence", "explanation": "Vietnamese explanation of the correction", "instructionVi": "Sửa lỗi sai trong câu." },
    { "id": "5", "type": "transformation", "sentence": "Sentence to transform with target cue", "answer": "Correct transformed full sentence", "explanation": "Vietnamese explanation of the transformation", "instructionVi": "Viết lại câu dùng cấu trúc vừa học." }
  ]
}

Rules:
- All explanations in Vietnamese
- Examples should use ${examContext}
- Exercises: exactly 5. Include exactly 3 multiple_choice, 1 error_correction, and 1 transformation
- Only multiple_choice exercises may include options, and they must include exactly 4 options
- For written exercises, answer must be one clear full-sentence expected answer
- Common mistakes: exactly 2, focusing on Vietnamese speaker errors
- Keep it practical and relevant to exam preparation`;

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const completion = await openAiClient.chat.completions.create({
        model: openAiConfig.chatModel,
        temperature: 0.5,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Generate a grammar lesson for: ${topicTitle} (${level})` },
        ],
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) continue;

      const lessonJson = JSON.parse(content);
      const lesson = GrammarLessonSchema.safeParse(lessonJson);
      if (!lesson.success) {
        console.warn("[grammar-lessons/generate] Invalid AI lesson:", lesson.error.flatten());
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
      console.error(`[grammar-lessons/generate] Error attempt ${attempt + 1}:`, err);
    }
  }

  return Response.json({ error: "Lesson generation failed" }, { status: 502 });
}
