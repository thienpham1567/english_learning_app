import { describe, expect, it } from "vitest";
import {
	createBaseline,
	createSkippedBaseline,
	baselineToMasteryStates,
	getGoalRelevantSkills,
	isGoalRelevant,
} from "../../src/learning/onboarding-baseline";

// ── Baseline Creation from Placement (AC: 1, 2, 5) ─────────────────────────

describe("createBaseline — from placement", () => {
	it("creates baseline with placement scores (AC: 1)", () => {
		const baseline = createBaseline({
			userId: "u1",
			primaryGoal: "career",
			dailyTimeBudgetMinutes: "20",
			selfReportedWeakSkill: "grammar",
			preferredLearningStyle: "visual",
			placementScores: [
				{ skillId: "grammar", score: 45, confidence: 0.7 },
				{ skillId: "vocabulary", score: 65, confidence: 0.8 },
			],
		});

		expect(baseline.userId).toBe("u1");
		expect(baseline.primaryGoal).toBe("career");
		expect(baseline.dailyTimeBudgetMinutes).toBe("20");
		expect(baseline.selfReportedWeakSkill).toBe("grammar");
		expect(baseline.preferredLearningStyle).toBe("visual");
		expect(baseline.baselineScores).toHaveLength(2);
		expect(baseline.placementSkipped).toBe(false);
		expect(baseline.createdAt).toBeTruthy();
	});

	it("stores all required fields (AC: 1)", () => {
		const baseline = createBaseline({
			userId: "u1",
			primaryGoal: "academic",
			dailyTimeBudgetMinutes: "30",
			placementScores: [{ skillId: "reading", score: 70, confidence: 0.9 }],
		});

		expect(baseline.primaryGoal).toBe("academic");
		expect(baseline.dailyTimeBudgetMinutes).toBe("30");
		expect(baseline.selfReportedWeakSkill).toBeNull();
		expect(baseline.preferredLearningStyle).toBe("mixed");
	});
});

// ── Skip Placement (AC: 4, 5) ───────────────────────────────────────────────

describe("createSkippedBaseline — conservative defaults", () => {
	it("creates conservative baseline when skipped (AC: 4)", () => {
		const baseline = createSkippedBaseline("u2");

		expect(baseline.userId).toBe("u2");
		expect(baseline.placementSkipped).toBe(true);
		expect(baseline.primaryGoal).toBe("general_improvement");
		expect(baseline.dailyTimeBudgetMinutes).toBe("10");
		expect(baseline.preferredLearningStyle).toBe("mixed");
	});

	it("provides default scores for all 7 core skills (AC: 4)", () => {
		const baseline = createSkippedBaseline("u2");
		expect(baseline.baselineScores).toHaveLength(7);

		const skills = baseline.baselineScores.map((s) => s.skillId);
		expect(skills).toContain("grammar");
		expect(skills).toContain("vocabulary");
		expect(skills).toContain("listening");
		expect(skills).toContain("speaking");
		expect(skills).toContain("pronunciation");
		expect(skills).toContain("reading");
		expect(skills).toContain("writing");
	});

	it("conservative scores are low (AC: 4)", () => {
		const baseline = createSkippedBaseline("u2");
		for (const score of baseline.baselineScores) {
			expect(score.score).toBeLessThanOrEqual(50);
			expect(score.confidence).toBeLessThanOrEqual(0.5);
		}
	});

	it("accepts optional goal and budget overrides", () => {
		const baseline = createSkippedBaseline("u2", "travel", "15");
		expect(baseline.primaryGoal).toBe("travel");
		expect(baseline.dailyTimeBudgetMinutes).toBe("15");
		expect(baseline.placementSkipped).toBe(true);
	});
});

// ── Baseline → Mastery States (AC: 2, 5) ───────────────────────────────────

describe("baselineToMasteryStates", () => {
	it("converts baseline scores to initial mastery states (AC: 2)", () => {
		const baseline = createBaseline({
			userId: "u1",
			primaryGoal: "career",
			dailyTimeBudgetMinutes: "20",
			placementScores: [
				{ skillId: "grammar", score: 45, confidence: 0.7 },
				{ skillId: "writing", score: 60, confidence: 0.8 },
			],
		});

		const states = baselineToMasteryStates(baseline);
		expect(states).toHaveLength(2);
		expect(states[0]!.skillId).toBe("grammar");
		expect(states[0]!.proficiency).toBe(45);
		expect(states[0]!.confidence).toBe(0.7);
		expect(states[0]!.userId).toBe("u1");
		expect(states[1]!.skillId).toBe("writing");
		expect(states[1]!.proficiency).toBe(60);
	});

	it("works with skipped baseline defaults (AC: 2, 4)", () => {
		const baseline = createSkippedBaseline("u3");
		const states = baselineToMasteryStates(baseline);
		expect(states).toHaveLength(7);
		for (const state of states) {
			expect(state.userId).toBe("u3");
			expect(state.proficiency).toBe(30);
			expect(state.confidence).toBe(0.3);
		}
	});
});

// ── Goal Relevance (AC: 3, 5) ──────────────────────────────────────────────

describe("getGoalRelevantSkills", () => {
	it("returns career-relevant skills", () => {
		const skills = getGoalRelevantSkills("career");
		expect(skills).toContain("writing");
		expect(skills).toContain("speaking");
		expect(skills).toContain("vocabulary");
	});

	it("returns travel-relevant skills", () => {
		const skills = getGoalRelevantSkills("travel");
		expect(skills).toContain("speaking");
		expect(skills).toContain("listening");
	});

	it("returns empty for general improvement (all relevant)", () => {
		const skills = getGoalRelevantSkills("general_improvement");
		expect(skills).toHaveLength(0);
	});
});

describe("isGoalRelevant", () => {
	it("grammar is relevant for academic goal", () => {
		expect(isGoalRelevant("academic", "grammar")).toBe(true);
	});

	it("pronunciation is not boosted for academic goal", () => {
		expect(isGoalRelevant("academic", "pronunciation")).toBe(false);
	});

	it("all skills are relevant for general_improvement", () => {
		expect(isGoalRelevant("general_improvement", "grammar")).toBe(true);
		expect(isGoalRelevant("general_improvement", "pronunciation")).toBe(true);
	});
});

// ── First Plan Uses Baseline (AC: 3, 5) ────────────────────────────────────

describe("first plan integration (AC: 3)", () => {
	it("baseline provides mastery states that feed into plan generator", () => {
		const baseline = createBaseline({
			userId: "u1",
			primaryGoal: "exam_prep",
			dailyTimeBudgetMinutes: "20",
			placementScores: [
				{ skillId: "grammar", score: 40, confidence: 0.6 },
				{ skillId: "reading", score: 70, confidence: 0.9 },
			],
		});

		const states = baselineToMasteryStates(baseline);
		const goalSkills = getGoalRelevantSkills(baseline.primaryGoal);

		// Grammar is weak AND goal-relevant → should be prioritized
		const grammarState = states.find((s) => s.skillId === "grammar")!;
		expect(grammarState.proficiency).toBe(40);
		expect(goalSkills).toContain("grammar");

		// Reading is strong → less urgent despite being goal-relevant
		const readingState = states.find((s) => s.skillId === "reading")!;
		expect(readingState.proficiency).toBe(70);
		expect(goalSkills).toContain("reading");
	});
});
