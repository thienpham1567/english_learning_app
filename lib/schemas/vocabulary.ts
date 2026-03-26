import { z } from "zod";

export const DictionarySenseSchema = z.object({
  id: z.string(),
  label: z.string(),
  definitionVi: z.string(),
  definitionEn: z.string(),
  usageNoteVi: z.string().optional(),
  examplesVi: z.array(z.string()).min(3).max(5),
  patterns: z.array(z.string()).default([]),
  relatedExpressions: z.array(z.string()).default([]),
  commonMistakesVi: z.array(z.string()).default([]),
});

export const VocabularySchema = z.object({
  query: z.string(),
  headword: z.string(),
  entryType: z.enum(["word", "collocation", "phrasal_verb", "idiom"]),
  phonetic: z.string().optional(),
  level: z.enum(["A1", "A2", "B1", "B2", "C1", "C2"]).optional(),
  register: z.string().optional(),
  overviewVi: z.string(),
  overviewEn: z.string(),
  senses: z.array(DictionarySenseSchema).min(1),
});

export type Vocabulary = z.infer<typeof VocabularySchema>;
export type DictionarySense = z.infer<typeof DictionarySenseSchema>;
