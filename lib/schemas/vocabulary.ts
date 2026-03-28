import { z } from "zod";

export const DictionarySenseSchema = z.object({
  id: z.string(),
  label: z.string(),
  definitionVi: z.string(),
  definitionEn: z.string(),
  usageNoteVi: z.string().nullable(),
  examplesVi: z.array(z.string()).default([]),
  examples: z
    .array(z.object({ en: z.string(), vi: z.string().optional() }))
    .default([]),
  synonyms: z.array(z.string()).default([]),
  patterns: z.array(z.string()),
  relatedExpressions: z.array(z.string()),
  commonMistakesVi: z.array(z.string()),
});

export const VocabularySchema = z.object({
  query: z.string(),
  headword: z.string(),
  entryType: z.enum(["word", "collocation", "phrasal_verb", "idiom"]),
  phonetic: z.string().nullable(),
  level: z.enum(["A1", "A2", "B1", "B2", "C1", "C2"]).nullable(),
  register: z.string().nullable(),
  overviewVi: z.string(),
  overviewEn: z.string(),
  senses: z.array(DictionarySenseSchema).min(1),
});

export type Vocabulary = z.infer<typeof VocabularySchema>;
export type DictionarySense = z.infer<typeof DictionarySenseSchema>;
