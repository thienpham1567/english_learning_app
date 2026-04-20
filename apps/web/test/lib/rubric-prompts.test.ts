import { describe, it, expect } from "vitest";

import {
  buildScoringPrompt,
  countWords,
  MIN_WORD_COUNT,
  MAX_WORD_COUNT,
  EXAM_LABELS,
  SCORE_RANGES,
  type ExamVariant,
} from "@/lib/writing/rubric-prompts";

describe("countWords", () => {
  it("counts basic words", () => {
    expect(countWords("hello world foo bar")).toBe(4);
  });

  it("handles multiple spaces", () => {
    expect(countWords("hello   world   foo")).toBe(3);
  });

  it("handles newlines and tabs", () => {
    expect(countWords("hello\nworld\tfoo")).toBe(3);
  });

  it("returns 0 for empty string", () => {
    expect(countWords("")).toBe(0);
    expect(countWords("   ")).toBe(0);
  });

  it("handles a 200-word essay", () => {
    const essay = Array(200).fill("word").join(" ");
    expect(countWords(essay)).toBe(200);
  });
});

describe("MIN_WORD_COUNT / MAX_WORD_COUNT", () => {
  it("minimum is 150", () => {
    expect(MIN_WORD_COUNT).toBe(150);
  });

  it("maximum is 2000", () => {
    expect(MAX_WORD_COUNT).toBe(2000);
  });
});

describe("EXAM_LABELS", () => {
  it("has labels for all exam variants", () => {
    const variants: ExamVariant[] = ["ielts-task2", "ielts-task1", "toefl-independent"];
    for (const v of variants) {
      expect(EXAM_LABELS[v]).toBeTruthy();
    }
  });
});

describe("SCORE_RANGES", () => {
  it("IELTS uses 1-9 scale with 0.5 step", () => {
    expect(SCORE_RANGES["ielts-task2"]).toEqual({ min: 1, max: 9, step: 0.5 });
    expect(SCORE_RANGES["ielts-task1"]).toEqual({ min: 1, max: 9, step: 0.5 });
  });

  it("TOEFL uses 1-30 scale with 1 step", () => {
    expect(SCORE_RANGES["toefl-independent"]).toEqual({ min: 1, max: 30, step: 1 });
  });
});

describe("buildScoringPrompt", () => {
  it("returns system and user prompts", () => {
    const result = buildScoringPrompt("ielts-task2", "Some essay text here.");
    expect(result.system).toBeTruthy();
    expect(result.user).toContain("Some essay text here.");
  });

  it("includes exam type in system prompt", () => {
    const result = buildScoringPrompt("ielts-task2", "text");
    expect(result.system).toContain("IELTS");
    expect(result.system).toContain("Task 2");
  });

  it("includes TOEFL context for TOEFL variant", () => {
    const result = buildScoringPrompt("toefl-independent", "text");
    expect(result.system).toContain("TOEFL");
  });

  it("includes prompt in user message when provided", () => {
    const result = buildScoringPrompt("ielts-task2", "essay", "Some prompt here");
    expect(result.user).toContain("Some prompt here");
  });

  it("omits prompt from user message when not provided", () => {
    const result = buildScoringPrompt("ielts-task2", "essay");
    expect(result.user).not.toContain("Prompt:");
  });

  it("includes target score in user message when provided (IELTS)", () => {
    const result = buildScoringPrompt("ielts-task2", "essay", undefined, 7);
    expect(result.user).toContain("7");
    expect(result.user).toContain("Target band");
  });

  it("uses 'Target score' label for TOEFL", () => {
    const result = buildScoringPrompt("toefl-independent", "essay", undefined, 24);
    expect(result.user).toContain("24");
    expect(result.user).toContain("Target score");
    expect(result.user).not.toContain("Target band");
  });

  it("system prompt contains JSON schema", () => {
    const result = buildScoringPrompt("ielts-task2", "text");
    expect(result.system).toContain("taskResponse");
    expect(result.system).toContain("inlineIssues");
    expect(result.system).toContain("strengths");
    expect(result.system).toContain("nextSteps");
  });

  it("system prompt contains self-check instruction", () => {
    const result = buildScoringPrompt("ielts-task2", "text");
    expect(result.system).toContain("self-check");
  });

  it("IELTS Task 1 prompt mentions report/letter", () => {
    const result = buildScoringPrompt("ielts-task1", "text");
    expect(result.system).toContain("Task 1");
  });

  it("includes vocab bank terms when provided", () => {
    const vocabBank = [{ term: "mitigate" }, { term: "exacerbate" }];
    const result = buildScoringPrompt("ielts-task2", "essay", undefined, undefined, vocabBank);
    expect(result.user).toContain("Vocab Bank");
    expect(result.user).toContain("mitigate");
    expect(result.user).toContain("exacerbate");
  });

  it("omits vocab bank section when not provided", () => {
    const result = buildScoringPrompt("ielts-task2", "essay");
    expect(result.user).not.toContain("Vocab Bank");
  });
});
