import { describe, it, expect } from "vitest";
import { computeSm2, defaultSm2State } from "../sm2";
import type { Sm2State } from "../types";

describe("defaultSm2State", () => {
  it("returns correct defaults", () => {
    const state = defaultSm2State();
    expect(state.easeFactor).toBe(2.5);
    expect(state.interval).toBe(0);
    expect(state.repetitions).toBe(0);
    expect(new Date(state.nextReview).getTime()).toBeLessThanOrEqual(Date.now());
  });
});

describe("computeSm2", () => {
  const base: Sm2State = {
    easeFactor: 2.5,
    interval: 0,
    repetitions: 0,
    nextReview: new Date().toISOString(),
  };

  it("first successful review (quality=3) gives interval=1, rep=1", () => {
    const next = computeSm2(base, 3);
    expect(next.repetitions).toBe(1);
    expect(next.interval).toBe(1);
    expect(next.easeFactor).toBeCloseTo(2.36, 1);
  });

  it("second successful review (quality=3) gives interval=6, rep=2", () => {
    const afterFirst = computeSm2(base, 3);
    const next = computeSm2(afterFirst, 3);
    expect(next.repetitions).toBe(2);
    expect(next.interval).toBe(6);
  });

  it("third successful review multiplies interval by easeFactor", () => {
    let state = base;
    state = computeSm2(state, 4); // rep=1, interval=1
    state = computeSm2(state, 4); // rep=2, interval=6
    const next = computeSm2(state, 4); // rep=3, interval = round(6 * EF)
    expect(next.repetitions).toBe(3);
    expect(next.interval).toBe(Math.round(6 * next.easeFactor));
  });

  it("failed recall (quality=0) resets repetitions and interval to 0", () => {
    const reviewed: Sm2State = {
      easeFactor: 2.5,
      interval: 6,
      repetitions: 2,
      nextReview: new Date().toISOString(),
    };
    const next = computeSm2(reviewed, 0);
    expect(next.repetitions).toBe(0);
    expect(next.interval).toBe(0);
  });

  it("failed recall (quality=2) also resets", () => {
    const reviewed: Sm2State = {
      easeFactor: 2.5,
      interval: 6,
      repetitions: 2,
      nextReview: new Date().toISOString(),
    };
    const next = computeSm2(reviewed, 2);
    expect(next.repetitions).toBe(0);
    expect(next.interval).toBe(0);
  });

  it("easy rating (quality=5) increases ease factor", () => {
    const next = computeSm2(base, 5);
    expect(next.easeFactor).toBe(2.6);
    expect(next.repetitions).toBe(1);
  });

  it("ease factor never drops below 1.3", () => {
    let state = base;
    // Repeatedly fail to drive easeFactor down
    for (let i = 0; i < 20; i++) {
      state = computeSm2(state, 0);
    }
    expect(state.easeFactor).toBeGreaterThanOrEqual(1.3);
  });

  it("quality is clamped between 0 and 5", () => {
    const next = computeSm2(base, 10);
    // quality clamped to 5
    expect(next.easeFactor).toBe(2.6);

    const next2 = computeSm2(base, -3);
    // quality clamped to 0
    expect(next2.repetitions).toBe(0);
  });

  it("nextReview advances by interval days", () => {
    const now = Date.now();
    const next = computeSm2(base, 5); // interval should be 1
    const reviewDate = new Date(next.nextReview).getTime();
    // Should be approximately 1 day from now (within 5 seconds tolerance)
    const oneDayMs = 24 * 60 * 60 * 1000;
    expect(reviewDate).toBeGreaterThan(now + oneDayMs - 5000);
    expect(reviewDate).toBeLessThan(now + oneDayMs + 5000);
  });
});
