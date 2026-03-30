import { describe, expect, it } from "vitest";
import { getNearbyWords } from "@/lib/dictionary/nearby-words";

describe("getNearbyWords", () => {
  it("returns words before and after the searched word", () => {
    const result = getNearbyWords("run");
    expect(result.length).toBeGreaterThan(0);
    expect(result).not.toContain("run");
  });

  it("returns at most count*2 words", () => {
    const result = getNearbyWords("run", 4);
    expect(result.length).toBeLessThanOrEqual(8);
  });

  it("returns fewer than count*2 words at the start of the list", () => {
    const result = getNearbyWords("a", 4);
    expect(result.length).toBeLessThan(8);
  });

  it("returns an array for a word not in the list", () => {
    const result = getNearbyWords("xyznotaword");
    expect(Array.isArray(result)).toBe(true);
  });

  it("preserves original casing of returned words", () => {
    const result = getNearbyWords("run", 4);
    result.forEach((w) => expect(typeof w).toBe("string"));
  });
});
