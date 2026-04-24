import { z } from "zod/v4";

/**
 * End-Of-Lesson Summary Contract (Story 25.1, AC: 1-3)
 *
 * Shared contract for all learning modules to produce a structured
 * end-of-lesson summary. Supports grammar, listening, reading, writing,
 * speaking, pronunciation, vocabulary, and mock-test modules (AC: 2).
 *
 * No module UI migration required in this story (AC: 4).
 */

// ── Supported Module Types (AC: 2) ─────────────────────────────────────────

export const LessonModuleType = z.enum([
	"grammar-quiz",
	"grammar-lessons",
	"listening",
	"reading",
	"writing",
	"speaking",
	"pronunciation",
	"vocabulary",
	"mock-test",
	"daily-challenge",
	"error-drill",
	"flashcards",
]);

// ── Summary Result Outcome ──────────────────────────────────────────────────

export const SummaryOutcome = z.enum([
	"passed",
	"failed",
	"completed",
	"needs_review",
]);

// ── Next Action Suggestion ──────────────────────────────────────────────────

export const NextActionSchema = z.object({
	/** Label shown to the learner */
	label: z.string().min(1),
	/** App route for the action */
	href: z.string().min(1),
	/** Priority: primary (main CTA) or secondary */
	priority: z.enum(["primary", "secondary"]),
});

// ── Review Task Candidate ───────────────────────────────────────────────────

export const ReviewCandidateSchema = z.object({
	/** Skill ID to review */
	skillId: z.string().min(1),
	/** What to review (e.g. "Present Perfect Tense") */
	topic: z.string().min(1),
	/** Urgency: how soon the review is needed */
	urgency: z.enum(["immediate", "soon", "later"]),
});

// ── Top Issue ───────────────────────────────────────────────────────────────

export const TopIssueSchema = z.object({
	/** Short description of the issue */
	description: z.string().min(1),
	/** Category of the issue (e.g. "tense", "vocabulary") */
	category: z.string().min(1),
	/** How many times this issue appeared in the session */
	occurrences: z.number().nonnegative(),
});

// ── End-Of-Lesson Summary (AC: 1) ──────────────────────────────────────────

export const LessonSummarySchema = z.object({
	/** Module that produced the summary */
	moduleType: LessonModuleType,
	/** Session identifier */
	sessionId: z.string().min(1),
	/** When the session was completed */
	completedAt: z.string().datetime(),

	// ── Result ────────────────────────────────────────────────────────────
	/** Outcome of the lesson */
	outcome: SummaryOutcome,
	/** Score (0-100, percentage) */
	score: z.number().min(0).max(100),
	/** Correct answers out of total */
	correctCount: z.number().nonnegative(),
	/** Total questions/items */
	totalCount: z.number().nonnegative(),
	/** Time spent in seconds */
	durationSeconds: z.number().nonnegative(),

	// ── Explanation ───────────────────────────────────────────────────────
	/** Brief learner-facing explanation of performance */
	explanation: z.string().min(1),

	// ── Top Issue ─────────────────────────────────────────────────────────
	/** The most significant issue encountered (nullable if none) */
	topIssue: TopIssueSchema.nullable(),

	// ── Next Actions ──────────────────────────────────────────────────────
	/** Suggested next actions (at least one primary) */
	nextActions: z.array(NextActionSchema).min(1),

	// ── Skills ────────────────────────────────────────────────────────────
	/** Skill IDs exercised in this session */
	skillIds: z.array(z.string().min(1)).min(1),

	// ── Review Candidates ─────────────────────────────────────────────────
	/** Optional review task candidates generated from errors */
	reviewCandidates: z.array(ReviewCandidateSchema).default([]),
});

// ── Inferred Types ──────────────────────────────────────────────────────────

export type LessonModuleTypeValue = z.infer<typeof LessonModuleType>;
export type SummaryOutcomeValue = z.infer<typeof SummaryOutcome>;
export type NextAction = z.infer<typeof NextActionSchema>;
export type ReviewCandidate = z.infer<typeof ReviewCandidateSchema>;
export type TopIssue = z.infer<typeof TopIssueSchema>;
export type LessonSummary = z.infer<typeof LessonSummarySchema>;
