import { describe, expect, it } from "vitest";
import type { ActorContext } from "@repo/auth";
import { DashboardResponseSchema, type DashboardResponse } from "@repo/contracts";
import type { DashboardQueryService } from "@repo/database";
import { getDashboardOverview } from "../../src";

const actor: ActorContext = {
	userId: "user-123",
	roles: ["learner"],
	clientType: "web",
};

const dashboardResponse: DashboardResponse = {
	flashcardsDue: 5,
	vocabDue: 3,
	dailyChallenge: {
		completed: true,
		score: 90,
	},
	streak: {
		currentStreak: 6,
		bestStreak: 12,
		lastCompletedDate: "2026-04-16",
	},
	badges: [
		{
			id: "streak-3",
			emoji: "🔥",
			label: "Warm streak",
			requiredStreak: 3,
			unlocked: true,
		},
	],
	recentVocabulary: [
		{
			query: "hello",
			headword: "hello",
			level: "A1",
			lookedUpAt: "2026-04-16T08:00:00Z",
		},
	],
	weeklyActivity: [
		{ day: "2026-04-10", count: 1 },
		{ day: "2026-04-11", count: 0 },
		{ day: "2026-04-12", count: 2 },
		{ day: "2026-04-13", count: 1 },
		{ day: "2026-04-14", count: 3 },
		{ day: "2026-04-15", count: 2 },
		{ day: "2026-04-16", count: 4 },
	],
	totalXP: 450,
};

describe("getDashboardOverview", () => {
	it("delegates to the query service with actor.userId and returns the dashboard payload", async () => {
		const receivedUserIds: string[] = [];
		const dashboardQuery: DashboardQueryService = {
			async getOverviewForUser(userId) {
				receivedUserIds.push(userId);
				return dashboardResponse;
			},
		};

		const result = await getDashboardOverview({
			actor,
			dashboardQuery,
		});

		expect(receivedUserIds).toEqual([actor.userId]);
		expect(result).toEqual(dashboardResponse);
		expect(DashboardResponseSchema.safeParse(result).success).toBe(true);
	});
});
