import { z } from "zod/v4";

// ── Source Types (AC: 2) ────────────────────────────────────────────────────

export const ReviewSourceType = z.enum([
	"flashcard_review",
	"error_retry",
	"grammar_remediation",
	"writing_rewrite",
	"pronunciation_drill",
	"listening_replay",
	"cloze_retry",
]);

// ── Review Mode ─────────────────────────────────────────────────────────────

export const ReviewMode = z.enum([
	"recall",        // Active recall (flashcard-style)
	"recognition",   // Multiple choice
	"production",    // Free-form answer
	"guided",        // Guided correction (error retry, writing rewrite)
]);

// ── Review Task Status ──────────────────────────────────────────────────────

export const ReviewTaskStatus = z.enum([
	"pending",       // Awaiting review
	"in_progress",   // Currently being reviewed
	"completed",     // Successfully completed
	"suppressed",    // Temporarily suppressed by user/system
]);

// ── Review Outcome ──────────────────────────────────────────────────────────

export const ReviewOutcome = z.enum([
	"again",    // Failed — re-review soon (SM-2 quality 0)
	"hard",     // Difficult — shorter interval (SM-2 quality 2)
	"good",     // Correct — normal interval (SM-2 quality 3)
	"easy",     // Effortless — longer interval (SM-2 quality 5)
]);

// ── Review Task DTO (AC: 1) ─────────────────────────────────────────────────

export const ReviewTaskSchema = z.object({
	id: z.string().min(1),
	userId: z.string().min(1),
	sourceType: ReviewSourceType,
	sourceId: z.string().min(1),
	skillIds: z.array(z.string()).min(1),
	priority: z.number().int().min(0).max(100),
	dueAt: z.string().datetime(),
	estimatedMinutes: z.number().positive(),
	reviewMode: ReviewMode,
	status: ReviewTaskStatus,
	lastOutcome: ReviewOutcome.nullable(),
	attemptCount: z.number().int().nonnegative(),
	nextIntervalDays: z.number().nonnegative(),
	easeFactor: z.number().min(1.3),
	suppressionReason: z.string().nullable(),
	createdAt: z.string().datetime(),
	updatedAt: z.string().datetime(),
});

// ── Scheduling Input ────────────────────────────────────────────────────────

export const ScheduleReviewInputSchema = z.object({
	taskId: z.string().min(1),
	outcome: ReviewOutcome,
	/** Time spent in ms (for quality assessment) */
	durationMs: z.number().int().nonnegative(),
});

// ── Scheduling Output ───────────────────────────────────────────────────────

export const ScheduleReviewOutputSchema = z.object({
	nextIntervalDays: z.number().nonnegative(),
	nextDueAt: z.string().datetime(),
	newEaseFactor: z.number().min(1.3),
	newPriority: z.number().int(),
	newAttemptCount: z.number().int(),
});

// ── Inferred types ──────────────────────────────────────────────────────────

export type ReviewSourceTypeValue = z.infer<typeof ReviewSourceType>;
export type ReviewModeValue = z.infer<typeof ReviewMode>;
export type ReviewTaskStatusValue = z.infer<typeof ReviewTaskStatus>;
export type ReviewOutcomeValue = z.infer<typeof ReviewOutcome>;
export type ReviewTask = z.infer<typeof ReviewTaskSchema>;
export type ScheduleReviewInput = z.infer<typeof ScheduleReviewInputSchema>;
export type ScheduleReviewOutput = z.infer<typeof ScheduleReviewOutputSchema>;
