import { z } from "zod/v4";

// ── Evidence Span (AC: 1) ───────────────────────────────────────────────────

export const EvidenceSpanSchema = z.object({
	/** Start char offset in user's text */
	start: z.number().int().nonnegative(),
	/** End char offset (exclusive) */
	end: z.number().int().nonnegative(),
	/** The text fragment */
	text: z.string(),
});

// ── Feedback Issue (AC: 1) ──────────────────────────────────────────────────

export const FeedbackIssueSeverity = z.enum(["low", "medium", "high", "critical"]);

export const FeedbackIssueSchema = z.object({
	id: z.string().min(1),
	category: z.string().min(1),
	description: z.string().min(1),
	severity: FeedbackIssueSeverity,
	evidenceSpan: EvidenceSpanSchema.nullable(),
	suggestedFix: z.string().nullable(),
	/** Mapped skill IDs from taxonomy (AC: 3) */
	skillIds: z.array(z.string()),
});

// ── Next Action Candidate (AC: 1) ──────────────────────────────────────────

export const NextActionCandidateSchema = z.object({
	type: z.enum(["rewrite", "drill", "review", "practice"]),
	description: z.string().min(1),
	skillIds: z.array(z.string()),
	estimatedMinutes: z.number().positive(),
});

// ── Structured Feedback (AC: 1) ─────────────────────────────────────────────

export const StructuredFeedbackSchema = z.object({
	summary: z.string().min(1),
	strengths: z.array(z.string()),
	issues: z.array(FeedbackIssueSchema),
	priorityIssues: z.array(z.string().min(1)),
	suggestedRewrite: z.string().nullable(),
	confidence: z.number().min(0).max(1),
	nextActionCandidates: z.array(NextActionCandidateSchema),
});

// ── Feedback Action Tracking (AC: 4) ───────────────────────────────────────

export const FeedbackActionType = z.enum([
	"accepted",
	"ignored",
	"edited",
	"retried",
]);

export const FeedbackActionSchema = z.object({
	feedbackRunId: z.string().min(1),
	userId: z.string().min(1),
	action: FeedbackActionType,
	editedContent: z.string().nullable(),
	timestamp: z.string().datetime(),
});

// ── Inferred types ──────────────────────────────────────────────────────────

export type EvidenceSpan = z.infer<typeof EvidenceSpanSchema>;
export type FeedbackIssueSeverityValue = z.infer<typeof FeedbackIssueSeverity>;
export type FeedbackIssue = z.infer<typeof FeedbackIssueSchema>;
export type NextActionCandidate = z.infer<typeof NextActionCandidateSchema>;
export type StructuredFeedback = z.infer<typeof StructuredFeedbackSchema>;
export type FeedbackActionTypeValue = z.infer<typeof FeedbackActionType>;
export type FeedbackAction = z.infer<typeof FeedbackActionSchema>;
