import { headers } from "next/headers";
import { eq, and } from "drizzle-orm";

import { auth } from "@/lib/auth";
import { db } from "@repo/database";
import { listeningExercise } from "@repo/database";
import type { ListeningQuestion } from "@repo/database";
import { awardXP, XP_VALUES } from "@/lib/xp";
import { logActivity } from "@/lib/activity-log";
import { SubmitInputSchema } from "@/lib/listening/types";
import { updateSkillProfile } from "@/lib/adaptive/difficulty";
import { recordLearningEvent } from "@repo/modules";

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
      return Response.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
    }

    const { exerciseId, answers } = parsed.data;
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

    // Save results
    await db
      .update(listeningExercise)
      .set({
        answers,
        score,
        completedAt: new Date(),
      })
      .where(eq(listeningExercise.id, exerciseId));

    // Award XP + log activity (fire-and-forget)
    void awardXP(userId, XP_VALUES.LISTENING_PRACTICE).catch(() => {});
    logActivity(userId, "listening_practice", XP_VALUES.LISTENING_PRACTICE, {
      exerciseId,
      level: exercise.level,
      exerciseType: exercise.exerciseType,
      score,
      correctCount,
      totalQuestions: questions.length,
    });

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
      difficulty: exercise.level === "easy" ? "beginner" : exercise.level === "hard" ? "advanced" : "intermediate",
    });

    // Update listening skill profile (adaptive difficulty)
    const accuracy = correctCount / questions.length;
    const skillUpdate = await updateSkillProfile(userId, "listening", accuracy);

    return Response.json({
      score,
      total: questions.length,
      correct: correctCount,
      xpEarned: XP_VALUES.LISTENING_PRACTICE,
      results,
      passage: exercise.passage, // reveal full passage after submission
      skill: {
        cefr: skillUpdate.cefr,
        levelUp: skillUpdate.levelUp,
        levelChanged: skillUpdate.levelChanged,
        previousLevel: skillUpdate.previousLevel,
        newLevel: skillUpdate.newLevel,
      },
    });
  } catch (err) {
    console.error("[Listening] Submit error:", err);
    return Response.json({ error: "Failed to submit answers" }, { status: 500 });
  }
}
