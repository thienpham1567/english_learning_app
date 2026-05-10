import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@repo/database";
import { toeicAttempt, toeicAnswer, toeicQuestion } from "@repo/database";
import { and, desc, eq, inArray, isNull } from "drizzle-orm";

/**
 * GET /api/toeic-mock/in-progress
 * Returns the user's most recent unfinished mock_test attempt (if any) plus
 * the question list (preserved via attempt.questionIds) and answered IDs.
 *
 * Used by the hub to offer "Tiếp tục mock" and the runner to resume state.
 */
export async function GET() {
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session?.user?.id) {
		return Response.json({ error: "Unauthorized" }, { status: 401 });
	}
	const userId = session.user.id;

	const [attempt] = await db
		.select()
		.from(toeicAttempt)
		.where(
			and(
				eq(toeicAttempt.userId, userId),
				eq(toeicAttempt.mode, "mock_test"),
				isNull(toeicAttempt.completedAt),
			),
		)
		.orderBy(desc(toeicAttempt.startedAt))
		.limit(1);

	if (!attempt || !attempt.questionIds || attempt.questionIds.length === 0) {
		return Response.json({ inProgress: null });
	}

	const answers = await db
		.select({ questionId: toeicAnswer.questionId })
		.from(toeicAnswer)
		.where(eq(toeicAnswer.attemptId, attempt.id));
	const answeredSet = new Set(answers.map((a) => a.questionId));

	const questions = await db
		.select()
		.from(toeicQuestion)
		.where(inArray(toeicQuestion.id, attempt.questionIds));

	// Preserve original order from questionIds
	const byId = new Map(questions.map((q) => [q.id, q]));
	const orderedQuestions = attempt.questionIds
		.map((id) => byId.get(id))
		.filter((q): q is NonNullable<typeof q> => Boolean(q));

	return Response.json({
		inProgress: {
			attemptId: attempt.id,
			questionCount: attempt.questionCount,
			startedAt: attempt.startedAt,
			readingStartedAt: attempt.readingStartedAt,
			questions: orderedQuestions.map((q) => ({
				id: q.id,
				part: q.part,
				questionText: q.questionText,
				passageText: q.passageText,
				options: q.options,
				correctIndex: -1,
				explanationEn: null,
				explanationVi: null,
				audioUrl: q.audioUrl,
				audioSegments: q.audioSegments,
				imageUrls: q.imageUrls,
				skillIds: q.skillIds,
				topic: q.topic,
				parentId: q.parentId,
				groupOrder: q.groupOrder,
				number: q.number,
				examCode: null,
			})),
			answeredIds: Array.from(answeredSet),
		},
	});
}
