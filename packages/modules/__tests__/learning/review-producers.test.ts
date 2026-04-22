import { describe, expect, it } from "vitest";
import {
	produceReviewTask,
	produceVocabularyReviewTask,
	produceWritingReviewTask,
	producePronunciationReviewTask,
	produceGrammarReviewTask,
	produceListeningReviewTask,
	produceClozeReviewTask,
} from "../../src/learning/review-producers";
import type { ReviewTaskProducerInput } from "../../src/learning/review-producers";

const NOW = Date.now();

// ── Base Producer ───────────────────────────────────────────────────────────

describe("produceReviewTask", () => {
	it("creates a review task output with scheduling defaults", () => {
		const input: ReviewTaskProducerInput = {
			userId: "u1",
			sourceType: "flashcard_review",
			sourceId: "card-123",
			skillIds: ["vocabulary"],
			reason: "Missed word",
		};
		const output = produceReviewTask(input, 60, NOW);

		expect(output.userId).toBe("u1");
		expect(output.sourceType).toBe("flashcard_review");
		expect(output.sourceId).toBe("card-123");
		expect(output.skillIds).toEqual(["vocabulary"]);
		expect(output.reason).toBe("Missed word");
		expect(output.priority).toBe(60);
		expect(output.estimatedMinutes).toBeGreaterThan(0);
		expect(output.reviewMode).toBeTruthy();
		expect(new Date(output.dueAt).getTime()).toBeGreaterThan(NOW);
	});

	it("uses default priority 50 when not overridden", () => {
		const input: ReviewTaskProducerInput = {
			userId: "u1",
			sourceType: "error_retry",
			sourceId: "err-1",
			skillIds: ["grammar"],
			reason: "Grammar error",
		};
		const output = produceReviewTask(input);
		expect(output.priority).toBe(50);
	});

	it("includes skill ids (AC: 3)", () => {
		const input: ReviewTaskProducerInput = {
			userId: "u1",
			sourceType: "cloze_retry",
			sourceId: "cloze-1",
			skillIds: ["reading", "vocabulary"],
			reason: "Cloze miss",
		};
		const output = produceReviewTask(input);
		expect(output.skillIds).toEqual(["reading", "vocabulary"]);
	});

	it("includes reason metadata (AC: 3)", () => {
		const input: ReviewTaskProducerInput = {
			userId: "u1",
			sourceType: "listening_replay",
			sourceId: "listen-1",
			skillIds: ["listening"],
			reason: "Missed keywords",
		};
		const output = produceReviewTask(input);
		expect(output.reason).toBe("Missed keywords");
	});
});

// ── Vocabulary Producer (AC: 5) ─────────────────────────────────────────────

describe("produceVocabularyReviewTask", () => {
	it("creates a flashcard_review task for vocabulary miss (AC: 5)", () => {
		const output = produceVocabularyReviewTask("u1", "word-42", "ephemeral");
		expect(output.sourceType).toBe("flashcard_review");
		expect(output.sourceId).toBe("vocab-word-42");
		expect(output.skillIds).toEqual(["vocabulary"]);
		expect(output.reason).toContain("ephemeral");
		expect(output.priority).toBe(60);
	});
});

// ── Writing Producer (AC: 5) ────────────────────────────────────────────────

describe("produceWritingReviewTask", () => {
	it("creates a writing_rewrite task for writing error (AC: 5)", () => {
		const output = produceWritingReviewTask("u1", "err-7", "subject-verb agreement");
		expect(output.sourceType).toBe("writing_rewrite");
		expect(output.sourceId).toBe("writing-err-7");
		expect(output.skillIds).toEqual(["writing"]);
		expect(output.reason).toContain("subject-verb agreement");
	});
});

// ── Pronunciation Producer (AC: 5) ─────────────────────────────────────────

describe("producePronunciationReviewTask", () => {
	it("creates a pronunciation_drill task (AC: 5)", () => {
		const output = producePronunciationReviewTask("u1", "ex-3", "comfortable");
		expect(output.sourceType).toBe("pronunciation_drill");
		expect(output.sourceId).toBe("pronun-ex-3");
		expect(output.skillIds).toContain("pronunciation");
		expect(output.skillIds).toContain("speaking");
		expect(output.reason).toContain("comfortable");
	});
});

// ── Grammar Producer ────────────────────────────────────────────────────────

describe("produceGrammarReviewTask", () => {
	it("creates a grammar_remediation task", () => {
		const output = produceGrammarReviewTask("u1", "q-99", "past perfect");
		expect(output.sourceType).toBe("grammar_remediation");
		expect(output.sourceId).toBe("grammar-q-99");
		expect(output.skillIds).toEqual(["grammar"]);
		expect(output.reason).toContain("past perfect");
	});
});

// ── Listening Producer ──────────────────────────────────────────────────────

describe("produceListeningReviewTask", () => {
	it("creates a listening_replay task", () => {
		const output = produceListeningReviewTask("u1", "ex-5", "business meeting");
		expect(output.sourceType).toBe("listening_replay");
		expect(output.sourceId).toBe("listening-ex-5");
		expect(output.skillIds).toEqual(["listening"]);
		expect(output.reason).toContain("business meeting");
	});
});

// ── Cloze Producer ──────────────────────────────────────────────────────────

describe("produceClozeReviewTask", () => {
	it("creates a cloze_retry task with dual skill ids", () => {
		const output = produceClozeReviewTask("u1", "p-12", "environment");
		expect(output.sourceType).toBe("cloze_retry");
		expect(output.sourceId).toBe("cloze-p-12");
		expect(output.skillIds).toEqual(["reading", "vocabulary"]);
		expect(output.reason).toContain("environment");
	});
});

// ── Cross-cutting (AC: 4) ──────────────────────────────────────────────────

describe("backward compatibility (AC: 4)", () => {
	it("producers return additive output without removing existing fields", () => {
		// All producers produce ReviewTaskProducerOutput — no existing route fields touched
		const vocab = produceVocabularyReviewTask("u1", "w1", "test");
		const writing = produceWritingReviewTask("u1", "e1", "test");
		const pronun = producePronunciationReviewTask("u1", "x1", "test");

		// All outputs have required fields without disrupting route payloads
		for (const output of [vocab, writing, pronun]) {
			expect(output.userId).toBeTruthy();
			expect(output.sourceType).toBeTruthy();
			expect(output.dueAt).toBeTruthy();
			expect(output.estimatedMinutes).toBeGreaterThan(0);
		}
	});
});
