import { describe, expect, it } from "vitest";
import { buildDictionaryInstructions } from "@/lib/dictionary/prompt";

describe("buildDictionaryInstructions", () => {
  it("instructs bilingual example pairs — not Vietnamese only", () => {
    const instructions = buildDictionaryInstructions("word");
    expect(instructions).toContain("bilingual pair");
    expect(instructions).not.toContain("Vietnamese only");
  });

  it("instructs generating synonyms per sense", () => {
    const instructions = buildDictionaryInstructions("idiom");
    expect(instructions).toContain("synonyms");
  });

  it("includes the entry type in the instructions string", () => {
    expect(buildDictionaryInstructions("phrasal_verb")).toContain("phrasal_verb");
    expect(buildDictionaryInstructions("collocation")).toContain("collocation");
  });

  it("instructs populating US and UK IPA phonetics", () => {
    const instructions = buildDictionaryInstructions("word");
    expect(instructions).toContain("phoneticsUs");
    expect(instructions).toContain("phoneticsUk");
  });

  it("instructs populating partOfSpeech", () => {
    const instructions = buildDictionaryInstructions("word");
    expect(instructions).toContain("partOfSpeech");
  });
});
