import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("axios");

beforeEach(() => {
  vi.clearAllMocks();
  vi.resetModules();
});

afterEach(() => {
  vi.resetModules();
});

describe("GET /api/dictionary/suggestions", () => {
  it("returns empty suggestions for query shorter than 2 chars", async () => {
    const axios = await import("axios");
    const { GET } = await import("@/app/api/dictionary/suggestions/route");
    const response = await GET(
      new Request("http://localhost/api/dictionary/suggestions?q=t"),
    );
    expect(vi.mocked(axios.default.get)).not.toHaveBeenCalled();
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual({ suggestions: [] });
  });

  it("returns empty suggestions for invalid pattern", async () => {
    const axios = await import("axios");
    const { GET } = await import("@/app/api/dictionary/suggestions/route");
    const response = await GET(
      new Request("http://localhost/api/dictionary/suggestions?q=he@llo"),
    );
    expect(vi.mocked(axios.default.get)).not.toHaveBeenCalled();
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual({ suggestions: [] });
  });

  it("returns suggestions from Datamuse", async () => {
    const axios = await import("axios");
    vi.mocked(axios.default.get).mockResolvedValueOnce({
      data: [{ word: "take off" }, { word: "take on" }],
    });

    const { GET } = await import("@/app/api/dictionary/suggestions/route");
    const response = await GET(
      new Request("http://localhost/api/dictionary/suggestions?q=take"),
    );
    expect(vi.mocked(axios.default.get)).toHaveBeenCalledWith(
      "https://api.datamuse.com/sug",
      expect.objectContaining({ params: { s: "take", max: 8 } }),
    );
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual({ suggestions: ["take off", "take on"] });
  });

  it("returns empty suggestions when no q param is provided", async () => {
    const axios = await import("axios");
    const { GET } = await import("@/app/api/dictionary/suggestions/route");
    const response = await GET(
      new Request("http://localhost/api/dictionary/suggestions"),
    );
    expect(vi.mocked(axios.default.get)).not.toHaveBeenCalled();
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual({ suggestions: [] });
  });

  it("returns empty suggestions when Datamuse request fails", async () => {
    const axios = await import("axios");
    vi.mocked(axios.default.get).mockRejectedValueOnce(new Error("network error"));
    const { GET } = await import("@/app/api/dictionary/suggestions/route");
    const response = await GET(
      new Request("http://localhost/api/dictionary/suggestions?q=take"),
    );
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual({ suggestions: [] });
  });
});
