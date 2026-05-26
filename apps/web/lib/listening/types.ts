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

export const DIALOGUE_TURN_COUNTS = [6, 8, 10] as const;
export const DIALOGUE_SPEAKER_COUNTS = [2, 3] as const;

export const GenerateDialogueInputSchema = z.object({
  topic: z.string().min(3).max(200),
  level: z.enum(CEFR_LEVELS),
  turns: z
    .enum(["6", "8", "10"])
    .default("8")
    .transform((v) => Number(v) as 6 | 8 | 10)
    .or(z.union([z.literal(6), z.literal(8), z.literal(10)])),
  speakers: z
    .enum(["2", "3"])
    .default("2")
    .transform((v) => Number(v) as 2 | 3)
    .or(z.union([z.literal(2), z.literal(3)])),
  examMode: z.enum(["toeic", "ielts"]).optional(),
});

export interface DialogueTurnPayload {
  speaker: "A" | "B" | "C";
  accent: "us" | "uk" | "au";
  voiceName: string;
  text: string;
}

export interface GenerateDialogueResponse {
  id: string;
  level: CefrLevel;
  exerciseType: ExerciseType;
  audioUrl: string;
  passage: string;
  turns: DialogueTurnPayload[];
  questions: { question: string; options: string[] }[];
  createdAt: string;
}

export const SubmitInputSchema = z.object({
  exerciseId: z.string().uuid(),
  answers: z.array(z.number().int().min(0).max(3)),
  /** Whether the user revealed the script during the exercise */
  scriptRevealed: z.boolean().optional().default(false),
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
  /** Present when exercise was generated as a multi-speaker dialogue (Story 19.3.1). */
  turns?: DialogueTurnPayload[];
  /** Passage text for script reveal during exercise. */
  passage?: string;
  /** AI-extracted key phrases for progressive script reveal. */
  keyPhrases?: string[];
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

// ── History Types ──

export interface ListeningHistoryItem {
  id: string;
  level: string;
  exerciseType: string;
  mode: string;
  score: number | null;
  bookmarked: boolean;
  scriptRevealed: boolean;
  completedAt: string | null;
  createdAt: string;
}

export interface ListeningHistoryDetail extends ListeningHistoryItem {
  passage: string;
  audioUrl: string;
  questions: { question: string; options: string[]; correctIndex: number }[];
  answers: number[] | null;
  dialogueTurns?: DialogueTurnPayload[];
}

export interface ListeningStats {
  totalSessions: number;
  sessionsThisWeek: number;
  avgScore: number;
  avgScoreThisWeek: number;
  weeklyTrend: { week: string; avg: number; count: number }[];
  byLevel: { level: string; count: number; avgScore: number }[];
  byMode: { mode: string; count: number; avgScore: number }[];
  currentStreak: number;
}
