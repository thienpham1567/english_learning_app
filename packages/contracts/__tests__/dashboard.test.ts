import { describe, expect, it } from "vitest";
import { DashboardResponseSchema } from "../src/dashboard";

const VALID_DASHBOARD = {
	flashcardsDue: 5,
	vocabDue: 3,
	dailyChallenge: { completed: true, score: 85 },
	streak: {
		currentStreak: 7,
		bestStreak: 14,
		lastCompletedDate: "2026-04-14",
	},
	badges: [
		{
			id: "streak-3",
			emoji: "🔥",
			label: "Bắt đầu tốt",
			requiredStreak: 3,
			unlocked: true,
		},
		{
			id: "streak-7",
			emoji: "🔥",
			label: "Kiên trì",
			requiredStreak: 7,
			unlocked: true,
		},
	],
	recentVocabulary: [
		{
			query: "hello",
			headword: "hello",
			level: "A1",
			lookedUpAt: "2026-04-14T10:00:00Z",
		},
	],
	weeklyActivity: [
		{ day: "2026-04-09", count: 2 },
		{ day: "2026-04-10", count: 0 },
		{ day: "2026-04-11", count: 1 },
	],
	totalXP: 450,
};

describe("DashboardResponseSchema", () => {
	it("parses valid dashboard response", () => {
		const result = DashboardResponseSchema.safeParse(VALID_DASHBOARD);
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.flashcardsDue).toBe(5);
			expect(result.data.badges).toHaveLength(2);
			expect(result.data.streak.currentStreak).toBe(7);
		}
	});

	it("accepts null score in daily challenge", () => {
		const data = {
			...VALID_DASHBOARD,
			dailyChallenge: { completed: false, score: null },
		};
		const result = DashboardResponseSchema.safeParse(data);
		expect(result.success).toBe(true);
	});

	it("accepts null lastCompletedDate", () => {
		const data = {
			...VALID_DASHBOARD,
			streak: { ...VALID_DASHBOARD.streak, lastCompletedDate: null },
		};
		const result = DashboardResponseSchema.safeParse(data);
		expect(result.success).toBe(true);
	});

	it("accepts empty arrays", () => {
		const data = {
			...VALID_DASHBOARD,
			badges: [],
			recentVocabulary: [],
			weeklyActivity: [],
		};
		const result = DashboardResponseSchema.safeParse(data);
		expect(result.success).toBe(true);
	});

	it("rejects missing flashcardsDue", () => {
		const { flashcardsDue, ...rest } = VALID_DASHBOARD;
		const result = DashboardResponseSchema.safeParse(rest);
		expect(result.success).toBe(false);
	});

	it("rejects invalid badge shape", () => {
		const data = {
			...VALID_DASHBOARD,
			badges: [{ id: "test" }], // missing fields
		};
		const result = DashboardResponseSchema.safeParse(data);
		expect(result.success).toBe(false);
	});

	it("rejects string where number expected", () => {
		const data = { ...VALID_DASHBOARD, totalXP: "not-a-number" };
		const result = DashboardResponseSchema.safeParse(data);
		expect(result.success).toBe(false);
	});
});
