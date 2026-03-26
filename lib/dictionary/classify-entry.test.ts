import { describe, expect, it } from "vitest";
import { classifyDictionaryEntry } from "@/lib/dictionary/classify-entry";

describe("classifyDictionaryEntry", () => {
  it("classifies a single token as a word", () => {
    expect(classifyDictionaryEntry("sustain")).toBe("word");
  });

  it("classifies a phrasal verb candidate", () => {
    expect(classifyDictionaryEntry("take off")).toBe("phrasal_verb");
  });
});
