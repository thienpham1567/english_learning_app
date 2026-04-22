import { z } from "zod/v4";

// ── Event Type (AC: 3) ─────────────────────────────────────────────────────

export const LearningEventType = z.enum([
	"exercise_submitted",
	"answer_graded",
	"mistake_detected",
	"skill_practice_completed",
	"review_completed",
	"ai_feedback_generated",
	"mastery_updated",
]);

// ── Module Type ─────────────────────────────────────────────────────────────

export const LearningModuleType = z.enum([
	"chatbot",
	"dictionary",
	"flashcard",
	"daily_challenge",
	"grammar_quiz",
	"writing",
	"listening",
	"speaking",
	"reading",
	"diagnostic",
	"scenarios",
]);

// ── Result ──────────────────────────────────────────────────────────────────

export const LearningResult = z.enum([
	"correct",
	"incorrect",
	"partial",
	"neutral",
]);

// ── Difficulty ──────────────────────────────────────────────────────────────

export const LearningDifficulty = z.enum([
	"beginner",
	"elementary",
	"intermediate",
	"upper_intermediate",
	"advanced",
]);

// ── Learning Event Payload (AC: 1, 2) ───────────────────────────────────────

export const LearningEventSchema = z.object({
	userId: z.string().min(1),
	sessionId: z.string().min(1),
	moduleType: LearningModuleType,
	contentId: z.string().min(1),
	skillIds: z.array(z.string()),
	attemptId: z.string().min(1),
	eventType: LearningEventType,
	result: LearningResult,
	score: z.number().finite().nullable(),
	durationMs: z.number().int().nonnegative(),
	difficulty: LearningDifficulty,
	errorTags: z.array(z.string()),
	timestamp: z.string().datetime(),

	// Optional AI/rubric metadata (AC: 2)
	aiVersion: z.string().optional(),
	rubricVersion: z.string().optional(),
});

// ── Inferred types ──────────────────────────────────────────────────────────

export type LearningEvent = z.infer<typeof LearningEventSchema>;
export type LearningEventTypeValue = z.infer<typeof LearningEventType>;
export type LearningModuleTypeValue = z.infer<typeof LearningModuleType>;
export type LearningResultValue = z.infer<typeof LearningResult>;
export type LearningDifficultyValue = z.infer<typeof LearningDifficulty>;
