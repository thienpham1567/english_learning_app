import { describe, expect, it } from "vitest";
import { normalizeDictionaryQuery } from "@/lib/dictionary/normalize-query";

describe("normalizeDictionaryQuery", () => {
  it("collapses repeated whitespace", () => {
    expect(normalizeDictionaryQuery("  take   off  ")).toEqual({
      normalized: "take off",
      cacheKey: "take off",
    });
  });

  it("normalizes uppercase input and lowercases cacheKey", () => {
    expect(normalizeDictionaryQuery("Take Off")).toEqual({
      normalized: "Take Off",
      cacheKey: "take off",
    });
  });
});
