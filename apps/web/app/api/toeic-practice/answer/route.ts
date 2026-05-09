import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@repo/database";
import { toeicAnswer, toeicAttempt, toeicQuestion } from "@repo/database";
import { and, eq, sql } from "drizzle-orm";
import { emitToeicLearningEvent } from "@/lib/toeic/event-emitter";

const BodySchema = z.object({
	attemptId: z.string().uuid(),
	questionId: z.string().uuid(),
	selectedIndex: z.number().int().min(0).max(3).nullable(),
	durationMs: z.number().int().min(0),
});

const MODE_TO_MODULE: Record<string, "toeic_practice" | "toeic_mock_test" | "toeic_diagnostic"> = {
	practice: "toeic_practice",
	mock_test: "toeic_mock_test",
	diagnostic: "toeic_diagnostic",
	drill: "toeic_practice",
};

export async function POST(req: Request) {
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session?.user?.id) {
		return Response.json({ error: "Unauthorized" }, { status: 401 });
	}

	const parsed = BodySchema.safeParse(await req.json());
	if (!parsed.success) {
		return Response.json({ error: "Invalid body", details: parsed.error.flatten() }, { status: 400 });
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

	const [question] = await db
		.select()
		.from(toeicQuestion)
		.where(eq(toeicQuestion.id, body.questionId))
		.limit(1);
	if (!question) {
		return Response.json({ error: "Question not found" }, { status: 404 });
	}

	const isCorrect = body.selectedIndex === null ? null : body.selectedIndex === question.correctIndex;

	await db
		.insert(toeicAnswer)
		.values({
			attemptId: body.attemptId,
			questionId: body.questionId,
			selectedIndex: body.selectedIndex,
			isCorrect,
			durationMs: body.durationMs,
		})
		.onConflictDoUpdate({
			target: [toeicAnswer.attemptId, toeicAnswer.questionId],
			set: {
				selectedIndex: body.selectedIndex,
				isCorrect,
				durationMs: body.durationMs,
				changedCount: sql`${toeicAnswer.changedCount} + 1`,
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

	return Response.json({ ok: true, isCorrect });
}
