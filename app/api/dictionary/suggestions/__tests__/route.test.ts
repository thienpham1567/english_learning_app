import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db", () => ({
  db: {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          orderBy: vi.fn(() => ({
            limit: vi.fn().mockResolvedValue([]),
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

describe("GET /api/dictionary/suggestions", () => {
  it("returns empty suggestions for query shorter than 2 chars", async () => {
    const { GET } = await import("@/app/api/dictionary/suggestions/route");
    const response = await GET(
      new Request("http://localhost/api/dictionary/suggestions?q=t"),
    );
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual({ suggestions: [] });
  });

  it("returns empty suggestions for invalid pattern", async () => {
    const { GET } = await import("@/app/api/dictionary/suggestions/route");
    const response = await GET(
      new Request("http://localhost/api/dictionary/suggestions?q=he@llo"),
    );
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual({ suggestions: [] });
  });

  it("returns matching suggestions from vocabularyCache", async () => {
    const { db } = await import("@/lib/db");
    vi.mocked(db.select).mockReturnValueOnce({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          orderBy: vi.fn(() => ({
            limit: vi.fn().mockResolvedValue([
              { query: "take off" },
              { query: "take on" },
            ]),
          })),
        })),
      })),
    } as ReturnType<typeof db.select>);

    const { GET } = await import("@/app/api/dictionary/suggestions/route");
    const response = await GET(
      new Request("http://localhost/api/dictionary/suggestions?q=take"),
    );
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual({ suggestions: ["take off", "take on"] });
  });

  it("returns empty suggestions when no q param is provided", async () => {
    const { GET } = await import("@/app/api/dictionary/suggestions/route");
    const response = await GET(
      new Request("http://localhost/api/dictionary/suggestions"),
    );
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual({ suggestions: [] });
  });
});
