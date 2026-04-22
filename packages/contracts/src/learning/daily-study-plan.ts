import { z } from "zod/v4";

// ── Time Budget Variants (AC: 2) ────────────────────────────────────────────

export const TimeBudget = z.enum(["5", "10", "20"]);

// ── Daily Study Plan Item (AC: 1) ──────────────────────────────────────────

export const DailyStudyPlanItemSchema = z.object({
	id: z.string().min(1),
	title: z.string().min(1),
	reason: z.string().min(1),
	estimatedMinutes: z.number().positive(),
	actionUrl: z.string().min(1),
	skillIds: z.array(z.string()),
	priority: z.enum(["high", "medium", "low"]),
	completed: z.boolean(),
});

// ── Daily Study Plan Response (AC: 1, 2) ────────────────────────────────────

export const DailyStudyPlanSchema = z.object({
	timeBudget: TimeBudget,
	items: z.array(DailyStudyPlanItemSchema).min(1).max(3),
	generatedAt: z.string().datetime(),
});

// ── Inferred types ──────────────────────────────────────────────────────────

export type TimeBudgetValue = z.infer<typeof TimeBudget>;
export type DailyStudyPlanItem = z.infer<typeof DailyStudyPlanItemSchema>;
export type DailyStudyPlan = z.infer<typeof DailyStudyPlanSchema>;
