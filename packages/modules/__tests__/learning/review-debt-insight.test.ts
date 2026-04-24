import { describe, expect, it } from "vitest";
import { computeReviewDebt } from "../../src/learning/review-debt-insight";
import type { ReviewTask } from "@repo/contracts";

const NOW = new Date("2026-04-24T12:00:00Z").getTime();

function makeTask(overrides?: Partial<ReviewTask>): ReviewTask {
	return {
		id: "rt-1",
		userId: "u-1",
		skillId: "vocabulary",
		sourceType: "learning_event",
		sourceId: "evt-1",
		topic: "Test topic",
		mode: "flashcard",
		status: "pending",
		scheduledAt: "2026-04-22T12:00:00Z", // 2 days ago
		createdAt: "2026-04-20T12:00:00Z",
		...overrides,
	} as ReviewTask;
}

describe("computeReviewDebt — Overdue (AC: 1, 4)", () => {
	it("computes debt for overdue tasks", () => {
		const tasks = [
			makeTask({ id: "rt-1", skillId: "vocabulary" }),
			makeTask({ id: "rt-2", skillId: "grammar" }),
		];
		const debt = computeReviewDebt(tasks, NOW);
		expect(debt.hasDebt).toBe(true);
		expect(debt.totalDebt).toBe(2);
		expect(debt.totalMinutes).toBe(4);
	});

	it("categorizes by skill", () => {
		const tasks = [
			makeTask({ id: "rt-1", skillId: "vocabulary" }),
			makeTask({ id: "rt-2", skillId: "vocabulary" }),
			makeTask({ id: "rt-3", skillId: "grammar" }),
		];
		const debt = computeReviewDebt(tasks, NOW);
		expect(debt.categories).toHaveLength(2);
		const vocab = debt.categories.find((c) => c.category === "vocabulary");
		expect(vocab!.overdueCount + vocab!.dueCount).toBe(2);
	});

	it("identifies high-risk items (>48h overdue)", () => {
		const tasks = [
			makeTask({ id: "rt-old", scheduledAt: "2026-04-20T12:00:00Z" }), // 4 days overdue
			makeTask({ id: "rt-recent", scheduledAt: "2026-04-24T10:00:00Z" }), // 2 hours overdue
		];
		const debt = computeReviewDebt(tasks, NOW);
		expect(debt.highRiskItemIds).toContain("rt-old");
		expect(debt.highRiskItemIds).not.toContain("rt-recent");
	});
});

describe("computeReviewDebt — No Debt", () => {
	it("returns no debt for empty tasks", () => {
		const debt = computeReviewDebt([], NOW);
		expect(debt.hasDebt).toBe(false);
		expect(debt.message).toContain("Tuyệt vời");
	});

	it("ignores completed tasks", () => {
		const tasks = [makeTask({ status: "completed" as any })];
		const debt = computeReviewDebt(tasks, NOW);
		expect(debt.hasDebt).toBe(false);
	});
});

describe("computeReviewDebt — Link (AC: 3)", () => {
	it("provides review hub URL", () => {
		const debt = computeReviewDebt([], NOW);
		expect(debt.reviewHubUrl).toBe("/vocab-review");
	});
});
