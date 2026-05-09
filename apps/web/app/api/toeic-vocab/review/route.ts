import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@repo/database";
import { toeicVocab, reviewTask } from "@repo/database";
import { and, eq, sql } from "drizzle-orm";
import { computeReschedule, computeInitialSchedule, recordLearningEvent } from "@repo/modules";

const BodySchema = z.object({
	wordId: z.string().uuid(),
	outcome: z.enum(["again", "hard", "good", "easy"]),
	durationMs: z.number().int().min(0).default(0),
});

export async function POST(req: Request) {
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session?.user?.id) {
		return Response.json({ error: "Unauthorized" }, { status: 401 });
	}
	const parsed = BodySchema.safeParse(await req.json());
	if (!parsed.success) {
		return Response.json({ error: "Invalid body" }, { status: 400 });
	}
	const { wordId, outcome, durationMs } = parsed.data;
	const userId = session.user.id;

	const [word] = await db.select().from(toeicVocab).where(eq(toeicVocab.id, wordId)).limit(1);
	if (!word) return Response.json({ error: "Word not found" }, { status: 404 });

	const [existing] = await db
		.select()
		.from(reviewTask)
		.where(
			and(
				eq(reviewTask.userId, userId),
				eq(reviewTask.sourceType, "flashcard_review"),
				eq(reviewTask.sourceId, wordId),
			),
		)
		.limit(1);

	const now = new Date();
	if (existing) {
		const sched = computeReschedule(
			outcome,
			existing.easeFactor,
			existing.nextIntervalDays,
			existing.attemptCount,
			existing.priority,
			existing.dueAt.getTime(),
			now.getTime(),
		);
		await db
			.update(reviewTask)
			.set({
				lastOutcome: outcome,
				attemptCount: sched.newAttemptCount,
				nextIntervalDays: sched.nextIntervalDays,
				easeFactor: sched.newEaseFactor,
				priority: sched.newPriority,
				dueAt: new Date(sched.nextDueAt),
				status: outcome === "again" || outcome === "hard" ? "pending" : "pending",
				updatedAt: now,
			})
			.where(eq(reviewTask.id, existing.id));
	} else {
		const init = computeInitialSchedule("flashcard_review", now.getTime());
		await db.insert(reviewTask).values({
			userId,
			sourceType: "flashcard_review",
			sourceId: wordId,
			skillIds: ["toeic.part5.vocab", "toeic.part7.vocab_in_context"],
			priority: init.priority,
			dueAt: new Date(init.dueAt),
			estimatedMinutes: init.estimatedMinutes,
			reviewMode: init.reviewMode,
			status: "pending",
			lastOutcome: outcome,
			attemptCount: 1,
			nextIntervalDays: init.dueAt && now.getTime() ? 1 : 0,
			easeFactor: 2.5,
		});
	}

	// Emit learning event for dashboard / mastery tracking
	const result = outcome === "again" ? "incorrect" : outcome === "hard" ? "partial" : "correct";
	const score = outcome === "again" ? 0 : outcome === "hard" ? 0.5 : outcome === "good" ? 0.85 : 1;
	void recordLearningEvent({
		userId,
		sessionId: `vocab:${wordId}`,
		moduleType: "toeic_vocab",
		contentId: wordId,
		skillIds: ["toeic.part5.vocab", "toeic.part7.vocab_in_context"],
		attemptId: `vocab-${userId}-${wordId}-${now.getTime()}`,
		eventType: "review_completed",
		result,
		score,
		durationMs,
		difficulty: word.level === "beginner" ? "elementary" : word.level === "advanced" ? "advanced" : "intermediate",
		errorTags: [],
	});

	return Response.json({ ok: true });
}
