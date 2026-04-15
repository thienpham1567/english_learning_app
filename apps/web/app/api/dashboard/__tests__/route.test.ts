import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockResolveWebActor = vi.fn();

vi.mock("@/lib/resolve-actor", () => ({
  resolveWebActor: mockResolveWebActor,
}));

vi.mock("@/lib/daily-challenge/badges", () => ({
  getBadges: vi.fn(() => []),
}));

vi.mock("@repo/database", () => ({
  db: {
    select: vi.fn(),
    execute: vi.fn(),
  },
  userVocabulary: {},
  vocabularyCache: {},
  flashcardProgress: {},
  dailyChallenge: {},
  userStreak: {},
  writingSubmission: {},
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
});
