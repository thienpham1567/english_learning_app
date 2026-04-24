import { describe, expect, it } from "vitest";
import {
	extractChatCorrections,
	estimateCorrectionSeverity,
} from "../../src/learning/chat-correction-signals";
import type { ChatCorrection } from "../../src/learning/chat-correction-signals";

function makeCorrection(overrides?: Partial<ChatCorrection>): ChatCorrection {
	return {
		original: "I go to school yesterday",
		corrected: "I went to school yesterday",
		category: "grammar",
		explanation: "Past tense needed for yesterday",
		...overrides,
	};
}

describe("extractChatCorrections (AC: 1, 2)", () => {
	it("extracts corrections and creates learning event", () => {
		const result = extractChatCorrections([makeCorrection()], "u-1", "s-1");
		expect(result.hasCorrections).toBe(true);
		expect(result.corrections).toHaveLength(1);
		expect(result.learningEvent.moduleType).toBe("chatbot");
		expect(result.errorEntries).toHaveLength(1);
	});

	it("creates error entries with correct fields", () => {
		const result = extractChatCorrections([makeCorrection()], "u-1", "s-1");
		expect(result.errorEntries[0]!.sourceModule).toBe("chatbot");
		expect(result.errorEntries[0]!.userAnswer).toBe("I go to school yesterday");
		expect(result.errorEntries[0]!.correctAnswer).toBe("I went to school yesterday");
	});

	it("maps skill IDs from correction categories", () => {
		const corrections = [
			makeCorrection({ category: "grammar" }),
			makeCorrection({ category: "vocabulary", original: "big house", corrected: "spacious house" }),
		];
		const result = extractChatCorrections(corrections, "u-1", "s-1");
		expect(result.learningEvent.skillIds).toContain("grammar");
		expect(result.learningEvent.skillIds).toContain("vocabulary");
	});
});

describe("extractChatCorrections — graceful degradation (AC: 3)", () => {
	it("returns empty for no corrections", () => {
		const result = extractChatCorrections([], "u-1", "s-1");
		expect(result.hasCorrections).toBe(false);
	});

	it("filters out identical original/corrected", () => {
		const result = extractChatCorrections(
			[makeCorrection({ original: "same", corrected: "same" })],
			"u-1", "s-1",
		);
		expect(result.hasCorrections).toBe(false);
	});

	it("filters out empty original", () => {
		const result = extractChatCorrections(
			[makeCorrection({ original: "" })],
			"u-1", "s-1",
		);
		expect(result.hasCorrections).toBe(false);
	});
});

describe("estimateCorrectionSeverity (AC: 4)", () => {
	it("grammar is significant", () => {
		expect(estimateCorrectionSeverity(makeCorrection({ category: "grammar" }))).toBe("significant");
	});
	it("spelling is minor", () => {
		expect(estimateCorrectionSeverity(makeCorrection({ category: "spelling" }))).toBe("minor");
	});
	it("vocabulary is moderate", () => {
		expect(estimateCorrectionSeverity(makeCorrection({ category: "vocabulary" }))).toBe("moderate");
	});
});
