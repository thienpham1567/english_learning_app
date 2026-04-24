import { describe, expect, it } from "vitest";
import { summarizeErrorPatterns } from "../../src/learning/error-pattern-summary";
import type { ErrorPatternInput } from "../../src/learning/error-pattern-summary";

// ── Helper ──────────────────────────────────────────────────────────────────

const NOW = new Date("2026-04-24T12:00:00Z").getTime();

function makeError(overrides?: Partial<ErrorPatternInput>): ErrorPatternInput {
	return {
		id: "e-1",
		sourceModule: "grammar-quiz",
		grammarTopic: "Present Perfect Tense",
		questionStem: "She ___ already left.",
		userAnswer: "has",
		correctAnswer: "had",
		isResolved: false,
		createdAt: "2026-04-23T10:00:00Z",
		...overrides,
	};
}

// ── Frequency & Recency (AC: 1) ─────────────────────────────────────────────

describe("summarizeErrorPatterns — Frequency & Recency (AC: 1)", () => {
	it("groups errors by normalized category", () => {
		const errors = [
			makeError({ id: "e1", grammarTopic: "Present Perfect" }),
			makeError({ id: "e2", grammarTopic: "Past Simple" }),
			makeError({ id: "e3", grammarTopic: "Articles" }),
		];
		const patterns = summarizeErrorPatterns(errors, NOW);

		expect(patterns.length).toBe(2); // tense (2) + article (1)
		expect(patterns[0]!.category.key).toBe("tense");
		expect(patterns[0]!.totalCount).toBe(2);
		expect(patterns[1]!.category.key).toBe("article");
		expect(patterns[1]!.totalCount).toBe(1);
	});

	it("sorts by unresolved count first", () => {
		const errors = [
			makeError({ id: "e1", grammarTopic: "Articles", isResolved: false }),
			makeError({ id: "e2", grammarTopic: "Articles", isResolved: false }),
			makeError({ id: "e3", grammarTopic: "Present Perfect", isResolved: true }),
			makeError({ id: "e4", grammarTopic: "Present Perfect", isResolved: true }),
			makeError({ id: "e5", grammarTopic: "Present Perfect", isResolved: true }),
		];
		const patterns = summarizeErrorPatterns(errors, NOW);

		// article has 2 unresolved, tense has 0 → article first
		expect(patterns[0]!.category.key).toBe("article");
		expect(patterns[0]!.unresolvedCount).toBe(2);
	});

	it("counts recent errors within 7-day window", () => {
		const errors = [
			makeError({ id: "e1", createdAt: "2026-04-23T10:00:00Z" }), // 1 day ago = recent
			makeError({ id: "e2", createdAt: "2026-04-10T10:00:00Z" }), // 14 days ago = not recent
		];
		const patterns = summarizeErrorPatterns(errors, NOW);
		expect(patterns[0]!.recentCount).toBe(1);
	});

	it("lastSeenAt is the most recent createdAt", () => {
		const errors = [
			makeError({ id: "e1", createdAt: "2026-04-20T10:00:00Z" }),
			makeError({ id: "e2", createdAt: "2026-04-23T10:00:00Z" }),
		];
		const patterns = summarizeErrorPatterns(errors, NOW);
		expect(patterns[0]!.lastSeenAt).toBe("2026-04-23T10:00:00Z");
	});
});

// ── Examples, Skill, Next Action (AC: 2) ────────────────────────────────────

describe("summarizeErrorPatterns — Examples & Actions (AC: 2)", () => {
	it("includes up to 3 examples per pattern", () => {
		const errors = Array.from({ length: 5 }, (_, i) =>
			makeError({ id: `e${i}`, createdAt: `2026-04-${20 + i}T10:00:00Z` }),
		);
		const patterns = summarizeErrorPatterns(errors, NOW);
		expect(patterns[0]!.examples.length).toBe(3);
	});

	it("prioritizes unresolved examples", () => {
		const errors = [
			makeError({ id: "resolved-1", isResolved: true, createdAt: "2026-04-24T10:00:00Z" }),
			makeError({ id: "unresolved-1", isResolved: false, createdAt: "2026-04-20T10:00:00Z" }),
		];
		const patterns = summarizeErrorPatterns(errors, NOW);
		expect(patterns[0]!.examples[0]!.id).toBe("unresolved-1");
	});

	it("includes affected skill IDs", () => {
		const errors = [makeError({ grammarTopic: "Present Perfect" })];
		const patterns = summarizeErrorPatterns(errors, NOW);
		expect(patterns[0]!.affectedSkillIds).toContain("grammar");
		expect(patterns[0]!.affectedSkillIds).toContain("grammar-form");
	});

	it("provides next action with label and href", () => {
		const errors = [makeError({ grammarTopic: "Articles" })];
		const patterns = summarizeErrorPatterns(errors, NOW);
		expect(patterns[0]!.nextAction.label).toBe("Luyện ngữ pháp");
		expect(patterns[0]!.nextAction.href).toBe("/grammar-quiz");
	});

	it("provides writing next action for coherence errors", () => {
		const errors = [makeError({ grammarTopic: "Coherence and cohesion" })];
		const patterns = summarizeErrorPatterns(errors, NOW);
		expect(patterns[0]!.nextAction.label).toBe("Luyện viết");
		expect(patterns[0]!.nextAction.href).toBe("/writing-practice");
	});

	it("provides listening next action for listening errors", () => {
		const errors = [makeError({ grammarTopic: null, sourceModule: "listening" })];
		const patterns = summarizeErrorPatterns(errors, NOW);
		expect(patterns[0]!.nextAction.label).toBe("Luyện nghe");
	});
});

// ── Resolved Errors in Trends (AC: 3) ──────────────────────────────────────

describe("summarizeErrorPatterns — Resolved Inclusion (AC: 3)", () => {
	it("includes resolved errors in totalCount", () => {
		const errors = [
			makeError({ id: "e1", isResolved: true }),
			makeError({ id: "e2", isResolved: false }),
		];
		const patterns = summarizeErrorPatterns(errors, NOW);
		expect(patterns[0]!.totalCount).toBe(2);
	});

	it("distinguishes unresolvedCount from totalCount", () => {
		const errors = [
			makeError({ id: "e1", isResolved: true }),
			makeError({ id: "e2", isResolved: true }),
			makeError({ id: "e3", isResolved: false }),
		];
		const patterns = summarizeErrorPatterns(errors, NOW);
		expect(patterns[0]!.totalCount).toBe(3);
		expect(patterns[0]!.unresolvedCount).toBe(1);
	});
});

// ── Empty State (AC: 4) ─────────────────────────────────────────────────────

describe("summarizeErrorPatterns — Empty State (AC: 4)", () => {
	it("returns empty array for no errors", () => {
		expect(summarizeErrorPatterns([], NOW)).toEqual([]);
	});
});

// ── Sparse / Legacy Data ────────────────────────────────────────────────────

describe("summarizeErrorPatterns — Sparse Data", () => {
	it("handles errors with null grammarTopic", () => {
		const errors = [makeError({ grammarTopic: null, sourceModule: "grammar-quiz" })];
		const patterns = summarizeErrorPatterns(errors, NOW);
		expect(patterns.length).toBe(1);
		expect(patterns[0]!.category.key).toBe("other");
	});

	it("handles mixed sparse and rich errors", () => {
		const errors = [
			makeError({ id: "e1", grammarTopic: "Present Perfect" }),
			makeError({ id: "e2", grammarTopic: null, sourceModule: "mock-test" }),
			makeError({ id: "e3", grammarTopic: null, sourceModule: "listening" }),
		];
		const patterns = summarizeErrorPatterns(errors, NOW);
		expect(patterns.length).toBe(3); // tense, exam-strategy, listening-comprehension
	});

	it("example includes question stem and answers", () => {
		const errors = [makeError({ questionStem: "Q?", userAnswer: "A", correctAnswer: "B" })];
		const patterns = summarizeErrorPatterns(errors, NOW);
		const ex = patterns[0]!.examples[0]!;
		expect(ex.questionStem).toBe("Q?");
		expect(ex.userAnswer).toBe("A");
		expect(ex.correctAnswer).toBe("B");
	});
});

// ── Multi-Source Aggregation ────────────────────────────────────────────────

describe("summarizeErrorPatterns — Multi-Source", () => {
	it("merges same category from different source modules", () => {
		const errors = [
			makeError({ id: "e1", sourceModule: "grammar-quiz", grammarTopic: "Past Simple" }),
			makeError({ id: "e2", sourceModule: "daily-challenge", grammarTopic: "Present Perfect" }),
		];
		const patterns = summarizeErrorPatterns(errors, NOW);
		// Both are "tense" category
		expect(patterns.length).toBe(1);
		expect(patterns[0]!.category.key).toBe("tense");
		expect(patterns[0]!.totalCount).toBe(2);
	});
});
