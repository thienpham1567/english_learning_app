import { LearningEventSchema, type LearningEvent } from "@repo/contracts";
import { insertLearningEvent } from "@repo/database";
import { TAXONOMY_VERSION, resolveSkillsForModule } from "./skill-taxonomy";
import type { LearningModuleTypeValue } from "@repo/contracts";

/**
 * Input to the event recorder — the route provides raw data and the recorder
 * validates it, resolves skills, stamps the taxonomy version, and persists.
 */
export interface RecordLearningEventInput {
	userId: string;
	sessionId: string;
	moduleType: LearningModuleTypeValue;
	contentId: string;
	attemptId: string;
	eventType: LearningEvent["eventType"];
	result: LearningEvent["result"];
	score: number | null;
	durationMs: number;
	difficulty: LearningEvent["difficulty"];
	errorTags?: string[];
	aiVersion?: string;
	rubricVersion?: string;
	/** Override auto-resolved skillIds when needed */
	skillIds?: string[];
}

/**
 * Build a deterministic idempotency key from the core identity fields.
 * This ensures client retries don't duplicate rows (AC: 4).
 */
function buildIdempotencyKey(input: RecordLearningEventInput): string {
	return `${input.userId}:${input.moduleType}:${input.contentId}:${input.attemptId}:${input.eventType}`;
}

/**
 * Record a learning event — fire-and-forget safe.
 *
 * 1. Validates the payload against the Story 20.1 contract (AC: 1).
 * 2. Auto-resolves skillIds from taxonomy if not provided (AC: 3 via 20.2).
 * 3. Stamps the current taxonomy version (AC: 5 forward-compat).
 * 4. Persists with idempotency key (AC: 4).
 * 5. Never throws — logs failures (AC: 5).
 *
 * Designed to be called with `void recordLearningEvent(...)` in routes.
 */
export async function recordLearningEvent(
	input: RecordLearningEventInput,
): Promise<{ recorded: boolean; reason?: string }> {
	try {
		// Resolve skills from taxonomy if not explicitly provided
		const skillIds = input.skillIds ?? resolveSkillsForModule(input.moduleType) as string[];

		const payload: LearningEvent = {
			userId: input.userId,
			sessionId: input.sessionId,
			moduleType: input.moduleType,
			contentId: input.contentId,
			skillIds,
			attemptId: input.attemptId,
			eventType: input.eventType,
			result: input.result,
			score: input.score,
			durationMs: input.durationMs,
			difficulty: input.difficulty,
			errorTags: input.errorTags ?? [],
			timestamp: new Date().toISOString(),
			aiVersion: input.aiVersion,
			rubricVersion: input.rubricVersion,
		};

		// Validate against contract (AC: 1)
		const validation = LearningEventSchema.safeParse(payload);
		if (!validation.success) {
			console.warn("[recordLearningEvent] Validation failed:", validation.error.message);
			return { recorded: false, reason: "validation_failed" };
		}

		const idempotencyKey = buildIdempotencyKey(input);

		// Persist (AC: 3 — non-blocking from route perspective when called with void)
		const result = await insertLearningEvent({
			...validation.data,
			taxonomyVersion: TAXONOMY_VERSION.version,
			idempotencyKey,
		});

		return { recorded: result.inserted };
	} catch (err) {
		// AC: 5 — never break the learning action
		console.warn("[recordLearningEvent] Non-fatal error:", err);
		return { recorded: false, reason: "internal_error" };
	}
}
