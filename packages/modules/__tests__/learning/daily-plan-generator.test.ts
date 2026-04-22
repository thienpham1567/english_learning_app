import { describe, expect, it } from "vitest";
import { generateDailyPlan } from "../../src/learning/daily-plan-generator";
import type { RecommendationCandidate, TimeBudgetValue } from "@repo/contracts";

const NOW = Date.now();

function makeCandidate(overrides: Partial<RecommendationCandidate> = {}): RecommendationCandidate {
	return {
		id: "test-1",
		skillIds: ["grammar"],
		moduleType: "grammar_quiz",
		actionUrl: "/grammar-quiz",
		label: "Grammar Practice",
		estimatedMinutes: 10,
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

// ── Plan Selection (AC: 1) ──────────────────────────────────────────────────

describe("generateDailyPlan — plan selection", () => {
	it("returns 1-3 items (AC: 1)", () => {
		const candidates = [
			makeCandidate({ id: "a", estimatedMinutes: 5 }),
			makeCandidate({ id: "b", estimatedMinutes: 5 }),
			makeCandidate({ id: "c", estimatedMinutes: 5 }),
			makeCandidate({ id: "d", estimatedMinutes: 5 }),
		];
		const plan = generateDailyPlan(candidates, "20", NOW);
		expect(plan.items.length).toBeGreaterThanOrEqual(1);
		expect(plan.items.length).toBeLessThanOrEqual(3);
	});

	it("includes title, reason, estimatedMinutes, actionUrl, skillIds, priority, and completed (AC: 1)", () => {
		const plan = generateDailyPlan([makeCandidate()], "20", NOW);
		const item = plan.items[0]!;
		expect(item.title).toBeTruthy();
		expect(item.reason).toBeTruthy();
		expect(item.estimatedMinutes).toBeGreaterThan(0);
		expect(item.actionUrl).toBeTruthy();
		expect(item.skillIds.length).toBeGreaterThan(0);
		expect(["high", "medium", "low"]).toContain(item.priority);
		expect(typeof item.completed).toBe("boolean");
	});
});

// ── Time Budget Variants (AC: 2) ────────────────────────────────────────────

describe("generateDailyPlan — time budgets", () => {
	const candidates = [
		makeCandidate({ id: "quick", estimatedMinutes: 5 }),
		makeCandidate({ id: "medium", estimatedMinutes: 10 }),
		makeCandidate({ id: "long", estimatedMinutes: 20 }),
	];

	it("5-minute variant fits within budget", () => {
		const plan = generateDailyPlan(candidates, "5", NOW);
		const totalMinutes = plan.items.reduce((s, i) => s + i.estimatedMinutes, 0);
		expect(totalMinutes).toBeLessThanOrEqual(5);
		expect(plan.timeBudget).toBe("5");
	});

	it("10-minute variant fits within budget", () => {
		const plan = generateDailyPlan(candidates, "10", NOW);
		const totalMinutes = plan.items.reduce((s, i) => s + i.estimatedMinutes, 0);
		expect(totalMinutes).toBeLessThanOrEqual(10);
	});

	it("20-minute variant fits within budget", () => {
		const plan = generateDailyPlan(candidates, "20", NOW);
		const totalMinutes = plan.items.reduce((s, i) => s + i.estimatedMinutes, 0);
		expect(totalMinutes).toBeLessThanOrEqual(20);
	});
});

// ── Due Review Priority (AC: 3) ─────────────────────────────────────────────

describe("generateDailyPlan — due review priority", () => {
	it("due review appears before new study when memory risk is high (AC: 3)", () => {
		const overdue = makeCandidate({
			id: "overdue-review",
			isDueReview: true,
			dueAt: new Date(NOW - 48 * 60 * 60 * 1000).toISOString(),
			estimatedMinutes: 10,
		});
		const newStudy = makeCandidate({
			id: "new-study",
			isDueReview: false,
			estimatedMinutes: 10,
			currentProficiency: 20,
		});
		const plan = generateDailyPlan([newStudy, overdue], "20", NOW);
		expect(plan.items[0]!.id).toBe("overdue-review");
	});
});

// ── Fatigue Guard (AC: 4) ───────────────────────────────────────────────────

describe("generateDailyPlan — fatigue guard", () => {
	it("avoids multiple heavy tasks in one session (AC: 4)", () => {
		const heavy1 = makeCandidate({ id: "heavy-1", estimatedMinutes: 15, currentProficiency: 10 });
		const heavy2 = makeCandidate({ id: "heavy-2", estimatedMinutes: 15, currentProficiency: 20 });
		const light = makeCandidate({ id: "light", estimatedMinutes: 5, currentProficiency: 30 });
		const plan = generateDailyPlan([heavy1, heavy2, light], "20", NOW);

		const heavyItems = plan.items.filter((i) => i.estimatedMinutes >= 15);
		expect(heavyItems.length).toBeLessThanOrEqual(1);
	});
});

// ── Completion State (AC: 1) ────────────────────────────────────────────────

describe("generateDailyPlan — completion state", () => {
	it("marks items as completed when their module type has been done today", () => {
		const plan = generateDailyPlan(
			[makeCandidate({ id: "grammar", moduleType: "grammar_quiz" })],
			"20",
			NOW,
			new Set(["grammar_quiz"]),
		);
		expect(plan.items[0]!.completed).toBe(true);
	});

	it("marks items as not completed when module type has not been done", () => {
		const plan = generateDailyPlan(
			[makeCandidate({ id: "grammar", moduleType: "grammar_quiz" })],
			"20",
			NOW,
			new Set(),
		);
		expect(plan.items[0]!.completed).toBe(false);
	});
});

// ── Fallback (edge case) ────────────────────────────────────────────────────

describe("generateDailyPlan — fallback", () => {
	it("returns at least one item even if nothing fits the budget", () => {
		const big = makeCandidate({ id: "big", estimatedMinutes: 30 });
		const plan = generateDailyPlan([big], "5", NOW);
		expect(plan.items.length).toBe(1);
	});

	it("includes generatedAt timestamp", () => {
		const plan = generateDailyPlan([makeCandidate()], "10", NOW);
		expect(plan.generatedAt).toBeTruthy();
	});
});
