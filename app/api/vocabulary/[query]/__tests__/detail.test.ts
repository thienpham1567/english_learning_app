import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/headers", () => ({
  headers: vi.fn().mockResolvedValue(new Headers()),
}));

vi.mock("@/lib/auth", () => ({
  auth: { api: { getSession: vi.fn() } },
}));

vi.mock("@/lib/db", () => ({
  db: {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          limit: vi.fn().mockResolvedValue([]),
        })),
      })),
    })),
  },
}));

beforeEach(() => {
  vi.resetModules();
});

afterEach(() => {
  vi.resetModules();
});

describe("GET /api/vocabulary/[query]/detail", () => {
  it("returns 401 when unauthenticated", async () => {
    const { auth } = await import("@/lib/auth");
    vi.mocked(auth.api.getSession).mockResolvedValueOnce(null);

    const { GET } = await import("@/app/api/vocabulary/[query]/detail/route");
    const response = await GET(
      new Request("http://localhost"),
      { params: Promise.resolve({ query: "take%20off" }) },
    );
    expect(response.status).toBe(401);
  });

  it("returns 404 when query not in cache", async () => {
    const { auth } = await import("@/lib/auth");
    vi.mocked(auth.api.getSession).mockResolvedValueOnce({
      user: { id: "user-1" },
    } as never);

    const { GET } = await import("@/app/api/vocabulary/[query]/detail/route");
    const response = await GET(
      new Request("http://localhost"),
      { params: Promise.resolve({ query: "nonexistent" }) },
    );
    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body).toEqual({ error: "not_found" });
  });

  it("returns full vocabulary data when found", async () => {
    const { auth } = await import("@/lib/auth");
    vi.mocked(auth.api.getSession).mockResolvedValueOnce({
      user: { id: "user-1" },
    } as never);

    const { db } = await import("@/lib/db");
    const mockData = {
      query: "take off",
      headword: "take off",
      entryType: "phrasal_verb",
      phonetic: null,
      phoneticsUs: "/teɪk ɒf/",
      phoneticsUk: "/teɪk ɒf/",
      partOfSpeech: "verb",
      level: "B1",
      register: null,
      overviewVi: "Cất cánh",
      overviewEn: "To leave the ground and begin to fly",
      senses: [],
    };
    vi.mocked(db.select).mockReturnValueOnce({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          limit: vi.fn().mockResolvedValue([{ data: mockData }]),
        })),
      })),
    } as ReturnType<typeof db.select>);

    const { GET } = await import("@/app/api/vocabulary/[query]/detail/route");
    const response = await GET(
      new Request("http://localhost"),
      { params: Promise.resolve({ query: "take%20off" }) },
    );
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual(mockData);
  });
});
