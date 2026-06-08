import { z } from "zod";

/** Morpheme categories surfaced in the catalog. */
export const MorphemeTypeSchema = z.enum(["prefix", "suffix", "root"]);
export type MorphemeType = z.infer<typeof MorphemeTypeSchema>;

/** A single derived word built from the morpheme. */
export const FamilyWordSchema = z.object({
  word: z.string().min(1),
  partOfSpeech: z.string().min(1),
  meaningVi: z.string().min(1),
  exampleEn: z.string().min(3),
  /** The morpheme substring to highlight inside exampleEn/word. */
  highlight: z.string().min(1),
});
export type FamilyWord = z.infer<typeof FamilyWordSchema>;

/** Match: connect each left item (morpheme/word) to its meaning on the right. */
export const MatchExerciseSchema = z.object({
  type: z.literal("match"),
  prompt: z.string().min(3),
  pairs: z
    .array(z.object({ left: z.string().min(1), right: z.string().min(1) }))
    .min(3)
    .max(6),
});

/** Word formation: type the correct derived form of baseWord for the blank. */
export const WordFormationExerciseSchema = z.object({
  type: z.literal("word_formation"),
  sentence: z.string().min(5),
  baseWord: z.string().min(1),
  answer: z.string().min(1),
  acceptedAnswers: z.array(z.string()).optional(),
  explanationVi: z.string().min(3),
  explanationEn: z.string().min(3),
});

/** MCQ: choose the word that correctly completes the sentence. */
export const McqExerciseSchema = z.object({
  type: z.literal("mcq"),
  sentence: z.string().min(5),
  options: z.tuple([z.string(), z.string(), z.string(), z.string()]),
  answer: z.string().min(1),
  explanationVi: z.string().min(3),
  explanationEn: z.string().min(3),
});

export const MorphemeExerciseSchema = z.discriminatedUnion("type", [
  MatchExerciseSchema,
  WordFormationExerciseSchema,
  McqExerciseSchema,
]);
export type MorphemeExercise = z.infer<typeof MorphemeExerciseSchema>;

/** Full AI-generated lesson for one morpheme. */
export const MorphemeLessonSchema = z.object({
  morpheme: z.string().min(1),
  type: MorphemeTypeSchema,
  gloss: z.string().min(1),
  meaningEn: z.string().min(5),
  meaningVi: z.string().min(3),
  origin: z.string().min(2),
  /** For suffixes: the part of speech it forms (e.g. "noun"). */
  posEffect: z.string().optional(),
  family: z.array(FamilyWordSchema).min(4).max(10),
  exercises: z.array(MorphemeExerciseSchema).min(4).max(12),
});
export type MorphemeLesson = z.infer<typeof MorphemeLessonSchema>;

/** Analyze mode: an arbitrary word split into morphemes + family. */
export const MorphemeAnalysisSchema = z.object({
  word: z.string().min(1),
  parts: z
    .array(
      z.object({
        surface: z.string().min(1),
        type: MorphemeTypeSchema,
        meaning: z.string().min(1),
      }),
    )
    .min(1),
  family: z.array(FamilyWordSchema).min(1).max(10),
});
export type MorphemeAnalysis = z.infer<typeof MorphemeAnalysisSchema>;

// ── Request schemas ──

export const MorphemeGenerateRequestSchema = z.object({
  morphemeId: z.string().min(1),
  morpheme: z.string().min(1),
  type: MorphemeTypeSchema,
  gloss: z.string().min(1),
  forceRefresh: z.boolean().optional().default(false),
});

export const MorphemeAnalyzeRequestSchema = z.object({
  word: z.string().min(1).max(40),
});

export const MorphemeAnswerSchema = z.object({
  exerciseType: z.enum(["match", "word_formation", "mcq"]),
  correct: z.boolean(),
});

export const MorphemeCompleteRequestSchema = z.object({
  morphemeId: z.string().min(1),
  morpheme: z.string().min(1).optional(),
  correctCount: z.number().int().min(0),
  totalCount: z.number().int().min(1),
  answers: z.array(MorphemeAnswerSchema).optional().default([]),
});

export type MorphemeProgressItem = {
  morphemeId: string;
  status: "in_progress" | "completed";
  correctCount: number;
  totalCount: number;
  scorePct: number;
  completedAt: string | null;
  lastStudiedAt: string;
};

/** Fixed XP for completing a morpheme lesson (parity with grammar-lessons). */
export const MORPHEME_LESSON_XP = 20;
