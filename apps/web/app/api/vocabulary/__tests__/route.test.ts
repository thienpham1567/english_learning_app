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
        leftJoin: vi.fn(() => ({
          where: vi.fn(() => ({
            orderBy: vi.fn().mockResolvedValue([]),
          })),
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

describe("GET /api/vocabulary", () => {
  it("returns 401 when unauthenticated", async () => {
    const { auth } = await import("@/lib/auth");
    vi.mocked(auth.api.getSession).mockResolvedValueOnce(null);

    const { GET } = await import("@/app/api/vocabulary/route");
    const response = await GET(new Request("http://localhost/api/vocabulary"));

    expect(response.status).toBe(401);
  }, 10000);

  it("normalizes legacy collocation entry types in the list response", async () => {
    const { auth } = await import("@/lib/auth");
    vi.mocked(auth.api.getSession).mockResolvedValueOnce({
      user: { id: "user-1" },
    } as never);

    const { db } = await import("@/lib/db");
    const rows = [
      {
        id: "1",
        query: "strong coffee",
        saved: false,
        lookedUpAt: "2026-03-30T10:00:00.000Z",
        headword: "strong coffee",
        level: "A2",
        entryType: "collocation",
      },
    ];
    vi.mocked(db.select).mockReturnValueOnce({
      from: vi.fn(() => ({
        leftJoin: vi.fn(() => ({
          leftJoin: vi.fn(() => ({
            where: vi.fn(() => ({
              orderBy: vi.fn(() => ({
                limit: vi.fn(() => ({
                  offset: vi.fn().mockResolvedValue(rows),
                })),
              })),
            })),
          })),
        })),
      })),
    } as unknown as ReturnType<typeof db.select>);

    const { GET } = await import("@/app/api/vocabulary/route");
    const response = await GET(new Request("http://localhost/api/vocabulary"));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual([
      {
        id: "1",
        query: "strong coffee",
        saved: false,
        lookedUpAt: "2026-03-30T10:00:00.000Z",
        headword: "strong coffee",
        level: "A2",
        entryType: "word",
      },
    ]);
  });
});
