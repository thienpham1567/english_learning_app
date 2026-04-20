import { describe, it, expect } from "vitest";

import { alignAndScore, tokenize, transcriptOverlap } from "@/lib/pronunciation/align";

describe("tokenize", () => {
  it("lowercases and strips punctuation", () => {
    expect(tokenize("Hello, World!")).toEqual(["hello", "world"]);
  });

  it("returns empty for all-punctuation input", () => {
    expect(tokenize("!!! ??")).toEqual([]);
  });
});

describe("alignAndScore", () => {
  it("gives 100 for exact match", () => {
    const r = alignAndScore("Hello world", "hello world");
    expect(r.overall).toBe(100);
    expect(r.wordScores.every((w) => w.status === "ok")).toBe(true);
  });

  it("marks missing word as missing with score 0", () => {
    const r = alignAndScore("I like coffee", "I coffee");
    const like = r.wordScores.find((w) => w.word === "like");
    expect(like?.status).toBe("missing");
    expect(like?.score).toBe(0);
  });

  it("catches a near-miss phoneme substitution", () => {
    // "ship" vs "sheep" — classic /ɪ/ vs /iː/ confusion, close but not exact
    const r = alignAndScore("I see a ship", "I see a sheep");
    const ship = r.wordScores.find((w) => w.word === "ship");
    expect(ship?.status === "slightly-off" || ship?.status === "wrong").toBe(true);
    expect(r.overall).toBeLessThan(100);
  });

  it("treats homophones as OK at phoneme level", () => {
    // "to" and "too" are homophones in CMUdict (T UW)
    const r = alignAndScore("I want to go", "I want too go");
    const to = r.wordScores.find((w) => w.word === "to");
    expect(to?.status).toBe("ok");
  });

  it("penalises fully wrong words", () => {
    const r = alignAndScore("I like apples", "I dance banana");
    expect(r.overall).toBeLessThan(50);
  });

  it("weights longer words more heavily in overall", () => {
    // Same number of correct/incorrect words but different lengths
    const short = alignAndScore("a b c", "a b x");
    const long = alignAndScore("hello world phonemes", "hello world xxxxxxxx");
    expect(long.overall).toBeLessThan(short.overall + 5);
  });

  it("empty reference produces overall 0", () => {
    const r = alignAndScore("", "anything");
    expect(r.overall).toBe(0);
  });
});

describe("transcriptOverlap", () => {
  it("returns 1 for full overlap", () => {
    expect(transcriptOverlap("the cat sat", "the cat sat on")).toBe(1);
  });

  it("returns 0 for completely different text", () => {
    expect(transcriptOverlap("hello world", "lorem ipsum")).toBe(0);
  });

  it("returns 0 for empty spoken", () => {
    expect(transcriptOverlap("hello world", "")).toBe(0);
  });
});
