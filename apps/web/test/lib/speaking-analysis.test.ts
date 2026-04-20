import { describe, it, expect } from "vitest";

import { detectFillers, calculateWpm, WPM_TARGETS } from "@/lib/speaking/analysis";

describe("detectFillers", () => {
  it("counts basic filler words", () => {
    const r = detectFillers("I um think that uh this is um good");
    expect(r.fillerCount).toBe(3);
    expect(r.fillers).toContainEqual({ filler: "um", count: 2 });
    expect(r.fillers).toContainEqual({ filler: "uh", count: 1 });
  });

  it("counts multi-word fillers", () => {
    const r = detectFillers("I you know sort of kind of like it");
    expect(r.fillerCount).toBe(4); // you know, sort of, kind of, like
  });

  it("is case-insensitive", () => {
    const r = detectFillers("UM Uh Like BASICALLY");
    expect(r.fillerCount).toBe(4);
  });

  it("returns 0 for clean speech", () => {
    const r = detectFillers("I think this is a great idea because it solves the problem");
    expect(r.fillerCount).toBe(0);
    expect(r.fillers).toEqual([]);
  });

  it("respects word boundaries", () => {
    // "umbrella" contains "um" but shouldn't match
    const r = detectFillers("I have an umbrella");
    expect(r.fillerCount).toBe(0);
  });

  it("handles empty string", () => {
    const r = detectFillers("");
    expect(r.fillerCount).toBe(0);
  });
});

describe("calculateWpm", () => {
  it("calculates correct WPM for 60s", () => {
    const transcript = Array(120).fill("word").join(" "); // 120 words
    const wpm = calculateWpm(transcript, 60_000); // 60 seconds
    expect(wpm).toBe(120);
  });

  it("calculates correct WPM for 90s", () => {
    const transcript = Array(150).fill("word").join(" "); // 150 words
    const wpm = calculateWpm(transcript, 90_000); // 90 seconds
    expect(wpm).toBe(100);
  });

  it("returns 0 for zero duration", () => {
    expect(calculateWpm("hello world", 0)).toBe(0);
  });

  it("returns 0 for empty transcript", () => {
    expect(calculateWpm("", 60_000)).toBe(0);
  });

  it("handles very short duration", () => {
    const wpm = calculateWpm("one two three", 1000); // 1 second
    expect(wpm).toBe(180); // 3 words * 60
  });
});

describe("WPM_TARGETS", () => {
  it("has entries for all CEFR levels", () => {
    expect(WPM_TARGETS).toHaveProperty("a2");
    expect(WPM_TARGETS).toHaveProperty("b1");
    expect(WPM_TARGETS).toHaveProperty("b2");
    expect(WPM_TARGETS).toHaveProperty("c1");
  });

  it("has increasing min values", () => {
    expect(WPM_TARGETS.a2.min).toBeLessThan(WPM_TARGETS.b1.min);
    expect(WPM_TARGETS.b1.min).toBeLessThan(WPM_TARGETS.b2.min);
    expect(WPM_TARGETS.b2.min).toBeLessThan(WPM_TARGETS.c1.min);
  });
});
