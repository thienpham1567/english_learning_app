import { describe, expect, it } from "vitest";
import {
	ONBOARDING_STEPS,
	GOAL_OPTIONS,
	TIME_OPTIONS,
	WEAK_SKILL_OPTIONS,
	STYLE_OPTIONS,
	ONBOARDING_DEFAULTS,
	mergeWithDefaults,
	shouldShowOnboarding,
	ESTIMATED_COMPLETION_SECONDS,
	UNDER_TWO_MINUTES,
} from "../../src/learning/onboarding-flow";
import type { OnboardingAnswers } from "../../src/learning/onboarding-flow";

// ── Flow Structure (AC: 1) ─────────────────────────────────────────────────

describe("Onboarding Flow — Structure (AC: 1)", () => {
	it("has exactly 4 steps", () => {
		expect(ONBOARDING_STEPS).toHaveLength(4);
	});

	it("steps cover goal, time, weak skill, and style", () => {
		const keys = ONBOARDING_STEPS.map((s) => s.key);
		expect(keys).toEqual(["goal", "time", "weak_skill", "style"]);
	});

	it("all steps have title, subtitle, and options", () => {
		for (const step of ONBOARDING_STEPS) {
			expect(step.title.length).toBeGreaterThan(0);
			expect(step.subtitle.length).toBeGreaterThan(0);
			expect(step.options.length).toBeGreaterThanOrEqual(3);
		}
	});

	it("all steps are not required (can skip)", () => {
		for (const step of ONBOARDING_STEPS) {
			expect(step.required).toBe(false);
		}
	});

	it("goal options cover all LearnerGoal values", () => {
		const values = GOAL_OPTIONS.map((o) => o.value);
		expect(values).toContain("career");
		expect(values).toContain("travel");
		expect(values).toContain("academic");
		expect(values).toContain("daily_conversation");
		expect(values).toContain("exam_prep");
		expect(values).toContain("general_improvement");
	});

	it("time options cover all DailyTimeBudget values", () => {
		const values = TIME_OPTIONS.map((o) => o.value);
		expect(values).toEqual(["5", "10", "15", "20", "30"]);
	});

	it("weak skill options cover 7 core skills", () => {
		expect(WEAK_SKILL_OPTIONS).toHaveLength(7);
	});

	it("style options cover all LearningStyle values", () => {
		const values = STYLE_OPTIONS.map((o) => o.value);
		expect(values).toContain("visual");
		expect(values).toContain("auditory");
		expect(values).toContain("reading_writing");
		expect(values).toContain("kinesthetic");
		expect(values).toContain("mixed");
	});

	it("all options have emoji and description", () => {
		const allOptions = [...GOAL_OPTIONS, ...TIME_OPTIONS, ...WEAK_SKILL_OPTIONS, ...STYLE_OPTIONS];
		for (const opt of allOptions) {
			expect(opt.emoji.length).toBeGreaterThan(0);
			expect(opt.description.length).toBeGreaterThan(0);
		}
	});
});

// ── Skip / Defaults (AC: 2) ────────────────────────────────────────────────

describe("Onboarding Flow — Skip / Defaults (AC: 2)", () => {
	it("mergeWithDefaults fills all missing answers", () => {
		const merged = mergeWithDefaults({});
		expect(merged.goal).toBe("general_improvement");
		expect(merged.time).toBe("10");
		expect(merged.weakSkill).toBe("grammar");
		expect(merged.style).toBe("mixed");
	});

	it("mergeWithDefaults preserves provided answers", () => {
		const answers: OnboardingAnswers = {
			goal: "career",
			time: "30",
			weakSkill: "listening",
			style: "auditory",
		};
		const merged = mergeWithDefaults(answers);
		expect(merged.goal).toBe("career");
		expect(merged.time).toBe("30");
		expect(merged.weakSkill).toBe("listening");
		expect(merged.style).toBe("auditory");
	});

	it("mergeWithDefaults handles partial answers", () => {
		const merged = mergeWithDefaults({ goal: "travel" });
		expect(merged.goal).toBe("travel");
		expect(merged.time).toBe("10");
		expect(merged.weakSkill).toBe("grammar");
		expect(merged.style).toBe("mixed");
	});

	it("defaults are valid enum values", () => {
		expect(GOAL_OPTIONS.find((o) => o.value === ONBOARDING_DEFAULTS.goal)).toBeTruthy();
		expect(TIME_OPTIONS.find((o) => o.value === ONBOARDING_DEFAULTS.time)).toBeTruthy();
		expect(WEAK_SKILL_OPTIONS.find((o) => o.value === ONBOARDING_DEFAULTS.weakSkill)).toBeTruthy();
		expect(STYLE_OPTIONS.find((o) => o.value === ONBOARDING_DEFAULTS.style)).toBeTruthy();
	});
});

// ── Display Logic (AC: 1) ──────────────────────────────────────────────────

describe("Onboarding Flow — Display Logic (AC: 1)", () => {
	it("shows onboarding when no baseline exists", () => {
		expect(shouldShowOnboarding(false)).toBe(true);
	});

	it("hides onboarding when baseline exists", () => {
		expect(shouldShowOnboarding(true)).toBe(false);
	});
});

// ── Completion Time (AC: 4) ────────────────────────────────────────────────

describe("Onboarding Flow — Completion Time (AC: 4)", () => {
	it("estimated completion is under 2 minutes", () => {
		expect(UNDER_TWO_MINUTES).toBe(true);
	});

	it("estimated completion is reasonable (20-60 seconds)", () => {
		expect(ESTIMATED_COMPLETION_SECONDS).toBeGreaterThanOrEqual(20);
		expect(ESTIMATED_COMPLETION_SECONDS).toBeLessThanOrEqual(60);
	});
});
