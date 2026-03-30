import { describe, expect, it } from "vitest";
import { DictionarySenseSchema, VocabularySchema } from "@/lib/schemas/vocabulary";

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
    expect(result.collocations).toEqual([]);
  });

  it("parses an actual bilingual collocation item", () => {
    const result = DictionarySenseSchema.parse({
      id: "s2",
      label: "Sense 2",
      definitionVi: "Nghĩa",
      definitionEn: "Meaning",
      usageNoteVi: null,
      collocations: [{ en: "strong coffee", vi: "cà phê đậm" }],
    });

    expect(result.collocations).toEqual([
      { en: "strong coffee", vi: "cà phê đậm" },
    ]);
  });
});

describe("VocabularySchema", () => {
  it.each(["word", "phrasal_verb", "idiom"] as const)(
    "parses allowed entry type %s",
    (entryType) => {
      const result = VocabularySchema.parse({
        query: "strong coffee",
        headword: "strong coffee",
        entryType,
        phonetic: null,
        phoneticsUs: null,
        phoneticsUk: null,
        partOfSpeech: null,
        level: null,
        register: null,
        overviewVi: "Nghĩa",
        overviewEn: "Meaning",
        senses: [
          {
            id: "s1",
            label: "Sense 1",
            definitionVi: "Nghĩa",
            definitionEn: "Meaning",
            usageNoteVi: null,
          },
        ],
      });

      expect(result.entryType).toBe(entryType);
    }
  );

  it("rejects collocation as an entry type", () => {
    expect(() =>
      VocabularySchema.parse({
        query: "strong coffee",
        headword: "strong coffee",
        entryType: "collocation",
        phonetic: null,
        phoneticsUs: null,
        phoneticsUk: null,
        partOfSpeech: null,
        level: null,
        register: null,
        overviewVi: "Nghĩa",
        overviewEn: "Meaning",
        senses: [
          {
            id: "s1",
            label: "Sense 1",
            definitionVi: "Nghĩa",
            definitionEn: "Meaning",
            usageNoteVi: null,
          },
        ],
      })
    ).toThrow();
  });
});
