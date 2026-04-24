/**
 * Diagnostic → Baseline Bridge (Story 24.2, AC: 1-4)
 *
 * Maps diagnostic test results to baseline skill scores, creates/updates
 * user skill states, and handles failures gracefully (AC: 3).
 */

import type { BaselineSkillScore, UserSkillState } from "@repo/contracts";
import { defaultSkillState } from "./mastery-engine";

// ── Diagnostic Result Shape ─────────────────────────────────────────────────

export interface DiagnosticSkillResult {
	skillId: string;
	correctCount: number;
	totalCount: number;
}

export interface DiagnosticResult {
	userId: string;
	skills: DiagnosticSkillResult[];
	completedAt: string;
}

// ── Score Mapping (AC: 1) ───────────────────────────────────────────────────

/** Minimum questions needed for confident scoring */
const MIN_QUESTIONS_FOR_CONFIDENCE = 3;

/**
 * Maps a diagnostic skill result to a baseline skill score (AC: 1).
 *
 * Score: percentage correct scaled to 0–100.
 * Confidence: based on number of questions answered.
 */
export function diagnosticToBaselineScore(result: DiagnosticSkillResult): BaselineSkillScore {
	const score = result.totalCount > 0
		? Math.round((result.correctCount / result.totalCount) * 100)
		: 30; // Conservative default

	const confidence = result.totalCount >= MIN_QUESTIONS_FOR_CONFIDENCE
		? Math.min(0.8, 0.3 + (result.totalCount / 20) * 0.5)
		: 0.2; // Low confidence for few questions

	return {
		skillId: result.skillId,
		score: Math.max(0, Math.min(100, score)),
		confidence: Math.max(0, Math.min(1, confidence)),
	};
}

/**
 * Maps all diagnostic results to baseline skill scores (AC: 1).
 */
export function diagnosticToBaselineScores(result: DiagnosticResult): BaselineSkillScore[] {
	return result.skills.map(diagnosticToBaselineScore);
}

// ── Skill State Creation / Update (AC: 2) ───────────────────────────────────

/**
 * Creates initial user skill states from diagnostic baseline scores (AC: 2).
 *
 * For each skill in the diagnostic, creates a UserSkillState using the
 * default template, then overrides proficiency and confidence.
 */
export function baselineScoresToSkillStates(
	userId: string,
	scores: BaselineSkillScore[],
): UserSkillState[] {
	return scores.map((s) => {
		const state = defaultSkillState(userId, s.skillId);
		return {
			...state,
			proficiency: s.score,
			confidence: s.confidence,
		};
	});
}

/**
 * Merges diagnostic skill states with existing states (AC: 2).
 *
 * Rule: Don't overwrite stronger existing data blindly.
 * - If existing proficiency > diagnostic → keep existing
 * - If diagnostic > existing → use diagnostic
 * - Confidence: use the higher value
 */
export function mergeSkillStates(
	existing: UserSkillState[],
	diagnostic: UserSkillState[],
): UserSkillState[] {
	const existingMap = new Map(existing.map((s) => [s.skillId, s]));

	const merged: UserSkillState[] = [];

	for (const diag of diagnostic) {
		const ex = existingMap.get(diag.skillId);
		if (!ex) {
			// New skill — use diagnostic directly
			merged.push(diag);
		} else {
			// Existing skill — keep the stronger values
			merged.push({
				...ex,
				proficiency: Math.max(ex.proficiency, diag.proficiency),
				confidence: Math.max(ex.confidence, diag.confidence),
				lastUpdatedAt: new Date().toISOString(),
			});
		}
		existingMap.delete(diag.skillId);
	}

	// Keep any existing skills not covered by diagnostic
	for (const [, ex] of existingMap) {
		merged.push(ex);
	}

	return merged;
}

// ── Safe Processing (AC: 3) ────────────────────────────────────────────────

export interface DiagnosticProcessingResult {
	success: boolean;
	baselineScores: BaselineSkillScore[];
	skillStates: UserSkillState[];
	error?: string;
}

/**
 * Safely processes diagnostic results (AC: 3).
 *
 * Never throws — returns a result object with success/error info.
 * Diagnostic failure should not block normal app usage.
 */
export function processDiagnosticSafely(
	result: DiagnosticResult,
	existingStates: UserSkillState[] = [],
): DiagnosticProcessingResult {
	try {
		if (!result.skills || result.skills.length === 0) {
			return {
				success: false,
				baselineScores: [],
				skillStates: existingStates,
				error: "No diagnostic skills provided",
			};
		}

		const baselineScores = diagnosticToBaselineScores(result);
		const diagnosticStates = baselineScoresToSkillStates(result.userId, baselineScores);
		const skillStates = mergeSkillStates(existingStates, diagnosticStates);

		return {
			success: true,
			baselineScores,
			skillStates,
		};
	} catch (err) {
		return {
			success: false,
			baselineScores: [],
			skillStates: existingStates,
			error: err instanceof Error ? err.message : "Unknown diagnostic processing error",
		};
	}
}
