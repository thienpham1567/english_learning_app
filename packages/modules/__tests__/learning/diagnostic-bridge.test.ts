import { describe, expect, it } from "vitest";
import {
	diagnosticToBaselineScore,
	diagnosticToBaselineScores,
	baselineScoresToSkillStates,
	mergeSkillStates,
	processDiagnosticSafely,
} from "../../src/learning/diagnostic-bridge";
import type { DiagnosticResult } from "../../src/learning/diagnostic-bridge";
import { defaultSkillState } from "../../src/learning/mastery-engine";

// ── Helpers ─────────────────────────────────────────────────────────────────

const USER_ID = "user-123";

function makeDiagnostic(overrides?: Partial<DiagnosticResult>): DiagnosticResult {
	return {
		userId: USER_ID,
		skills: [
			{ skillId: "grammar", correctCount: 7, totalCount: 10 },
			{ skillId: "vocabulary", correctCount: 5, totalCount: 10 },
			{ skillId: "listening", correctCount: 3, totalCount: 10 },
			{ skillId: "reading", correctCount: 8, totalCount: 10 },
		],
		completedAt: "2026-04-24T12:00:00Z",
		...overrides,
	};
}

// ── Score Mapping (AC: 1) ───────────────────────────────────────────────────

describe("diagnosticToBaselineScore — Score Mapping (AC: 1)", () => {
	it("maps correct/total to percentage score", () => {
		const score = diagnosticToBaselineScore({ skillId: "grammar", correctCount: 7, totalCount: 10 });
		expect(score.score).toBe(70);
		expect(score.skillId).toBe("grammar");
	});

	it("uses conservative default for 0 total", () => {
		const score = diagnosticToBaselineScore({ skillId: "grammar", correctCount: 0, totalCount: 0 });
		expect(score.score).toBe(30);
		expect(score.confidence).toBe(0.2);
	});

	it("clamps score to 0-100", () => {
		const score = diagnosticToBaselineScore({ skillId: "grammar", correctCount: 10, totalCount: 10 });
		expect(score.score).toBe(100);
	});

	it("gives higher confidence for more questions", () => {
		const few = diagnosticToBaselineScore({ skillId: "grammar", correctCount: 1, totalCount: 2 });
		const many = diagnosticToBaselineScore({ skillId: "grammar", correctCount: 5, totalCount: 10 });
		expect(many.confidence).toBeGreaterThan(few.confidence);
	});
});

describe("diagnosticToBaselineScores (AC: 1)", () => {
	it("maps all diagnostic skills", () => {
		const scores = diagnosticToBaselineScores(makeDiagnostic());
		expect(scores).toHaveLength(4);
		expect(scores.map((s) => s.skillId)).toEqual(["grammar", "vocabulary", "listening", "reading"]);
	});
});

// ── Skill State Creation (AC: 2) ────────────────────────────────────────────

describe("baselineScoresToSkillStates (AC: 2)", () => {
	it("creates skill states from baseline scores", () => {
		const scores = [
			{ skillId: "grammar", score: 70, confidence: 0.6 },
			{ skillId: "vocabulary", score: 50, confidence: 0.4 },
		];
		const states = baselineScoresToSkillStates(USER_ID, scores);
		expect(states).toHaveLength(2);
		expect(states[0]!.proficiency).toBe(70);
		expect(states[0]!.confidence).toBe(0.6);
		expect(states[0]!.userId).toBe(USER_ID);
	});
});

// ── Merge Logic (AC: 2) ────────────────────────────────────────────────────

describe("mergeSkillStates (AC: 2)", () => {
	it("keeps stronger existing proficiency", () => {
		const existing = [{ ...defaultSkillState(USER_ID, "grammar"), proficiency: 80, confidence: 0.7 }];
		const diagnostic = [{ ...defaultSkillState(USER_ID, "grammar"), proficiency: 60, confidence: 0.5 }];
		const merged = mergeSkillStates(existing, diagnostic);
		expect(merged[0]!.proficiency).toBe(80); // kept existing
		expect(merged[0]!.confidence).toBe(0.7); // kept existing (higher)
	});

	it("uses diagnostic when stronger", () => {
		const existing = [{ ...defaultSkillState(USER_ID, "grammar"), proficiency: 30, confidence: 0.3 }];
		const diagnostic = [{ ...defaultSkillState(USER_ID, "grammar"), proficiency: 70, confidence: 0.6 }];
		const merged = mergeSkillStates(existing, diagnostic);
		expect(merged[0]!.proficiency).toBe(70);
		expect(merged[0]!.confidence).toBe(0.6);
	});

	it("adds new skills from diagnostic", () => {
		const existing = [{ ...defaultSkillState(USER_ID, "grammar"), proficiency: 50 }];
		const diagnostic = [{ ...defaultSkillState(USER_ID, "listening"), proficiency: 60 }];
		const merged = mergeSkillStates(existing, diagnostic);
		expect(merged).toHaveLength(2);
		expect(merged.find((s) => s.skillId === "listening")!.proficiency).toBe(60);
	});

	it("preserves existing skills not in diagnostic", () => {
		const existing = [{ ...defaultSkillState(USER_ID, "writing"), proficiency: 40 }];
		const diagnostic = [{ ...defaultSkillState(USER_ID, "grammar"), proficiency: 60 }];
		const merged = mergeSkillStates(existing, diagnostic);
		expect(merged).toHaveLength(2);
		expect(merged.find((s) => s.skillId === "writing")!.proficiency).toBe(40);
	});
});

// ── Safe Processing (AC: 3) ────────────────────────────────────────────────

describe("processDiagnosticSafely (AC: 3)", () => {
	it("processes valid diagnostic successfully", () => {
		const result = processDiagnosticSafely(makeDiagnostic());
		expect(result.success).toBe(true);
		expect(result.baselineScores).toHaveLength(4);
		expect(result.skillStates).toHaveLength(4);
	});

	it("returns error for empty skills array", () => {
		const result = processDiagnosticSafely(makeDiagnostic({ skills: [] }));
		expect(result.success).toBe(false);
		expect(result.error).toContain("No diagnostic skills");
	});

	it("preserves existing states on failure", () => {
		const existing = [{ ...defaultSkillState(USER_ID, "grammar"), proficiency: 50 }];
		const result = processDiagnosticSafely(makeDiagnostic({ skills: [] }), existing);
		expect(result.success).toBe(false);
		expect(result.skillStates).toEqual(existing);
	});

	it("merges with existing states on success", () => {
		const existing = [{ ...defaultSkillState(USER_ID, "grammar"), proficiency: 90, confidence: 0.9 }];
		const result = processDiagnosticSafely(makeDiagnostic(), existing);
		expect(result.success).toBe(true);
		const grammar = result.skillStates.find((s) => s.skillId === "grammar")!;
		expect(grammar.proficiency).toBe(90); // kept existing (stronger)
	});
});

// ── Per-Skill Coverage (AC: 4) ──────────────────────────────────────────────

describe("diagnosticToBaselineScores — Per-Skill (AC: 4)", () => {
	it("creates grammar baseline", () => {
		const scores = diagnosticToBaselineScores(makeDiagnostic());
		const grammar = scores.find((s) => s.skillId === "grammar")!;
		expect(grammar.score).toBe(70);
	});

	it("creates vocabulary baseline", () => {
		const scores = diagnosticToBaselineScores(makeDiagnostic());
		const vocab = scores.find((s) => s.skillId === "vocabulary")!;
		expect(vocab.score).toBe(50);
	});

	it("creates listening baseline", () => {
		const scores = diagnosticToBaselineScores(makeDiagnostic());
		const listening = scores.find((s) => s.skillId === "listening")!;
		expect(listening.score).toBe(30);
	});

	it("creates reading baseline", () => {
		const scores = diagnosticToBaselineScores(makeDiagnostic());
		const reading = scores.find((s) => s.skillId === "reading")!;
		expect(reading.score).toBe(80);
	});
});
