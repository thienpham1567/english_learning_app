import type {
	ReviewOutcomeValue,
	ReviewSourceTypeValue,
	LearningResultValue,
	LearningDifficultyValue,
	ScheduleReviewOutput,
} from "@repo/contracts";
import { computeReschedule } from "./review-scheduler";
import { computeMasteryUpdate, defaultSkillState } from "./mastery-engine";

// ── Stable / Mastered Threshold (AC: 3) ─────────────────────────────────────

/** Consecutive successes before a task is considered stable */
const STABLE_THRESHOLD = 3;
/** Consecutive easy successes before a task is considered mastered */
const MASTERED_THRESHOLD = 5;

// ── Review Outcome → Learning Result mapping ────────────────────────────────

function outcomeToResult(outcome: ReviewOutcomeValue): LearningResultValue {
	if (outcome === "again") return "incorrect";
	if (outcome === "hard") return "partial";
	return "correct";
}

// ── Review Outcome → Difficulty approximation ───────────────────────────────

function outcomeToDifficulty(outcome: ReviewOutcomeValue): LearningDifficultyValue {
	if (outcome === "again") return "advanced";
	if (outcome === "hard") return "upper_intermediate";
	if (outcome === "good") return "intermediate";
	return "beginner"; // easy
}

// ── Source type → module type mapping ────────────────────────────────────────

const SOURCE_TO_MODULE: Record<ReviewSourceTypeValue, string> = {
	flashcard_review: "flashcard",
	error_retry: "grammar_quiz",
	grammar_remediation: "grammar_quiz",
	writing_rewrite: "writing",
	pronunciation_drill: "speaking",
	listening_replay: "listening",
	cloze_retry: "reading",
};

// ── Next-action messages (AC: 4) ────────────────────────────────────────────

function getNextActionMessage(
	outcome: ReviewOutcomeValue,
	nextIntervalDays: number,
	isStable: boolean,
	isMastered: boolean,
): string {
	if (isMastered) return "🏆 Mastered! This won't appear for a while.";
	if (isStable) return "✅ Getting solid! Review interval extended.";
	if (outcome === "again") return "🔄 Don't worry — you'll see this again soon.";
	if (outcome === "hard") return `💪 Keep at it — next review in ${formatInterval(nextIntervalDays)}.`;
	if (outcome === "easy") return `🚀 Great! Next review in ${formatInterval(nextIntervalDays)}.`;
	return `👍 Good job — next review in ${formatInterval(nextIntervalDays)}.`;
}

function formatInterval(days: number): string {
	if (days < 1) {
		const hours = Math.round(days * 24);
		return `${hours}h`;
	}
	if (days < 7) return `${Math.round(days)}d`;
	return `${Math.round(days / 7)}w`;
}

// ── Completion Input ────────────────────────────────────────────────────────

export interface ReviewCompletionInput {
	taskId: string;
	userId: string;
	sourceType: ReviewSourceTypeValue;
	sourceId: string;
	skillIds: string[];
	outcome: ReviewOutcomeValue;
	durationMs: number;
	currentEaseFactor: number;
	currentIntervalDays: number;
	currentAttemptCount: number;
	currentPriority: number;
	currentSuccessStreak: number;
	dueAtMs: number;
	nowMs?: number;
}

// ── Completion Output ───────────────────────────────────────────────────────

export interface ReviewCompletionOutput {
	schedule: ScheduleReviewOutput;
	taskStatus: "pending" | "completed" | "suppressed";
	isStable: boolean;
	isMastered: boolean;
	nextActionMessage: string;
	learningEvent: {
		userId: string;
		sessionId: string;
		moduleType: string;
		contentId: string;
		skillIds: string[];
		attemptId: string;
		eventType: "review_completed";
		result: LearningResultValue;
		score: number | null;
		durationMs: number;
		difficulty: LearningDifficultyValue;
		errorTags: string[];
		timestamp: string;
	};
	masteryUpdates: Array<{
		skillId: string;
		previousProficiency: number;
		newProficiency: number;
		delta: number;
	}>;
}

// ── Complete Review (AC: 1, 2, 3, 4) ────────────────────────────────────────

/**
 * Process a review completion:
 * 1. Compute new schedule via SM-2 (AC: 1)
 * 2. Determine stable/mastered status (AC: 3)
 * 3. Build learning event for persistence (AC: 1)
 * 4. Compute mastery updates for affected skills (AC: 1)
 * 5. Generate next-action message (AC: 4)
 *
 * This is a pure function — side effects (persistence) are handled by the caller.
 */
export function completeReview(
	input: ReviewCompletionInput,
	existingSkillStates?: Map<string, { proficiency: number; confidence: number; successStreak: number; failureStreak: number; decayRate: number; signalCount: number; lastPracticedAt: string; lastUpdatedAt: string; nextReviewAt: string }>,
): ReviewCompletionOutput {
	const nowMs = input.nowMs ?? Date.now();
	const now = new Date(nowMs).toISOString();

	// 1. Schedule update (AC: 1, 2)
	const schedule = computeReschedule(
		input.outcome,
		input.currentEaseFactor,
		input.currentIntervalDays,
		input.currentAttemptCount,
		input.currentPriority,
		input.dueAtMs,
		nowMs,
	);

	// 2. Stable/mastered detection (AC: 3)
	const isSuccess = input.outcome === "good" || input.outcome === "easy";
	const newSuccessStreak = isSuccess ? input.currentSuccessStreak + 1 : 0;
	const isStable = newSuccessStreak >= STABLE_THRESHOLD;
	const isMastered = newSuccessStreak >= MASTERED_THRESHOLD && input.outcome === "easy";

	// Task stays pending for reschedule, or completed if mastered
	const taskStatus = isMastered ? "completed" as const : "pending" as const;

	// 3. Learning event (AC: 1)
	const learningEvent = {
		userId: input.userId,
		sessionId: `review-${input.taskId}`,
		moduleType: SOURCE_TO_MODULE[input.sourceType] ?? "flashcard",
		contentId: input.sourceId,
		skillIds: input.skillIds,
		attemptId: `${input.taskId}-${schedule.newAttemptCount}`,
		eventType: "review_completed" as const,
		result: outcomeToResult(input.outcome),
		score: null,
		durationMs: input.durationMs,
		difficulty: outcomeToDifficulty(input.outcome),
		errorTags: input.outcome === "again" ? ["review_failed"] : [],
		timestamp: now,
	};

	// 4. Mastery updates for each affected skill (AC: 1)
	const masteryUpdates = input.skillIds.map((skillId) => {
		const existing = existingSkillStates?.get(skillId);
		const currentState = existing
			? {
				userId: input.userId,
				skillId,
				proficiency: existing.proficiency,
				confidence: existing.confidence,
				successStreak: existing.successStreak,
				failureStreak: existing.failureStreak,
				decayRate: existing.decayRate,
				signalCount: existing.signalCount,
				lastPracticedAt: existing.lastPracticedAt,
				lastUpdatedAt: existing.lastUpdatedAt,
				nextReviewAt: existing.nextReviewAt,
			}
			: defaultSkillState(input.userId, skillId);

		const { output } = computeMasteryUpdate(currentState, {
			result: learningEvent.result,
			difficulty: learningEvent.difficulty,
			hintCount: 0,
		});

		return {
			skillId,
			previousProficiency: output.previousProficiency,
			newProficiency: output.newProficiency,
			delta: output.delta,
		};
	});

	// 5. Next action message (AC: 4)
	const nextActionMessage = getNextActionMessage(
		input.outcome,
		schedule.nextIntervalDays,
		isStable,
		isMastered,
	);

	return {
		schedule,
		taskStatus,
		isStable,
		isMastered,
		nextActionMessage,
		learningEvent,
		masteryUpdates,
	};
}
