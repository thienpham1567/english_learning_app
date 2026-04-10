import { describe, it, expect } from "vitest";
import { VocabularySchema, VerbFormSchema, normalizeVocabulary } from "@/lib/schemas/vocabulary";

const BASE_ENTRY = {
  query: "sustain",
  headword: "sustain",
  entryType: "word" as const,
  phonetic: null,
  phoneticsUs: "/səˈsteɪn/",
  phoneticsUk: "/səˈsteɪn/",
  partOfSpeech: "verb",
  level: "B2" as const,
  register: null,
  overviewVi: "Duy trì, chống đỡ",
  overviewEn: "To maintain or support over a period of time",
  senses: [
    {
      id: "s1",
      label: "Duy trì",
      definitionVi: "Giữ cho tiếp tục",
      definitionEn: "To keep going",
      usageNoteVi: null,
      examples: [{ en: "She sustained her effort.", vi: "Cô ấy duy trì nỗ lực." }],
      examplesVi: [],
      collocations: [],
      synonyms: ["maintain"],
      antonyms: ["abandon"],
      patterns: [],
      relatedExpressions: [],
      commonMistakesVi: [],
    },
  ],
};

describe("VerbFormSchema", () => {
  it("parses a valid verb form", () => {
    const form = VerbFormSchema.parse({
      label: "Past Simple",
      form: "sustained",
      phoneticsUs: "/səˈsteɪnd/",
      phoneticsUk: "/səˈsteɪnd/",
      isIrregular: false,
    });
    expect(form.label).toBe("Past Simple");
    expect(form.isIrregular).toBe(false);
  });

  it("allows null phonetics", () => {
    const form = VerbFormSchema.parse({
      label: "Infinitive",
      form: "go",
      phoneticsUs: null,
      phoneticsUk: null,
      isIrregular: false,
    });
    expect(form.phoneticsUs).toBeNull();
  });
});

describe("VocabularySchema with verbForms", () => {
  it("defaults verbForms to null when not provided", () => {
    const entry = VocabularySchema.parse(BASE_ENTRY);
    expect(entry.verbForms).toBeNull();
  });

  it("parses entry with verbForms array", () => {
    const entry = VocabularySchema.parse({
      ...BASE_ENTRY,
      verbForms: [
        {
          label: "Infinitive",
          form: "sustain",
          phoneticsUs: "/səˈsteɪn/",
          phoneticsUk: "/səˈsteɪn/",
          isIrregular: false,
        },
        {
          label: "Past Simple",
          form: "sustained",
          phoneticsUs: "/səˈsteɪnd/",
          phoneticsUk: "/səˈsteɪnd/",
          isIrregular: false,
        },
      ],
    });
    expect(entry.verbForms).toHaveLength(2);
    expect(entry.verbForms![0].form).toBe("sustain");
  });

  it("accepts explicit null verbForms", () => {
    const entry = VocabularySchema.parse({ ...BASE_ENTRY, verbForms: null });
    expect(entry.verbForms).toBeNull();
  });

  it("normalizeVocabulary handles legacy entries without verbForms", () => {
    const legacy = { ...BASE_ENTRY };
    const result = normalizeVocabulary(legacy);
    expect(result.verbForms).toBeNull();
  });
});
