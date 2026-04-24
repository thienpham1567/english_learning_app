import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { db, reviewTask, learningEvent, userSkillState } from "@repo/database";
import { completeReview } from "@repo/modules/learning";

// ── Request Schema (AC: 1) ──────────────────────────────────────────────────

const outcomeSchema = z.object({
	taskId: z.string().uuid(),
	outcome: z.enum(["again", "hard", "good", "easy"]),
	durationMs: z.number().int().min(0).default(0),
});

const batchSchema = z.object({
	results: z.array(outcomeSchema).min(1).max(50),
});

// ── Response Types ──────────────────────────────────────────────────────────

interface OutcomeResult {
	taskId: string;
	success: boolean;
	nextActionMessage?: string;
	error?: string;
}

/**
 * POST /api/review/outcome
 *
 * Processes review outcomes from the unified session (Story 22.4).
 * Wires to completeReview() for scheduling + mastery updates.
 * Telemetry failures do NOT discard the learner's task state update (AC: 4).
 */
export async function POST(request: Request) {
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session) {
		return Response.json({ error: "Unauthorized" }, { status: 401 });
	}

	const userId = session.user.id;

	let body: z.infer<typeof batchSchema>;
	try {
		body = batchSchema.parse(await request.json());
	} catch {
		return Response.json({ error: "Invalid request body" }, { status: 400 });
	}

	const results: OutcomeResult[] = [];

	for (const item of body.results) {
		try {
			// 1. Load the review task
			const [task] = await db
				.select()
				.from(reviewTask)
				.where(eq(reviewTask.id, item.taskId))
				.limit(1);

			if (!task || task.userId !== userId) {
				results.push({ taskId: item.taskId, success: false, error: "Task not found" });
				continue;
			}

			// 2. Load existing skill states for mastery update
			const skillStates = new Map<
				string,
				{
					proficiency: number;
					confidence: number;
					successStreak: number;
					failureStreak: number;
					decayRate: number;
					signalCount: number;
					lastPracticedAt: string;
					lastUpdatedAt: string;
					nextReviewAt: string;
				}
			>();

			for (const skillId of task.skillIds) {
				const [state] = await db
					.select()
					.from(userSkillState)
					.where(eq(userSkillState.skillId, skillId))
					.limit(1);
				if (state) {
					skillStates.set(skillId, {
						proficiency: state.proficiency,
						confidence: state.confidence,
						successStreak: state.successStreak,
						failureStreak: state.failureStreak,
						decayRate: state.decayRate,
						signalCount: state.signalCount,
						lastPracticedAt: state.lastPracticedAt.toISOString(),
						lastUpdatedAt: state.lastUpdatedAt.toISOString(),
						nextReviewAt: state.nextReviewAt.toISOString(),
					});
				}
			}

			// Track success streak from previous attempts
			const previousSuccess =
				task.lastOutcome === "good" || task.lastOutcome === "easy"
					? (task.attemptCount > 0 ? Math.min(task.attemptCount, 5) : 0)
					: 0;

			// 3. Compute completion (pure function — AC: 1, 2, 3)
			const completion = completeReview(
				{
					taskId: item.taskId,
					userId,
					sourceType: task.sourceType as Parameters<typeof completeReview>[0]["sourceType"],
					sourceId: task.sourceId,
					skillIds: task.skillIds,
					outcome: item.outcome,
					durationMs: item.durationMs,
					currentEaseFactor: task.easeFactor,
					currentIntervalDays: task.nextIntervalDays,
					currentAttemptCount: task.attemptCount,
					currentPriority: task.priority,
					currentSuccessStreak: previousSuccess,
					dueAtMs: task.dueAt.getTime(),
				},
				skillStates.size > 0 ? skillStates : undefined,
			);

			// 4. Persist task status update (AC: 1) — MUST succeed
			await db
				.update(reviewTask)
				.set({
					lastOutcome: item.outcome,
					attemptCount: completion.schedule.newAttemptCount,
					nextIntervalDays: completion.schedule.nextIntervalDays,
					easeFactor: completion.schedule.newEaseFactor,
					dueAt: new Date(completion.schedule.nextDueMs),
					priority: completion.schedule.newPriority,
					status: completion.taskStatus,
					updatedAt: new Date(),
				})
				.where(eq(reviewTask.id, item.taskId));

			// 5. Telemetry — fire-and-forget (AC: 2, 3, 4)
			// Failures here do NOT erase the learner's answer
			try {
				const evt = completion.learningEvent;
				await db.insert(learningEvent).values({
					userId: evt.userId,
					sessionId: evt.sessionId,
					moduleType: evt.moduleType,
					contentId: evt.contentId,
					skillIds: evt.skillIds,
					attemptId: evt.attemptId,
					eventType: evt.eventType,
					result: evt.result,
					score: evt.score,
					durationMs: evt.durationMs,
					difficulty: evt.difficulty,
					errorTags: evt.errorTags,
					idempotencyKey: `review-${item.taskId}-${completion.schedule.newAttemptCount}`,
				});
			} catch {
				// AC: 4 — telemetry failure does not discard visible answer
				console.warn(`[review/outcome] Telemetry failed for task ${item.taskId} — answer preserved`);
			}

			// 6. Mastery updates — fire-and-forget (AC: 3, 4)
			try {
				for (const update of completion.masteryUpdates) {
					await db
						.update(userSkillState)
						.set({
							proficiency: update.newProficiency,
							lastUpdatedAt: new Date(),
						})
						.where(eq(userSkillState.skillId, update.skillId));
				}
			} catch {
				// AC: 4 — mastery failure does not discard visible answer
				console.warn(`[review/outcome] Mastery update failed for task ${item.taskId} — answer preserved`);
			}

			results.push({
				taskId: item.taskId,
				success: true,
				nextActionMessage: completion.nextActionMessage,
			});
		} catch (err) {
			console.error(`[review/outcome] Error processing task ${item.taskId}:`, err);
			results.push({ taskId: item.taskId, success: false, error: "Processing failed" });
		}
	}

	return Response.json({ results });
}
