import { describe, expect, it } from "vitest";
import {
	validateFeedbackOutput,
	issuesAsReviewTasks,
	recordFeedbackAction,
	isMeaningfulFeedbackAction,
} from "../../src/learning/feedback-quality-gates";
import type { StructuredFeedback, FeedbackIssue } from "@repo/contracts/src/learning/structured-feedback";

// ── Helper: valid structured feedback ───────────────────────────────────────

function makeValidFeedback(overrides: Partial<StructuredFeedback> = {}): StructuredFeedback {
	return {
		summary: "Your writing shows good structure but has grammar issues.",
		strengths: ["Clear thesis", "Good paragraph flow"],
		issues: [
			{
				id: "issue-1",
				category: "grammar",
				description: "Subject-verb agreement error",
				severity: "high",
				evidenceSpan: { start: 42, end: 55, text: "they was going" },
				suggestedFix: "they were going",
				skillIds: ["grammar"],
			},
		],
		priorityIssues: ["issue-1"],
		suggestedRewrite: "They were going to the store when...",
		confidence: 0.85,
		nextActionCandidates: [
			{
				type: "drill",
				description: "Practice subject-verb agreement",
				skillIds: ["grammar"],
				estimatedMinutes: 5,
			},
		],
		...overrides,
	};
}

// ── Valid Output (AC: 1, 5) ─────────────────────────────────────────────────

describe("validateFeedbackOutput — valid output", () => {
	it("accepts well-formed structured feedback (AC: 1)", () => {
		const valid = makeValidFeedback();
		const { feedback, degraded } = validateFeedbackOutput(valid);
		expect(degraded).toBe(false);
		expect(feedback.summary).toBe(valid.summary);
		expect(feedback.strengths).toHaveLength(2);
		expect(feedback.issues).toHaveLength(1);
		expect(feedback.confidence).toBe(0.85);
	});

	it("includes evidence spans (AC: 1)", () => {
		const { feedback } = validateFeedbackOutput(makeValidFeedback());
		expect(feedback.issues[0]!.evidenceSpan).toEqual({
			start: 42,
			end: 55,
			text: "they was going",
		});
	});

	it("includes next action candidates (AC: 1)", () => {
		const { feedback } = validateFeedbackOutput(makeValidFeedback());
		expect(feedback.nextActionCandidates).toHaveLength(1);
		expect(feedback.nextActionCandidates[0]!.type).toBe("drill");
	});

	it("includes priority issues list (AC: 1)", () => {
		const { feedback } = validateFeedbackOutput(makeValidFeedback());
		expect(feedback.priorityIssues).toContain("issue-1");
	});
});

// ── Malformed Output (AC: 2, 5) ─────────────────────────────────────────────

describe("validateFeedbackOutput — malformed output", () => {
	it("degrades gracefully when partial (AC: 2)", () => {
		const partial = { summary: "Some feedback", extraField: true };
		const { feedback, degraded } = validateFeedbackOutput(partial);
		expect(degraded).toBe(true);
		expect(feedback.summary).toBe("Some feedback");
		expect(feedback.issues).toEqual([]);
		expect(feedback.confidence).toBe(0);
	});

	it("preserves strengths in degraded mode if valid array", () => {
		const partial = {
			summary: "OK feedback",
			strengths: ["Good vocabulary", 42],
		};
		const { feedback, degraded } = validateFeedbackOutput(partial);
		expect(degraded).toBe(true);
		expect(feedback.strengths).toEqual(["Good vocabulary"]);
	});

	it("throws on completely unusable output (AC: 2)", () => {
		expect(() => validateFeedbackOutput(null)).toThrow("unusable");
		expect(() => validateFeedbackOutput(undefined)).toThrow("unusable");
		expect(() => validateFeedbackOutput("just a string")).toThrow("unusable");
		expect(() => validateFeedbackOutput({ score: 5 })).toThrow("unusable");
	});
});

// ── Priority Issues → Review Tasks (AC: 3, 5) ──────────────────────────────

describe("issuesAsReviewTasks", () => {
	const baseIssue: FeedbackIssue = {
		id: "i1",
		category: "grammar",
		description: "Verb tense error",
		severity: "high",
		evidenceSpan: null,
		suggestedFix: null,
		skillIds: ["grammar"],
	};

	it("creates review tasks for high-severity issues (AC: 3)", () => {
		const tasks = issuesAsReviewTasks("u1", "run-1", [baseIssue]);
		expect(tasks).toHaveLength(1);
		expect(tasks[0]!.sourceType).toBe("error_retry");
		expect(tasks[0]!.skillIds).toEqual(["grammar"]);
		expect(tasks[0]!.reason).toContain("Verb tense error");
	});

	it("creates review tasks for critical-severity issues (AC: 3)", () => {
		const critical = { ...baseIssue, id: "i2", severity: "critical" as const };
		const tasks = issuesAsReviewTasks("u1", "run-1", [critical]);
		expect(tasks).toHaveLength(1);
		expect(tasks[0]!.priority).toBe(80); // critical gets highest priority
	});

	it("skips low and medium severity issues", () => {
		const low = { ...baseIssue, id: "i3", severity: "low" as const };
		const medium = { ...baseIssue, id: "i4", severity: "medium" as const };
		const tasks = issuesAsReviewTasks("u1", "run-1", [low, medium]);
		expect(tasks).toHaveLength(0);
	});

	it("skips issues without skill IDs", () => {
		const noSkills = { ...baseIssue, id: "i5", skillIds: [] };
		const tasks = issuesAsReviewTasks("u1", "run-1", [noSkills]);
		expect(tasks).toHaveLength(0);
	});

	it("handles multiple high-priority issues", () => {
		const issues = [
			baseIssue,
			{ ...baseIssue, id: "i6", category: "vocabulary", skillIds: ["vocabulary"] },
		];
		const tasks = issuesAsReviewTasks("u1", "run-1", issues);
		expect(tasks).toHaveLength(2);
	});
});

// ── Feedback Action Tracking (AC: 4, 5) ────────────────────────────────────

describe("recordFeedbackAction", () => {
	it("creates an accepted action record (AC: 4)", () => {
		const record = recordFeedbackAction("run-1", "u1", "accepted");
		expect(record.action).toBe("accepted");
		expect(record.feedbackRunId).toBe("run-1");
		expect(record.editedContent).toBeNull();
		expect(record.timestamp).toBeTruthy();
	});

	it("creates an edited action with content (AC: 4)", () => {
		const record = recordFeedbackAction("run-1", "u1", "edited", "Fixed version");
		expect(record.action).toBe("edited");
		expect(record.editedContent).toBe("Fixed version");
	});

	it("creates retried and ignored actions (AC: 4)", () => {
		const retried = recordFeedbackAction("run-1", "u1", "retried");
		const ignored = recordFeedbackAction("run-1", "u1", "ignored");
		expect(retried.action).toBe("retried");
		expect(ignored.action).toBe("ignored");
	});
});

describe("isMeaningfulFeedbackAction", () => {
	it("accepted is meaningful", () => {
		expect(isMeaningfulFeedbackAction("accepted")).toBe(true);
	});

	it("retried is meaningful", () => {
		expect(isMeaningfulFeedbackAction("retried")).toBe(true);
	});

	it("edited is meaningful", () => {
		expect(isMeaningfulFeedbackAction("edited")).toBe(true);
	});

	it("ignored is not meaningful", () => {
		expect(isMeaningfulFeedbackAction("ignored")).toBe(false);
	});
});
