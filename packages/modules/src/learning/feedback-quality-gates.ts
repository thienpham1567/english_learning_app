import { StructuredFeedbackSchema } from "@repo/contracts/src/learning/structured-feedback";
import type {
	StructuredFeedback,
	FeedbackIssue,
	FeedbackActionTypeValue,
} from "@repo/contracts/src/learning/structured-feedback";
import type { ReviewTaskProducerOutput } from "./review-producers";
import { produceReviewTask } from "./review-producers";

// ── Validation & Safe Degradation (AC: 2) ───────────────────────────────────

/**
 * Validate AI model output against StructuredFeedbackSchema.
 * Returns parsed feedback on success, or a degraded fallback on recoverable failure.
 * Throws on completely unusable output.
 */
export function validateFeedbackOutput(
	raw: unknown,
): { feedback: StructuredFeedback; degraded: boolean } {
	const parsed = StructuredFeedbackSchema.safeParse(raw);

	if (parsed.success) {
		return { feedback: parsed.data, degraded: false };
	}

	// Attempt safe degradation for partially valid output
	if (raw && typeof raw === "object" && "summary" in raw) {
		const obj = raw as Record<string, unknown>;
		const fallback: StructuredFeedback = {
			summary: typeof obj.summary === "string" ? obj.summary : "Feedback could not be fully parsed.",
			strengths: Array.isArray(obj.strengths)
				? obj.strengths.filter((s): s is string => typeof s === "string")
				: [],
			issues: [],
			priorityIssues: [],
			suggestedRewrite: null,
			confidence: 0,
			nextActionCandidates: [],
		};
		return { feedback: fallback, degraded: true };
	}

	throw new Error("AI feedback output is completely unusable and cannot be parsed.");
}

// ── Priority Issues → Review Tasks (AC: 3) ─────────────────────────────────

/**
 * Convert high-priority feedback issues into review task candidates.
 * Only issues with severity "high" or "critical" and mapped skillIds are eligible.
 */
export function issuesAsReviewTasks(
	userId: string,
	feedbackRunId: string,
	issues: FeedbackIssue[],
): ReviewTaskProducerOutput[] {
	return issues
		.filter((issue) =>
			(issue.severity === "high" || issue.severity === "critical") &&
			issue.skillIds.length > 0,
		)
		.map((issue) =>
			produceReviewTask(
				{
					userId,
					sourceType: "error_retry",
					sourceId: `feedback-${feedbackRunId}-${issue.id}`,
					skillIds: issue.skillIds,
					reason: `Fix: ${issue.description}`,
				},
				issue.severity === "critical" ? 80 : 65,
			),
		);
}

// ── Feedback Action Tracking (AC: 4) ───────────────────────────────────────

export interface FeedbackActionRecord {
	feedbackRunId: string;
	userId: string;
	action: FeedbackActionTypeValue;
	editedContent: string | null;
	timestamp: string;
}

/**
 * Create a feedback action record. Pure — persistence is handled by caller.
 */
export function recordFeedbackAction(
	feedbackRunId: string,
	userId: string,
	action: FeedbackActionTypeValue,
	editedContent?: string,
): FeedbackActionRecord {
	return {
		feedbackRunId,
		userId,
		action,
		editedContent: editedContent ?? null,
		timestamp: new Date().toISOString(),
	};
}

/**
 * Determine if a feedback action is meaningful enough to emit a learning event.
 * "accepted" and "retried" are meaningful; "ignored" is not.
 */
export function isMeaningfulFeedbackAction(action: FeedbackActionTypeValue): boolean {
	return action === "accepted" || action === "retried" || action === "edited";
}
