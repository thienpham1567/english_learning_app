import { headers } from "next/headers";
import { and, eq } from "drizzle-orm";

import { auth } from "@/lib/auth";
import { routeLogger } from "@/lib/logger";

const log = routeLogger("grammar-lessons/generate");
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
  const lessonVersion = "3";
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

  const systemPrompt = `You are an expert English grammar teacher for Vietnamese learners preparing for ${examContext}.
Generate a comprehensive, bilingual grammar lesson for: "${topicTitle}" at ${level || "B1"} level.

Return ONLY valid JSON with this structure:
{
  "title": "${topicTitle}",
  "titleVi": "Vietnamese translation of the topic name",
  "formula": "Grammar formula/structure (e.g., S + have/has + V3/ed)",
  "explanationEn": "Clear English explanation of the grammar rule (3-5 sentences). Use standard grammar terminology. Explain when and why this structure is used.",
  "explanation": "Clear Vietnamese explanation of the same grammar rule (3-5 sentences). Use simple, accessible Vietnamese.",
  "examples": [
    { "en": "English example sentence", "vi": "Vietnamese translation", "highlight": "key grammar part highlighted" },
    { "en": "...", "vi": "...", "highlight": "..." },
    { "en": "...", "vi": "...", "highlight": "..." },
    { "en": "...", "vi": "...", "highlight": "..." }
  ],
  "commonMistakes": [
    { "wrong": "Incorrect sentence", "correct": "Correct sentence", "note": "Vietnamese explanation of why it's wrong", "noteEn": "English explanation of the grammar rule violated" },
    { "wrong": "...", "correct": "...", "note": "...", "noteEn": "..." },
    { "wrong": "...", "correct": "...", "note": "...", "noteEn": "..." }
  ],
  "exercises": [
    // TIER 1 - Recognition (4 multiple_choice): identify correct usage
    { "id": "1", "type": "multiple_choice", "tier": "recognition", "sentence": "Sentence with _____ blank", "answer": "correct", "options": ["opt1", "opt2", "opt3", "opt4"], "explanation": "Vietnamese explanation", "explanationEn": "English explanation", "hint": "Short rule reminder", "instructionVi": "Chọn đáp án đúng." },
    { "id": "2", "type": "multiple_choice", "tier": "recognition", "sentence": "...", "answer": "...", "options": ["...","...","...","..."], "explanation": "...", "explanationEn": "...", "hint": "...", "instructionVi": "Chọn đáp án đúng." },
    { "id": "3", "type": "multiple_choice", "tier": "recognition", "sentence": "...", "answer": "...", "options": ["...","...","...","..."], "explanation": "...", "explanationEn": "...", "hint": "...", "instructionVi": "Chọn đáp án đúng." },
    { "id": "4", "type": "multiple_choice", "tier": "recognition", "sentence": "...", "answer": "...", "options": ["...","...","...","..."], "explanation": "...", "explanationEn": "...", "hint": "...", "instructionVi": "Chọn đáp án đúng." },
    // TIER 2 - Application (2 multiple_choice with harder context)
    { "id": "5", "type": "multiple_choice", "tier": "application", "sentence": "More complex contextual sentence with _____", "answer": "...", "options": ["...","...","...","..."], "explanation": "...", "explanationEn": "...", "hint": "...", "instructionVi": "Chọn đáp án đúng." },
    { "id": "6", "type": "multiple_choice", "tier": "application", "sentence": "...", "answer": "...", "options": ["...","...","...","..."], "explanation": "...", "explanationEn": "...", "hint": "...", "instructionVi": "Chọn đáp án đúng." },
    // TIER 3 - Production (2 written: 1 error_correction + 1 transformation)
    { "id": "7", "type": "error_correction", "tier": "production", "sentence": "Sentence with grammar error to fix", "answer": "Corrected full sentence", "explanation": "Vietnamese explanation", "explanationEn": "English explanation", "hint": "Look at the verb form...", "acceptedAnswers": ["alternative correct version"], "instructionVi": "Tìm và sửa lỗi sai trong câu." },
    { "id": "8", "type": "transformation", "tier": "production", "sentence": "Sentence to transform using the target structure", "answer": "Expected transformed sentence", "explanation": "Vietnamese explanation", "explanationEn": "English explanation", "hint": "Use the structure: ...", "acceptedAnswers": ["alternative valid answer"], "instructionVi": "Viết lại câu dùng cấu trúc vừa học." },
    // TIER 4 - Context (2 multiple_choice: paragraph/passage-level)
    { "id": "9", "type": "multiple_choice", "tier": "context", "sentence": "A longer passage (2-3 sentences) with _____ blank in exam-style context", "answer": "...", "options": ["...","...","...","..."], "explanation": "...", "explanationEn": "...", "hint": "...", "instructionVi": "Đọc đoạn văn và chọn đáp án đúng." },
    { "id": "10", "type": "multiple_choice", "tier": "context", "sentence": "Another passage-level question in ${examContext} setting", "answer": "...", "options": ["...","...","...","..."], "explanation": "...", "explanationEn": "...", "hint": "...", "instructionVi": "Đọc đoạn văn và chọn đáp án đúng." }
  ]
}

Rules:
- "explanation" fields are ALWAYS in Vietnamese, "explanationEn" fields are ALWAYS in English
- Examples use ${examContext} vocabulary and situations
- Total exercises: exactly 10 across 4 tiers as shown above
- Only multiple_choice has "options" with exactly 4 choices
- For written exercises (error_correction, transformation), provide 1-2 acceptedAnswers for alternative valid phrasings
- Tier "context" exercises must use longer, passage-like sentences (2-3 sentences)
- Each exercise must have a "hint" that reminds the student of the relevant rule without giving away the answer
- Common mistakes: exactly 3, with both Vietnamese (note) and English (noteEn) explanations
- Keep everything practical, exam-relevant, and accessible to Vietnamese learners`;

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
