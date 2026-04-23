import { z } from "zod";

import type { GrammarTopic, GrammarTopicCategory } from "./topics";

const ExampleSchema = z.object({
  en: z.string().min(5),
  vi: z.string().min(3),
  highlight: z.string().min(1),
});

const MistakeSchema = z.object({
  wrong: z.string().min(3),
  correct: z.string().min(3),
  note: z.string().min(5),
});

const BaseExerciseSchema = z.object({
  id: z.string().min(1),
  sentence: z.string().min(5),
  answer: z.string().min(1),
  explanation: z.string().min(5),
  instructionVi: z.string().optional(),
});

export const MultipleChoiceExerciseSchema = BaseExerciseSchema.extend({
  type: z.literal("multiple_choice"),
  options: z.tuple([z.string(), z.string(), z.string(), z.string()]),
});

export const WrittenExerciseSchema = BaseExerciseSchema.extend({
  type: z.enum(["error_correction", "transformation", "free_write"]),
  options: z.undefined().optional(),
});

export const GrammarLessonExerciseSchema = z.discriminatedUnion("type", [
  MultipleChoiceExerciseSchema,
  WrittenExerciseSchema,
]);

export const GrammarLessonSchema = z.object({
  title: z.string().min(2),
  titleVi: z.string().min(2),
  formula: z.string().min(3),
  explanation: z.string().min(10),
  examples: z.array(ExampleSchema).min(3).max(5),
  commonMistakes: z.array(MistakeSchema).min(2).max(4),
  exercises: z.array(GrammarLessonExerciseSchema).min(3).max(8),
});

export const GrammarLessonGenerateRequestSchema = z.object({
  topic: z.string().min(1),
  topicTitle: z.string().min(1),
  examMode: z.enum(["toeic", "ielts"]).default("toeic"),
  level: z.string().default("B1"),
  forceRefresh: z.boolean().optional().default(false),
});

export const GrammarLessonAnswerSchema = z.object({
  exerciseId: z.string().min(1),
  type: z.enum(["multiple_choice", "error_correction", "transformation", "free_write"]),
  questionStem: z.string().min(1),
  options: z.array(z.string()).optional(),
  userAnswer: z.string(),
  correctAnswer: z.string(),
  explanationVi: z.string().optional(),
  correct: z.boolean(),
});

export const GrammarLessonCompleteRequestSchema = z.object({
  topic: z.string().min(1),
  topicTitle: z.string().min(1).optional(),
  examMode: z.enum(["toeic", "ielts"]).default("toeic"),
  level: z.string().default("B1"),
  correctCount: z.number().int().min(0),
  totalCount: z.number().int().min(1),
  durationMs: z.number().int().nonnegative().optional().default(0),
  answers: z.array(GrammarLessonAnswerSchema).optional().default([]),
});

export type GrammarLessonData = z.infer<typeof GrammarLessonSchema>;
export type GrammarLessonExercise = z.infer<typeof GrammarLessonExerciseSchema>;
export type GrammarLessonAnswer = z.infer<typeof GrammarLessonAnswerSchema>;
export type GrammarLessonProgressStatus = "in_progress" | "completed";

export type GrammarLessonProgressItem = {
  topicId: string;
  status: GrammarLessonProgressStatus;
  correctCount: number;
  totalCount: number;
  scorePct: number;
  completedAt?: string | null;
  lastStudiedAt?: string | null;
};

export type GrammarLessonSummary = {
  totalTopics: number;
  totalCompleted: number;
  completedTopicIds: string[];
  progressByTopic: Record<string, GrammarLessonProgressItem>;
};

export function normalizeGrammarAnswer(answer: string): string {
  return answer
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[.!?]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function isGrammarAnswerCorrect(userAnswer: string, correctAnswer: string): boolean {
  return normalizeGrammarAnswer(userAnswer) === normalizeGrammarAnswer(correctAnswer);
}

export function getGrammarLessonDifficulty(level: string): "elementary" | "intermediate" | "upper_intermediate" {
  if (level === "A2") return "elementary";
  if (level === "B2") return "upper_intermediate";
  return "intermediate";
}

export function calculateGrammarLessonXp(correctCount: number, totalCount: number): number {
  const scorePct = totalCount > 0 ? correctCount / totalCount : 0;
  return Math.max(10, Math.round(10 + scorePct * 20));
}

export function buildGrammarLessonSummary(
  categories: GrammarTopicCategory[],
  progress: GrammarLessonProgressItem[],
): GrammarLessonSummary {
  const progressByTopic = Object.fromEntries(progress.map((item) => [item.topicId, item]));
  const completedTopicIds = progress
    .filter((item) => item.status === "completed")
    .map((item) => item.topicId);

  return {
    totalTopics: categories.reduce((sum, category) => sum + category.topics.length, 0),
    totalCompleted: completedTopicIds.length,
    completedTopicIds,
    progressByTopic,
  };
}

export function getRecommendedGrammarTopic(
  categories: GrammarTopicCategory[],
  progress: GrammarLessonProgressItem[],
  preferredLevel?: string,
): GrammarTopic | null {
  const completed = new Set(
    progress.filter((item) => item.status === "completed").map((item) => item.topicId),
  );
  const topics = categories.flatMap((category) => category.topics);

  const sameLevel = preferredLevel
    ? topics.find((topic) => topic.level === preferredLevel && !completed.has(topic.id))
    : undefined;
  if (sameLevel) return sameLevel;

  const incompleteTopic = topics.find((topic) => !completed.has(topic.id));
  if (incompleteTopic) return incompleteTopic;

  const weakTopic = progress
    .filter((item) => item.status === "completed" && item.scorePct < 70)
    .sort((a, b) => a.scorePct - b.scorePct)[0];

  return weakTopic ? topics.find((topic) => topic.id === weakTopic.topicId) ?? null : null;
}
