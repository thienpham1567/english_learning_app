import { z } from "zod";

export const FillInBlankSchema = z.object({
  type: z.literal("fill-in-blank"),
  instruction: z.string(),
  data: z.object({
    sentence: z.string(),
    options: z.tuple([z.string(), z.string(), z.string(), z.string()]),
    correctIndex: z.number().int().min(0).max(3),
  }),
});

export const SentenceOrderSchema = z.object({
  type: z.literal("sentence-order"),
  instruction: z.string(),
  data: z.object({
    scrambled: z.array(z.string()).min(3),
    correctOrder: z.array(z.string()).min(3),
  }),
});

export const TranslationSchema = z.object({
  type: z.literal("translation"),
  instruction: z.string(),
  data: z.object({
    vietnamese: z.string(),
    acceptableAnswers: z.array(z.string()).min(1),
  }),
});

export const ErrorCorrectionSchema = z.object({
  type: z.literal("error-correction"),
  instruction: z.string(),
  data: z.object({
    sentence: z.string(),
    errorWord: z.string(),
    correction: z.string(),
    explanation: z.string(),
  }),
});

export const ExerciseSchema = z.discriminatedUnion("type", [
  FillInBlankSchema,
  SentenceOrderSchema,
  TranslationSchema,
  ErrorCorrectionSchema,
]);

export const ChallengeGenerationSchema = z.object({
  exercises: z.array(ExerciseSchema).length(5),
});

export const SubmitAnswerSchema = z.object({
  answers: z.array(
    z.object({
      exerciseIndex: z.number().int().min(0).max(4),
      answer: z.string().min(1),
    }),
  ).min(1).max(5),
  timeElapsedMs: z.number().int().min(0),
});
