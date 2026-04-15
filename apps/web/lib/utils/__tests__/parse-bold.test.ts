import { describe, expect, it } from "vitest";
import { parseBold } from "@/lib/utils/parse-bold";

describe("parseBold", () => {
  it("returns a single plain segment for text without markers", () => {
    expect(parseBold("hello world")).toEqual([{ text: "hello world", bold: false }]);
  });

  it("returns an empty array for empty string", () => {
    expect(parseBold("")).toEqual([]);
  });

  it("parses a single bold word at the start", () => {
    expect(parseBold("**make** a decision")).toEqual([
      { text: "make", bold: true },
      { text: " a decision", bold: false },
    ]);
  });

  it("parses a bold word in the middle", () => {
    expect(parseBold("She **took** the plane off")).toEqual([
      { text: "She ", bold: false },
      { text: "took", bold: true },
      { text: " the plane off", bold: false },
    ]);
  });

  it("parses multiple bold words", () => {
    expect(parseBold("She **took** the plane **off**")).toEqual([
      { text: "She ", bold: false },
      { text: "took", bold: true },
      { text: " the plane ", bold: false },
      { text: "off", bold: true },
    ]);
  });

  it("treats an unmatched ** as plain text", () => {
    const result = parseBold("hello ** world");
    expect(result.every((s) => !s.bold)).toBe(true);
  });

  it("skips empty segments", () => {
    const result = parseBold("**bold**");
    expect(result).toEqual([{ text: "bold", bold: true }]);
  });
});
