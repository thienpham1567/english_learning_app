import { describe, expect, it } from "vitest";
import {
	validateDrillItem,
	validateDrillItems,
	generateDrillsFromErrors,
	buildDrillPrompt,
	canGenerateDrill,
	MIN_ERRORS_FOR_DRILL,
} from "../../src/learning/error-drill-generator";
import type { DrillSourceError, DrillGenerationInput } from "../../src/learning/error-drill-generator";
import { getCategoryByKey } from "../../src/learning/error-category";

// ── Helpers ─────────────────────────────────────────────────────────────────

function makeSourceError(overrides?: Partial<DrillSourceError>): DrillSourceError {
	return {
		id: "err-1",
		questionStem: "She ___ already left when I arrived.",
		options: ["has", "had", "have", "having"],
		userAnswer: "has",
		correctAnswer: "had",
		explanationEn: "Use past perfect for the earlier action.",
		explanationVi: "Dùng quá khứ hoàn thành cho hành động xảy ra trước.",
		...overrides,
	};
}

const TENSE_CATEGORY = getCategoryByKey("tense")!;

function makeInput(overrides?: Partial<DrillGenerationInput>): DrillGenerationInput {
	return {
		category: TENSE_CATEGORY,
		sourceErrors: [makeSourceError(), makeSourceError({ id: "err-2" })],
		...overrides,
	};
}

// ── Schema Validation (AC: 4) ───────────────────────────────────────────────

describe("validateDrillItem — Schema Validation (AC: 4)", () => {
	it("accepts a valid drill item", () => {
		const result = validateDrillItem({
			questionStem: "Q?",
			options: ["A", "B", "C", "D"],
			correctAnswer: "B",
			explanationEn: "Because...",
		}, 0);
		expect(result.valid).toBe(true);
	});

	it("rejects null item", () => {
		expect(validateDrillItem(null, 0).valid).toBe(false);
	});

	it("rejects missing questionStem", () => {
		const result = validateDrillItem({
			options: ["A", "B"],
			correctAnswer: "A",
			explanationEn: "E",
		}, 0);
		expect(result.valid).toBe(false);
		expect(result.error).toContain("questionStem");
	});

	it("rejects empty options", () => {
		const result = validateDrillItem({
			questionStem: "Q?",
			options: [],
			correctAnswer: "A",
			explanationEn: "E",
		}, 0);
		expect(result.valid).toBe(false);
		expect(result.error).toContain("options");
	});

	it("rejects correctAnswer not in options", () => {
		const result = validateDrillItem({
			questionStem: "Q?",
			options: ["A", "B"],
			correctAnswer: "C",
			explanationEn: "E",
		}, 0);
		expect(result.valid).toBe(false);
		expect(result.error).toContain("correctAnswer");
	});

	it("rejects missing explanationEn", () => {
		const result = validateDrillItem({
			questionStem: "Q?",
			options: ["A", "B"],
			correctAnswer: "A",
		}, 0);
		expect(result.valid).toBe(false);
		expect(result.error).toContain("explanationEn");
	});
});

describe("validateDrillItems — Batch Validation (AC: 4)", () => {
	it("returns valid items and skips invalid ones", () => {
		const raw = [
			{ questionStem: "Q1?", options: ["A", "B"], correctAnswer: "A", explanationEn: "E1" },
			null,
			{ questionStem: "Q2?", options: ["X", "Y"], correctAnswer: "X", explanationEn: "E2" },
		];
		const result = validateDrillItems(raw);
		expect(result.valid).toBe(true);
		expect(result.items).toHaveLength(2);
		expect(result.errors).toHaveLength(1);
	});

	it("returns valid=false when all items are invalid", () => {
		const result = validateDrillItems([null, null]);
		expect(result.valid).toBe(false);
		expect(result.items).toHaveLength(0);
		expect(result.errors).toHaveLength(2);
	});

	it("assigns unique IDs to each valid item", () => {
		const raw = [
			{ questionStem: "Q1?", options: ["A", "B"], correctAnswer: "A", explanationEn: "E1" },
			{ questionStem: "Q2?", options: ["X", "Y"], correctAnswer: "X", explanationEn: "E2" },
		];
		const result = validateDrillItems(raw);
		expect(result.items[0]!.id).not.toBe(result.items[1]!.id);
	});
});

// ── Drill Generation (AC: 1, 2) ─────────────────────────────────────────────

describe("generateDrillsFromErrors — Drill Generation (AC: 1, 2)", () => {
	it("generates drills from source errors", () => {
		const session = generateDrillsFromErrors(makeInput());
		expect(session.items).toHaveLength(2);
		expect(session.categoryKey).toBe("tense");
	});

	it("limits items to maxItems", () => {
		const errors = Array.from({ length: 10 }, (_, i) => makeSourceError({ id: `e${i}` }));
		const session = generateDrillsFromErrors(makeInput({ sourceErrors: errors, maxItems: 3 }));
		expect(session.items).toHaveLength(3);
	});

	it("each item has question, options, correct answer, and explanation (AC: 2)", () => {
		const session = generateDrillsFromErrors(makeInput());
		for (const item of session.items) {
			expect(item.questionStem.length).toBeGreaterThan(0);
			expect(item.options.length).toBeGreaterThanOrEqual(2);
			expect(item.correctAnswer.length).toBeGreaterThan(0);
			expect(item.options).toContain(item.correctAnswer);
			expect(item.explanationEn.length).toBeGreaterThan(0);
			expect(item.explanationVi.length).toBeGreaterThan(0);
		}
	});

	it("includes sourceErrorId for each item", () => {
		const session = generateDrillsFromErrors(makeInput());
		expect(session.items[0]!.sourceErrorId).toBe("err-1");
		expect(session.items[1]!.sourceErrorId).toBe("err-2");
	});

	it("handles errors with null options", () => {
		const input = makeInput({
			sourceErrors: [makeSourceError({ options: null })],
		});
		const session = generateDrillsFromErrors(input);
		expect(session.items[0]!.options.length).toBeGreaterThanOrEqual(2);
		expect(session.items[0]!.options).toContain("had");
	});

	it("handles errors with null explanations", () => {
		const input = makeInput({
			sourceErrors: [makeSourceError({ explanationEn: null, explanationVi: null })],
		});
		const session = generateDrillsFromErrors(input);
		expect(session.items[0]!.explanationEn.length).toBeGreaterThan(0);
		expect(session.items[0]!.explanationVi.length).toBeGreaterThan(0);
	});

	it("includes correct answer and user's wrong answer in options", () => {
		const session = generateDrillsFromErrors(makeInput({
			sourceErrors: [makeSourceError({ userAnswer: "has", correctAnswer: "had" })],
		}));
		const options = session.items[0]!.options;
		expect(options).toContain("had");
		expect(options).toContain("has");
	});
});

// ── AI Prompt (AC: 1) ───────────────────────────────────────────────────────

describe("buildDrillPrompt", () => {
	it("includes category info", () => {
		const prompt = buildDrillPrompt(TENSE_CATEGORY, []);
		expect(prompt).toContain("Tense");
		expect(prompt).toContain("Thì");
		expect(prompt).toContain("grammar");
	});

	it("includes example sentences", () => {
		const prompt = buildDrillPrompt(TENSE_CATEGORY, ["She has left already."]);
		expect(prompt).toContain("She has left already.");
	});

	it("includes JSON schema", () => {
		const prompt = buildDrillPrompt(TENSE_CATEGORY, []);
		expect(prompt).toContain("questionStem");
		expect(prompt).toContain("correctAnswer");
		expect(prompt).toContain("explanationEn");
	});
});

// ── Minimum Threshold (AC: 1) ───────────────────────────────────────────────

describe("canGenerateDrill (AC: 1)", () => {
	it("returns false for 0 errors", () => {
		expect(canGenerateDrill(0)).toBe(false);
	});

	it("returns false for 1 error", () => {
		expect(canGenerateDrill(1)).toBe(false);
	});

	it("returns true for 2+ errors", () => {
		expect(canGenerateDrill(2)).toBe(true);
		expect(canGenerateDrill(10)).toBe(true);
	});

	it("MIN_ERRORS_FOR_DRILL is 2", () => {
		expect(MIN_ERRORS_FOR_DRILL).toBe(2);
	});
});
