import { describe, expect, it } from "vitest";
import { generateWeeklyRetrospective } from "../../src/learning/weekly-retrospective";
import type { WeeklyActivityData } from "../../src/learning/weekly-retrospective";

function makeRichData(): WeeklyActivityData {
	return {
		completedSessions: 15,
		totalMinutes: 120,
		moduleCounts: { "grammar-quiz": 5, listening: 4, reading: 3, writing: 3 },
		skillProficiencies: { grammar: 75, listening: 50, reading: 60, writing: 40 },
		topRepeatedError: "Present Perfect vs Past Simple",
		reviewDebtCount: 3,
		daysActive: 6,
	};
}

function makeSparseData(): WeeklyActivityData {
	return {
		completedSessions: 0,
		totalMinutes: 0,
		moduleCounts: {},
		skillProficiencies: {},
		reviewDebtCount: 0,
		daysActive: 0,
	};
}

describe("generateWeeklyRetrospective — Rich Data (AC: 1)", () => {
	it("summarizes completed actions", () => {
		const retro = generateWeeklyRetrospective("2026-W17", makeRichData());
		expect(retro.completedActions).toContain("15 phiên");
		expect(retro.completedActions).toContain("120 phút");
	});

	it("identifies strongest and weakest skill", () => {
		const retro = generateWeeklyRetrospective("2026-W17", makeRichData());
		expect(retro.strongestSkill).toBe("grammar");
		expect(retro.weakestSkill).toBe("writing");
	});

	it("includes repeated error pattern", () => {
		const retro = generateWeeklyRetrospective("2026-W17", makeRichData());
		expect(retro.repeatedErrorPattern).toBe("Present Perfect vs Past Simple");
	});

	it("includes review debt summary", () => {
		const retro = generateWeeklyRetrospective("2026-W17", makeRichData());
		expect(retro.reviewDebtSummary).toContain("3");
	});

	it("generates next week recommendation", () => {
		const retro = generateWeeklyRetrospective("2026-W17", makeRichData());
		expect(retro.nextWeekRecommendation.length).toBeGreaterThan(0);
	});

	it("has celebrating tone for active week", () => {
		const retro = generateWeeklyRetrospective("2026-W17", makeRichData());
		expect(retro.tone).toBe("celebrating");
	});
});

describe("generateWeeklyRetrospective — Sparse Data (AC: 4)", () => {
	it("handles no activity gracefully", () => {
		const retro = generateWeeklyRetrospective("2026-W17", makeSparseData());
		expect(retro.hasSufficientData).toBe(false);
		expect(retro.tone).toBe("nudging");
		expect(retro.completedActions).toContain("Không");
	});

	it("still provides next week recommendation", () => {
		const retro = generateWeeklyRetrospective("2026-W17", makeSparseData());
		expect(retro.nextWeekRecommendation).toContain("5-10 phút");
	});
});

describe("generateWeeklyRetrospective — No AI (AC: 3)", () => {
	it("is deterministic (same inputs → same outputs)", () => {
		const a = generateWeeklyRetrospective("2026-W17", makeRichData());
		const b = generateWeeklyRetrospective("2026-W17", makeRichData());
		expect(a.completedActions).toBe(b.completedActions);
		expect(a.strongestSkill).toBe(b.strongestSkill);
	});
});
