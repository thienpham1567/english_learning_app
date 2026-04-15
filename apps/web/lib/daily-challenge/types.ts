export type ChallengeType = "fill-in-blank" | "sentence-order" | "translation" | "error-correction";

export type Exercise =
  | { type: "fill-in-blank"; instruction: string; data: FillInBlankData }
  | { type: "sentence-order"; instruction: string; data: SentenceOrderData }
  | { type: "translation"; instruction: string; data: TranslationData }
  | { type: "error-correction"; instruction: string; data: ErrorCorrectionData };

export type FillInBlankData = {
  sentence: string; // with _____ placeholder
  options: [string, string, string, string];
  correctIndex: number;
};

export type SentenceOrderData = {
  scrambled: string[];
  correctOrder: string[];
};

export type TranslationData = {
  vietnamese: string;
  acceptableAnswers: string[];
};

export type ErrorCorrectionData = {
  sentence: string;
  errorWord: string;
  correction: string;
  explanation: string;
};

export type DailyChallenge = {
  id: string;
  challengeDate: string;
  exercises: Exercise[];
  answers: ExerciseAnswer[] | null;
  score: number | null;
  completedAt: string | null;
  timeElapsedMs: number | null;
};

export type ExerciseAnswer = {
  exerciseIndex: number;
  answer: string;
  isCorrect?: boolean;
  explanation?: string;
  correctAnswer?: string;
  questionStem?: string;
  exerciseType?: ChallengeType;
};

export type StreakInfo = {
  currentStreak: number;
  bestStreak: number;
  lastCompletedDate: string | null;
};

export type Badge = {
  id: string;
  emoji: string;
  label: string;
  requiredStreak: number;
  unlocked: boolean;
};

export type ChallengeState =
  | "loading"
  | "active"
  | "submitting"
  | "results"
  | "completed"
  | "error";
