import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/headers", () => ({
  headers: vi.fn().mockResolvedValue(new Headers()),
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

const mockSelect = vi.fn();
const mockInsert = vi.fn();

vi.mock("@/lib/db", () => ({
  db: {
    select: mockSelect,
    insert: mockInsert,
  },
}));

vi.mock("@/lib/db/schema", () => ({
  conversation: {
    id: "id",
    title: "title",
    updatedAt: "updatedAt",
    personaId: "personaId",
    userId: "userId",
  },
}));

beforeEach(() => {
  vi.resetModules();
  mockSelect.mockReset();
  mockInsert.mockReset();
});

afterEach(() => {
  vi.resetModules();
});

describe("GET /api/conversations", () => {
  it("returns conversations including personaId", async () => {
    mockSelect.mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          orderBy: vi.fn().mockResolvedValue([
            {
              id: "conv-1",
              title: "Test",
              updatedAt: "2026-01-01T00:00:00Z",
              personaId: "simon",
            },
          ]),
        }),
      }),
    });

    const { GET } = await import("@/app/api/conversations/route");
    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data[0].personaId).toBe("simon");
  });
});

describe("POST /api/conversations", () => {
  it("stores the personaId when provided", async () => {
    const insertValues = vi.fn().mockReturnValue({
      returning: vi
        .fn()
        .mockResolvedValue([{ id: "conv-1", title: "Test", personaId: "christine" }]),
    });
    mockInsert.mockReturnValue({ values: insertValues });

    const { POST } = await import("@/app/api/conversations/route");
    const request = new Request("http://localhost/api/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Test", personaId: "christine" }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.personaId).toBe("christine");
    expect(insertValues).toHaveBeenCalledWith(expect.objectContaining({ personaId: "christine" }));
  });

  it("defaults personaId to 'simon' when omitted", async () => {
    const insertValues = vi.fn().mockReturnValue({
      returning: vi.fn().mockResolvedValue([{ id: "conv-1", title: "Test", personaId: "simon" }]),
    });
    mockInsert.mockReturnValue({ values: insertValues });

    const { POST } = await import("@/app/api/conversations/route");
    const request = new Request("http://localhost/api/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Test" }),
    });

    await POST(request);

    expect(insertValues).toHaveBeenCalledWith(expect.objectContaining({ personaId: "simon" }));
  });

  it("defaults personaId to 'simon' for unknown persona", async () => {
    const insertValues = vi.fn().mockReturnValue({
      returning: vi.fn().mockResolvedValue([{ id: "conv-1", title: "Test", personaId: "simon" }]),
    });
    mockInsert.mockReturnValue({ values: insertValues });

    const { POST } = await import("@/app/api/conversations/route");
    const request = new Request("http://localhost/api/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Test", personaId: "hacker" }),
    });

    await POST(request);

    expect(insertValues).toHaveBeenCalledWith(expect.objectContaining({ personaId: "simon" }));
  });
});
