import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { routeLogger } from "@/lib/logger";

const log = routeLogger("listening/submit");

import type { ListeningQuestion } from "@repo/database";
import { db, errorLog, listeningExercise } from "@repo/database";
import { recordLearningEvent } from "@repo/modules";
import { logActivity } from "@/lib/activity-log";
import { updateSkillProfile } from "@/lib/adaptive/difficulty";
import { SubmitInputSchema } from "@/lib/listening/types";
import { awardXP, XP_VALUES } from "@/lib/xp";

/**
 * POST /api/listening/submit
 *
 * Scores a listening exercise, awards XP, and logs activity.
 * Returns: { score, total, correct, results }
 */
export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = SubmitInputSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { exerciseId, answers, scriptRevealed } = parsed.data;
    const userId = session.user.id;

    // Fetch the exercise
    const [exercise] = await db
      .select()
      .from(listeningExercise)
      .where(and(eq(listeningExercise.id, exerciseId), eq(listeningExercise.userId, userId)))
      .limit(1);

    if (!exercise) {
      return Response.json({ error: "Exercise not found" }, { status: 404 });
    }

    if (exercise.completedAt) {
      return Response.json({ error: "Exercise already submitted" }, { status: 409 });
    }

    const questions = exercise.questions as ListeningQuestion[];
    if (answers.length !== questions.length) {
      return Response.json(
        { error: `Expected ${questions.length} answers, got ${answers.length}` },
        { status: 400 },
      );
    }

    // Score answers
    const results = questions.map((q, i) => ({
      question: q.question,
      options: q.options,
      correctIndex: q.correctIndex,
      userAnswer: answers[i],
      correct: answers[i] === q.correctIndex,
    }));

    const correctCount = results.filter((r) => r.correct).length;
    const score = Math.round((correctCount / questions.length) * 100);

    // Save results + scriptRevealed flag
    await db
      .update(listeningExercise)
      .set({
        answers,
        score,
        completedAt: new Date(),
        scriptRevealed: scriptRevealed ?? false,
      })
      .where(eq(listeningExercise.id, exerciseId));

    // Award XP (reduced by 30% if script was revealed) + log activity (fire-and-forget)
    const xpBase = XP_VALUES.LISTENING_PRACTICE;
    const xpEarned = scriptRevealed ? Math.round(xpBase * 0.7) : xpBase;
    void awardXP(userId, xpEarned).catch(() => {});
    logActivity(userId, "listening_practice", xpEarned, {
      exerciseId,
      level: exercise.level,
      exerciseType: exercise.exerciseType,
      score,
      correctCount,
      totalQuestions: questions.length,
      scriptRevealed,
    });

    // Log wrong answers to errorLog for SRS review (fire-and-forget)
    const wrongResults = results.filter((r) => !r.correct);
    if (wrongResults.length > 0) {
      void db
        .insert(errorLog)
        .values(
          wrongResults.map((r) => ({
            userId,
            sourceModule: "listening" as const,
            questionStem: r.question,
            options: r.options,
            userAnswer: r.options[r.userAnswer] ?? "",
            correctAnswer: r.options[r.correctIndex] ?? "",
            grammarTopic: exercise.level,
          })),
        )
        .catch((e) => log.error({ err: e }, "listening.submit.error-log.insert.failed"));
    }

    // Emit learning event (fire-and-forget, AC: 3)
    void recordLearningEvent({
      userId,
      sessionId: `listen-${userId}-${Date.now()}`,
      moduleType: "listening",
      contentId: exerciseId,
      attemptId: `${exerciseId}-${Date.now()}`,
      eventType: "exercise_submitted",
      result: score >= 80 ? "correct" : score >= 50 ? "partial" : "incorrect",
      score,
      durationMs: 0,
      difficulty:
        exercise.level === "easy"
          ? "beginner"
          : exercise.level === "hard"
            ? "advanced"
            : "intermediate",
    });

    // Update listening skill profile (adaptive difficulty)
    const accuracy = correctCount / questions.length;
    const skillUpdate = await updateSkillProfile(userId, "listening", accuracy);

    return Response.json({
      score,
      total: questions.length,
      correct: correctCount,
      xpEarned,
      results,
      passage: exercise.passage, // reveal full passage after submission
      scriptRevealed,
      skill: {
        cefr: skillUpdate.cefr,
        levelUp: skillUpdate.levelUp,
        levelChanged: skillUpdate.levelChanged,
        previousLevel: skillUpdate.previousLevel,
        newLevel: skillUpdate.newLevel,
      },
    });
  } catch (err) {
    log.error({ err }, "listening.submit.error");
    return Response.json({ error: "Failed to submit answers" }, { status: 500 });
  }
}
