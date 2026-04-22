import { describe, expect, it } from "vitest";
import { scoreAndRank } from "../../src/learning/recommendation-scorer";
import type { RecommendationCandidate, ScorerContext } from "@repo/contracts";

// ── Helpers ─────────────────────────────────────────────────────────────────

const NOW = Date.now();

function makeCandidate(overrides: Partial<RecommendationCandidate> = {}): RecommendationCandidate {
	return {
		id: "test-1",
		skillIds: ["grammar"],
		moduleType: "grammar_quiz",
		actionUrl: "/grammar-quiz",
		label: "Grammar Practice",
		estimatedMinutes: 15,
		isDueReview: false,
		dueAt: null,
		currentProficiency: 50,
		currentConfidence: 0.5,
		difficulty: "intermediate",
		goalAligned: false,
		hoursSinceLastPractice: 24,
		...overrides,
	};
}

function makeCtx(overrides: Partial<ScorerContext> = {}): ScorerContext {
	return { nowMs: NOW, ...overrides };
}

// ── Determinism (AC: 4) ─────────────────────────────────────────────────────

describe("scoreAndRank — determinism", () => {
	it("produces identical output for identical input (AC: 4)", () => {
		const candidates = [
			makeCandidate({ id: "a", currentProficiency: 30 }),
			makeCandidate({ id: "b", currentProficiency: 70 }),
		];
		const ctx = makeCtx();
		const r1 = scoreAndRank(candidates, ctx);
		const r2 = scoreAndRank(candidates, ctx);
		expect(r1).toEqual(r2);
	});
});

// ── Due review priority (AC: 5) ─────────────────────────────────────────────

describe("scoreAndRank — due review priority", () => {
	it("overdue review outranks optional new study (AC: 5)", () => {
		const overdue = makeCandidate({
			id: "overdue",
			isDueReview: true,
			dueAt: new Date(NOW - 48 * 60 * 60 * 1000).toISOString(), // 48h overdue
			currentProficiency: 60,
		});
		const optional = makeCandidate({
			id: "optional",
			isDueReview: false,
			currentProficiency: 20, // weaker but not overdue
		});
		const results = scoreAndRank([optional, overdue], makeCtx());
		expect(results[0]!.id).toBe("overdue");
		expect(results[0]!.group).toBe("must_do");
	});

	it("non-overdue scheduled review has lower urgency than overdue", () => {
		const overdue = makeCandidate({
			id: "overdue",
			isDueReview: true,
			dueAt: new Date(NOW - 24 * 60 * 60 * 1000).toISOString(),
		});
		const scheduled = makeCandidate({
			id: "scheduled",
			isDueReview: true,
			dueAt: new Date(NOW + 24 * 60 * 60 * 1000).toISOString(),
		});
		const results = scoreAndRank([scheduled, overdue], makeCtx());
		expect(results[0]!.id).toBe("overdue");
	});
});

// ── Weak skill priority (AC: 5) ─────────────────────────────────────────────

describe("scoreAndRank — weak skill priority", () => {
	it("weak high-impact skill outranks strong low-impact skill (AC: 5)", () => {
		const weakGoal = makeCandidate({
			id: "weak-goal",
			currentProficiency: 10,
			currentConfidence: 0.2,
			goalAligned: true,
		});
		const strongNoGoal = makeCandidate({
			id: "strong-no-goal",
			currentProficiency: 90,
			currentConfidence: 0.9,
			goalAligned: false,
		});
		const results = scoreAndRank([strongNoGoal, weakGoal], makeCtx());
		expect(results[0]!.id).toBe("weak-goal");
		expect(results[0]!.score).toBeGreaterThan(results[1]!.score);
	});
});

// ── Time budget filtering (AC: 5) ──────────────────────────────────────────

describe("scoreAndRank — time budget", () => {
	it("filters out candidates exceeding time budget (AC: 5)", () => {
		const quick = makeCandidate({ id: "quick", estimatedMinutes: 5 });
		const slow = makeCandidate({ id: "slow", estimatedMinutes: 30 });
		const results = scoreAndRank([quick, slow], makeCtx({ timeBudgetMinutes: 10 }));
		expect(results).toHaveLength(1);
		expect(results[0]!.id).toBe("quick");
	});

	it("returns all candidates when no time budget is set", () => {
		const quick = makeCandidate({ id: "quick", estimatedMinutes: 5 });
		const slow = makeCandidate({ id: "slow", estimatedMinutes: 30 });
		const results = scoreAndRank([quick, slow], makeCtx());
		expect(results).toHaveLength(2);
	});
});

// ── Goal relevance (AC: 5) ─────────────────────────────────────────────────

describe("scoreAndRank — goal relevance", () => {
	it("goal-aligned candidate scores higher than non-aligned with same proficiency (AC: 5)", () => {
		const aligned = makeCandidate({ id: "aligned", goalAligned: true, currentProficiency: 50 });
		const notAligned = makeCandidate({ id: "not-aligned", goalAligned: false, currentProficiency: 50 });
		const results = scoreAndRank([notAligned, aligned], makeCtx());
		const alignedScore = results.find((r) => r.id === "aligned")!.score;
		const notAlignedScore = results.find((r) => r.id === "not-aligned")!.score;
		expect(alignedScore).toBeGreaterThan(notAlignedScore);
	});
});

// ── Grouping (AC: 2) ────────────────────────────────────────────────────────

describe("scoreAndRank — grouping", () => {
	it("assigns must_do to overdue reviews", () => {
		const overdue = makeCandidate({
			id: "overdue",
			isDueReview: true,
			dueAt: new Date(NOW - 48 * 60 * 60 * 1000).toISOString(),
		});
		const results = scoreAndRank([overdue], makeCtx());
		expect(results[0]!.group).toBe("must_do");
	});

	it("assigns must_do to very weak goal-aligned skills", () => {
		const weak = makeCandidate({
			id: "weak",
			currentProficiency: 5,
			goalAligned: true,
		});
		const results = scoreAndRank([weak], makeCtx());
		expect(results[0]!.group).toBe("must_do");
	});

	it("assigns could_do to strong non-urgent skills", () => {
		const strong = makeCandidate({
			id: "strong",
			currentProficiency: 85,
			currentConfidence: 0.9,
			goalAligned: false,
			hoursSinceLastPractice: 2,
		});
		const results = scoreAndRank([strong], makeCtx());
		expect(results[0]!.group).toBe("could_do");
	});
});

// ── Reason text (AC: 3) ────────────────────────────────────────────────────

describe("scoreAndRank — reason text", () => {
	it("includes 'Due for review' for overdue items", () => {
		const overdue = makeCandidate({
			id: "overdue",
			isDueReview: true,
			dueAt: new Date(NOW - 48 * 60 * 60 * 1000).toISOString(),
		});
		const results = scoreAndRank([overdue], makeCtx());
		expect(results[0]!.reason).toContain("Due for review");
	});

	it("includes 'Needs practice' for weak skills", () => {
		const weak = makeCandidate({
			id: "weak",
			currentProficiency: 15,
		});
		const results = scoreAndRank([weak], makeCtx());
		expect(results[0]!.reason).toContain("Needs practice");
	});

	it("always has non-empty reason", () => {
		const normal = makeCandidate({ id: "normal", currentProficiency: 70 });
		const results = scoreAndRank([normal], makeCtx());
		expect(results[0]!.reason.length).toBeGreaterThan(0);
	});
});

// ── Score breakdown (AC: 1) ─────────────────────────────────────────────────

describe("scoreAndRank — score breakdown", () => {
	it("preserves score breakdown for debugging", () => {
		const c = makeCandidate();
		const results = scoreAndRank([c], makeCtx());
		const b = results[0]!.breakdown;
		expect(b).toHaveProperty("dueUrgency");
		expect(b).toHaveProperty("masteryGap");
		expect(b).toHaveProperty("goalRelevance");
		expect(b).toHaveProperty("recency");
		expect(b).toHaveProperty("difficultyFit");
		expect(b).toHaveProperty("durationFit");
		expect(b).toHaveProperty("skillImportance");
		expect(b).toHaveProperty("completionLikelihood");
	});
});
