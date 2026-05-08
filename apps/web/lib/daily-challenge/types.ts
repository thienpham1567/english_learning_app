export type ChallengeType =
  | "fill-in-blank"
  | "sentence-order"
  | "translation"
  | "error-correction"
  | "word-formation"
  | "dialogue-completion"
  | "synonym-antonym"
  | "reading-comprehension"
  | "collocation";

export type Exercise =
  | { type: "fill-in-blank"; instruction: string; data: FillInBlankData }
  | { type: "sentence-order"; instruction: string; data: SentenceOrderData }
  | { type: "translation"; instruction: string; data: TranslationData }
  | { type: "error-correction"; instruction: string; data: ErrorCorrectionData }
  | { type: "word-formation"; instruction: string; data: WordFormationData }
  | { type: "dialogue-completion"; instruction: string; data: DialogueCompletionData }
  | { type: "synonym-antonym"; instruction: string; data: SynonymAntonymData }
  | { type: "reading-comprehension"; instruction: string; data: ReadingComprehensionData }
  | { type: "collocation"; instruction: string; data: CollocationData };

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

export type WordFormationData = {
  sentence: string; // "The _____ of the project was impressive."
  rootWord: string; // "execute"
  correctAnswer: string; // "execution"
  options: [string, string, string, string];
  correctIndex: number;
};

export type DialogueCompletionData = {
  context: string; // "At a business meeting"
  dialogue: { speaker: string; text: string }[];
  missingIndex: number; // which line is blank
  options: [string, string, string, string];
  correctIndex: number;
};

export type SynonymAntonymData = {
  word: string;
  mode: "synonym" | "antonym";
  options: [string, string, string, string];
  correctIndex: number;
};

export type ReadingComprehensionData = {
  passage: string; // 2-3 sentences
  question: string;
  options: [string, string, string, string];
  correctIndex: number;
};

export type CollocationData = {
  phrase: string; // "make a _____"
  options: [string, string, string, string];
  correctIndex: number;
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
  icon: string;
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
