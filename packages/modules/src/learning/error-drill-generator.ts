/**
 * Targeted Error Drill Generator (Story 23.3, AC: 1-4)
 *
 * Creates drill items from actual learner errors. Works in two modes:
 * 1. Template-based: Transforms existing error examples into drill format
 * 2. AI-ready: Provides a structured prompt for AI generation
 *
 * All output is schema-validated before display (AC: 4).
 */

import type { ErrorCategory } from "./error-category";

// ── Drill Item Schema (AC: 1, 4) ────────────────────────────────────────────

export interface DrillItem {
	id: string;
	questionStem: string;
	options: string[];
	correctAnswer: string;
	explanationEn: string;
	explanationVi: string;
	category: string;
	sourceErrorId?: string;
}

export interface DrillSession {
	id: string;
	categoryKey: string;
	categoryLabel: string;
	items: DrillItem[];
	createdAt: string;
}

// ── Drill Input ─────────────────────────────────────────────────────────────

export interface DrillSourceError {
	id: string;
	questionStem: string;
	options: string[] | null;
	userAnswer: string;
	correctAnswer: string;
	explanationEn: string | null;
	explanationVi: string | null;
}

export interface DrillGenerationInput {
	category: ErrorCategory;
	sourceErrors: DrillSourceError[];
	maxItems?: number;
}

// ── Schema Validation (AC: 4) ───────────────────────────────────────────────

export interface DrillValidationResult {
	valid: boolean;
	items: DrillItem[];
	errors: string[];
}

/**
 * Validates that a drill item has the required shape and content.
 * Rejects items with missing fields, empty options, or invalid correct answers.
 */
export function validateDrillItem(item: unknown, index: number): { valid: boolean; error?: string } {
	if (!item || typeof item !== "object") {
		return { valid: false, error: `Item ${index}: not an object` };
	}

	const obj = item as Record<string, unknown>;

	if (typeof obj.questionStem !== "string" || obj.questionStem.trim().length === 0) {
		return { valid: false, error: `Item ${index}: missing or empty questionStem` };
	}

	if (!Array.isArray(obj.options) || obj.options.length < 2) {
		return { valid: false, error: `Item ${index}: options must have at least 2 choices` };
	}

	if (typeof obj.correctAnswer !== "string" || obj.correctAnswer.trim().length === 0) {
		return { valid: false, error: `Item ${index}: missing or empty correctAnswer` };
	}

	if (!obj.options.includes(obj.correctAnswer)) {
		return { valid: false, error: `Item ${index}: correctAnswer not found in options` };
	}

	if (typeof obj.explanationEn !== "string" || obj.explanationEn.trim().length === 0) {
		return { valid: false, error: `Item ${index}: missing or empty explanationEn` };
	}

	return { valid: true };
}

/**
 * Validates an array of AI-generated drill items (AC: 4).
 * Returns only the valid items + collected error messages.
 */
export function validateDrillItems(rawItems: unknown[]): DrillValidationResult {
	const items: DrillItem[] = [];
	const errors: string[] = [];

	for (let i = 0; i < rawItems.length; i++) {
		const result = validateDrillItem(rawItems[i], i);
		if (result.valid) {
			const raw = rawItems[i] as Record<string, unknown>;
			items.push({
				id: `drill-${Date.now()}-${i}`,
				questionStem: raw.questionStem as string,
				options: raw.options as string[],
				correctAnswer: raw.correctAnswer as string,
				explanationEn: raw.explanationEn as string,
				explanationVi: (raw.explanationVi as string) ?? "",
				category: (raw.category as string) ?? "",
				sourceErrorId: raw.sourceErrorId as string | undefined,
			});
		} else {
			errors.push(result.error!);
		}
	}

	return { valid: items.length > 0, items, errors };
}

// ── Template-Based Drill Generation (AC: 1, 2) ─────────────────────────────

/**
 * Generates drill items from existing error examples by transforming them
 * into a quiz format. Works offline without AI.
 *
 * Each source error becomes a drill item with:
 * - Original question stem
 * - Options: correct answer + user's wrong answer + distractors
 * - Explanation from the original error
 *
 * AC: 1 — Uses actual repeated error examples
 * AC: 2 — Every drill item has answer validation and explanation
 */
export function generateDrillsFromErrors(input: DrillGenerationInput): DrillSession {
	const maxItems = input.maxItems ?? 5;
	const now = new Date().toISOString();

	// Take the most relevant source errors (up to maxItems)
	const selected = input.sourceErrors.slice(0, maxItems);

	const items: DrillItem[] = selected.map((err, i) => {
		// Build options: always include correct and user's wrong answer
		const optionSet = new Set<string>();
		optionSet.add(err.correctAnswer);
		if (err.userAnswer !== err.correctAnswer) {
			optionSet.add(err.userAnswer);
		}

		// Add original options if available
		if (err.options) {
			for (const opt of err.options) {
				optionSet.add(opt);
			}
		}

		// Ensure at least 2 options
		if (optionSet.size < 2) {
			optionSet.add("(none of the above)");
		}

		const options = Array.from(optionSet);
		// Shuffle options deterministically
		options.sort((a, b) => a.localeCompare(b));

		return {
			id: `drill-${Date.now()}-${i}`,
			questionStem: err.questionStem,
			options,
			correctAnswer: err.correctAnswer,
			explanationEn: err.explanationEn ?? "Review the grammar rule for this pattern.",
			explanationVi: err.explanationVi ?? "Xem lại quy tắc ngữ pháp cho mẫu lỗi này.",
			category: input.category.key,
			sourceErrorId: err.id,
		};
	});

	return {
		id: `session-${Date.now()}`,
		categoryKey: input.category.key,
		categoryLabel: input.category.labelVi,
		items,
		createdAt: now,
	};
}

// ── AI Prompt Builder ───────────────────────────────────────────────────────

/**
 * Builds an AI prompt for generating targeted drill items.
 * Used by the API route when AI generation is requested.
 */
export function buildDrillPrompt(
	category: ErrorCategory,
	exampleSentences: string[],
	count: number = 5,
): string {
	const exampleBlock = exampleSentences.length > 0
		? `\nExample errors from this learner:\n${exampleSentences.map((s, i) => `${i + 1}. "${s}"`).join("\n")}\n`
		: "";

	return `You are an expert English grammar drill writer.

Error category: "${category.label}" (${category.labelVi})
Affected skill: ${category.skillId}
${exampleBlock}
TASK: Write ${count} multiple-choice drill items targeting this specific error pattern.

RULES:
- Each question should have 4 options (A, B, C, D).
- Exactly one option is correct.
- The other 3 are plausible distractors.
- Question stems should be 1–2 sentences long.
- Do NOT copy any example sentence verbatim — create fresh items.
- Provide explanations in English (explanationEn) and Vietnamese (explanationVi).
- Return ONLY valid JSON — no markdown fences.

JSON Schema:
{
  "items": [
    {
      "questionStem": "...",
      "options": ["A", "B", "C", "D"],
      "correctAnswer": "B",
      "explanationEn": "...",
      "explanationVi": "..."
    }
  ]
}`;
}

// ── Minimum Examples Threshold ──────────────────────────────────────────────

/** Minimum source errors required before generating drills (AC: 1) */
export const MIN_ERRORS_FOR_DRILL = 2;

export function canGenerateDrill(sourceErrorCount: number): boolean {
	return sourceErrorCount >= MIN_ERRORS_FOR_DRILL;
}
