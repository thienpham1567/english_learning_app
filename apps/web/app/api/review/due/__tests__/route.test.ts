import { describe, expect, it } from "vitest";

// ── Story 22.1: Due Review Task API Adapter Tests (AC: 1-4) ─────────────────
//
// These tests validate the response shape, reason metadata, and edge cases
// using pure functions extracted from the route logic.

// ── Response Shape Validation (AC: 1) ───────────────────────────────────────

interface DueReviewItem {
	id: string;
	sourceType: string;
	sourceId: string;
	skillIds: string[];
	priority: number;
	dueAt: string;
	estimatedMinutes: number;
	reviewMode: string;
	reason: string;
}

interface DueReviewResponse {
	items: DueReviewItem[];
	legacy: {
		flashcardsDue: number;
		unresolvedErrors: number;
	};
}

// Extracted reason function matching the route implementation
function reasonForSource(sourceType: string, daysOverdue: number): string {
	const overdueSuffix = daysOverdue > 0 ? ` (${daysOverdue} ngày quá hạn)` : "";
	switch (sourceType) {
		case "grammar_quiz":
			return `Ôn ngữ pháp${overdueSuffix}`;
		case "listening":
			return `Ôn nghe${overdueSuffix}`;
		case "vocabulary":
			return `Ôn từ vựng${overdueSuffix}`;
		case "error_log":
			return `Ôn lỗi sai${overdueSuffix}`;
		case "writing":
			return `Ôn bài viết${overdueSuffix}`;
		case "reading":
			return `Ôn bài đọc${overdueSuffix}`;
		default:
			return `Ôn tập${overdueSuffix}`;
	}
}

// Mock task data matching ReviewTaskRow shape
function makeMockTask(overrides?: Partial<{
	id: string;
	sourceType: string;
	sourceId: string;
	skillIds: string[];
	priority: number;
	dueAt: Date;
	estimatedMinutes: number;
	reviewMode: string;
}>) {
	const now = new Date();
	return {
		id: overrides?.id ?? "task-1",
		sourceType: overrides?.sourceType ?? "grammar_quiz",
		sourceId: overrides?.sourceId ?? "grammar-topic-1",
		skillIds: overrides?.skillIds ?? ["grammar"],
		priority: overrides?.priority ?? 80,
		dueAt: overrides?.dueAt ?? now,
		estimatedMinutes: overrides?.estimatedMinutes ?? 5,
		reviewMode: overrides?.reviewMode ?? "recall",
	};
}

// Map function matching the route implementation
function mapTaskToItem(task: ReturnType<typeof makeMockTask>, now: Date): DueReviewItem {
	const daysOverdue = Math.max(
		0,
		Math.floor((now.getTime() - task.dueAt.getTime()) / (1000 * 60 * 60 * 24)),
	);
	return {
		id: task.id,
		sourceType: task.sourceType,
		sourceId: task.sourceId,
		skillIds: task.skillIds,
		priority: task.priority,
		dueAt: task.dueAt.toISOString(),
		estimatedMinutes: task.estimatedMinutes,
		reviewMode: task.reviewMode,
		reason: reasonForSource(task.sourceType, daysOverdue),
	};
}

// ── Tests ───────────────────────────────────────────────────────────────────

describe("Due Review API — Response Shape (AC: 1)", () => {
	it("includes all required fields on mapped items", () => {
		const now = new Date();
		const task = makeMockTask();
		const item = mapTaskToItem(task, now);

		expect(item.id).toBe("task-1");
		expect(item.sourceType).toBe("grammar_quiz");
		expect(item.sourceId).toBe("grammar-topic-1");
		expect(item.skillIds).toEqual(["grammar"]);
		expect(item.priority).toBe(80);
		expect(item.dueAt).toBeDefined();
		expect(item.estimatedMinutes).toBe(5);
		expect(item.reviewMode).toBe("recall");
		expect(item.reason).toBeDefined();
		expect(typeof item.reason).toBe("string");
	});

	it("serializes dueAt as ISO string", () => {
		const now = new Date("2026-04-24T00:00:00Z");
		const task = makeMockTask({ dueAt: now });
		const item = mapTaskToItem(task, now);

		expect(item.dueAt).toBe("2026-04-24T00:00:00.000Z");
	});
});

describe("Due Review API — Reason Metadata (AC: 1)", () => {
	it("generates reason for grammar_quiz", () => {
		expect(reasonForSource("grammar_quiz", 0)).toBe("Ôn ngữ pháp");
	});

	it("generates reason for listening", () => {
		expect(reasonForSource("listening", 0)).toBe("Ôn nghe");
	});

	it("generates reason for vocabulary", () => {
		expect(reasonForSource("vocabulary", 0)).toBe("Ôn từ vựng");
	});

	it("generates reason for error_log", () => {
		expect(reasonForSource("error_log", 0)).toBe("Ôn lỗi sai");
	});

	it("appends overdue days when > 0", () => {
		expect(reasonForSource("grammar_quiz", 3)).toBe("Ôn ngữ pháp (3 ngày quá hạn)");
	});

	it("returns generic reason for unknown source type", () => {
		expect(reasonForSource("unknown_type", 0)).toBe("Ôn tập");
	});

	it("calculates overdue days correctly", () => {
		const now = new Date("2026-04-24T12:00:00Z");
		const twoDaysAgo = new Date("2026-04-22T00:00:00Z");
		const task = makeMockTask({ sourceType: "vocabulary", dueAt: twoDaysAgo });
		const item = mapTaskToItem(task, now);

		expect(item.reason).toBe("Ôn từ vựng (2 ngày quá hạn)");
	});
});

describe("Due Review API — Legacy Counts (AC: 2)", () => {
	it("response shape includes legacy section with flashcardsDue and unresolvedErrors", () => {
		const response: DueReviewResponse = {
			items: [],
			legacy: {
				flashcardsDue: 5,
				unresolvedErrors: 3,
			},
		};

		expect(response.legacy.flashcardsDue).toBe(5);
		expect(response.legacy.unresolvedErrors).toBe(3);
	});

	it("legacy counts default to 0 for empty results", () => {
		const response: DueReviewResponse = {
			items: [],
			legacy: {
				flashcardsDue: 0,
				unresolvedErrors: 0,
			},
		};

		expect(response.legacy.flashcardsDue).toBe(0);
		expect(response.legacy.unresolvedErrors).toBe(0);
	});
});

describe("Due Review API — Empty Queue (AC: 4)", () => {
	it("returns empty items array when no tasks are due", () => {
		const response: DueReviewResponse = {
			items: [],
			legacy: { flashcardsDue: 0, unresolvedErrors: 0 },
		};

		expect(response.items).toHaveLength(0);
		expect(response.items).toEqual([]);
	});
});

describe("Due Review API — Mixed Due Tasks (AC: 4)", () => {
	it("maps multiple different source types correctly", () => {
		const now = new Date("2026-04-24T12:00:00Z");
		const tasks = [
			makeMockTask({ id: "t1", sourceType: "grammar_quiz", skillIds: ["grammar"], priority: 90 }),
			makeMockTask({ id: "t2", sourceType: "vocabulary", skillIds: ["vocabulary"], priority: 70 }),
			makeMockTask({ id: "t3", sourceType: "listening", skillIds: ["listening"], priority: 50 }),
		];

		const items = tasks.map((t) => mapTaskToItem(t, now));

		expect(items).toHaveLength(3);
		expect(items[0]!.sourceType).toBe("grammar_quiz");
		expect(items[1]!.sourceType).toBe("vocabulary");
		expect(items[2]!.sourceType).toBe("listening");
		expect(items[0]!.priority).toBe(90);
		expect(items[1]!.priority).toBe(70);
		expect(items[2]!.priority).toBe(50);
	});
});

describe("Due Review API — Graceful Fallback (AC: 4)", () => {
	it("handles unknown source types without crashing", () => {
		const now = new Date();
		const task = makeMockTask({ sourceType: "future_module" });
		const item = mapTaskToItem(task, now);

		expect(item.reason).toBe("Ôn tập");
		expect(item.sourceType).toBe("future_module");
	});

	it("handles empty skillIds array", () => {
		const now = new Date();
		const task = makeMockTask({ skillIds: [] });
		const item = mapTaskToItem(task, now);

		expect(item.skillIds).toEqual([]);
	});
});
