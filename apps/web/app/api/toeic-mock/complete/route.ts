import { db, reviewTask, toeicAnswer, toeicAttempt, toeicQuestion } from "@repo/database";
import { computeInitialSchedule } from "@repo/modules";
import { and, eq, inArray } from "drizzle-orm";
import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { recordActivityStreak } from "@/lib/streak";
import { computeMockScore } from "@/lib/toeic/scoring";
import { awardXP, XP_VALUES } from "@/lib/xp";

const BodySchema = z.object({ attemptId: z.string().uuid() });

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const parsed = BodySchema.safeParse(await req.json());
  if (!parsed.success) return Response.json({ error: "Invalid body" }, { status: 400 });
  const { attemptId } = parsed.data;
  const userId = session.user.id;

  const [attempt] = await db
    .select()
    .from(toeicAttempt)
    .where(and(eq(toeicAttempt.id, attemptId), eq(toeicAttempt.userId, userId)))
    .limit(1);
  if (!attempt) return Response.json({ error: "Not found" }, { status: 404 });
  if (attempt.mode !== "mock_test")
    return Response.json({ error: "Not a mock attempt" }, { status: 400 });

  const answers = await db.select().from(toeicAnswer).where(eq(toeicAnswer.attemptId, attemptId));
  const questionIds = answers.map((a) => a.questionId);
  const questions = questionIds.length
    ? await db.select().from(toeicQuestion).where(inArray(toeicQuestion.id, questionIds))
    : [];
  const partById = new Map(questions.map((q) => [q.id, q.part]));
  const byId = new Map(questions.map((q) => [q.id, q]));

  const enriched = answers.map((a) => ({
    part: partById.get(a.questionId) ?? 0,
    isCorrect: a.isCorrect,
  }));

  const score = computeMockScore(enriched);

  const completedAt = new Date();
  const startedAtMs = attempt.startedAt.getTime();
  await db
    .update(toeicAttempt)
    .set({
      completedAt,
      durationMs: completedAt.getTime() - startedAtMs,
      rawListening: score.rawListening,
      rawReading: score.rawReading,
      scaledListening: score.scaledListening,
      scaledReading: score.scaledReading,
      totalScaled: score.totalScaled,
    })
    .where(eq(toeicAttempt.id, attemptId));

  // Per-part breakdown for result page
  const byPart: Record<number, { correct: number; total: number }> = {};
  for (const a of answers) {
    const p = partById.get(a.questionId) ?? 0;
    byPart[p] = byPart[p] ?? { correct: 0, total: 0 };
    byPart[p].total++;
    if (a.isCorrect === true) byPart[p].correct++;
  }

  // Enqueue bookmark_review SRS for flagged questions answered CORRECTLY.
  // (Wrong answers already enqueue error_retry via the answer event-emitter upstream.)
  const flaggedAnswers = answers.filter((a) => a.flagged && a.isCorrect === true);
  if (flaggedAnswers.length > 0) {
    const now = new Date();
    const init = computeInitialSchedule("bookmark_review", now.getTime());
    await Promise.all(
      flaggedAnswers.map(async (a) => {
        const q = byId.get(a.questionId);
        if (!q) return;
        await db
          .insert(reviewTask)
          .values({
            userId,
            sourceType: "bookmark_review",
            sourceId: a.questionId,
            skillIds: q.skillIds.length > 0 ? q.skillIds : ["toeic.general"],
            priority: 30,
            dueAt: new Date(init.dueAt),
            estimatedMinutes: init.estimatedMinutes,
            reviewMode: init.reviewMode,
            status: "pending",
            lastOutcome: null,
            attemptCount: 0,
            nextIntervalDays: init.intervalDays,
            easeFactor: 2.5,
          })
          .onConflictDoNothing();
      }),
    );
  }

  void awardXP(userId, XP_VALUES.TOEIC_MOCK_COMPLETE);
  void recordActivityStreak(userId);

  return Response.json({ ...score, byPart });
}
