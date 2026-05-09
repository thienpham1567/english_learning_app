/**
 * TOEIC event-pipeline glue.
 *
 * Each TOEIC answer flows through this helper:
 *   1. recordLearningEvent → learning_event table
 *   2. produceReviewTask + createReviewTask → review_task table (on incorrect)
 *
 * Mastery updates happen via review-task completions in the existing
 * review-completion module (not here). The diagnostic /complete endpoint
 * seeds initial userSkillState from %correct per skill.
 */
import { recordLearningEvent, produceReviewTask } from "@repo/modules";
import { createReviewTask } from "@repo/database";
import { routeLogger } from "@/lib/logger";

const log = routeLogger("toeic/event-emitter");

export type EmitToeicEventInput = {
	userId: string;
	moduleType: "toeic_practice" | "toeic_mock_test" | "toeic_diagnostic";
	attemptId: string;
	questionId: string;
	skillIds: string[];
	isCorrect: boolean | null;
	durationMs: number;
	difficulty: string;
};

export async function emitToeicLearningEvent(input: EmitToeicEventInput): Promise<void> {
	const result =
		input.isCorrect === null
			? "neutral"
			: input.isCorrect
				? "correct"
				: "incorrect";
	const score = input.isCorrect === null ? null : input.isCorrect ? 1 : 0;

	const difficulty = ([
		"beginner",
		"elementary",
		"intermediate",
		"upper_intermediate",
		"advanced",
	].includes(input.difficulty)
		? input.difficulty
		: "intermediate") as
		| "beginner"
		| "elementary"
		| "intermediate"
		| "upper_intermediate"
		| "advanced";

	try {
		await recordLearningEvent({
			userId: input.userId,
			sessionId: input.attemptId,
			moduleType: input.moduleType,
			contentId: input.questionId,
			skillIds: input.skillIds.length > 0 ? input.skillIds : undefined,
			attemptId: input.attemptId,
			eventType: "answer_graded",
			result,
			score,
			durationMs: input.durationMs,
			difficulty,
			errorTags: [],
		});
	} catch (err) {
		log.error({ err, contentId: input.questionId }, "record_learning_event_failed");
	}

	if (input.isCorrect === false && input.skillIds.length > 0) {
		try {
			const producer = produceReviewTask({
				userId: input.userId,
				sourceType: "error_retry",
				sourceId: input.questionId,
				skillIds: input.skillIds,
				reason: `Incorrect TOEIC answer (${input.moduleType})`,
			});
			await createReviewTask({
				userId: producer.userId,
				sourceType: producer.sourceType,
				sourceId: producer.sourceId,
				skillIds: producer.skillIds,
				priority: producer.priority,
				dueAt: new Date(producer.dueAt),
				estimatedMinutes: producer.estimatedMinutes,
				reviewMode: producer.reviewMode,
			});
		} catch (err) {
			log.error({ err, contentId: input.questionId }, "create_review_task_failed");
		}
	}
}
