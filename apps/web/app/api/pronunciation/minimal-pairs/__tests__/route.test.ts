import { describe, expect, it } from "vitest";

import {
  aggregateWeakestContrasts,
  normalizeMinimalPairsPayload,
} from "../route";

describe("minimal pairs route helpers", () => {
  it("rejects malformed focusTags instead of storing arbitrary JSON", () => {
    const result = normalizeMinimalPairsPayload({
      mode: "listen",
      total: 10,
      correct: 7,
      focusTags: "th-s",
      tagStats: [{ tag: "th-s", total: 2, correct: 1 }],
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain("focusTags");
    }
  });

  it("normalizes known focus tags and per-tag stats", () => {
    const result = normalizeMinimalPairsPayload({
      mode: "listen",
      total: 10,
      correct: 7,
      focusTags: ["th-s", "unknown", "th-s"],
      tagStats: [
        { tag: "th-s", total: 2, correct: 1 },
        { tag: "l-r", total: 3, correct: 3 },
        { tag: "unknown", total: 9, correct: 0 },
      ],
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.focusTags).toEqual(["th-s"]);
      expect(result.value.tagStats).toEqual([
        { tag: "th-s", total: 2, correct: 1 },
        { tag: "l-r", total: 3, correct: 3 },
      ]);
    }
  });

  it("aggregates weakest contrasts from per-tag stats without double-counting mixed sessions", () => {
    const weakest = aggregateWeakestContrasts([
      {
        focusTags: ["th-s"],
        tagStats: [
          { tag: "th-s", total: 2, correct: 1 },
          { tag: "l-r", total: 3, correct: 3 },
        ],
      },
      {
        focusTags: ["v-w"],
        tagStats: [
          { tag: "th-s", total: 1, correct: 0 },
          { tag: "v-w", total: 2, correct: 1 },
        ],
      },
    ]);

    expect(weakest).toEqual([
      { tag: "th-s", total: 3, correct: 1, accuracy: 33 },
      { tag: "v-w", total: 2, correct: 1, accuracy: 50 },
      { tag: "l-r", total: 3, correct: 3, accuracy: 100 },
    ]);
  });
});
