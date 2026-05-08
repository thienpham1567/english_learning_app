import { headers } from "next/headers";
import { eq, and } from "drizzle-orm";

import { auth } from "@/lib/auth";
import { db } from "@repo/database";
import { dailyChallenge } from "@repo/database";
import { SubmitAnswerSchema } from "@/lib/daily-challenge/schema";
import { awardXP, XP_VALUES } from "@/lib/xp";
import { logActivity } from "@/lib/activity-log";
import type { Exercise, ExerciseAnswer } from "@/lib/daily-challenge/types";

function getVnDate(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Ho_Chi_Minh" });
}

function scoreExercise(
  exercise: Exercise,
  answer: string,
): { isCorrect: boolean; explanation: string; correctAnswer: string; questionStem: string } {
  switch (exercise.type) {
    case "fill-in-blank": {
      const d = exercise.data;
      const correct = d.options[d.correctIndex];
      const isCorrect = correct?.toLowerCase() === answer.toLowerCase();
      return { isCorrect, correctAnswer: correct, questionStem: d.sentence, explanation: isCorrect ? "Chính xác!" : `Đáp án đúng là "${correct}".` };
    }
    case "sentence-order": {
      const d = exercise.data;
      const correctSentence = d.correctOrder.join(" ");
      const isCorrect = correctSentence.toLowerCase() === answer.toLowerCase();
      return { isCorrect, correctAnswer: correctSentence, questionStem: `Sắp xếp: ${d.scrambled.join(" / ")}`, explanation: isCorrect ? "Chính xác!" : `Thứ tự đúng: "${correctSentence}".` };
    }
    case "translation": {
      const d = exercise.data;
      const normalized = answer.toLowerCase().replace(/[.!?]/g, "").trim();
      const isCorrect = d.acceptableAnswers.some((a) => a.toLowerCase().replace(/[.!?]/g, "").trim() === normalized);
      return { isCorrect, correctAnswer: d.acceptableAnswers[0], questionStem: d.vietnamese, explanation: isCorrect ? "Chính xác!" : `Đáp án: "${d.acceptableAnswers[0]}".` };
    }
    case "error-correction": {
      const d = exercise.data;
      const isCorrect = answer.toLowerCase().trim() === d.correction.toLowerCase().trim();
      return { isCorrect, correctAnswer: d.correction, questionStem: d.sentence, explanation: isCorrect ? "Chính xác!" : `${d.explanation}` };
    }
    case "word-formation": {
      const d = exercise.data;
      const correct = d.options[d.correctIndex];
      const isCorrect = correct?.toLowerCase() === answer.toLowerCase();
      return { isCorrect, correctAnswer: correct, questionStem: `${d.sentence} (gốc: ${d.rootWord})`, explanation: isCorrect ? "Chính xác!" : `Đáp án: "${correct}".` };
    }
    case "dialogue-completion": {
      const d = exercise.data;
      const correct = d.options[d.correctIndex];
      const isCorrect = correct?.toLowerCase() === answer.toLowerCase();
      return { isCorrect, correctAnswer: correct, questionStem: `Hội thoại: ${d.context}`, explanation: isCorrect ? "Chính xác!" : `Đáp án: "${correct}".` };
    }
    case "synonym-antonym": {
      const d = exercise.data;
      const correct = d.options[d.correctIndex];
      const isCorrect = correct?.toLowerCase() === answer.toLowerCase();
      return { isCorrect, correctAnswer: correct, questionStem: `${d.mode === "synonym" ? "Đồng nghĩa" : "Trái nghĩa"}: ${d.word}`, explanation: isCorrect ? "Chính xác!" : `Đáp án: "${correct}".` };
    }
    case "reading-comprehension": {
      const d = exercise.data;
      const correct = d.options[d.correctIndex];
      const isCorrect = correct?.toLowerCase() === answer.toLowerCase();
      return { isCorrect, correctAnswer: correct, questionStem: d.question, explanation: isCorrect ? "Chính xác!" : `Đáp án: "${correct}".` };
    }
    case "collocation": {
      const d = exercise.data;
      const correct = d.options[d.correctIndex];
      const isCorrect = correct?.toLowerCase() === answer.toLowerCase();
      return { isCorrect, correctAnswer: correct, questionStem: d.phrase, explanation: isCorrect ? "Chính xác!" : `${d.explanation}` };
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

  // Get today's bonus challenge
  const rows = await db
    .select()
    .from(dailyChallenge)
    .where(
      and(eq(dailyChallenge.userId, session.user.id), eq(dailyChallenge.challengeDate, `${vnToday}-bonus`)),
    )
    .limit(1);

  const challenge = rows[0];
  if (!challenge) {
    return Response.json({ error: "No bonus challenge found" }, { status: 404 });
  }

  if (challenge.completedAt) {
    return Response.json({ error: "Bonus already completed" }, { status: 409 });
  }

  // Score answers
  const exercises = challenge.exercises as Exercise[];
  const scoredAnswers: ExerciseAnswer[] = parsed.data.answers.map((a) => {
    const exercise = exercises[a.exerciseIndex];
    if (!exercise) return { ...a, isCorrect: false, explanation: "Câu hỏi không tồn tại." };
    const result = scoreExercise(exercise, a.answer);
    return { ...a, ...result, exerciseType: exercise.type };
  });

  const score = scoredAnswers.filter((a) => a.isCorrect).length;

  // Update bonus challenge (no streak update for bonus)
  await db
    .update(dailyChallenge)
    .set({
      answers: scoredAnswers,
      score,
      completedAt: new Date(),
      timeElapsedMs: parsed.data.timeElapsedMs,
    })
    .where(eq(dailyChallenge.id, challenge.id));

  // Award reduced XP for bonus
  const bonusXP = Math.max(5, Math.floor((XP_VALUES.DAILY_CHALLENGE ?? 15) * 0.5));
  void awardXP(session.user.id, bonusXP).catch(() => {});
  logActivity(session.user.id, "daily_challenge", bonusXP, { score, type: "bonus" });

  return Response.json({
    answers: scoredAnswers,
    score,
  });
}
