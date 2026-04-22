import type {
	ReviewOutcomeValue,
	ReviewSourceTypeValue,
	ScheduleReviewOutput,
} from "@repo/contracts";

// ── SM-2 Quality Mapping ────────────────────────────────────────────────────

const OUTCOME_QUALITY: Record<ReviewOutcomeValue, number> = {
	again: 0,
	hard: 2,
	good: 3,
	easy: 5,
};

// ── Default intervals by source type (AC: 3) ───────────────────────────────

const DEFAULT_INTERVAL: Record<ReviewSourceTypeValue, number> = {
	flashcard_review: 1,
	error_retry: 0.5,
	grammar_remediation: 1,
	writing_rewrite: 2,
	pronunciation_drill: 1,
	listening_replay: 1,
	cloze_retry: 1,
};

// ── Estimated minutes by source type ────────────────────────────────────────

export const DEFAULT_ESTIMATED_MINUTES: Record<ReviewSourceTypeValue, number> = {
	flashcard_review: 5,
	error_retry: 5,
	grammar_remediation: 10,
	writing_rewrite: 15,
	pronunciation_drill: 5,
	listening_replay: 10,
	cloze_retry: 8,
};

// ── Default review mode by source type ──────────────────────────────────────

export const DEFAULT_REVIEW_MODE: Record<ReviewSourceTypeValue, string> = {
	flashcard_review: "recall",
	error_retry: "guided",
	grammar_remediation: "recognition",
	writing_rewrite: "production",
	pronunciation_drill: "production",
	listening_replay: "recognition",
	cloze_retry: "production",
};

// ── Heavy task types — burnout protection (AC: 4) ───────────────────────────

const HEAVY_SOURCE_TYPES: Set<ReviewSourceTypeValue> = new Set([
	"writing_rewrite",
	"grammar_remediation",
	"listening_replay",
]);

/** Maximum heavy tasks allowed due in a single day */
export const MAX_HEAVY_PER_DAY = 2;

// ── Initial Schedule (AC: 3) ────────────────────────────────────────────────

/**
 * Compute the initial schedule for a new review task.
 * Returns the due date and interval based on source type.
 */
export function computeInitialSchedule(
	sourceType: ReviewSourceTypeValue,
	nowMs: number = Date.now(),
): { dueAt: string; intervalDays: number; estimatedMinutes: number; reviewMode: string } {
	const intervalDays = DEFAULT_INTERVAL[sourceType] ?? 1;
	const dueMs = nowMs + intervalDays * 24 * 60 * 60 * 1000;
	return {
		dueAt: new Date(dueMs).toISOString(),
		intervalDays,
		estimatedMinutes: DEFAULT_ESTIMATED_MINUTES[sourceType] ?? 5,
		reviewMode: DEFAULT_REVIEW_MODE[sourceType] ?? "recall",
	};
}

// ── Rescheduling (AC: 3, 4) ─────────────────────────────────────────────────

/**
 * Reschedule a review task after an attempt using SM-2 algorithm.
 *
 * - Success (good/easy): increase interval by easeFactor (AC: 3)
 * - Failure (again): reset interval to initial (AC: 3)
 * - Hard: shorter interval progression (AC: 3)
 * - Urgency boost: overdue tasks get +10 priority (AC: 4)
 */
export function computeReschedule(
	outcome: ReviewOutcomeValue,
	currentEaseFactor: number,
	currentIntervalDays: number,
	attemptCount: number,
	currentPriority: number,
	dueAtMs: number,
	nowMs: number = Date.now(),
): ScheduleReviewOutput {
	const quality = OUTCOME_QUALITY[outcome];

	// SM-2 ease factor update
	let newEaseFactor = currentEaseFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
	newEaseFactor = Math.round(Math.max(1.3, newEaseFactor) * 100) / 100;

	let nextIntervalDays: number;
	if (quality < 3) {
		// Failed — reset interval
		nextIntervalDays = quality === 0 ? 0.25 : 0.5; // again → 6h, hard → 12h
	} else {
		// Success — extend interval
		const newAttempt = attemptCount + 1;
		if (newAttempt === 1) {
			nextIntervalDays = 1;
		} else if (newAttempt === 2) {
			nextIntervalDays = 6;
		} else {
			nextIntervalDays = Math.round(currentIntervalDays * newEaseFactor * 10) / 10;
		}

		// Easy bonus: extend 50% more
		if (quality === 5) {
			nextIntervalDays = Math.round(nextIntervalDays * 1.5 * 10) / 10;
		}
	}

	// Urgency boost: overdue tasks get priority bump (AC: 4)
	let newPriority = currentPriority;
	const overdueHours = (nowMs - dueAtMs) / (1000 * 60 * 60);
	if (overdueHours > 0) {
		newPriority = Math.min(100, currentPriority + 10);
	}
	// Reduce priority on easy
	if (quality === 5) {
		newPriority = Math.max(0, newPriority - 15);
	}
	// Increase priority on failure
	if (quality < 3) {
		newPriority = Math.min(100, newPriority + 10);
	}

	const nextDueMs = nowMs + nextIntervalDays * 24 * 60 * 60 * 1000;

	return {
		nextIntervalDays,
		nextDueAt: new Date(nextDueMs).toISOString(),
		newEaseFactor,
		newPriority,
		newAttemptCount: attemptCount + 1,
	};
}

// ── Burnout Protection (AC: 4) ──────────────────────────────────────────────

/**
 * Check if a source type is considered "heavy" for burnout protection.
 */
export function isHeavySourceType(sourceType: ReviewSourceTypeValue): boolean {
	return HEAVY_SOURCE_TYPES.has(sourceType);
}

/**
 * Apply burnout protection: cap heavy tasks due per day.
 * Returns the list with excess heavy tasks postponed by 1 day.
 */
export function applyBurnoutProtection<T extends { sourceType: string; dueAt: string }>(
	tasks: T[],
	maxHeavyPerDay: number = MAX_HEAVY_PER_DAY,
): T[] {
	let heavyCount = 0;
	return tasks.map((task) => {
		if (isHeavySourceType(task.sourceType as ReviewSourceTypeValue)) {
			heavyCount++;
			if (heavyCount > maxHeavyPerDay) {
				// Postpone by 1 day
				const postponedMs = new Date(task.dueAt).getTime() + 24 * 60 * 60 * 1000;
				return { ...task, dueAt: new Date(postponedMs).toISOString() };
			}
		}
		return task;
	});
}
