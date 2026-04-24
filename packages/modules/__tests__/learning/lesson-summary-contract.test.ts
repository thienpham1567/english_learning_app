import { describe, expect, it } from "vitest";
import { LessonSummarySchema } from "@repo/contracts";
import type { LessonSummary } from "@repo/contracts";

// ── Helpers ─────────────────────────────────────────────────────────────────

function makeValidSummary(overrides?: Partial<LessonSummary>): Record<string, unknown> {
	return {
		moduleType: "grammar-quiz",
		sessionId: "session-123",
		completedAt: "2026-04-24T12:00:00Z",
		outcome: "passed",
		score: 80,
		correctCount: 8,
		totalCount: 10,
		durationSeconds: 300,
		explanation: "Bạn làm tốt! 8/10 câu đúng.",
		topIssue: {
			description: "Nhầm lẫn giữa Present Perfect và Past Simple",
			category: "tense",
			occurrences: 2,
		},
		nextActions: [
			{ label: "Luyện thêm ngữ pháp", href: "/grammar-quiz", priority: "primary" },
		],
		skillIds: ["grammar"],
		reviewCandidates: [],
		...overrides,
	};
}

// ── Valid Summaries (AC: 1) ────────────────────────────────────────────────

describe("LessonSummarySchema — Valid Summaries (AC: 1)", () => {
	it("validates a complete valid summary", () => {
		const result = LessonSummarySchema.safeParse(makeValidSummary());
		expect(result.success).toBe(true);
	});

	it("validates summary with null topIssue", () => {
		const result = LessonSummarySchema.safeParse(makeValidSummary({ topIssue: null }));
		expect(result.success).toBe(true);
	});

	it("validates summary with multiple next actions", () => {
		const result = LessonSummarySchema.safeParse(makeValidSummary({
			nextActions: [
				{ label: "Primary", href: "/a", priority: "primary" },
				{ label: "Secondary", href: "/b", priority: "secondary" },
			],
		}));
		expect(result.success).toBe(true);
	});

	it("validates summary with review candidates", () => {
		const result = LessonSummarySchema.safeParse(makeValidSummary({
			reviewCandidates: [
				{ skillId: "grammar", topic: "Present Perfect", urgency: "immediate" },
				{ skillId: "vocabulary", topic: "Business terms", urgency: "later" },
			],
		}));
		expect(result.success).toBe(true);
	});

	it("defaults reviewCandidates to empty array when omitted", () => {
		const data = makeValidSummary();
		delete (data as Record<string, unknown>).reviewCandidates;
		const result = LessonSummarySchema.safeParse(data);
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.reviewCandidates).toEqual([]);
		}
	});
});

// ── Module Type Coverage (AC: 2) ───────────────────────────────────────────

describe("LessonSummarySchema — Module Types (AC: 2)", () => {
	const moduleTypes = [
		"grammar-quiz", "grammar-lessons", "listening", "reading",
		"writing", "speaking", "pronunciation", "vocabulary",
		"mock-test", "daily-challenge", "error-drill", "flashcards",
	];

	for (const mod of moduleTypes) {
		it(`supports "${mod}" module type`, () => {
			const result = LessonSummarySchema.safeParse(makeValidSummary({ moduleType: mod as any }));
			expect(result.success).toBe(true);
		});
	}
});

// ── Invalid Payloads (AC: 3) ───────────────────────────────────────────────

describe("LessonSummarySchema — Invalid Payloads (AC: 3)", () => {
	it("rejects unknown module type", () => {
		const result = LessonSummarySchema.safeParse(makeValidSummary({ moduleType: "unknown" as any }));
		expect(result.success).toBe(false);
	});

	it("rejects missing sessionId", () => {
		const data = makeValidSummary();
		delete data.sessionId;
		const result = LessonSummarySchema.safeParse(data);
		expect(result.success).toBe(false);
	});

	it("rejects invalid outcome", () => {
		const result = LessonSummarySchema.safeParse(makeValidSummary({ outcome: "amazing" as any }));
		expect(result.success).toBe(false);
	});

	it("rejects score > 100", () => {
		const result = LessonSummarySchema.safeParse(makeValidSummary({ score: 150 }));
		expect(result.success).toBe(false);
	});

	it("rejects score < 0", () => {
		const result = LessonSummarySchema.safeParse(makeValidSummary({ score: -10 }));
		expect(result.success).toBe(false);
	});

	it("rejects empty explanation", () => {
		const result = LessonSummarySchema.safeParse(makeValidSummary({ explanation: "" }));
		expect(result.success).toBe(false);
	});

	it("rejects empty nextActions array", () => {
		const result = LessonSummarySchema.safeParse(makeValidSummary({ nextActions: [] }));
		expect(result.success).toBe(false);
	});

	it("rejects empty skillIds array", () => {
		const result = LessonSummarySchema.safeParse(makeValidSummary({ skillIds: [] }));
		expect(result.success).toBe(false);
	});

	it("rejects invalid datetime format", () => {
		const result = LessonSummarySchema.safeParse(makeValidSummary({ completedAt: "not-a-date" }));
		expect(result.success).toBe(false);
	});

	it("rejects negative durationSeconds", () => {
		const result = LessonSummarySchema.safeParse(makeValidSummary({ durationSeconds: -1 }));
		expect(result.success).toBe(false);
	});

	it("rejects invalid review candidate urgency", () => {
		const result = LessonSummarySchema.safeParse(makeValidSummary({
			reviewCandidates: [{ skillId: "grammar", topic: "Tense", urgency: "ASAP" }],
		}));
		expect(result.success).toBe(false);
	});
});
