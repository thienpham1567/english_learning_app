import { describe, expect, it } from "vitest";
import { generateImprovementStatements } from "../../src/learning/improvement-statements";
import type { EvidenceData } from "../../src/learning/improvement-statements";

describe("generateImprovementStatements — Rich Data (AC: 1)", () => {
	it("generates vocabulary statement with gain", () => {
		const stmts = generateImprovementStatements({
			rememberedWords: 50,
			previousRememberedWords: 35,
		});
		const vocab = stmts.find((s) => s.category === "vocabulary");
		expect(vocab).toBeTruthy();
		expect(vocab!.text).toContain("15");
	});

	it("generates error reduction statement", () => {
		const stmts = generateImprovementStatements({
			resolvedErrors: 10,
			previousResolvedErrors: 5,
		});
		const errors = stmts.find((s) => s.category === "errors");
		expect(errors).toBeTruthy();
		expect(errors!.text).toContain("5");
	});

	it("generates reading level statement", () => {
		const stmts = generateImprovementStatements({
			readingLevel: "B2",
			previousReadingLevel: "B1",
		});
		const reading = stmts.find((s) => s.category === "reading");
		expect(reading).toBeTruthy();
		expect(reading!.confidence).toBe("high");
	});

	it("generates speaking duration statement", () => {
		const stmts = generateImprovementStatements({
			speakingDuration: 45,
			previousSpeakingDuration: 30,
		});
		const speaking = stmts.find((s) => s.category === "speaking");
		expect(speaking).toBeTruthy();
		expect(speaking!.text).toContain("15");
	});

	it("generates listening speed statement", () => {
		const stmts = generateImprovementStatements({
			listeningSpeed: 120,
			previousListeningSpeed: 100,
		});
		const listening = stmts.find((s) => s.category === "listening");
		expect(listening).toBeTruthy();
	});

	it("generates consistency statement", () => {
		const stmts = generateImprovementStatements({ totalSessions: 7 });
		const consistency = stmts.find((s) => s.category === "consistency");
		expect(consistency).toBeTruthy();
		expect(consistency!.confidence).toBe("high");
	});
});

describe("generateImprovementStatements — Sparse Data (AC: 3)", () => {
	it("returns encouragement for no data", () => {
		const stmts = generateImprovementStatements({});
		expect(stmts).toHaveLength(1);
		expect(stmts[0]!.confidence).toBe("low");
	});

	it("avoids overclaiming with low vocab count", () => {
		const stmts = generateImprovementStatements({ rememberedWords: 2 });
		const vocab = stmts.find((s) => s.category === "vocabulary");
		expect(vocab).toBeFalsy();
	});
});

describe("generateImprovementStatements — Evidence Link (AC: 2)", () => {
	it("every statement has a category", () => {
		const stmts = generateImprovementStatements({
			rememberedWords: 50,
			previousRememberedWords: 30,
			totalSessions: 5,
		});
		for (const stmt of stmts) {
			expect(stmt.category).toBeTruthy();
			expect(stmt.emoji.length).toBeGreaterThan(0);
		}
	});
});
