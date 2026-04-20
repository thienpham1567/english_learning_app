import { describe, it, expect } from "vitest";

import {
  MINIMAL_PAIRS,
  CONTRAST_TAGS,
  getPairsByTag,
  getMissedContrastTags,
  pickRandomPairs,
  shuffle,
  summarizeMinimalPairAnswersByTag,
} from "@/lib/pronunciation/minimal-pairs";

describe("MINIMAL_PAIRS dataset (AC2)", () => {
  it("has at least 40 pairs", () => {
    expect(MINIMAL_PAIRS.length).toBeGreaterThanOrEqual(40);
  });

  it("covers at least 6 contrast tags", () => {
    expect(CONTRAST_TAGS.length).toBeGreaterThanOrEqual(6);
  });

  it("includes the required contrasts", () => {
    const required = ["short-long-i", "a-e", "th-s", "v-w", "l-r", "sh-s"];
    for (const tag of required) {
      expect(CONTRAST_TAGS).toContain(tag);
    }
  });

  it("each pair has all required fields", () => {
    for (const pair of MINIMAL_PAIRS) {
      expect(pair.a).toBeTruthy();
      expect(pair.b).toBeTruthy();
      expect(pair.contrast).toBeTruthy();
      expect(pair.tag).toBeTruthy();
      expect(pair.a).not.toEqual(pair.b);
    }
  });

  it("each contrast has at least 5 pairs", () => {
    for (const tag of CONTRAST_TAGS) {
      const pairs = getPairsByTag(tag);
      expect(pairs.length).toBeGreaterThanOrEqual(5);
    }
  });
});

describe("getPairsByTag", () => {
  it("returns only pairs matching the tag", () => {
    const pairs = getPairsByTag("short-long-i");
    expect(pairs.length).toBeGreaterThan(0);
    for (const p of pairs) {
      expect(p.tag).toBe("short-long-i");
    }
  });

  it("returns empty for unknown tag", () => {
    expect(getPairsByTag("nonexistent")).toEqual([]);
  });
});

describe("pickRandomPairs", () => {
  it("returns requested number of pairs", () => {
    const result = pickRandomPairs(5);
    expect(result).toHaveLength(5);
  });

  it("never exceeds available pairs", () => {
    const result = pickRandomPairs(999);
    expect(result.length).toBeLessThanOrEqual(MINIMAL_PAIRS.length);
  });

  it("filters by focus tags when provided", () => {
    const result = pickRandomPairs(3, ["th-s"]);
    for (const p of result) {
      expect(p.tag).toBe("th-s");
    }
  });

  it("fills a focused 10-question session even when the tag pool is smaller", () => {
    const result = pickRandomPairs(10, ["th-s"]);
    expect(result).toHaveLength(10);
    for (const p of result) {
      expect(p.tag).toBe("th-s");
    }
  });

  it("returns empty when focus tags match nothing", () => {
    const result = pickRandomPairs(5, ["nonexistent"]);
    expect(result).toHaveLength(0);
  });
});

describe("shuffle", () => {
  it("returns same length array", () => {
    const arr = [1, 2, 3, 4, 5];
    expect(shuffle(arr)).toHaveLength(5);
  });

  it("contains all original elements", () => {
    const arr = [1, 2, 3, 4, 5];
    const shuffled = shuffle(arr);
    expect(shuffled.sort()).toEqual([1, 2, 3, 4, 5]);
  });

  it("does not mutate the original array", () => {
    const arr = [1, 2, 3];
    const original = [...arr];
    shuffle(arr);
    expect(arr).toEqual(original);
  });
});

describe("minimal pair answer summaries", () => {
  it("summarizes totals and correct counts independently per tag", () => {
    const thPair = getPairsByTag("th-s")[0]!;
    const lrPair = getPairsByTag("l-r")[0]!;

    expect(summarizeMinimalPairAnswersByTag([
      { pair: thPair, correct: false },
      { pair: thPair, correct: true },
      { pair: lrPair, correct: true },
    ])).toEqual([
      { tag: "th-s", total: 2, correct: 1 },
      { tag: "l-r", total: 1, correct: 1 },
    ]);
  });

  it("returns only missed contrast tags for the focus queue", () => {
    const thPair = getPairsByTag("th-s")[0]!;
    const lrPair = getPairsByTag("l-r")[0]!;

    expect(getMissedContrastTags([
      { pair: thPair, correct: false },
      { pair: lrPair, correct: true },
      { pair: thPair, correct: false },
    ])).toEqual(["th-s"]);
  });
});
