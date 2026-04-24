/**
 * Chat Correction Signals (Story 25.5, AC: 1-4)
 *
 * Extracts learning signals from AI chatbot corrections. When the AI
 * corrects the learner's English, this module captures the correction
 * as a structured learning event + error signal.
 */

import type { LearningEvent } from "@repo/contracts";

// ── Types ───────────────────────────────────────────────────────────────────

export interface ChatCorrection {
	/** What the learner wrote */
	original: string;
	/** What the AI corrected it to */
	corrected: string;
	/** Category of the correction */
	category: "grammar" | "vocabulary" | "spelling" | "word-choice" | "idiom" | "other";
	/** Brief explanation of why */
	explanation: string;
}

export interface ChatCorrectionSignal {
	/** Corrections extracted from the AI response */
	corrections: ChatCorrection[];
	/** Learning event to emit */
	learningEvent: Partial<LearningEvent>;
	/** Error log entries to create */
	errorEntries: Array<{
		sourceModule: string;
		userAnswer: string;
		correctAnswer: string;
		grammarTopic: string;
		isResolved: boolean;
	}>;
	/** Whether any corrections were found */
	hasCorrections: boolean;
}

// ── Correction Extractor (AC: 1, 2) ────────────────────────────────────────

/**
 * Extracts corrections from structured AI response metadata (AC: 1).
 *
 * AC: 1 — Captures corrections as learning signals
 * AC: 2 — Maps to learning event format
 * AC: 3 — Tolerates missing/malformed correction data
 */
export function extractChatCorrections(
	corrections: ChatCorrection[],
	userId: string,
	sessionId: string,
): ChatCorrectionSignal {
	if (!corrections || corrections.length === 0) {
		return {
			corrections: [],
			learningEvent: {},
			errorEntries: [],
			hasCorrections: false,
		};
	}

	// Validate corrections (AC: 3)
	const validCorrections = corrections.filter(
		(c) => c.original && c.corrected && c.original !== c.corrected,
	);

	if (validCorrections.length === 0) {
		return {
			corrections: [],
			learningEvent: {},
			errorEntries: [],
			hasCorrections: false,
		};
	}

	// Build learning event (AC: 2)
	const learningEvent: Partial<LearningEvent> = {
		userId,
		moduleType: "chatbot",
		sessionId,
		eventType: "practice",
		result: "partial",
		difficulty: "intermediate",
		correctCount: 0,
		totalCount: validCorrections.length,
		skillIds: [...new Set(validCorrections.map((c) => categoryToSkill(c.category)))],
		durationSeconds: 0,
	};

	// Build error entries (AC: 1)
	const errorEntries = validCorrections.map((c) => ({
		sourceModule: "chatbot",
		userAnswer: c.original,
		correctAnswer: c.corrected,
		grammarTopic: c.explanation || c.category,
		isResolved: false,
	}));

	return {
		corrections: validCorrections,
		learningEvent,
		errorEntries,
		hasCorrections: true,
	};
}

// ── Category → Skill Mapping ────────────────────────────────────────────────

function categoryToSkill(category: ChatCorrection["category"]): string {
	const map: Record<string, string> = {
		grammar: "grammar",
		vocabulary: "vocabulary",
		spelling: "vocabulary",
		"word-choice": "vocabulary",
		idiom: "vocabulary",
		other: "grammar",
	};
	return map[category] ?? "grammar";
}

// ── Correction Severity ─────────────────────────────────────────────────────

export type CorrectionSeverity = "minor" | "moderate" | "significant";

/**
 * Estimates the severity of a correction (AC: 4).
 */
export function estimateCorrectionSeverity(correction: ChatCorrection): CorrectionSeverity {
	// Grammar errors are more significant
	if (correction.category === "grammar") return "significant";
	// Spelling is usually minor
	if (correction.category === "spelling") return "minor";
	// Everything else is moderate
	return "moderate";
}
