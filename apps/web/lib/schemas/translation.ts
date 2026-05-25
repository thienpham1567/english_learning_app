import { z } from "zod";

export const TranslationSchema = z.object({
  translation: z.string(),
  keyVocabulary: z
    .array(
      z.object({
        word: z.string(),
        meaning: z.string(),
      })
    )
    .default([]),
});

export type TranslationResponse = z.infer<typeof TranslationSchema>;
