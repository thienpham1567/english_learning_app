import { describe, expect, it } from "vitest";
import { computeErrorTrends } from "../../src/learning/error-trend";
import type { TrendInput } from "../../src/learning/error-trend";

// ── Helpers ─────────────────────────────────────────────────────────────────

const NOW = new Date("2026-04-24T12:00:00Z").getTime();
const RECENT = "2026-04-20T10:00:00Z"; // 4 days ago — recent
const OLDER = "2026-03-15T10:00:00Z"; // 40 days ago — older

function makeError(overrides?: Partial<TrendInput>): TrendInput {
	return {
		id: "e-1",
		sourceModule: "grammar-quiz",
		grammarTopic: "Present Perfect Tense",
		isResolved: false,
		createdAt: RECENT,
		...overrides,
	};
}

// ── Trend By Category (AC: 1) ───────────────────────────────────────────────

describe("computeErrorTrends — Trend By Category (AC: 1)", () => {
	it("groups errors by normalized category", () => {
		const errors = [
			makeError({ id: "e1", grammarTopic: "Present Perfect" }),
			makeError({ id: "e2", grammarTopic: "Past Simple" }),
			makeError({ id: "e3", grammarTopic: "Articles" }),
		];
		const trends = computeErrorTrends(errors, NOW);
		// tense (2) in worsened (new), article (1) in worsened (new)
		expect(trends.hasData).toBe(true);
		const allCategories = [...trends.improved, ...trends.worsened, ...trends.needsReview];
		expect(allCategories.length).toBe(2);
	});

	it("detects improved category (recent < older)", () => {
		const errors = [
			// 3 older tense errors
			makeError({ id: "e1", createdAt: OLDER }),
			makeError({ id: "e2", createdAt: OLDER }),
			makeError({ id: "e3", createdAt: OLDER }),
			// 1 recent tense error
			makeError({ id: "e4", createdAt: RECENT }),
		];
		const trends = computeErrorTrends(errors, NOW);
		expect(trends.improved.length).toBe(1);
		expect(trends.improved[0]!.category.key).toBe("tense");
		expect(trends.improved[0]!.direction).toBe("improved");
	});

	it("detects worsened category (recent > older)", () => {
		const errors = [
			// 1 older tense error
			makeError({ id: "e1", createdAt: OLDER }),
			// 3 recent tense errors
			makeError({ id: "e2", createdAt: RECENT }),
			makeError({ id: "e3", createdAt: RECENT }),
			makeError({ id: "e4", createdAt: RECENT }),
		];
		const trends = computeErrorTrends(errors, NOW);
		expect(trends.worsened.length).toBe(1);
		expect(trends.worsened[0]!.direction).toBe("worsened");
	});

	it("detects stable category (recent = older)", () => {
		const errors = [
			makeError({ id: "e1", createdAt: OLDER }),
			makeError({ id: "e2", createdAt: OLDER }),
			makeError({ id: "e3", createdAt: RECENT }),
			makeError({ id: "e4", createdAt: RECENT }),
		];
		const trends = computeErrorTrends(errors, NOW);
		expect(trends.needsReview.length).toBe(1);
		expect(trends.needsReview[0]!.direction).toBe("stable");
	});

	it("detects new category (only recent errors)", () => {
		const errors = [
			makeError({ id: "e1", createdAt: RECENT }),
			makeError({ id: "e2", createdAt: RECENT }),
			makeError({ id: "e3", createdAt: RECENT }),
		];
		const trends = computeErrorTrends(errors, NOW);
		expect(trends.worsened.length).toBe(1);
		expect(trends.worsened[0]!.direction).toBe("new");
	});
});

// ── Improved / Worsened / Needs-Review Classification (AC: 2) ───────────────

describe("computeErrorTrends — Classification (AC: 2)", () => {
	it("separates improved, worsened, and needs-review", () => {
		const errors = [
			// Tense: improved (3 older, 1 recent)
			makeError({ id: "e1", grammarTopic: "Past Simple", createdAt: OLDER }),
			makeError({ id: "e2", grammarTopic: "Present Perfect", createdAt: OLDER }),
			makeError({ id: "e3", grammarTopic: "Future Tense", createdAt: OLDER }),
			makeError({ id: "e4", grammarTopic: "Past Perfect", createdAt: RECENT }),
			// Article: worsened (1 older, 3 recent)
			makeError({ id: "e5", grammarTopic: "Articles a/an", createdAt: OLDER }),
			makeError({ id: "e6", grammarTopic: "Articles the", createdAt: RECENT }),
			makeError({ id: "e7", grammarTopic: "Determiner articles", createdAt: RECENT }),
			makeError({ id: "e8", grammarTopic: "Article usage", createdAt: RECENT }),
			// Preposition: stable (2 older, 2 recent)
			makeError({ id: "e9", grammarTopic: "Prepositions of time", createdAt: OLDER }),
			makeError({ id: "e10", grammarTopic: "Prepositions in/on", createdAt: OLDER }),
			makeError({ id: "e11", grammarTopic: "Preposition at", createdAt: RECENT }),
			makeError({ id: "e12", grammarTopic: "Prep for", createdAt: RECENT }),
		];
		const trends = computeErrorTrends(errors, NOW);
		expect(trends.improved.length).toBe(1);
		expect(trends.worsened.length).toBe(1);
		expect(trends.needsReview.length).toBe(1);
	});

	it("calculates resolution rate", () => {
		const errors = [
			makeError({ id: "e1", isResolved: true, createdAt: OLDER }),
			makeError({ id: "e2", isResolved: true, createdAt: OLDER }),
			makeError({ id: "e3", isResolved: false, createdAt: RECENT }),
		];
		const trends = computeErrorTrends(errors, NOW);
		const all = [...trends.improved, ...trends.worsened, ...trends.needsReview];
		const trend = all.find((t) => t.category.key === "tense")!;
		expect(trend.resolutionRate).toBeCloseTo(2 / 3);
	});
});

// ── No Backfill (AC: 3) ────────────────────────────────────────────────────

describe("computeErrorTrends — No Backfill (AC: 3)", () => {
	it("works with only recent errors", () => {
		const errors = [
			makeError({ id: "e1", createdAt: RECENT }),
			makeError({ id: "e2", createdAt: RECENT }),
			makeError({ id: "e3", createdAt: RECENT }),
		];
		const trends = computeErrorTrends(errors, NOW);
		expect(trends.hasData).toBe(true);
		expect(trends.worsened[0]!.direction).toBe("new");
	});

	it("works with only older errors", () => {
		const errors = [
			makeError({ id: "e1", createdAt: OLDER }),
			makeError({ id: "e2", createdAt: OLDER }),
			makeError({ id: "e3", createdAt: OLDER }),
		];
		const trends = computeErrorTrends(errors, NOW);
		expect(trends.hasData).toBe(true);
		expect(trends.improved[0]!.direction).toBe("improved");
		expect(trends.improved[0]!.recentCount).toBe(0);
	});

	it("handles null grammarTopic via source module fallback", () => {
		const errors = [
			makeError({ id: "e1", grammarTopic: null, sourceModule: "listening", createdAt: OLDER }),
			makeError({ id: "e2", grammarTopic: null, sourceModule: "listening", createdAt: OLDER }),
			makeError({ id: "e3", grammarTopic: null, sourceModule: "listening", createdAt: RECENT }),
		];
		const trends = computeErrorTrends(errors, NOW);
		const all = [...trends.improved, ...trends.worsened, ...trends.needsReview];
		expect(all[0]!.category.key).toBe("listening-comprehension");
	});
});

// ── Low-Confidence Data (AC: 4) ────────────────────────────────────────────

describe("computeErrorTrends — Low Confidence (AC: 4)", () => {
	it("marks categories with < 3 errors as low-confidence", () => {
		const errors = [
			makeError({ id: "e1", createdAt: RECENT }),
			makeError({ id: "e2", createdAt: RECENT }),
		];
		const trends = computeErrorTrends(errors, NOW);
		const all = [...trends.improved, ...trends.worsened, ...trends.needsReview];
		expect(all[0]!.confident).toBe(false);
		expect(all[0]!.explanation).toContain("cần thêm dữ liệu");
	});

	it("marks categories with >= 3 errors as confident", () => {
		const errors = [
			makeError({ id: "e1", createdAt: OLDER }),
			makeError({ id: "e2", createdAt: OLDER }),
			makeError({ id: "e3", createdAt: RECENT }),
		];
		const trends = computeErrorTrends(errors, NOW);
		const all = [...trends.improved, ...trends.worsened, ...trends.needsReview];
		expect(all[0]!.confident).toBe(true);
	});

	it("explanation includes percentage for confident improved trend", () => {
		const errors = [
			makeError({ id: "e1", createdAt: OLDER }),
			makeError({ id: "e2", createdAt: OLDER }),
			makeError({ id: "e3", createdAt: OLDER }),
			makeError({ id: "e4", createdAt: RECENT }),
		];
		const trends = computeErrorTrends(errors, NOW);
		expect(trends.improved[0]!.explanation).toContain("Giảm");
		expect(trends.improved[0]!.explanation).toContain("%");
	});
});

// ── Empty State ─────────────────────────────────────────────────────────────

describe("computeErrorTrends — Empty State", () => {
	it("returns empty summary for no errors", () => {
		const trends = computeErrorTrends([], NOW);
		expect(trends.hasData).toBe(false);
		expect(trends.improved).toEqual([]);
		expect(trends.worsened).toEqual([]);
		expect(trends.needsReview).toEqual([]);
	});
});

// ── Sorting ─────────────────────────────────────────────────────────────────

describe("computeErrorTrends — Sorting", () => {
	it("sorts each group by total count descending", () => {
		const errors = [
			// Tense: 4 total, all new → worsened
			makeError({ id: "e1", grammarTopic: "Past Simple", createdAt: RECENT }),
			makeError({ id: "e2", grammarTopic: "Present Perfect", createdAt: RECENT }),
			makeError({ id: "e3", grammarTopic: "Future", createdAt: RECENT }),
			makeError({ id: "e4", grammarTopic: "Continuous", createdAt: RECENT }),
			// Article: 2 total, all new → worsened
			makeError({ id: "e5", grammarTopic: "Articles", createdAt: RECENT }),
			makeError({ id: "e6", grammarTopic: "Article the", createdAt: RECENT }),
		];
		const trends = computeErrorTrends(errors, NOW);
		expect(trends.worsened[0]!.totalCount).toBeGreaterThanOrEqual(trends.worsened[1]!.totalCount);
	});
});
