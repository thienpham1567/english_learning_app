import { describe, expect, it } from "vitest";
import {
	LearningEventSchema,
	LearningEventType,
	LearningModuleType,
	LearningResult,
	LearningDifficulty,
} from "../src/learning";

// ── Valid payloads ──────────────────────────────────────────────────────────

const VALID_EVENT = {
	userId: "user_abc123",
	sessionId: "sess_xyz789",
	moduleType: "listening" as const,
	contentId: "exercise_001",
	skillIds: ["listening-comprehension", "vocabulary-b2"],
	attemptId: "attempt_42",
	eventType: "exercise_submitted" as const,
	result: "correct" as const,
	score: 85,
	durationMs: 45000,
	difficulty: "intermediate" as const,
	errorTags: ["tense-error", "article-missing"],
	timestamp: "2026-04-22T10:00:00Z",
};

const MINIMAL_EVENT = {
	userId: "user_abc123",
	sessionId: "sess_xyz789",
	moduleType: "chatbot" as const,
	contentId: "msg_001",
	skillIds: [],
	attemptId: "attempt_1",
	eventType: "ai_feedback_generated" as const,
	result: "neutral" as const,
	score: null,
	durationMs: 1200,
	difficulty: "beginner" as const,
	errorTags: [],
	timestamp: "2026-04-22T10:01:00Z",
};

// ── Tests ───────────────────────────────────────────────────────────────────

describe("LearningEventSchema", () => {
	it("parses a fully populated valid event", () => {
		const result = LearningEventSchema.safeParse(VALID_EVENT);
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.eventType).toBe("exercise_submitted");
			expect(result.data.moduleType).toBe("listening");
			expect(result.data.skillIds).toHaveLength(2);
			expect(result.data.score).toBe(85);
			expect(result.data.errorTags).toHaveLength(2);
		}
	});

	it("parses a minimal valid event with empty arrays and null score", () => {
		const result = LearningEventSchema.safeParse(MINIMAL_EVENT);
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.score).toBeNull();
			expect(result.data.skillIds).toHaveLength(0);
			expect(result.data.errorTags).toHaveLength(0);
		}
	});

	it("accepts optional aiVersion field", () => {
		const data = { ...VALID_EVENT, aiVersion: "gpt-4o-2026-04" };
		const result = LearningEventSchema.safeParse(data);
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.aiVersion).toBe("gpt-4o-2026-04");
		}
	});

	it("accepts optional rubricVersion field", () => {
		const data = { ...VALID_EVENT, rubricVersion: "ielts-writing-v2" };
		const result = LearningEventSchema.safeParse(data);
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.rubricVersion).toBe("ielts-writing-v2");
		}
	});

	it("accepts both aiVersion and rubricVersion together", () => {
		const data = {
			...VALID_EVENT,
			aiVersion: "gpt-4o-2026-04",
			rubricVersion: "ielts-writing-v2",
		};
		const result = LearningEventSchema.safeParse(data);
		expect(result.success).toBe(true);
	});

	// ── Rejection tests (AC: 4) ──

	it("rejects empty string userId", () => {
		const data = { ...VALID_EVENT, userId: "" };
		const result = LearningEventSchema.safeParse(data);
		expect(result.success).toBe(false);
	});

	it("rejects missing userId", () => {
		const { userId, ...rest } = VALID_EVENT;
		const result = LearningEventSchema.safeParse(rest);
		expect(result.success).toBe(false);
	});

	it("rejects missing sessionId", () => {
		const { sessionId, ...rest } = VALID_EVENT;
		const result = LearningEventSchema.safeParse(rest);
		expect(result.success).toBe(false);
	});

	it("rejects missing moduleType", () => {
		const { moduleType, ...rest } = VALID_EVENT;
		const result = LearningEventSchema.safeParse(rest);
		expect(result.success).toBe(false);
	});

	it("rejects missing eventType", () => {
		const { eventType, ...rest } = VALID_EVENT;
		const result = LearningEventSchema.safeParse(rest);
		expect(result.success).toBe(false);
	});

	it("rejects missing timestamp", () => {
		const { timestamp, ...rest } = VALID_EVENT;
		const result = LearningEventSchema.safeParse(rest);
		expect(result.success).toBe(false);
	});

	it("rejects invalid eventType value", () => {
		const data = { ...VALID_EVENT, eventType: "invalid_event" };
		const result = LearningEventSchema.safeParse(data);
		expect(result.success).toBe(false);
	});

	it("rejects invalid moduleType value", () => {
		const data = { ...VALID_EVENT, moduleType: "nonexistent_module" };
		const result = LearningEventSchema.safeParse(data);
		expect(result.success).toBe(false);
	});

	it("rejects invalid result value", () => {
		const data = { ...VALID_EVENT, result: "maybe" };
		const result = LearningEventSchema.safeParse(data);
		expect(result.success).toBe(false);
	});

	it("rejects invalid difficulty value", () => {
		const data = { ...VALID_EVENT, difficulty: "impossible" };
		const result = LearningEventSchema.safeParse(data);
		expect(result.success).toBe(false);
	});

	it("rejects string where number expected for durationMs", () => {
		const data = { ...VALID_EVENT, durationMs: "not-a-number" };
		const result = LearningEventSchema.safeParse(data);
		expect(result.success).toBe(false);
	});

	it("rejects negative durationMs", () => {
		const data = { ...VALID_EVENT, durationMs: -100 };
		const result = LearningEventSchema.safeParse(data);
		expect(result.success).toBe(false);
	});
});

// ── Enum coverage ───────────────────────────────────────────────────────────

describe("LearningEventType enum", () => {
	it("includes all required event types per AC3", () => {
		const required = [
			"exercise_submitted",
			"answer_graded",
			"mistake_detected",
			"skill_practice_completed",
			"review_completed",
			"ai_feedback_generated",
			"mastery_updated",
		];
		for (const type of required) {
			expect(LearningEventType.options).toContain(type);
		}
	});
});

describe("LearningModuleType enum", () => {
	it("includes core module types", () => {
		expect(LearningModuleType.options.length).toBeGreaterThanOrEqual(5);
	});
});

describe("LearningResult enum", () => {
	it("includes correct, incorrect, partial, and neutral", () => {
		for (const r of ["correct", "incorrect", "partial", "neutral"]) {
			expect(LearningResult.options).toContain(r);
		}
	});
});

describe("LearningDifficulty enum", () => {
	it("includes beginner through advanced", () => {
		for (const d of ["beginner", "elementary", "intermediate", "upper_intermediate", "advanced"]) {
			expect(LearningDifficulty.options).toContain(d);
		}
	});
});
