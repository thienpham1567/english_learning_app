import { describe, expect, it } from "vitest";
import {
	errorPatternsToRecommendations,
	generateErrorDrillReason,
	computeDrillCompletionEffects,
} from "../../src/learning/error-remediation-recommender";
import type { ErrorPattern } from "../../src/learning/error-pattern-summary";
import { getCategoryByKey } from "../../src/learning/error-category";

// ── Helpers ─────────────────────────────────────────────────────────────────

const NOW = new Date("2026-04-24T12:00:00Z").getTime();

function makePattern(overrides?: Partial<ErrorPattern>): ErrorPattern {
	return {
		category: getCategoryByKey("tense")!,
		totalCount: 5,
		unresolvedCount: 3,
		recentCount: 2,
		lastSeenAt: "2026-04-23T10:00:00Z",
		examples: [],
		affectedSkillIds: ["grammar", "grammar-form"],
		nextAction: { label: "Luyện ngữ pháp", href: "/grammar-quiz" },
		...overrides,
	};
}

// ── Pattern → Candidate Conversion (AC: 1) ─────────────────────────────────

describe("errorPatternsToRecommendations (AC: 1)", () => {
	it("converts patterns to recommendation candidates", () => {
		const patterns = [makePattern()];
		const candidates = errorPatternsToRecommendations(patterns, NOW);

		expect(candidates).toHaveLength(1);
		expect(candidates[0]!.id).toBe("error-drill-tense");
		expect(candidates[0]!.moduleType).toBe("error-drill");
		expect(candidates[0]!.skillIds).toEqual(["grammar", "grammar-form"]);
	});

	it("excludes patterns with < 2 unresolved errors", () => {
		const patterns = [
			makePattern({ unresolvedCount: 1 }),
			makePattern({ unresolvedCount: 3, category: getCategoryByKey("article")! }),
		];
		const candidates = errorPatternsToRecommendations(patterns, NOW);
		expect(candidates).toHaveLength(1);
		expect(candidates[0]!.id).toBe("error-drill-article");
	});

	it("limits to max 3 recommendations", () => {
		const patterns = Array.from({ length: 5 }, (_, i) =>
			makePattern({
				category: getCategoryByKey(["tense", "article", "preposition", "word-form", "subject-verb"][i]!)!,
				unresolvedCount: 5 - i,
			}),
		);
		const candidates = errorPatternsToRecommendations(patterns, NOW);
		expect(candidates).toHaveLength(3);
	});

	it("sets isDueReview=true for patterns with >= 3 unresolved", () => {
		const candidates = errorPatternsToRecommendations([makePattern({ unresolvedCount: 3 })], NOW);
		expect(candidates[0]!.isDueReview).toBe(true);
	});

	it("sets isDueReview=false for patterns with < 3 unresolved", () => {
		const candidates = errorPatternsToRecommendations([makePattern({ unresolvedCount: 2 })], NOW);
		expect(candidates[0]!.isDueReview).toBe(false);
	});

	it("computes proficiency inversely to unresolved count", () => {
		const candidates = errorPatternsToRecommendations([makePattern({ unresolvedCount: 5 })], NOW);
		expect(candidates[0]!.currentProficiency).toBeLessThan(50);
	});

	it("returns empty for no patterns", () => {
		expect(errorPatternsToRecommendations([], NOW)).toEqual([]);
	});

	it("labels include Vietnamese pattern name", () => {
		const candidates = errorPatternsToRecommendations([makePattern()], NOW);
		expect(candidates[0]!.label).toContain("Thì");
		expect(candidates[0]!.label).toContain("Luyện sửa lỗi");
	});
});

// ── Reason Text (AC: 2) ────────────────────────────────────────────────────

describe("generateErrorDrillReason (AC: 2)", () => {
	it("names the pattern in Vietnamese", () => {
		const reason = generateErrorDrillReason(makePattern());
		expect(reason).toContain("Thì");
		expect(reason).toContain("lặp lại");
	});

	it("includes unresolved count", () => {
		const reason = generateErrorDrillReason(makePattern({ unresolvedCount: 5 }));
		expect(reason).toContain("5 lần");
	});

	it("includes recent count when > 0", () => {
		const reason = generateErrorDrillReason(makePattern({ recentCount: 3 }));
		expect(reason).toContain("3 lần gần đây");
	});

	it("omits recent count when 0", () => {
		const reason = generateErrorDrillReason(makePattern({ recentCount: 0 }));
		expect(reason).not.toContain("gần đây");
	});
});

// ── Drill Completion Effects (AC: 3) ────────────────────────────────────────

describe("computeDrillCompletionEffects (AC: 3)", () => {
	it("resolves errors when score >= 0.7", () => {
		const effect = computeDrillCompletionEffects("tense", ["e1", "e2"], 4, 5);
		expect(effect.score).toBe(0.8);
		expect(effect.resolveErrorIds).toEqual(["e1", "e2"]);
		expect(effect.createLearningEvent).toBe(true);
	});

	it("does not resolve errors when score < 0.7", () => {
		const effect = computeDrillCompletionEffects("tense", ["e1", "e2"], 2, 5);
		expect(effect.score).toBe(0.4);
		expect(effect.resolveErrorIds).toEqual([]);
		expect(effect.createLearningEvent).toBe(true);
	});

	it("handles edge case: exactly 0.7 threshold", () => {
		const effect = computeDrillCompletionEffects("tense", ["e1"], 7, 10);
		expect(effect.score).toBe(0.7);
		expect(effect.resolveErrorIds).toEqual(["e1"]);
	});

	it("handles 0 total items", () => {
		const effect = computeDrillCompletionEffects("tense", [], 0, 0);
		expect(effect.score).toBe(0);
		expect(effect.resolveErrorIds).toEqual([]);
	});

	it("always creates learning event", () => {
		const effect = computeDrillCompletionEffects("tense", [], 0, 5);
		expect(effect.createLearningEvent).toBe(true);
	});

	it("tracks category key", () => {
		const effect = computeDrillCompletionEffects("article", ["e1"], 5, 5);
		expect(effect.categoryKey).toBe("article");
	});
});

// ── Integration with Scorer ─────────────────────────────────────────────────

describe("Integration — Candidates are scorer-compatible", () => {
	it("candidate has all required RecommendationCandidate fields", () => {
		const candidates = errorPatternsToRecommendations([makePattern()], NOW);
		const c = candidates[0]!;

		// Required fields from RecommendationCandidateSchema
		expect(typeof c.id).toBe("string");
		expect(c.skillIds.length).toBeGreaterThan(0);
		expect(typeof c.moduleType).toBe("string");
		expect(typeof c.actionUrl).toBe("string");
		expect(typeof c.label).toBe("string");
		expect(typeof c.estimatedMinutes).toBe("number");
		expect(typeof c.isDueReview).toBe("boolean");
		expect(typeof c.currentProficiency).toBe("number");
		expect(typeof c.currentConfidence).toBe("number");
		expect(typeof c.difficulty).toBe("string");
		expect(typeof c.goalAligned).toBe("boolean");
		expect(typeof c.hoursSinceLastPractice).toBe("number");
	});

	it("proficiency is in range 0–100", () => {
		const candidates = errorPatternsToRecommendations([makePattern({ unresolvedCount: 10 })], NOW);
		expect(candidates[0]!.currentProficiency).toBeGreaterThanOrEqual(0);
		expect(candidates[0]!.currentProficiency).toBeLessThanOrEqual(100);
	});

	it("confidence is in range 0–1", () => {
		const candidates = errorPatternsToRecommendations([makePattern()], NOW);
		expect(candidates[0]!.currentConfidence).toBeGreaterThanOrEqual(0);
		expect(candidates[0]!.currentConfidence).toBeLessThanOrEqual(1);
	});
});
