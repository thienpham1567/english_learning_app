import type { ReviewSourceTypeValue } from "@repo/contracts";
import {
	computeInitialSchedule,
} from "./review-scheduler";

// ── Producer Input ──────────────────────────────────────────────────────────

/**
 * Common input for all review task producers.
 * Each producer maps module-specific result objects to this shape.
 */
export interface ReviewTaskProducerInput {
	userId: string;
	sourceType: ReviewSourceTypeValue;
	sourceId: string;
	skillIds: string[];
	/** Short reason for why this needs review */
	reason: string;
}

/**
 * Output from a producer — ready for persistence via createReviewTask.
 */
export interface ReviewTaskProducerOutput {
	userId: string;
	sourceType: ReviewSourceTypeValue;
	sourceId: string;
	skillIds: string[];
	priority: number;
	dueAt: string;
	estimatedMinutes: number;
	reviewMode: string;
	reason: string;
}

// ── Base Producer ───────────────────────────────────────────────────────────

/**
 * Convert a producer input into a producer output with scheduling defaults.
 * All specific producers delegate to this.
 */
export function produceReviewTask(
	input: ReviewTaskProducerInput,
	priorityOverride?: number,
	nowMs: number = Date.now(),
): ReviewTaskProducerOutput {
	const schedule = computeInitialSchedule(input.sourceType, nowMs);

	return {
		userId: input.userId,
		sourceType: input.sourceType,
		sourceId: input.sourceId,
		skillIds: input.skillIds,
		priority: priorityOverride ?? 50,
		dueAt: schedule.dueAt,
		estimatedMinutes: schedule.estimatedMinutes,
		reviewMode: schedule.reviewMode,
		reason: input.reason,
	};
}

// ── Vocabulary / Flashcard Producer (AC: 2, 5) ─────────────────────────────

export function produceVocabularyReviewTask(
	userId: string,
	wordId: string,
	word: string,
): ReviewTaskProducerOutput {
	return produceReviewTask({
		userId,
		sourceType: "flashcard_review",
		sourceId: `vocab-${wordId}`,
		skillIds: ["vocabulary"],
		reason: `Review missed word: "${word}"`,
	}, 60); // Higher priority for vocabulary misses
}

// ── Writing Error Producer (AC: 2, 5) ──────────────────────────────────────

export function produceWritingReviewTask(
	userId: string,
	errorId: string,
	errorPattern: string,
): ReviewTaskProducerOutput {
	return produceReviewTask({
		userId,
		sourceType: "writing_rewrite",
		sourceId: `writing-${errorId}`,
		skillIds: ["writing"],
		reason: `Practice fixing: "${errorPattern}"`,
	}, 50);
}

// ── Pronunciation Issue Producer (AC: 2, 5) ────────────────────────────────

export function producePronunciationReviewTask(
	userId: string,
	exerciseId: string,
	word: string,
): ReviewTaskProducerOutput {
	return produceReviewTask({
		userId,
		sourceType: "pronunciation_drill",
		sourceId: `pronun-${exerciseId}`,
		skillIds: ["pronunciation", "speaking"],
		reason: `Drill pronunciation: "${word}"`,
	}, 45);
}

// ── Grammar Remediation Producer (AC: 2) ────────────────────────────────────

export function produceGrammarReviewTask(
	userId: string,
	questionId: string,
	topic: string,
): ReviewTaskProducerOutput {
	return produceReviewTask({
		userId,
		sourceType: "grammar_remediation",
		sourceId: `grammar-${questionId}`,
		skillIds: ["grammar"],
		reason: `Review grammar: "${topic}"`,
	}, 55);
}

// ── Listening Replay Producer (AC: 2) ───────────────────────────────────────

export function produceListeningReviewTask(
	userId: string,
	exerciseId: string,
	topic: string,
): ReviewTaskProducerOutput {
	return produceReviewTask({
		userId,
		sourceType: "listening_replay",
		sourceId: `listening-${exerciseId}`,
		skillIds: ["listening"],
		reason: `Replay listening: "${topic}"`,
	}, 45);
}

// ── Cloze Retry Producer (AC: 2) ────────────────────────────────────────────

export function produceClozeReviewTask(
	userId: string,
	passageId: string,
	topic: string,
): ReviewTaskProducerOutput {
	return produceReviewTask({
		userId,
		sourceType: "cloze_retry",
		sourceId: `cloze-${passageId}`,
		skillIds: ["reading", "vocabulary"],
		reason: `Retry cloze: "${topic}"`,
	}, 40);
}
