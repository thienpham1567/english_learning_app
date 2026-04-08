export type InlineAnnotation = {
  startIndex: number;
  endIndex: number;
  type: "grammar" | "vocabulary" | "coherence";
  suggestion: string;
  explanation: string;
};

export type BandScores = {
  taskResponse: number;
  coherenceCohesion: number;
  lexicalResource: number;
  grammaticalRange: number;
};

export type WritingFeedback = {
  scores: BandScores;
  overallBand: number;
  annotations: InlineAnnotation[];
  generalFeedback: string;
  generalFeedbackVi: string;
  improvedVersion: string;
};

export type WritingSubmission = {
  id: string;
  category: string;
  prompt: string;
  text: string;
  wordCount: number;
  overallBand: number;
  scores: BandScores;
  feedback: WritingFeedback;
  createdAt: string;
};

export type WritingCategory = "ielts-task-1" | "ielts-task-2" | "email" | "free";

export const CATEGORY_LABELS: Record<WritingCategory, string> = {
  "ielts-task-1": "IELTS Task 1",
  "ielts-task-2": "IELTS Task 2",
  email: "Email",
  free: "Chủ đề tự do",
};

export const MIN_WORDS: Record<WritingCategory, number> = {
  "ielts-task-1": 150,
  "ielts-task-2": 250,
  email: 80,
  free: 50,
};
