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

export type WritingCategory = "email-response" | "opinion-essay" | "describe-picture" | "free";

export const CATEGORY_LABELS: Record<WritingCategory, string> = {
  "email-response": "Email Response",
  "opinion-essay": "Opinion Essay",
  "describe-picture": "Describe a Picture",
  free: "Chủ đề tự do",
};

export const MIN_WORDS: Record<WritingCategory, number> = {
  "email-response": 80,
  "opinion-essay": 200,
  "describe-picture": 60,
  free: 50,
};
