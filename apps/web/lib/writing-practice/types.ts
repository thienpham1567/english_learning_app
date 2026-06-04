export type InlineAnnotation = {
  startIndex: number;
  endIndex: number;
  type: "grammar" | "vocabulary" | "coherence";
  suggestion: string;
  explanation: string;
};

/**
 * TOEIC Writing scoring criteria.
 * Each criterion scored 0-5 (matching TOEIC raw score scale).
 */
export type ToeicWritingScores = {
  grammar: number;
  vocabulary: number;
  organization: number;
  taskCompletion: number;
};

export type WritingFeedback = {
  scores: ToeicWritingScores;
  overallScore: number; // 0-5 average
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
  overallScore: number;
  scores: ToeicWritingScores;
  feedback: WritingFeedback;
  createdAt: string;
};

export type WritingCategory = "sentence-picture" | "email-response" | "opinion-essay";

export const CATEGORY_LABELS: Record<WritingCategory, string> = {
  "sentence-picture": "Sentence from Picture",
  "email-response": "Email Response",
  "opinion-essay": "Opinion Essay",
};

export const MIN_WORDS: Record<WritingCategory, number> = {
  "sentence-picture": 15,
  "email-response": 80,
  "opinion-essay": 200,
};
