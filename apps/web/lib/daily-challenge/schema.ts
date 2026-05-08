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

export const WordFormationSchema = z.object({
  type: z.literal("word-formation"),
  instruction: z.string(),
  data: z.object({
    sentence: z.string(),
    rootWord: z.string(),
    correctAnswer: z.string(),
    options: z.tuple([z.string(), z.string(), z.string(), z.string()]),
    correctIndex: z.number().int().min(0).max(3),
  }),
});

export const DialogueCompletionSchema = z.object({
  type: z.literal("dialogue-completion"),
  instruction: z.string(),
  data: z.object({
    context: z.string(),
    dialogue: z.array(z.object({ speaker: z.string(), text: z.string() })).min(2),
    missingIndex: z.number().int().min(0),
    options: z.tuple([z.string(), z.string(), z.string(), z.string()]),
    correctIndex: z.number().int().min(0).max(3),
  }),
});

export const SynonymAntonymSchema = z.object({
  type: z.literal("synonym-antonym"),
  instruction: z.string(),
  data: z.object({
    word: z.string(),
    mode: z.enum(["synonym", "antonym"]),
    options: z.tuple([z.string(), z.string(), z.string(), z.string()]),
    correctIndex: z.number().int().min(0).max(3),
  }),
});

export const ReadingComprehensionSchema = z.object({
  type: z.literal("reading-comprehension"),
  instruction: z.string(),
  data: z.object({
    passage: z.string(),
    question: z.string(),
    options: z.tuple([z.string(), z.string(), z.string(), z.string()]),
    correctIndex: z.number().int().min(0).max(3),
  }),
});

export const CollocationSchema = z.object({
  type: z.literal("collocation"),
  instruction: z.string(),
  data: z.object({
    phrase: z.string(),
    options: z.tuple([z.string(), z.string(), z.string(), z.string()]),
    correctIndex: z.number().int().min(0).max(3),
    explanation: z.string(),
  }),
});

export const ExerciseSchema = z.discriminatedUnion("type", [
  FillInBlankSchema,
  SentenceOrderSchema,
  TranslationSchema,
  ErrorCorrectionSchema,
  WordFormationSchema,
  DialogueCompletionSchema,
  SynonymAntonymSchema,
  ReadingComprehensionSchema,
  CollocationSchema,
]);

export const ChallengeGenerationSchema = z.object({
  exercises: z.array(ExerciseSchema).min(3).max(8),
});

export const SubmitAnswerSchema = z.object({
  answers: z
    .array(
      z.object({
        exerciseIndex: z.number().int().min(0).max(7),
        answer: z.string(),
      }),
    )
    .min(1)
    .max(8),
  timeElapsedMs: z.number().int().min(0),
});
