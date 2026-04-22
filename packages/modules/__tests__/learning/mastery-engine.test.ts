import { describe, expect, it } from "vitest";
import {
	defaultSkillState,
	applyDecay,
	computeMasteryUpdate,
} from "../../src/learning/mastery-engine";
import type { MasteryUpdateInput, UserSkillState } from "@repo/contracts";

// ── Helpers ─────────────────────────────────────────────────────────────────

function makeState(overrides: Partial<UserSkillState> = {}): UserSkillState {
	return { ...defaultSkillState("user1", "grammar"), ...overrides };
}

function makeInput(overrides: Partial<MasteryUpdateInput> = {}): MasteryUpdateInput {
	return {
		userId: "user1",
		skillId: "grammar",
		result: "correct",
		score: 80,
		difficulty: "intermediate",
		durationMs: 5000,
		errorTags: [],
		hintCount: 0,
		...overrides,
	};
}

// ── Default state ───────────────────────────────────────────────────────────

describe("defaultSkillState", () => {
	it("creates a zeroed-out state with sensible defaults", () => {
		const state = defaultSkillState("u1", "listening");
		expect(state.userId).toBe("u1");
		expect(state.skillId).toBe("listening");
		expect(state.proficiency).toBe(0);
		expect(state.confidence).toBe(0.5);
		expect(state.successStreak).toBe(0);
		expect(state.failureStreak).toBe(0);
		expect(state.signalCount).toBe(0);
	});
});

// ── Correct answers (AC: 3) ─────────────────────────────────────────────────

describe("computeMasteryUpdate — correct", () => {
	it("increases proficiency on a correct answer", () => {
		const state = makeState({ proficiency: 30 });
		const { nextState, output } = computeMasteryUpdate(state, makeInput());
		expect(nextState.proficiency).toBeGreaterThan(30);
		expect(output.delta).toBeGreaterThan(0);
	});

	it("gains more from hard difficulty than easy (AC: 3)", () => {
		const state = makeState({ proficiency: 30 });
		const easyResult = computeMasteryUpdate(state, makeInput({ difficulty: "beginner" }));
		const hardResult = computeMasteryUpdate(state, makeInput({ difficulty: "advanced" }));
		expect(hardResult.output.delta).toBeGreaterThan(easyResult.output.delta);
	});

	it("gains less when hints are used (AC: 3)", () => {
		const state = makeState({ proficiency: 30 });
		const noHints = computeMasteryUpdate(state, makeInput({ hintCount: 0 }));
		const withHints = computeMasteryUpdate(state, makeInput({ hintCount: 3 }));
		expect(withHints.output.delta).toBeLessThan(noHints.output.delta);
	});

	it("increases success streak and resets failure streak", () => {
		const state = makeState({ successStreak: 2, failureStreak: 3 });
		const { nextState } = computeMasteryUpdate(state, makeInput());
		expect(nextState.successStreak).toBe(3);
		expect(nextState.failureStreak).toBe(0);
	});

	it("applies streak bonus after 3+ correct", () => {
		const state = makeState({ proficiency: 30, successStreak: 3 });
		const withStreak = computeMasteryUpdate(state, makeInput());

		const stateNoStreak = makeState({ proficiency: 30, successStreak: 0 });
		const noStreak = computeMasteryUpdate(stateNoStreak, makeInput());

		expect(withStreak.output.delta).toBeGreaterThan(noStreak.output.delta);
	});

	it("increases confidence on correct answer", () => {
		const state = makeState({ confidence: 0.5 });
		const { nextState } = computeMasteryUpdate(state, makeInput());
		expect(nextState.confidence).toBeGreaterThan(0.5);
	});
});

// ── Incorrect answers (AC: 4) ───────────────────────────────────────────────

describe("computeMasteryUpdate — incorrect", () => {
	it("decreases proficiency on an incorrect answer", () => {
		const state = makeState({ proficiency: 50 });
		const { nextState, output } = computeMasteryUpdate(state, makeInput({ result: "incorrect" }));
		expect(nextState.proficiency).toBeLessThan(50);
		expect(output.delta).toBeLessThan(0);
	});

	it("decreases confidence on incorrect answer (AC: 4)", () => {
		const state = makeState({ confidence: 0.8 });
		const { nextState } = computeMasteryUpdate(state, makeInput({ result: "incorrect" }));
		expect(nextState.confidence).toBeLessThan(0.8);
	});

	it("increases failure streak and resets success streak", () => {
		const state = makeState({ successStreak: 5, failureStreak: 1 });
		const { nextState } = computeMasteryUpdate(state, makeInput({ result: "incorrect" }));
		expect(nextState.successStreak).toBe(0);
		expect(nextState.failureStreak).toBe(2);
	});

	it("repeated mistakes increase loss severity (AC: 4)", () => {
		const state0 = makeState({ proficiency: 50, failureStreak: 0 });
		const state3 = makeState({ proficiency: 50, failureStreak: 3 });

		const result0 = computeMasteryUpdate(state0, makeInput({ result: "incorrect" }));
		const result3 = computeMasteryUpdate(state3, makeInput({ result: "incorrect" }));

		// More failure streak → bigger loss
		expect(Math.abs(result3.output.delta)).toBeGreaterThan(Math.abs(result0.output.delta));
	});

	it("increases decay rate with higher failure streak", () => {
		const state = makeState({ failureStreak: 4 });
		const { nextState } = computeMasteryUpdate(state, makeInput({ result: "incorrect" }));
		expect(nextState.decayRate).toBeGreaterThan(0.05);
	});
});

// ── Partial answers ─────────────────────────────────────────────────────────

describe("computeMasteryUpdate — partial", () => {
	it("gives small positive gain for partial answers", () => {
		const state = makeState({ proficiency: 30 });
		const { output } = computeMasteryUpdate(state, makeInput({ result: "partial" }));
		expect(output.delta).toBeGreaterThan(0);
		// But less than full correct
		const correctResult = computeMasteryUpdate(state, makeInput({ result: "correct" }));
		expect(output.delta).toBeLessThan(correctResult.output.delta);
	});
});

// ── Neutral results ─────────────────────────────────────────────────────────

describe("computeMasteryUpdate — neutral", () => {
	it("does not change proficiency on neutral result", () => {
		const state = makeState({ proficiency: 50 });
		const { nextState, output } = computeMasteryUpdate(state, makeInput({ result: "neutral" }));
		expect(nextState.proficiency).toBe(50);
		expect(output.delta).toBe(0);
	});

	it("still increments signal count", () => {
		const state = makeState({ signalCount: 5 });
		const { nextState } = computeMasteryUpdate(state, makeInput({ result: "neutral" }));
		expect(nextState.signalCount).toBe(6);
	});
});

// ── Decay (AC: 5) ───────────────────────────────────────────────────────────

describe("applyDecay", () => {
	it("does not decay within grace period (48h)", () => {
		const state = makeState({ proficiency: 80 });
		const nowMs = new Date(state.lastPracticedAt).getTime() + 24 * 60 * 60 * 1000; // 24h later
		const result = applyDecay(state, nowMs);
		expect(result.proficiency).toBe(80);
	});

	it("decays proficiency after grace period (AC: 5)", () => {
		const state = makeState({ proficiency: 80, decayRate: 0.05 });
		// 5 days later
		const nowMs = new Date(state.lastPracticedAt).getTime() + 5 * 24 * 60 * 60 * 1000;
		const result = applyDecay(state, nowMs);
		expect(result.proficiency).toBeLessThan(80);
		expect(result.proficiency).toBeGreaterThan(0);
	});

	it("decays confidence alongside proficiency", () => {
		const state = makeState({ proficiency: 80, confidence: 0.9 });
		const nowMs = new Date(state.lastPracticedAt).getTime() + 7 * 24 * 60 * 60 * 1000;
		const result = applyDecay(state, nowMs);
		expect(result.confidence).toBeLessThan(0.9);
	});

	it("never decays below zero", () => {
		const state = makeState({ proficiency: 1, confidence: 0.01, decayRate: 0.5 });
		const nowMs = new Date(state.lastPracticedAt).getTime() + 365 * 24 * 60 * 60 * 1000; // 1 year
		const result = applyDecay(state, nowMs);
		expect(result.proficiency).toBeGreaterThanOrEqual(0);
		expect(result.confidence).toBeGreaterThanOrEqual(0);
	});
});

// ── Bounds ──────────────────────────────────────────────────────────────────

describe("computeMasteryUpdate — bounds", () => {
	it("proficiency never exceeds 100", () => {
		const state = makeState({ proficiency: 99, successStreak: 10 });
		const { nextState } = computeMasteryUpdate(state, makeInput({ difficulty: "advanced" }));
		expect(nextState.proficiency).toBeLessThanOrEqual(100);
	});

	it("proficiency never goes below 0", () => {
		const state = makeState({ proficiency: 1, failureStreak: 10 });
		const { nextState } = computeMasteryUpdate(state, makeInput({ result: "incorrect", difficulty: "advanced" }));
		expect(nextState.proficiency).toBeGreaterThanOrEqual(0);
	});

	it("confidence stays in [0, 1]", () => {
		const highConf = makeState({ confidence: 0.99 });
		const { nextState: s1 } = computeMasteryUpdate(highConf, makeInput({ difficulty: "advanced" }));
		expect(s1.confidence).toBeLessThanOrEqual(1);

		const lowConf = makeState({ confidence: 0.01, failureStreak: 10 });
		const { nextState: s2 } = computeMasteryUpdate(lowConf, makeInput({ result: "incorrect", difficulty: "advanced" }));
		expect(s2.confidence).toBeGreaterThanOrEqual(0);
	});
});
