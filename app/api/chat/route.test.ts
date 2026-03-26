import { describe, expect, it, vi } from "vitest";

describe("openai config", () => {
  it("throws when OPENAI_API_KEY is missing", async () => {
    vi.resetModules();
    delete process.env.OPENAI_API_KEY;

    await expect(import("@/lib/openai/config")).rejects.toThrow(
      "Missing OPENAI_API_KEY",
    );
  });
});
