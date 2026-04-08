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
    taskResponse: z.number().min(1).max(9),
    coherenceCohesion: z.number().min(1).max(9),
    lexicalResource: z.number().min(1).max(9),
    grammaticalRange: z.number().min(1).max(9),
  }),
  overallBand: z.number().min(1).max(9),
  annotations: z.array(InlineAnnotationSchema),
  generalFeedback: z.string().min(10),
  generalFeedbackVi: z.string().min(10),
  improvedVersion: z.string().min(10),
});

export const PromptRequestSchema = z.object({
  category: z.enum(["ielts-task-1", "ielts-task-2", "email", "free"]),
});

export const ReviewRequestSchema = z.object({
  prompt: z.string().min(1),
  category: z.enum(["ielts-task-1", "ielts-task-2", "email", "free"]),
  text: z.string().min(10),
});
