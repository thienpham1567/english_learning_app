import { z } from "zod/v4";

// ── Recommendation Group (AC: 2) ────────────────────────────────────────────

export const RecommendationGroup = z.enum([
	"must_do",
	"should_do",
	"could_do",
]);

// ── Score Breakdown (AC: 1 — internal for tests/debugging) ──────────────────

export const ScoreBreakdownSchema = z.object({
	dueUrgency: z.number(),
	masteryGap: z.number(),
	goalRelevance: z.number(),
	recency: z.number(),
	difficultyFit: z.number(),
	durationFit: z.number(),
	skillImportance: z.number(),
	completionLikelihood: z.number(),
});

// ── Recommendation Candidate Input ──────────────────────────────────────────

export const RecommendationCandidateSchema = z.object({
	/** Unique candidate identifier */
	id: z.string().min(1),
	/** Target skill IDs this action exercises */
	skillIds: z.array(z.string()).min(1),
	/** Module type for routing */
	moduleType: z.string().min(1),
	/** App route for the action */
	actionUrl: z.string().min(1),
	/** Label shown to user */
	label: z.string().min(1),
	/** Estimated minutes to complete */
	estimatedMinutes: z.number().positive(),
	/** Is this a due review item? */
	isDueReview: z.boolean(),
	/** When is the next review due (ISO datetime, nullable) */
	dueAt: z.string().datetime().nullable(),
	/** Current proficiency for the primary skill (0–100) */
	currentProficiency: z.number().min(0).max(100),
	/** Current confidence for the primary skill (0–1) */
	currentConfidence: z.number().min(0).max(1),
	/** Difficulty level of this action */
	difficulty: z.enum(["beginner", "elementary", "intermediate", "upper_intermediate", "advanced"]),
	/** Is this skill aligned with the user's goal? */
	goalAligned: z.boolean(),
	/** Hours since last practice on this skill */
	hoursSinceLastPractice: z.number().nonnegative(),
});

// ── Recommendation Output (AC: 1, 2, 3) ────────────────────────────────────

export const RecommendationSchema = z.object({
	id: z.string().min(1),
	skillIds: z.array(z.string()),
	moduleType: z.string(),
	actionUrl: z.string(),
	label: z.string(),
	estimatedMinutes: z.number(),
	/** Learner-facing short reason text (AC: 3) */
	reason: z.string().min(1),
	/** Composite score for ranking */
	score: z.number(),
	/** Priority group (AC: 2) */
	group: RecommendationGroup,
	/** Score breakdown for debugging */
	breakdown: ScoreBreakdownSchema,
});

// ── Scorer Input — context for scoring ──────────────────────────────────────

export const ScorerContextSchema = z.object({
	/** Available time budget in minutes (optional filter) */
	timeBudgetMinutes: z.number().positive().optional(),
	/** User's exam goal (toeic/ielts) */
	examGoal: z.enum(["toeic", "ielts"]).optional(),
	/** Current timestamp for due urgency calculation */
	nowMs: z.number(),
});

// ── Inferred types ──────────────────────────────────────────────────────────

export type RecommendationGroupValue = z.infer<typeof RecommendationGroup>;
export type ScoreBreakdown = z.infer<typeof ScoreBreakdownSchema>;
export type RecommendationCandidate = z.infer<typeof RecommendationCandidateSchema>;
export type Recommendation = z.infer<typeof RecommendationSchema>;
export type ScorerContext = z.infer<typeof ScorerContextSchema>;
