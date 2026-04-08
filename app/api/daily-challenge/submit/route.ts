import { headers } from "next/headers";
import { eq, and } from "drizzle-orm";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { dailyChallenge, userStreak } from "@/lib/db/schema";
import { SubmitAnswerSchema } from "@/lib/daily-challenge/schema";
import { getBadges, getNewlyUnlockedBadges } from "@/lib/daily-challenge/badges";
import type { Exercise, ExerciseAnswer } from "@/lib/daily-challenge/types";

function getVnDate(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Ho_Chi_Minh" });
}

function getVnYesterday(): string {
  // Parse today's VN date and subtract 1 day — avoids server-timezone skew
  const today = getVnDate(); // YYYY-MM-DD
  const d = new Date(today + "T00:00:00+07:00");
  d.setDate(d.getDate() - 1);
  return d.toLocaleDateString("en-CA", { timeZone: "Asia/Ho_Chi_Minh" });
}

function scoreExercise(exercise: Exercise, answer: string): { isCorrect: boolean; explanation: string } {
  switch (exercise.type) {
    case "fill-in-blank": {
      const d = exercise.data;
      const isCorrect = d.options[d.correctIndex]?.toLowerCase() === answer.toLowerCase();
      return { isCorrect, explanation: isCorrect ? "Chính xác!" : `Đáp án đúng: ${d.options[d.correctIndex]}` };
    }
    case "sentence-order": {
      const d = exercise.data;
      const isCorrect = d.correctOrder.join(" ").toLowerCase() === answer.toLowerCase();
      return { isCorrect, explanation: isCorrect ? "Chính xác!" : `Câu đúng: ${d.correctOrder.join(" ")}` };
    }
    case "translation": {
      const d = exercise.data;
      const normalized = answer.toLowerCase().replace(/[.!?]/g, "").trim();
      const isCorrect = d.acceptableAnswers.some(
        (a) => a.toLowerCase().replace(/[.!?]/g, "").trim() === normalized,
      );
      return { isCorrect, explanation: isCorrect ? "Chính xác!" : `Đáp án chấp nhận: ${d.acceptableAnswers[0]}` };
    }
    case "error-correction": {
      const d = exercise.data;
      const isCorrect = answer.toLowerCase().trim() === d.correction.toLowerCase().trim();
      return { isCorrect, explanation: isCorrect ? "Chính xác!" : `${d.explanation} Đáp án: ${d.correction}` };
    }
  }
}

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = SubmitAnswerSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
  }

  const vnToday = getVnDate();

  // Get today's challenge
  const rows = await db
    .select()
    .from(dailyChallenge)
    .where(
      and(
        eq(dailyChallenge.userId, session.user.id),
        eq(dailyChallenge.challengeDate, vnToday),
      ),
    )
    .limit(1);

  const challenge = rows[0];
  if (!challenge) {
    return Response.json({ error: "No challenge found for today" }, { status: 404 });
  }

  if (challenge.completedAt) {
    return Response.json({ error: "Already completed today's challenge" }, { status: 409 });
  }

  // Score answers
  const exercises = challenge.exercises as Exercise[];
  const scoredAnswers: ExerciseAnswer[] = parsed.data.answers.map((a) => {
    const exercise = exercises[a.exerciseIndex];
    if (!exercise) return { ...a, isCorrect: false, explanation: "Câu hỏi không tồn tại." };
    const result = scoreExercise(exercise, a.answer);
    return { ...a, ...result };
  });

  const score = scoredAnswers.filter((a) => a.isCorrect).length;

  // Update challenge
  await db
    .update(dailyChallenge)
    .set({
      answers: scoredAnswers,
      score,
      completedAt: new Date(),
      timeElapsedMs: parsed.data.timeElapsedMs,
    })
    .where(eq(dailyChallenge.id, challenge.id));

  // Update streak
  const streakRows = await db
    .select()
    .from(userStreak)
    .where(eq(userStreak.userId, session.user.id))
    .limit(1);

  const vnYesterday = getVnYesterday();
  let currentStreak: number;
  let previousBestStreak = 0;

  if (streakRows[0]) {
    const s = streakRows[0];
    previousBestStreak = s.bestStreak;

    if (s.lastCompletedDate === vnToday) {
      // Already counted today
      currentStreak = s.currentStreak;
    } else if (s.lastCompletedDate === vnYesterday) {
      // Consecutive
      currentStreak = s.currentStreak + 1;
    } else {
      // Missed day(s)
      currentStreak = 1;
    }

    const newBest = Math.max(s.bestStreak, currentStreak);
    await db
      .update(userStreak)
      .set({
        currentStreak,
        bestStreak: newBest,
        lastCompletedDate: vnToday,
        updatedAt: new Date(),
      })
      .where(eq(userStreak.userId, session.user.id));
  } else {
    currentStreak = 1;
    await db.insert(userStreak).values({
      userId: session.user.id,
      currentStreak: 1,
      bestStreak: 1,
      lastCompletedDate: vnToday,
    });
  }

  const newBestStreak = Math.max(previousBestStreak, currentStreak);
  const allBadges = getBadges(newBestStreak);
  const newBadges = getNewlyUnlockedBadges(previousBestStreak, newBestStreak);

  return Response.json({
    answers: scoredAnswers,
    score,
    streak: {
      currentStreak,
      bestStreak: newBestStreak,
      lastCompletedDate: vnToday,
    },
    badges: allBadges,
    newBadges,
  });
}
