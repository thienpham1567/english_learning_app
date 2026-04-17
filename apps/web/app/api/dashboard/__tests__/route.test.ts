import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockResolveWebActor = vi.fn();
const mockGetDashboardOverview = vi.fn();
const fallbackDatabaseResult = {
  flashcardsDue: 0,
  vocabDue: 0,
  dailyChallenge: { completed: false, score: null },
  streak: { currentStreak: 0, bestStreak: 0, lastCompletedDate: null },
  badges: [],
  recentVocabulary: [],
  weeklyActivity: [],
  totalXP: 0,
};
const mockDashboardQuery = {
  getOverviewForUser: vi.fn(),
};

vi.mock("@/lib/resolve-actor", () => ({
  resolveWebActor: mockResolveWebActor,
}));

vi.mock("@repo/modules", () => ({
  getDashboardOverview: mockGetDashboardOverview,
}));

vi.mock("@repo/database", () => ({
  drizzleDashboardQueryService: mockDashboardQuery,
}));

beforeEach(() => {
  vi.resetModules();
  mockResolveWebActor.mockReset();
  mockGetDashboardOverview.mockReset();
  mockDashboardQuery.getOverviewForUser.mockReset();
  mockDashboardQuery.getOverviewForUser.mockResolvedValue(fallbackDatabaseResult);
});

afterEach(() => {
  vi.resetModules();
});

describe("GET /api/dashboard", () => {
  it("returns the existing unauthorized payload when actor resolution fails", async () => {
    const { UnauthorizedError } = await import("@repo/shared");
    mockResolveWebActor.mockRejectedValueOnce(new UnauthorizedError("Session required"));

    const { GET } = await import("@/app/api/dashboard/route");
    const response = await GET();

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: "Unauthorized" });
    expect(mockGetDashboardOverview).not.toHaveBeenCalled();
  });

  it("returns dashboard data when authenticated", async () => {
    const actor = { userId: "test-user-id", roles: ["learner"], clientType: "web" } as const;
    const result = {
      flashcardsDue: 2,
      vocabDue: 1,
      dailyChallenge: { completed: true, score: 88 },
      streak: { currentStreak: 4, bestStreak: 9, lastCompletedDate: "2026-04-16" },
      badges: [],
      recentVocabulary: [],
      weeklyActivity: [],
      totalXP: 150,
    };

    mockResolveWebActor.mockResolvedValueOnce(actor);
    mockGetDashboardOverview.mockResolvedValueOnce(result);

    const { GET } = await import("@/app/api/dashboard/route");
    const response = await GET();

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(result);
    expect(mockGetDashboardOverview).toHaveBeenCalledWith({
      actor,
      dashboardQuery: mockDashboardQuery,
    });
  });

  it("preserves AppError transport mapping from the use-case boundary", async () => {
    const { AppError } = await import("@repo/shared");

    mockResolveWebActor.mockResolvedValueOnce({
      userId: "test-user-id",
      roles: ["learner"],
      clientType: "web",
    });
    mockGetDashboardOverview.mockRejectedValueOnce(
      new AppError({
        code: "DASHBOARD_UNAVAILABLE",
        message: "Dashboard unavailable",
        statusCode: 503,
      }),
    );

    const { GET } = await import("@/app/api/dashboard/route");
    const response = await GET();

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ error: "Dashboard unavailable" });
  });
});
