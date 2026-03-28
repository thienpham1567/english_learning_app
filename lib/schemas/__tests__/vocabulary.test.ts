import { describe, expect, it } from "vitest";
import { DictionarySenseSchema } from "@/lib/schemas/vocabulary";

const baseSense = {
  id: "s1",
  label: "Nghĩa 1",
  definitionVi: "Cất cánh",
  definitionEn: "To leave the ground and begin flying.",
  usageNoteVi: null,
  patterns: [],
  relatedExpressions: [],
  commonMistakesVi: [],
};

describe("DictionarySenseSchema", () => {
  it("accepts bilingual examples and synonyms", () => {
    const sense = {
      ...baseSense,
      examples: [{ en: "The plane took off.", vi: "Máy bay cất cánh." }],
      synonyms: ["depart", "ascend"],
    };
    const result = DictionarySenseSchema.parse(sense);
    expect(result.examples).toHaveLength(1);
    expect(result.examples[0]).toEqual({
      en: "The plane took off.",
      vi: "Máy bay cất cánh.",
    });
    expect(result.synonyms).toEqual(["depart", "ascend"]);
  });

  it("defaults examples and synonyms to [] when absent (backward compat)", () => {
    const sense = {
      ...baseSense,
      examplesVi: ["Máy bay cất cánh.", "Chuyến bay cất cánh.", "Cất cánh lúc sáng."],
    };
    const result = DictionarySenseSchema.parse(sense);
    expect(result.examples).toEqual([]);
    expect(result.synonyms).toEqual([]);
  });

  it("defaults examplesVi to [] when absent", () => {
    const sense = {
      ...baseSense,
      examples: [{ en: "The plane took off.", vi: "Máy bay cất cánh." }],
    };
    const result = DictionarySenseSchema.parse(sense);
    expect(result.examplesVi).toEqual([]);
  });
});
