import { describe, it, expect } from "vitest";
import { deriveTitle } from "../derive-title";

describe("deriveTitle", () => {
  it("returns the text unchanged when 60 chars or fewer", () => {
    expect(deriveTitle("Hello world")).toBe("Hello world");
  });

  it("returns exactly 60 chars unchanged", () => {
    const exact = "a".repeat(60);
    expect(deriveTitle(exact)).toBe(exact);
  });

  it("truncates to 60 chars and appends ellipsis when over 60", () => {
    const long = "a".repeat(80);
    const result = deriveTitle(long);
    expect(result).toBe("a".repeat(60) + "…");
  });

  it("trims leading and trailing whitespace before measuring", () => {
    expect(deriveTitle("  hello  ")).toBe("hello");
  });

  it("trims trailing whitespace before appending ellipsis", () => {
    const text = "a".repeat(58) + " " + "b".repeat(10);
    const result = deriveTitle(text);
    expect(result.endsWith("…")).toBe(true);
    expect(result.slice(0, -1).trimEnd()).toBe(result.slice(0, -1));
  });
});
