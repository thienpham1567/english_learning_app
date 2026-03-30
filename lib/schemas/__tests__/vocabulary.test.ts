import { describe, expect, it } from "vitest";
import { DictionarySenseSchema } from "@/lib/schemas/vocabulary";

describe("DictionarySenseSchema", () => {
  it("parses successfully when optional array fields are absent", () => {
    const result = DictionarySenseSchema.parse({
      id: "s1",
      label: "Sense 1",
      definitionVi: "Nghĩa",
      definitionEn: "Meaning",
      usageNoteVi: null,
      // synonyms, antonyms, examplesVi, examples all omitted — should default to []
      // patterns, relatedExpressions, commonMistakesVi omitted — should default to []
    });
    expect(result.synonyms).toEqual([]);
    expect(result.antonyms).toEqual([]);
    expect(result.patterns).toEqual([]);
    expect(result.relatedExpressions).toEqual([]);
    expect(result.commonMistakesVi).toEqual([]);
  });
});
