import { z } from "zod";

export const VocabularySchema = z.object({
  word: z.string(),
  phonetic: z.string(),
  meaning: z.string(),
  example: z.string(),
  grammar_notes: z.array(z.string()),
  level: z.enum(["Dễ", "Trung bình", "Khó"]),
});

export type Vocabulary = z.infer<typeof VocabularySchema>;
