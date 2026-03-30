import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/headers", () => ({
  headers: vi.fn().mockResolvedValue({}),
}));

vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      getSession: vi.fn().mockResolvedValue({
        user: { id: "user-1" },
      }),
    },
  },
}));

const mockReturning = vi.fn().mockResolvedValue([
  { id: "row-1", query: "take off", saved: true },
]);
const mockWhere = vi.fn(() => ({ returning: mockReturning }));
const mockSet = vi.fn(() => ({ where: mockWhere }));
const mockUpdate = vi.fn(() => ({ set: mockSet }));

vi.mock("@/lib/db", () => ({
  db: { update: mockUpdate },
}));

vi.mock("@/lib/db/schema", () => ({
  userVocabulary: { userId: "userId", query: "query", saved: "saved", id: "id" },
}));

vi.mock("drizzle-orm", () => ({
  and: (...args: unknown[]) => ({ and: args }),
  eq: (col: unknown, val: unknown) => ({ eq: [col, val] }),
}));

describe("PATCH /api/vocabulary/[query]/saved", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("decodes a URL-encoded query parameter before querying the DB", async () => {
    const { PATCH } = await import("@/app/api/vocabulary/[query]/saved/route");

    const req = new Request("http://localhost", {
      method: "PATCH",
      body: JSON.stringify({ saved: true }),
      headers: { "Content-Type": "application/json" },
    });

    await PATCH(req, { params: Promise.resolve({ query: "take%20off" }) });

    // The eq() call for the query column must use the decoded value "take off"
    const whereArg = mockWhere.mock.calls[0][0];
    const conditions = (whereArg as { and: { eq: unknown[] }[] }).and;
    const queryCondition = conditions.find((c) => c.eq[1] === "take off");
    expect(queryCondition).toBeDefined();
  });

  it("returns 404 when no row is matched", async () => {
    mockReturning.mockResolvedValueOnce([]);
    const { PATCH } = await import("@/app/api/vocabulary/[query]/saved/route");

    const req = new Request("http://localhost", {
      method: "PATCH",
      body: JSON.stringify({ saved: false }),
      headers: { "Content-Type": "application/json" },
    });

    const res = await PATCH(req, { params: Promise.resolve({ query: "run" }) });
    expect(res.status).toBe(404);
  });

  it("returns 401 when unauthenticated", async () => {
    const { auth } = await import("@/lib/auth");
    vi.mocked(auth.api.getSession).mockResolvedValueOnce(null);

    const { PATCH } = await import("@/app/api/vocabulary/[query]/saved/route");
    const req = new Request("http://localhost", {
      method: "PATCH",
      body: JSON.stringify({ saved: true }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await PATCH(req, { params: Promise.resolve({ query: "run" }) });
    expect(res.status).toBe(401);
  });
});
