import { z } from "zod";

// ── CEFR Levels ──

export const CEFR_LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"] as const;
export type CefrLevel = (typeof CEFR_LEVELS)[number];

// ── Exercise Types ──

export const EXERCISE_TYPES = ["comprehension", "dictation", "fill_blanks"] as const;
export type ExerciseType = (typeof EXERCISE_TYPES)[number];

// ── Zod Schemas ──

export const GenerateInputSchema = z.object({
  level: z.enum(CEFR_LEVELS),
  exerciseType: z.enum(EXERCISE_TYPES).default("comprehension"),
  examMode: z.enum(["toeic", "ielts"]).optional(),
});

export const SubmitInputSchema = z.object({
  exerciseId: z.string().uuid(),
  answers: z.array(z.number().int().min(0).max(3)),
});

// ── Response Types ──

export interface ListeningExerciseResponse {
  id: string;
  level: CefrLevel;
  exerciseType: ExerciseType;
  audioUrl: string;
  questions: {
    question: string;
    options: string[];
  }[];
  createdAt: string;
}

export interface ListeningSubmitResponse {
  score: number;
  total: number;
  correct: number;
  xpEarned: number;
  passage: string;
  results: {
    question: string;
    options: string[];
    correctIndex: number;
    userAnswer: number;
    correct: boolean;
  }[];
  skill?: {
    cefr: string;
    levelUp: boolean;
    levelChanged: boolean;
    previousLevel: number;
    newLevel: number;
  };
}
