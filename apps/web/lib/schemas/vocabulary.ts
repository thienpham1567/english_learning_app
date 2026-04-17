import { z } from "zod";

export const VocabularyEntryTypeSchema = z.enum(["word", "phrasal_verb", "idiom"]);

export const VerbFormSchema = z.object({
  label: z.string(),
  form: z.string(),
  phoneticsUs: z.string().nullable(),
  phoneticsUk: z.string().nullable(),
  isIrregular: z.boolean(),
});

export const DictionarySenseSchema = z.object({
  id: z.string(),
  label: z.string(),
  definitionEn: z.string(),
  usageNoteVi: z.string().nullable(),
  examplesVi: z.array(z.string()).default([]),
  examples: z.array(z.object({ en: z.string(), vi: z.string() })).default([]),
  collocations: z.array(z.object({ en: z.string(), vi: z.string() })).default([]),
  synonyms: z.array(z.string()).default([]),
  antonyms: z.array(z.string()).default([]),
  patterns: z.array(z.string()).default([]),
  relatedExpressions: z.array(z.string()).default([]),
  commonMistakesVi: z.array(z.string()).default([]),
});

export const NumberInfoSchema = z.object({
  plural: z.string().nullable(),
  isUncountable: z.boolean(),
  isPluralOnly: z.boolean(),
  isSingularOnly: z.boolean(),
});

export const VocabularySchema = z.object({
  query: z.string(),
  headword: z.string(),
  entryType: VocabularyEntryTypeSchema,
  phonetic: z.string().nullable(),
  phoneticsUs: z.string().nullable(),
  phoneticsUk: z.string().nullable(),
  partOfSpeech: z.string().nullable(),
  level: z.enum(["A1", "A2", "B1", "B2", "C1", "C2"]).nullable(),
  register: z.string().nullable(),
  verbForms: z.array(VerbFormSchema).nullable().default(null),
  numberInfo: NumberInfoSchema.nullable().default(null),
  frequencyBand: z.enum(["top1k", "top3k", "top5k", "top10k", "rare"]).nullable().default(null),
  wordFamily: z
    .array(z.object({ pos: z.string(), words: z.array(z.string()) }))
    .nullable()
    .default(null),
  isNotEnglish: z.boolean().default(false),
  senses: z.array(DictionarySenseSchema).min(1),
});

export const VocabularyWithNearbySchema = VocabularySchema.extend({
  nearbyWords: z.array(z.string()).default([]),
});

export type Vocabulary = z.infer<typeof VocabularySchema>;
export type VocabularyWithNearby = z.infer<typeof VocabularyWithNearbySchema>;
export type DictionarySense = z.infer<typeof DictionarySenseSchema>;
export type VerbForm = z.infer<typeof VerbFormSchema>;
export type FrequencyBand = "top1k" | "top3k" | "top5k" | "top10k" | "rare";
export type WordFamilyGroup = { pos: string; words: string[] };

export function normalizeVocabularyEntryType(
  entryType: string | null | undefined,
): Vocabulary["entryType"] | null {
  if (!entryType) return null;

  const normalized = entryType === "collocation" ? "word" : entryType;
  const parsed = VocabularyEntryTypeSchema.safeParse(normalized);
  return parsed.success ? parsed.data : null;
}

export function normalizeVocabulary(value: unknown): Vocabulary {
  if (typeof value !== "object" || value === null) {
    return VocabularySchema.parse(value);
  }

  const entry = value as Record<string, unknown>;
  const normalizedEntryType = normalizeVocabularyEntryType(
    typeof entry.entryType === "string" ? entry.entryType : null,
  );

  return VocabularySchema.parse({
    ...entry,
    ...(normalizedEntryType ? { entryType: normalizedEntryType } : {}),
  });
}
