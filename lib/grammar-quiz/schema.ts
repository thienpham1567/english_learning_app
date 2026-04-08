import { z } from "zod";

export const GrammarQuestionSchema = z.object({
  stem: z.string().min(5),
  options: z.tuple([z.string(), z.string(), z.string(), z.string()]),
  correctIndex: z.number().int().min(0).max(3),
  explanation: z.string().min(10),
  grammarTopic: z.string().min(2),
});

export const QuizGenerationResponseSchema = z.object({
  questions: z.array(GrammarQuestionSchema).min(1).max(20),
});

export type QuizGenerationResponse = z.infer<typeof QuizGenerationResponseSchema>;
