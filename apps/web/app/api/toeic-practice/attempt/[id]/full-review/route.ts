import { db, toeicAnswer, toeicAttempt, toeicQuestion } from "@repo/database";
import { and, eq, inArray } from "drizzle-orm";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

/**
 * GET /api/toeic-practice/attempt/[id]/full-review
 * Returns attempt + all answered questions + answers for the review tabs UI.
 * Owner-only.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;

  const [attempt] = await db
    .select()
    .from(toeicAttempt)
    .where(and(eq(toeicAttempt.id, id), eq(toeicAttempt.userId, session.user.id)))
    .limit(1);
  if (!attempt) return Response.json({ error: "Not found" }, { status: 404 });

  const answers = await db.select().from(toeicAnswer).where(eq(toeicAnswer.attemptId, id));
  const questionIds = answers.map((a) => a.questionId);
  const questions = questionIds.length
    ? await db.select().from(toeicQuestion).where(inArray(toeicQuestion.id, questionIds))
    : [];

  return Response.json({
    attempt: {
      id: attempt.id,
      mode: attempt.mode,
      completedAt: attempt.completedAt,
      scaledListening: attempt.scaledListening,
      scaledReading: attempt.scaledReading,
      totalScaled: attempt.totalScaled,
      cheatViolations: attempt.cheatViolations,
    },
    questions: questions.map((q) => ({
      id: q.id,
      number: q.number,
      part: q.part,
      questionText: q.questionText,
      passageText: q.passageText,
      options: q.options,
      correctIndex: q.correctIndex,
      explanationVi: q.explanationVi,
      explanationEn: q.explanationEn,
      audioUrl: q.audioUrl,
      audioSegments: q.audioSegments,
      imageUrls: q.imageUrls,
      skillIds: q.skillIds,
    })),
    answers: answers.map((a) => ({
      questionId: a.questionId,
      selectedIndex: a.selectedIndex,
      isCorrect: a.isCorrect,
      flagged: a.flagged,
      durationMs: a.durationMs,
    })),
  });
}
