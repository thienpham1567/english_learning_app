import { describe, expect, it } from "vitest";
import {
	buildSkillProgressPanel,
	generateRecommendationExplanation,
	CORE_SKILLS,
} from "../../src/learning/skill-progress-panel";
import { defaultSkillState } from "../../src/learning/mastery-engine";

const NOW = new Date("2026-04-24T12:00:00Z").getTime();
const USER = "u-1";

describe("buildSkillProgressPanel — Full Data (AC: 1, 2)", () => {
	it("shows all 7 core skills", () => {
		const panel = buildSkillProgressPanel([], NOW);
		expect(panel.skills).toHaveLength(7);
		expect(panel.skills.map((s) => s.skillId)).toEqual([...CORE_SKILLS]);
	});

	it("includes proficiency, confidence, level, and last practiced", () => {
		const states = [{ ...defaultSkillState(USER, "grammar"), proficiency: 75, confidence: 0.7, updatedAt: "2026-04-23T12:00:00Z" }];
		const panel = buildSkillProgressPanel(states, NOW);
		const grammar = panel.skills.find((s) => s.skillId === "grammar")!;
		expect(grammar.proficiency).toBe(75);
		expect(grammar.confidence).toBe(0.7);
		expect(grammar.level).toBe("upper_intermediate");
		expect(grammar.lastPracticedLabel).toBe("Hôm qua");
	});

	it("identifies strongest and weakest skill", () => {
		const states = [
			{ ...defaultSkillState(USER, "grammar"), proficiency: 80, confidence: 0.8 },
			{ ...defaultSkillState(USER, "listening"), proficiency: 30, confidence: 0.5 },
		];
		const panel = buildSkillProgressPanel(states, NOW);
		expect(panel.strongestSkill).toBe("grammar");
		expect(panel.weakestSkill).toBe("listening");
	});
});

describe("buildSkillProgressPanel — Missing Data (AC: 3)", () => {
	it("handles no skill state at all", () => {
		const panel = buildSkillProgressPanel([], NOW);
		expect(panel.hasData).toBe(false);
		expect(panel.strongestSkill).toBeNull();
		expect(panel.overallMessage).toContain("Bắt đầu");
	});

	it("marks low-confidence skills as unreliable", () => {
		const states = [{ ...defaultSkillState(USER, "grammar"), proficiency: 50, confidence: 0.1 }];
		const panel = buildSkillProgressPanel(states, NOW);
		const grammar = panel.skills.find((s) => s.skillId === "grammar")!;
		expect(grammar.hasReliableData).toBe(false);
	});
});

describe("generateRecommendationExplanation (AC: 4)", () => {
	it("suggests focusing on weakest skill", () => {
		const states = [
			{ ...defaultSkillState(USER, "grammar"), proficiency: 80, confidence: 0.8 },
			{ ...defaultSkillState(USER, "listening"), proficiency: 30, confidence: 0.5 },
		];
		const panel = buildSkillProgressPanel(states, NOW);
		const explanation = generateRecommendationExplanation(panel);
		expect(explanation).toContain("Nghe");
	});

	it("suggests diagnostic for no data", () => {
		const panel = buildSkillProgressPanel([], NOW);
		const explanation = generateRecommendationExplanation(panel);
		expect(explanation).toContain("chẩn đoán");
	});
});
