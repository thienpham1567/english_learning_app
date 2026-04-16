import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockResolveWebActor = vi.fn();

vi.mock("@/lib/resolve-actor", () => ({
  resolveWebActor: mockResolveWebActor,
}));

vi.mock("@repo/database", () => ({
  drizzleDashboardQueryService: {
    getOverviewForUser: vi.fn(() =>
      Promise.resolve({
        flashcardsDue: 0,
        vocabDue: 0,
        dailyChallenge: { completed: false, score: null },
        streak: { currentStreak: 0, bestStreak: 0, lastCompletedDate: null },
        badges: [],
        recentVocabulary: [],
        weeklyActivity: [],
        totalXP: 0,
      }),
    ),
  },
}));

beforeEach(() => {
  vi.resetModules();
  mockResolveWebActor.mockReset();
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
  });

  it("returns dashboard data when authenticated", async () => {
    mockResolveWebActor.mockResolvedValueOnce({ userId: "test-user-id" });

    const { GET } = await import("@/app/api/dashboard/route");
    const response = await GET();

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toHaveProperty("flashcardsDue");
    expect(data).toHaveProperty("vocabDue");
    expect(data).toHaveProperty("dailyChallenge");
    expect(data).toHaveProperty("streak");
    expect(data).toHaveProperty("badges");
    expect(data).toHaveProperty("recentVocabulary");
    expect(data).toHaveProperty("weeklyActivity");
    expect(data).toHaveProperty("totalXP");
  });
});
