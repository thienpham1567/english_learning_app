import { z } from "zod/v4";

// ── Template & Rubric Version (AC: 4) ───────────────────────────────────────

/** Semantic version pattern: major.minor.patch */
const VersionString = z.string().regex(/^\d+\.\d+\.\d+$/, "Must be semver (e.g. 1.0.0)");

// ── Feedback Module Types (AC: 2) ──────────────────────────────────────────

export const FeedbackModuleType = z.enum([
	"writing",
	"speaking",
	"pronunciation",
	"listening_summary",
	"grammar",
	"reading",
]);

// ── Template Definition (AC: 1, 4) ──────────────────────────────────────────

export const FeedbackTemplateSchema = z.object({
	templateId: z.string().min(1),
	moduleType: FeedbackModuleType,
	templateVersion: VersionString,
	rubricVersion: VersionString,
	/** SHA-256 hash of the prompt text — enables change detection (AC: 4) */
	promptHash: z.string().min(1),
	description: z.string().optional(),
});

// ── Feedback Run Record (AC: 1) ─────────────────────────────────────────────

export const FeedbackRunSchema = z.object({
	id: z.string().min(1),
	userId: z.string().min(1),
	templateId: z.string().min(1),
	templateVersion: VersionString,
	rubricVersion: VersionString,
	modelName: z.string().min(1),
	promptHash: z.string().min(1),
	/** Redacted input snapshot — no raw secrets/PII (AC: 1, dev note) */
	inputSnapshot: z.record(z.string(), z.unknown()),
	/** Structured AI output */
	structuredOutput: z.record(z.string(), z.unknown()),
	latencyMs: z.number().int().nonnegative(),
	costEstimate: z.number().nonnegative().nullable(),
	safetyFlags: z.array(z.string()),
	createdAt: z.string().datetime(),
});

// ── Feedback Wrapper Input (AC: 1, 4) ───────────────────────────────────────

export const FeedbackRequestSchema = z.object({
	templateId: z.string().min(1),
	templateVersion: VersionString,
	rubricVersion: VersionString,
	moduleType: FeedbackModuleType,
	modelName: z.string().min(1),
	promptHash: z.string().min(1),
	inputData: z.record(z.string(), z.unknown()),
});

// ── Inferred types ──────────────────────────────────────────────────────────

export type FeedbackModuleTypeValue = z.infer<typeof FeedbackModuleType>;
export type FeedbackTemplate = z.infer<typeof FeedbackTemplateSchema>;
export type FeedbackRun = z.infer<typeof FeedbackRunSchema>;
export type FeedbackRequest = z.infer<typeof FeedbackRequestSchema>;
