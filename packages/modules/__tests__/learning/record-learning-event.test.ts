import { describe, expect, it, vi, beforeEach } from "vitest";

// Mock @repo/database before importing the module under test
vi.mock("@repo/database", () => ({
	insertLearningEvent: vi.fn().mockResolvedValue({ inserted: true }),
}));

import { recordLearningEvent } from "../../src/learning/record-learning-event";
import { insertLearningEvent } from "@repo/database";

const BASE_INPUT = {
	userId: "user_abc",
	sessionId: "sess_xyz",
	moduleType: "flashcard" as const,
	contentId: "word_hello",
	attemptId: "attempt_1",
	eventType: "exercise_submitted" as const,
	result: "correct" as const,
	score: 80,
	durationMs: 3000,
	difficulty: "intermediate" as const,
};

beforeEach(() => {
	vi.clearAllMocks();
});

describe("recordLearningEvent", () => {
	it("validates, resolves skills, and persists a valid event (AC: 1)", async () => {
		const result = await recordLearningEvent(BASE_INPUT);
		expect(result.recorded).toBe(true);
		expect(insertLearningEvent).toHaveBeenCalledTimes(1);

		const call = vi.mocked(insertLearningEvent).mock.calls[0]![0];
		expect(call.userId).toBe("user_abc");
		expect(call.moduleType).toBe("flashcard");
		// Skills auto-resolved from taxonomy
		expect(call.skillIds).toContain("vocabulary");
		// Taxonomy version stamped
		expect(call.taxonomyVersion).toBe("1.0.0");
		// Idempotency key present
		expect(call.idempotencyKey).toBeTruthy();
	});

	it("allows explicit skillIds override", async () => {
		const result = await recordLearningEvent({
			...BASE_INPUT,
			skillIds: ["grammar", "writing"],
		});
		expect(result.recorded).toBe(true);
		const call = vi.mocked(insertLearningEvent).mock.calls[0]![0];
		expect(call.skillIds).toEqual(["grammar", "writing"]);
	});

	it("builds deterministic idempotency key (AC: 4)", async () => {
		await recordLearningEvent(BASE_INPUT);
		await recordLearningEvent(BASE_INPUT);
		const key1 = vi.mocked(insertLearningEvent).mock.calls[0]![0].idempotencyKey;
		const key2 = vi.mocked(insertLearningEvent).mock.calls[1]![0].idempotencyKey;
		expect(key1).toBe(key2);
	});

	it("returns recorded:false on validation failure (AC: 1)", async () => {
		const result = await recordLearningEvent({
			...BASE_INPUT,
			eventType: "invalid_type" as any,
		});
		expect(result.recorded).toBe(false);
		expect(result.reason).toBe("validation_failed");
		expect(insertLearningEvent).not.toHaveBeenCalled();
	});

	it("returns recorded:false on persistence failure without throwing (AC: 5)", async () => {
		vi.mocked(insertLearningEvent).mockRejectedValueOnce(new Error("DB down"));
		const result = await recordLearningEvent(BASE_INPUT);
		expect(result.recorded).toBe(false);
		expect(result.reason).toBe("internal_error");
	});

	it("handles null score (AI feedback event)", async () => {
		const result = await recordLearningEvent({
			...BASE_INPUT,
			eventType: "ai_feedback_generated",
			result: "neutral",
			score: null,
		});
		expect(result.recorded).toBe(true);
		const call = vi.mocked(insertLearningEvent).mock.calls[0]![0];
		expect(call.score).toBeNull();
	});

	it("attaches optional aiVersion and rubricVersion metadata", async () => {
		const result = await recordLearningEvent({
			...BASE_INPUT,
			aiVersion: "gpt-4o-2026-04",
			rubricVersion: "ielts-v2",
		});
		expect(result.recorded).toBe(true);
		const call = vi.mocked(insertLearningEvent).mock.calls[0]![0];
		expect(call.aiVersion).toBe("gpt-4o-2026-04");
		expect(call.rubricVersion).toBe("ielts-v2");
	});
});
