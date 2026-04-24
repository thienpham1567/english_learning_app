/**
 * Versioned AI Feedback Persistence (Story 25.3, AC: 1-3)
 *
 * Pure functions for creating, versioning, and querying AI feedback runs.
 * No database writes — persistence handled by caller.
 */

import type { FeedbackRun } from "@repo/contracts";

// ── Types ───────────────────────────────────────────────────────────────────

export interface FeedbackRunRecord {
	id: string;
	userId: string;
	moduleType: string;
	sessionId: string;
	version: number;
	input: Record<string, unknown>;
	output: Record<string, unknown>;
	modelId: string;
	promptVersion: string;
	latencyMs: number;
	success: boolean;
	error?: string;
	createdAt: string;
}

// ── Version Computation ─────────────────────────────────────────────────────

/**
 * Computes the next version number for a feedback run (AC: 1).
 * Version is auto-incremented per (userId, moduleType, sessionId).
 */
export function computeNextVersion(existingRuns: FeedbackRunRecord[]): number {
	if (existingRuns.length === 0) return 1;
	const maxVersion = Math.max(...existingRuns.map((r) => r.version));
	return maxVersion + 1;
}

// ── Create Feedback Run Record (AC: 1) ──────────────────────────────────────

export interface CreateFeedbackRunInput {
	userId: string;
	moduleType: string;
	sessionId: string;
	input: Record<string, unknown>;
	output: Record<string, unknown>;
	modelId: string;
	promptVersion: string;
	latencyMs: number;
	success: boolean;
	error?: string;
	existingRuns?: FeedbackRunRecord[];
}

/**
 * Creates a versioned feedback run record (AC: 1).
 * Pure function — persistence handled by caller.
 */
export function createFeedbackRunRecord(input: CreateFeedbackRunInput): FeedbackRunRecord {
	const version = computeNextVersion(input.existingRuns ?? []);
	return {
		id: `fbr-${input.userId}-${input.sessionId}-v${version}`,
		userId: input.userId,
		moduleType: input.moduleType,
		sessionId: input.sessionId,
		version,
		input: input.input,
		output: input.output,
		modelId: input.modelId,
		promptVersion: input.promptVersion,
		latencyMs: input.latencyMs,
		success: input.success,
		error: input.error,
		createdAt: new Date().toISOString(),
	};
}

// ── Query Helpers (AC: 2) ───────────────────────────────────────────────────

/**
 * Gets the latest feedback run for a session (AC: 2).
 */
export function getLatestRun(runs: FeedbackRunRecord[]): FeedbackRunRecord | null {
	if (runs.length === 0) return null;
	return runs.reduce((latest, run) => run.version > latest.version ? run : latest);
}

/**
 * Gets all successful runs (AC: 2).
 */
export function getSuccessfulRuns(runs: FeedbackRunRecord[]): FeedbackRunRecord[] {
	return runs.filter((r) => r.success);
}

// ── Metrics (AC: 3) ────────────────────────────────────────────────────────

export interface FeedbackRunMetrics {
	totalRuns: number;
	successRate: number;
	avgLatencyMs: number;
	latestVersion: number;
}

/**
 * Computes metrics for a set of feedback runs (AC: 3).
 */
export function computeRunMetrics(runs: FeedbackRunRecord[]): FeedbackRunMetrics {
	if (runs.length === 0) {
		return { totalRuns: 0, successRate: 0, avgLatencyMs: 0, latestVersion: 0 };
	}

	const successful = runs.filter((r) => r.success).length;
	const avgLatency = runs.reduce((sum, r) => sum + r.latencyMs, 0) / runs.length;
	const latestVersion = Math.max(...runs.map((r) => r.version));

	return {
		totalRuns: runs.length,
		successRate: successful / runs.length,
		avgLatencyMs: Math.round(avgLatency),
		latestVersion,
	};
}
