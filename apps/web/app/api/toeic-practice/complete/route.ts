import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@repo/database";
import {
	toeicAnswer,
	toeicAttempt,
	toeicQuestion,
	onboardingBaseline,
	userSkillState,
} from "@repo/database";
import { and, eq, inArray } from "drizzle-orm";
import { TOEIC_SKILLS } from "@repo/contracts";

const BodySchema = z.object({
	attemptId: z.string().uuid(),
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
	const { attemptId } = parsed.data;
	const userId = session.user.id;

	const [attempt] = await db
		.select()
		.from(toeicAttempt)
		.where(and(eq(toeicAttempt.id, attemptId), eq(toeicAttempt.userId, userId)))
		.limit(1);
	if (!attempt) {
		return Response.json({ error: "Attempt not found" }, { status: 404 });
	}
	if (attempt.completedAt) {
		const answers = await db
			.select()
			.from(toeicAnswer)
			.where(eq(toeicAnswer.attemptId, attemptId));
		const correct = answers.filter((a) => a.isCorrect === true).length;
		return Response.json({
			alreadyCompleted: true,
			correct,
			total: attempt.questionCount,
			baselineSnapshot: attempt.baselineSnapshot ?? null,
		});
	}

	const answers = await db
		.select()
		.from(toeicAnswer)
		.where(eq(toeicAnswer.attemptId, attemptId));
	const correct = answers.filter((a) => a.isCorrect === true).length;
	const total = attempt.questionCount;

	let baselineSnapshot: Record<string, number> | null = null;

	if (attempt.mode === "diagnostic") {
		const questionIds = answers.map((a) => a.questionId);
		const questions = questionIds.length
			? await db.select().from(toeicQuestion).where(inArray(toeicQuestion.id, questionIds))
			: [];
		const byId = new Map(questions.map((q) => [q.id, q]));

		const skillStats = new Map<string, { correct: number; total: number }>();
		for (const a of answers) {
			const q = byId.get(a.questionId);
			if (!q) continue;
			for (const s of q.skillIds) {
				const cur = skillStats.get(s) ?? { correct: 0, total: 0 };
				cur.total++;
				if (a.isCorrect === true) cur.correct++;
				skillStats.set(s, cur);
			}
		}

		baselineSnapshot = {};
		for (const skill of TOEIC_SKILLS) {
			const stats = skillStats.get(skill);
			baselineSnapshot[skill] =
				stats && stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 50;
		}

		const baselineScores = Object.entries(baselineSnapshot).map(([skillId, score]) => ({
			skillId,
			score,
			confidence: skillStats.get(skillId)?.total ? 0.7 : 0.2,
		}));

		const [existing] = await db
			.select()
			.from(onboardingBaseline)
			.where(eq(onboardingBaseline.userId, userId))
			.limit(1);

		if (existing) {
			const kept = (existing.baselineScores ?? []).filter(
				(b) => !b.skillId.startsWith("toeic."),
			);
			await db
				.update(onboardingBaseline)
				.set({
					baselineScores: [...kept, ...baselineScores],
					updatedAt: new Date(),
				})
				.where(eq(onboardingBaseline.userId, userId));
		} else {
			await db.insert(onboardingBaseline).values({
				userId,
				primaryGoal: "exam_prep",
				dailyTimeBudgetMinutes: "30",
				preferredLearningStyle: "mixed",
				baselineScores,
				placementSkipped: false,
			});
		}

		// Seed userSkillState for all 25 TOEIC skills
		for (const [skillId, score] of Object.entries(baselineSnapshot)) {
			const proficiency = score / 100;
			const stats = skillStats.get(skillId);
			await db
				.insert(userSkillState)
				.values({
					userId,
					skillId,
					proficiency,
					confidence: stats?.total ? 0.7 : 0.2,
					signalCount: stats?.total ?? 0,
				})
				.onConflictDoUpdate({
					target: [userSkillState.userId, userSkillState.skillId],
					set: { proficiency, lastUpdatedAt: new Date() },
				});
		}
	}

	const completedAt = new Date();
	const startedAtMs = attempt.startedAt.getTime();
	await db
		.update(toeicAttempt)
		.set({
			completedAt,
			durationMs: completedAt.getTime() - startedAtMs,
			baselineSnapshot,
		})
		.where(eq(toeicAttempt.id, attemptId));

	return Response.json({ correct, total, baselineSnapshot });
}
