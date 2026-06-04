import { z } from "zod";

export const InlineAnnotationSchema = z.object({
  startIndex: z.number().int().min(0),
  endIndex: z.number().int().min(0),
  type: z.enum(["grammar", "vocabulary", "coherence"]),
  suggestion: z.string().min(1),
  explanation: z.string().min(1),
});

export const WritingFeedbackSchema = z.object({
  scores: z.object({
    grammar: z.number().min(0).max(5),
    vocabulary: z.number().min(0).max(5),
    organization: z.number().min(0).max(5),
    taskCompletion: z.number().min(0).max(5),
  }),
  overallScore: z.number().min(0).max(5),
  annotations: z.array(InlineAnnotationSchema),
  generalFeedback: z.string().min(10),
  generalFeedbackVi: z.string().min(10),
  improvedVersion: z.string().min(10),
});

export const PromptRequestSchema = z.object({
  category: z.enum(["sentence-picture", "email-response", "opinion-essay"]),
});

export const ReviewRequestSchema = z.object({
  prompt: z.string().min(1),
  category: z.enum(["sentence-picture", "email-response", "opinion-essay"]),
  text: z.string().min(10),
});
