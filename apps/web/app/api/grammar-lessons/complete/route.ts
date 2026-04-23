import { headers } from "next/headers";
import { and, eq } from "drizzle-orm";

import { auth } from "@/lib/auth";
import {
  calculateGrammarLessonXp,
  getGrammarLessonDifficulty,
  GrammarLessonCompleteRequestSchema,
} from "@/lib/grammar-lessons/schema";
import { db } from "@repo/database";
import { activityLog, errorLog, grammarLessonProgress } from "@repo/database";
import { recordLearningEvent } from "@repo/modules";

/**
 * POST /api/grammar-lessons/complete
 *
 * Awards XP for completing a grammar lesson.
 * Body: { topic: string, correctCount: number, totalCount: number }
 */
export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const body = await request.json();
  const parsed = GrammarLessonCompleteRequestSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json(
      { error: "Invalid body", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { topic, topicTitle, examMode, level, correctCount, totalCount, durationMs, answers } = parsed.data;
  const scorePct = Math.round((correctCount / totalCount) * 100);
  const now = new Date();

  const [existing] = await db
    .select()
    .from(grammarLessonProgress)
    .where(and(
      eq(grammarLessonProgress.userId, userId),
      eq(grammarLessonProgress.topicId, topic),
      eq(grammarLessonProgress.examMode, examMode),
    ))
    .limit(1);

  const previousBest = existing?.scorePct ?? 0;
  const isBestAttempt = scorePct >= previousBest;
  const wasCompleted = existing?.status === "completed";
  const xpAmount = wasCompleted ? 0 : calculateGrammarLessonXp(correctCount, totalCount);
  const mergedCorrectCount = isBestAttempt ? correctCount : existing?.correctCount ?? correctCount;
  const mergedTotalCount = isBestAttempt ? totalCount : existing?.totalCount ?? totalCount;
  const mergedScorePct = Math.max(previousBest, scorePct);
  const completedAt = existing?.completedAt ?? now;

  if (existing) {
    await db
      .update(grammarLessonProgress)
      .set({
        level,
        status: "completed",
        correctCount: mergedCorrectCount,
        totalCount: mergedTotalCount,
        scorePct: mergedScorePct,
        attemptCount: existing.attemptCount + 1,
        lastStudiedAt: now,
        completedAt,
        updatedAt: now,
      })
      .where(eq(grammarLessonProgress.id, existing.id));
  } else {
    await db.insert(grammarLessonProgress).values({
      userId,
      topicId: topic,
      examMode,
      level,
      status: "completed",
      correctCount,
      totalCount,
      scorePct,
      attemptCount: 1,
      lastStudiedAt: now,
      completedAt: now,
      updatedAt: now,
    });
  }

  if (xpAmount > 0) {
    await db.insert(activityLog).values({
      userId,
      activityType: "grammar_lesson",
      xpEarned: xpAmount,
      metadata: { topic, topicTitle, examMode, level, correctCount, totalCount, scorePct },
    });
  }

  const incorrectAnswers = answers.filter((answer) => !answer.correct);
  if (incorrectAnswers.length > 0) {
    await db.insert(errorLog).values(incorrectAnswers.map((answer) => ({
      userId,
      sourceModule: "grammar-lessons",
      questionStem: answer.questionStem,
      options: answer.options ?? null,
      userAnswer: answer.userAnswer,
      correctAnswer: answer.correctAnswer,
      explanationEn: null,
      explanationVi: answer.explanationVi ?? null,
      grammarTopic: topicTitle ?? topic,
    })));
  }

  void recordLearningEvent({
    userId,
    sessionId: `grammar-lesson-${userId}-${topic}`,
    moduleType: "grammar_lesson",
    contentId: `lesson-${topic}`,
    attemptId: `grammar-lesson-${topic}-${Date.now()}`,
    eventType: "skill_practice_completed",
    result: scorePct >= 80 ? "correct" : scorePct >= 50 ? "partial" : "incorrect",
    score: scorePct,
    durationMs,
    difficulty: getGrammarLessonDifficulty(level),
    errorTags: incorrectAnswers.map((answer) => `grammar_${answer.type}`),
  });

  return Response.json({
    xpAwarded: xpAmount,
    alreadyCompleted: wasCompleted,
    loggedErrors: incorrectAnswers.length,
    progress: {
      topicId: topic,
      status: "completed",
      correctCount: mergedCorrectCount,
      totalCount: mergedTotalCount,
      scorePct: mergedScorePct,
      completedAt: completedAt.toISOString(),
      lastStudiedAt: now.toISOString(),
    },
  });
}
