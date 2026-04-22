import { z } from "zod/v4";

// ── User Skill State (AC: 1, 2) ────────────────────────────────────────────

export const UserSkillStateSchema = z.object({
	userId: z.string().min(1),
	skillId: z.string().min(1),
	proficiency: z.number().min(0).max(100),       // 0–100 mastery scale
	confidence: z.number().min(0).max(1),           // 0–1 certainty
	successStreak: z.number().int().nonnegative(),
	failureStreak: z.number().int().nonnegative(),
	decayRate: z.number().min(0).max(1),            // 0–1 per day
	signalCount: z.number().int().nonnegative(),    // total events processed
	lastPracticedAt: z.string().datetime(),
	lastUpdatedAt: z.string().datetime(),
	nextReviewAt: z.string().datetime(),
});

// ── Mastery Update Input (from a learning event) ────────────────────────────

export const MasteryUpdateInputSchema = z.object({
	userId: z.string().min(1),
	skillId: z.string().min(1),
	result: z.enum(["correct", "incorrect", "partial", "neutral"]),
	score: z.number().finite().nullable(),
	difficulty: z.enum(["beginner", "elementary", "intermediate", "upper_intermediate", "advanced"]),
	durationMs: z.number().int().nonnegative(),
	errorTags: z.array(z.string()),
	hintCount: z.number().int().nonnegative().default(0),
});

// ── Mastery Update Output ───────────────────────────────────────────────────

export const MasteryUpdateOutputSchema = z.object({
	previousProficiency: z.number(),
	newProficiency: z.number(),
	previousConfidence: z.number(),
	newConfidence: z.number(),
	delta: z.number(),
	nextReviewAt: z.string().datetime(),
});

// ── Inferred types ──────────────────────────────────────────────────────────

export type UserSkillState = z.infer<typeof UserSkillStateSchema>;
export type MasteryUpdateInput = z.infer<typeof MasteryUpdateInputSchema>;
export type MasteryUpdateOutput = z.infer<typeof MasteryUpdateOutputSchema>;
