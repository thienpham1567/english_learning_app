import { describe, expect, it } from "vitest";
import { LessonSummarySchema } from "@repo/contracts";
import {
	buildGrammarQuizSummary,
	buildListeningSummary,
	buildWritingSummary,
	buildGenericSummary,
} from "../../src/learning/lesson-summary-builder";
import type { SummaryBuilderInput } from "../../src/learning/lesson-summary-builder";

// ── Helpers ─────────────────────────────────────────────────────────────────

const NOW = "2026-04-24T12:00:00Z";

function makeInput(overrides?: Partial<SummaryBuilderInput>): SummaryBuilderInput {
	return {
		sessionId: "s-123",
		correctCount: 8,
		totalCount: 10,
		durationSeconds: 300,
		completedAt: NOW,
		...overrides,
	};
}

// ── Grammar Quiz (AC: 1) ───────────────────────────────────────────────────

describe("buildGrammarQuizSummary (AC: 1)", () => {
	it("produces a valid LessonSummary", () => {
		const summary = buildGrammarQuizSummary(makeInput());
		const result = LessonSummarySchema.safeParse(summary);
		expect(result.success).toBe(true);
	});

	it("computes score from correct/total", () => {
		const summary = buildGrammarQuizSummary(makeInput({ correctCount: 7, totalCount: 10 }));
		expect(summary.score).toBe(70);
	});

	it("sets outcome=passed for score >= 70", () => {
		const summary = buildGrammarQuizSummary(makeInput({ correctCount: 8, totalCount: 10 }));
		expect(summary.outcome).toBe("passed");
	});

	it("sets outcome=failed for score < 50", () => {
		const summary = buildGrammarQuizSummary(makeInput({ correctCount: 3, totalCount: 10 }));
		expect(summary.outcome).toBe("failed");
	});

	it("includes top issue when provided", () => {
		const summary = buildGrammarQuizSummary(makeInput({
			topErrorTopic: "Present Perfect vs Past Simple",
			topErrorCategory: "tense",
			topErrorOccurrences: 3,
		}));
		expect(summary.topIssue).toBeTruthy();
		expect(summary.topIssue!.description).toBe("Present Perfect vs Past Simple");
		expect(summary.topIssue!.occurrences).toBe(3);
	});

	it("has null topIssue when none provided", () => {
		const summary = buildGrammarQuizSummary(makeInput());
		expect(summary.topIssue).toBeNull();
	});

	it("generates review candidates from top issue", () => {
		const summary = buildGrammarQuizSummary(makeInput({
			correctCount: 3, totalCount: 10,
			topErrorTopic: "Articles",
		}));
		expect(summary.reviewCandidates.length).toBe(1);
		expect(summary.reviewCandidates[0]!.urgency).toBe("immediate");
	});

	it("next actions include retry for low scores", () => {
		const summary = buildGrammarQuizSummary(makeInput({ correctCount: 3, totalCount: 10 }));
		expect(summary.nextActions[0]!.label).toBe("Làm lại");
		expect(summary.nextActions[0]!.href).toBe("/grammar-quiz");
	});
});

// ── Listening (AC: 1) ──────────────────────────────────────────────────────

describe("buildListeningSummary (AC: 1)", () => {
	it("produces a valid LessonSummary", () => {
		const summary = buildListeningSummary(makeInput());
		const result = LessonSummarySchema.safeParse(summary);
		expect(result.success).toBe(true);
	});

	it("sets moduleType to listening", () => {
		const summary = buildListeningSummary(makeInput());
		expect(summary.moduleType).toBe("listening");
	});

	it("explanation uses 'nghe'", () => {
		const summary = buildListeningSummary(makeInput());
		expect(summary.explanation).toContain("nghe");
	});
});

// ── Writing (AC: 1) ────────────────────────────────────────────────────────

describe("buildWritingSummary (AC: 1)", () => {
	it("produces a valid LessonSummary", () => {
		const summary = buildWritingSummary({
			sessionId: "s-w1",
			score: 75,
			durationSeconds: 600,
			completedAt: NOW,
		});
		const result = LessonSummarySchema.safeParse(summary);
		expect(result.success).toBe(true);
	});

	it("includes writing and grammar skill ids", () => {
		const summary = buildWritingSummary({
			sessionId: "s-w1",
			score: 75,
			durationSeconds: 600,
		});
		expect(summary.skillIds).toContain("writing");
		expect(summary.skillIds).toContain("grammar");
	});

	it("generates chatbot next action for low scores", () => {
		const summary = buildWritingSummary({
			sessionId: "s-w1",
			score: 40,
			durationSeconds: 600,
		});
		const labels = summary.nextActions.map((a) => a.label);
		expect(labels).toContain("Hỏi AI Coach");
	});
});

// ── Next Actions Link Targets (AC: 2) ──────────────────────────────────────

describe("Summary Builders — Next Actions (AC: 2)", () => {
	it("can link to retry", () => {
		const summary = buildGrammarQuizSummary(makeInput({ correctCount: 2, totalCount: 10 }));
		expect(summary.nextActions.find((a) => a.href === "/grammar-quiz")).toBeTruthy();
	});

	it("can link to error notebook (review)", () => {
		const summary = buildGrammarQuizSummary(makeInput({ correctCount: 2, totalCount: 10 }));
		expect(summary.nextActions.find((a) => a.href === "/error-notebook")).toBeTruthy();
	});

	it("can link to chatbot", () => {
		const summary = buildWritingSummary({ sessionId: "s", score: 30, durationSeconds: 60 });
		expect(summary.nextActions.find((a) => a.href === "/english-chatbot")).toBeTruthy();
	});

	it("can link to daily plan (home)", () => {
		const summary = buildGrammarQuizSummary(makeInput({ correctCount: 9, totalCount: 10 }));
		expect(summary.nextActions.find((a) => a.href === "/")).toBeTruthy();
	});
});

// ── Generic Builder ────────────────────────────────────────────────────────

describe("buildGenericSummary", () => {
	it("works for any module type", () => {
		const summary = buildGenericSummary("pronunciation", makeInput());
		const result = LessonSummarySchema.safeParse(summary);
		expect(result.success).toBe(true);
		expect(summary.moduleType).toBe("pronunciation");
	});
});
