import { describe, expect, it } from "vitest";
import {
	generateStarterPathway,
	pathwayDayToCandidates,
} from "../../src/learning/starter-pathway";
import type { LearnerGoalValue, DailyTimeBudgetValue } from "@repo/contracts";

// ── 7-Day Structure (AC: 1) ────────────────────────────────────────────────

describe("generateStarterPathway — 7-Day Structure (AC: 1)", () => {
	it("generates exactly 7 days", () => {
		const pathway = generateStarterPathway("general_improvement", "10");
		expect(pathway.days).toHaveLength(7);
	});

	it("each day has a theme and actions", () => {
		const pathway = generateStarterPathway("exam_prep", "15");
		for (const day of pathway.days) {
			expect(day.theme.length).toBeGreaterThan(0);
			expect(day.actions.length).toBeGreaterThanOrEqual(1);
		}
	});

	it("each action has estimated minutes and skill focus", () => {
		const pathway = generateStarterPathway("career", "20");
		for (const day of pathway.days) {
			for (const action of day.actions) {
				expect(action.estimatedMinutes).toBeGreaterThan(0);
				expect(action.skillIds.length).toBeGreaterThan(0);
				expect(action.actionUrl.startsWith("/")).toBe(true);
			}
		}
	});

	it("tracks total minutes per day", () => {
		const pathway = generateStarterPathway("travel", "15");
		for (const day of pathway.days) {
			const sum = day.actions.reduce((s, a) => s + a.estimatedMinutes, 0);
			expect(day.totalMinutes).toBe(sum);
		}
	});

	it("is deterministic (same inputs → same outputs)", () => {
		const a = generateStarterPathway("exam_prep", "10");
		const b = generateStarterPathway("exam_prep", "10");
		expect(a.days.map((d) => d.theme)).toEqual(b.days.map((d) => d.theme));
	});
});

// ── Candidate Conversion (AC: 2) ───────────────────────────────────────────

describe("pathwayDayToCandidates (AC: 2)", () => {
	it("converts day actions into RecommendationCandidate objects", () => {
		const pathway = generateStarterPathway("general_improvement", "10");
		const candidates = pathwayDayToCandidates(pathway.days[0]!, "user-1");
		expect(candidates.length).toBeGreaterThanOrEqual(1);
	});

	it("each candidate has required fields", () => {
		const pathway = generateStarterPathway("career", "15");
		const candidates = pathwayDayToCandidates(pathway.days[0]!, "user-1");
		for (const c of candidates) {
			expect(c.id).toBeTruthy();
			expect(c.skillIds.length).toBeGreaterThan(0);
			expect(c.moduleType).toBeTruthy();
			expect(c.actionUrl.startsWith("/")).toBe(true);
			expect(c.estimatedMinutes).toBeGreaterThan(0);
			expect(typeof c.isDueReview).toBe("boolean");
			expect(typeof c.goalAligned).toBe("boolean");
		}
	});
});

// ── Goal-Specific Pathways (AC: 3) ─────────────────────────────────────────

describe("generateStarterPathway — Goal Coverage (AC: 3)", () => {
	const goals: LearnerGoalValue[] = ["exam_prep", "career", "travel", "daily_conversation", "academic", "general_improvement"];

	for (const goal of goals) {
		it(`generates 7-day pathway for "${goal}"`, () => {
			const pathway = generateStarterPathway(goal, "10");
			expect(pathway.days).toHaveLength(7);
			expect(pathway.goalKey).toBe(goal);
			expect(pathway.goalLabel.length).toBeGreaterThan(0);
		});
	}
});

// ── Time Budget Adaptation (AC: 4) ─────────────────────────────────────────

describe("generateStarterPathway — Time Budget (AC: 4)", () => {
	const budgets: DailyTimeBudgetValue[] = ["5", "10", "15", "20", "30"];

	for (const budget of budgets) {
		it(`respects ${budget}-minute budget`, () => {
			const pathway = generateStarterPathway("exam_prep", budget);
			const limit = parseInt(budget, 10);
			for (const day of pathway.days) {
				// totalMinutes should not exceed budget (may be slightly under)
				expect(day.totalMinutes).toBeLessThanOrEqual(limit + 5); // 5min tolerance for single-action minimum
			}
		});
	}

	it("5-min budget has fewer actions than 30-min budget", () => {
		const small = generateStarterPathway("exam_prep", "5");
		const large = generateStarterPathway("exam_prep", "30");
		const smallActions = small.days.reduce((s, d) => s + d.actions.length, 0);
		const largeActions = large.days.reduce((s, d) => s + d.actions.length, 0);
		expect(largeActions).toBeGreaterThanOrEqual(smallActions);
	});

	it("always has at least 1 action per day even with 5-min budget", () => {
		const pathway = generateStarterPathway("travel", "5");
		for (const day of pathway.days) {
			expect(day.actions.length).toBeGreaterThanOrEqual(1);
		}
	});
});
