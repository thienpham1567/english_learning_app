import { describe, expect, it } from "vitest";
import {
	classifyError,
	getCategoryByKey,
	getAllCategories,
	categoryToSkillIds,
	ERROR_CATEGORIES,
} from "../../src/learning/error-category";

// ── Grammar Topic Pattern Matching (AC: 1) ──────────────────────────────────

describe("classifyError — Grammar Topics (AC: 1)", () => {
	it("classifies 'Present Perfect Tense' as tense", () => {
		const cat = classifyError({ grammarTopic: "Present Perfect Tense" });
		expect(cat.key).toBe("tense");
		expect(cat.skillId).toBe("grammar");
	});

	it("classifies 'Past Simple' as tense", () => {
		expect(classifyError({ grammarTopic: "Past Simple" }).key).toBe("tense");
	});

	it("classifies 'Articles: a/an/the' as article", () => {
		expect(classifyError({ grammarTopic: "Articles: a/an/the" }).key).toBe("article");
	});

	it("classifies 'Prepositions of time' as preposition", () => {
		expect(classifyError({ grammarTopic: "Prepositions of time" }).key).toBe("preposition");
	});

	it("classifies 'Word form: noun → verb' as word-form", () => {
		expect(classifyError({ grammarTopic: "Word form: noun → verb" }).key).toBe("word-form");
	});

	it("classifies 'Subject-verb agreement' as subject-verb", () => {
		expect(classifyError({ grammarTopic: "Subject-verb agreement" }).key).toBe("subject-verb");
	});

	it("classifies 'Relative clause' as clause", () => {
		expect(classifyError({ grammarTopic: "Relative clause" }).key).toBe("clause");
	});

	it("classifies 'Conditional sentences' as clause", () => {
		expect(classifyError({ grammarTopic: "Conditional sentences" }).key).toBe("clause");
	});

	it("classifies 'Vocabulary - word choice' as vocabulary", () => {
		expect(classifyError({ grammarTopic: "Vocabulary - word choice" }).key).toBe("vocabulary");
	});

	it("classifies 'Coherence and cohesion' as coherence", () => {
		expect(classifyError({ grammarTopic: "Coherence and cohesion" }).key).toBe("coherence");
	});

	it("classifies 'Pronunciation stress' as pronunciation", () => {
		expect(classifyError({ grammarTopic: "Pronunciation stress patterns" }).key).toBe("pronunciation");
	});

	it("classifies 'Spelling mistakes' as spelling", () => {
		expect(classifyError({ grammarTopic: "Spelling mistakes" }).key).toBe("spelling");
	});

	it("classifies 'Listening detail — specific information' as listening-detail", () => {
		expect(classifyError({ grammarTopic: "Listening detail: specific information" }).key).toBe("listening-detail");
	});

	it("classifies 'Time management strategy' as exam-strategy", () => {
		expect(classifyError({ grammarTopic: "Time management strategy" }).key).toBe("exam-strategy");
	});
});

// ── Source Module Fallback (AC: 2) ──────────────────────────────────────────

describe("classifyError — Source Module Fallback (AC: 2)", () => {
	it("falls back to exam-strategy for mock-test", () => {
		const cat = classifyError({ sourceModule: "mock-test" });
		expect(cat.key).toBe("exam-strategy");
	});

	it("falls back to listening-comprehension for listening module", () => {
		expect(classifyError({ sourceModule: "listening" }).key).toBe("listening-comprehension");
	});

	it("falls back to coherence for writing module", () => {
		expect(classifyError({ sourceModule: "writing" }).key).toBe("coherence");
	});

	it("falls back to pronunciation for speaking module", () => {
		expect(classifyError({ sourceModule: "speaking" }).key).toBe("pronunciation");
	});

	it("falls back to other for grammar-quiz without topic", () => {
		expect(classifyError({ sourceModule: "grammar-quiz" }).key).toBe("other");
	});

	it("falls back to reading-comprehension for reading module", () => {
		expect(classifyError({ sourceModule: "reading" }).key).toBe("reading-comprehension");
	});

	it("prioritizes grammarTopic over sourceModule", () => {
		const cat = classifyError({ grammarTopic: "Present Perfect", sourceModule: "mock-test" });
		expect(cat.key).toBe("tense"); // Topic match wins over module fallback
	});
});

// ── Legacy Row Compatibility (AC: 2) ────────────────────────────────────────

describe("classifyError — Legacy Rows (AC: 2)", () => {
	it("handles null grammarTopic with sourceModule", () => {
		const cat = classifyError({ grammarTopic: null, sourceModule: "grammar-quiz" });
		expect(cat.key).toBe("other");
	});

	it("handles undefined grammarTopic", () => {
		const cat = classifyError({ sourceModule: "mock-test" });
		expect(cat.key).toBe("exam-strategy");
	});

	it("handles both null grammarTopic and null sourceModule", () => {
		const cat = classifyError({ grammarTopic: null, sourceModule: null });
		expect(cat.key).toBe("other");
	});

	it("handles empty object", () => {
		const cat = classifyError({});
		expect(cat.key).toBe("other");
	});

	it("handles unknown sourceModule gracefully", () => {
		const cat = classifyError({ sourceModule: "future_module" });
		expect(cat.key).toBe("other");
	});
});

// ── Skill ID Mapping (AC: 3) ────────────────────────────────────────────────

describe("categoryToSkillIds (AC: 3)", () => {
	it("maps tense to grammar + grammar-form", () => {
		const cat = getCategoryByKey("tense")!;
		expect(categoryToSkillIds(cat)).toEqual(["grammar", "grammar-form"]);
	});

	it("maps coherence to writing + writing-coherence", () => {
		const cat = getCategoryByKey("coherence")!;
		expect(categoryToSkillIds(cat)).toEqual(["writing", "writing-coherence"]);
	});

	it("maps pronunciation to pronunciation + pronunciation-segments", () => {
		const cat = getCategoryByKey("pronunciation")!;
		expect(categoryToSkillIds(cat)).toEqual(["pronunciation", "pronunciation-segments"]);
	});

	it("maps exam-strategy to grammar only (no subskill)", () => {
		const cat = getCategoryByKey("exam-strategy")!;
		expect(categoryToSkillIds(cat)).toEqual(["grammar"]);
	});

	it("maps other to grammar only (no subskill)", () => {
		const cat = getCategoryByKey("other")!;
		expect(categoryToSkillIds(cat)).toEqual(["grammar"]);
	});
});

// ── Classification Fallback (AC: 4) ────────────────────────────────────────

describe("classifyError — Fallback Behavior (AC: 4)", () => {
	it("returns 'other' for completely unknown input", () => {
		const cat = classifyError({ grammarTopic: "xyz_unknown_topic_123", sourceModule: "xyz_unknown" });
		expect(cat.key).toBe("other");
		expect(cat.label).toBe("Other");
		expect(cat.labelVi).toBe("Khác");
	});

	it("always returns a valid ErrorCategory object", () => {
		const cat = classifyError({});
		expect(cat.key).toBeDefined();
		expect(cat.label).toBeDefined();
		expect(cat.skillId).toBeDefined();
		expect(cat.emoji).toBeDefined();
	});
});

// ── Category Registry ───────────────────────────────────────────────────────

describe("Category Registry", () => {
	it("has at least 15 categories", () => {
		expect(getAllCategories().length).toBeGreaterThanOrEqual(15);
	});

	it("all categories have unique keys", () => {
		const keys = ERROR_CATEGORIES.map((c) => c.key);
		expect(new Set(keys).size).toBe(keys.length);
	});

	it("getCategoryByKey returns undefined for unknown keys", () => {
		expect(getCategoryByKey("nonexistent")).toBeUndefined();
	});

	it("getCategoryByKey returns correct category", () => {
		expect(getCategoryByKey("tense")?.label).toBe("Tense");
	});
});

// ── Underscore/Hyphen Source Module Variants ─────────────────────────────────

describe("classifyError — Module Name Variants", () => {
	it("handles grammar_quiz (underscore variant)", () => {
		expect(classifyError({ sourceModule: "grammar_quiz" }).key).toBe("other");
	});

	it("handles mock_test (underscore variant)", () => {
		expect(classifyError({ sourceModule: "mock_test" }).key).toBe("exam-strategy");
	});

	it("handles daily_challenge (underscore variant)", () => {
		expect(classifyError({ sourceModule: "daily_challenge" }).key).toBe("other");
	});

	it("handles writing-practice (hyphen variant)", () => {
		expect(classifyError({ sourceModule: "writing-practice" }).key).toBe("coherence");
	});
});
