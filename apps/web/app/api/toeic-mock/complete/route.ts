import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@repo/database";
import { toeicAttempt, toeicAnswer, toeicQuestion } from "@repo/database";
import { and, eq, inArray } from "drizzle-orm";
import { computeMockScore } from "@/lib/toeic/scoring";

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

	return Response.json({ ...score, byPart });
}
