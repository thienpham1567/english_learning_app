import { db, errorLog, toeicAnswer, toeicAttempt, toeicQuestion } from "@repo/database";
import { and, eq, sql } from "drizzle-orm";
import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { recordActivityStreak } from "@/lib/streak";
import { emitToeicLearningEvent } from "@/lib/toeic/event-emitter";
import { awardXP, XP_VALUES } from "@/lib/xp";

const MODE_TO_SOURCE_MODULE: Record<string, string> = {
  practice: "toeic-practice",
  mock_test: "toeic-mock-test",
  drill: "toeic-drill",
};

const BodySchema = z.object({
  attemptId: z.string().uuid(),
  questionId: z.string().uuid(),
  selectedIndex: z.number().int().min(0).max(3).nullable(),
  durationMs: z.number().int().min(0),
  /** Optional: persist flagged state on toeic_answer (no answer change required). */
  flagged: z.boolean().optional(),
  /** Optional: report soft-cheat event during mock test (short-circuit return). */
  cheatEvent: z.enum(["tabSwitch", "paste"]).optional(),
  /** Time spent off-tab in ms (only meaningful for cheatEvent="tabSwitch"). */
  durationMsOff: z.number().int().min(0).optional(),
});

const MODE_TO_MODULE: Record<string, "toeic_practice" | "toeic_mock_test"> = {
  practice: "toeic_practice",
  mock_test: "toeic_mock_test",
  drill: "toeic_practice",
};

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = BodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return Response.json(
      { error: "Invalid body", details: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const body = parsed.data;
  const userId = session.user.id;

  const [attempt] = await db
    .select()
    .from(toeicAttempt)
    .where(and(eq(toeicAttempt.id, body.attemptId), eq(toeicAttempt.userId, userId)))
    .limit(1);
  if (!attempt) {
    return Response.json({ error: "Attempt not found" }, { status: 404 });
  }
  if (attempt.completedAt) {
    return Response.json({ error: "Attempt already completed" }, { status: 409 });
  }

  // Cheat event short-circuit — increment counters and return without recording an answer.
  if (body.cheatEvent) {
    const prev = attempt.cheatViolations ?? {
      tabSwitches: 0,
      pasteAttempts: 0,
      longBlurMs: 0,
    };
    const next = {
      tabSwitches: prev.tabSwitches + (body.cheatEvent === "tabSwitch" ? 1 : 0),
      pasteAttempts: prev.pasteAttempts + (body.cheatEvent === "paste" ? 1 : 0),
      longBlurMs:
        prev.longBlurMs + (body.cheatEvent === "tabSwitch" ? (body.durationMsOff ?? 0) : 0),
    };
    await db
      .update(toeicAttempt)
      .set({ cheatViolations: next })
      .where(eq(toeicAttempt.id, body.attemptId));
    return Response.json({ ok: true, cheatViolations: next });
  }

  const [question] = await db
    .select()
    .from(toeicQuestion)
    .where(eq(toeicQuestion.id, body.questionId))
    .limit(1);
  if (!question) {
    return Response.json({ error: "Question not found" }, { status: 404 });
  }

  const isCorrect =
    body.selectedIndex === null ? null : body.selectedIndex === question.correctIndex;

  await db
    .insert(toeicAnswer)
    .values({
      attemptId: body.attemptId,
      questionId: body.questionId,
      selectedIndex: body.selectedIndex,
      isCorrect,
      durationMs: body.durationMs,
      flagged: body.flagged ?? false,
    })
    .onConflictDoUpdate({
      target: [toeicAnswer.attemptId, toeicAnswer.questionId],
      set: {
        selectedIndex: body.selectedIndex,
        isCorrect,
        durationMs: body.durationMs,
        changedCount: sql`${toeicAnswer.changedCount} + 1`,
        ...(body.flagged !== undefined ? { flagged: body.flagged } : {}),
      },
    });

  void emitToeicLearningEvent({
    userId,
    moduleType: MODE_TO_MODULE[attempt.mode] ?? "toeic_practice",
    attemptId: body.attemptId,
    questionId: body.questionId,
    skillIds: question.skillIds,
    isCorrect,
    durationMs: body.durationMs,
    difficulty: question.difficulty,
  });

  // Award XP + bump streak for correct answers (small per-answer reward)
  if (isCorrect === true) {
    void awardXP(userId, XP_VALUES.TOEIC_ANSWER_CORRECT);
    void recordActivityStreak(userId);
  }

  // Bridge to error-notebook: persist incorrect answers to errorLog so users
  // see TOEIC mistakes alongside grammar-quiz errors.
  if (isCorrect === false && body.selectedIndex !== null) {
    void db
      .insert(errorLog)
      .values({
        userId,
        sourceModule: MODE_TO_SOURCE_MODULE[attempt.mode] ?? "toeic-practice",
        questionStem: question.questionText ?? `TOEIC Part ${question.part} câu ${question.number}`,
        options: question.options,
        userAnswer: question.options[body.selectedIndex] ?? `Option ${body.selectedIndex}`,
        correctAnswer: question.options[question.correctIndex] ?? "Unknown",
        explanationEn: question.explanationEn,
        explanationVi: question.explanationVi,
        grammarTopic: question.skillIds[0] ?? question.topic ?? null,
      })
      .catch((err) => {
        // Non-blocking; event pipeline already captured the mistake via reviewTask
        console.warn("errorLog insert failed:", err instanceof Error ? err.message : err);
      });
  }

  return Response.json({ ok: true, isCorrect });
}
