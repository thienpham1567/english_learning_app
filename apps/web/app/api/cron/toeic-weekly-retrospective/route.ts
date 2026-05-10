import { NextResponse } from "next/server";
import { db } from "@repo/database";
import {
	learningEvent,
	userSkillState,
	reviewTask,
	errorLog,
	pushSubscription,
} from "@repo/database";
import { and, eq, gte, lte, sql, like, or } from "drizzle-orm";
import webpush from "web-push";
import { generateWeeklyRetrospective } from "@repo/modules";
import { getSkillLabel, type ToeicSkill, TOEIC_SKILLS } from "@repo/contracts";

const VAPID_EMAIL = process.env.VAPID_EMAIL || "mailto:admin@thienglish.app";
let vapidInitialized = false;

function initWebPush() {
	if (vapidInitialized) return;
	const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
	const priv = process.env.VAPID_PRIVATE_KEY;
	if (!pub || !priv) throw new Error("Missing VAPID keys");
	webpush.setVapidDetails(VAPID_EMAIL, pub, priv);
	vapidInitialized = true;
}

/**
 * GET /api/cron/toeic-weekly-retrospective
 * Sunday 20:00 VN time. For each user with TOEIC activity in the last 7 days,
 * compute a retrospective and send push notification.
 */
export async function GET(request: Request) {
	const authHeader = request.headers.get("authorization");
	if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	let pushAvailable = true;
	try {
		initWebPush();
	} catch {
		pushAvailable = false;
	}

	const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
	const weekId = `${new Date().getUTCFullYear()}-W${Math.ceil(((new Date().getTime() - new Date(new Date().getUTCFullYear(), 0, 1).getTime()) / 86400000 + 1) / 7)}`;

	// Find users with any TOEIC activity in last 7 days
	const activeUsers = await db
		.select({
			userId: learningEvent.userId,
			c: sql<number>`count(*)::int`,
		})
		.from(learningEvent)
		.where(
			and(
				gte(learningEvent.createdAt, since),
				like(learningEvent.moduleType, "toeic_%"),
			),
		)
		.groupBy(learningEvent.userId);

	let processed = 0;
	let pushed = 0;
	let failed = 0;

	for (const { userId } of activeUsers) {
		const [events, skillStates, dueTasks, errors] = await Promise.all([
			db
				.select()
				.from(learningEvent)
				.where(
					and(
						eq(learningEvent.userId, userId),
						gte(learningEvent.createdAt, since),
						like(learningEvent.moduleType, "toeic_%"),
					),
				),
			db
				.select()
				.from(userSkillState)
				.where(
					and(
						eq(userSkillState.userId, userId),
						sql`${userSkillState.skillId} LIKE 'toeic.%'`,
					),
				),
			db
				.select({ c: sql<number>`count(*)::int` })
				.from(reviewTask)
				.where(
					and(
						eq(reviewTask.userId, userId),
						eq(reviewTask.status, "pending"),
						lte(reviewTask.dueAt, new Date()),
					),
				),
			db
				.select({ topic: errorLog.grammarTopic, c: sql<number>`count(*)::int` })
				.from(errorLog)
				.where(
					and(
						eq(errorLog.userId, userId),
						or(
							like(errorLog.sourceModule, "toeic-%"),
							eq(errorLog.sourceModule, "mock-test"),
						),
						gte(errorLog.createdAt, since),
					),
				)
				.groupBy(errorLog.grammarTopic)
				.orderBy(sql`count(*) DESC`)
				.limit(1),
		]);

		const moduleCounts: Record<string, number> = {};
		const dayBuckets = new Set<string>();
		let totalDurMs = 0;
		for (const e of events) {
			moduleCounts[e.moduleType] = (moduleCounts[e.moduleType] ?? 0) + 1;
			dayBuckets.add(e.createdAt.toISOString().slice(0, 10));
			totalDurMs += e.durationMs;
		}
		const proficiencies: Record<string, number> = {};
		for (const s of skillStates) {
			if ((TOEIC_SKILLS as readonly string[]).includes(s.skillId)) {
				proficiencies[s.skillId] = s.proficiency;
			}
		}

		const retro = generateWeeklyRetrospective(weekId, {
			completedSessions: events.length,
			totalMinutes: Math.round(totalDurMs / 60000),
			moduleCounts,
			skillProficiencies: proficiencies,
			topRepeatedError: errors[0]?.topic ?? undefined,
			reviewDebtCount: dueTasks[0]?.c ?? 0,
			daysActive: dayBuckets.size,
		});

		processed++;

		if (!pushAvailable || !retro.hasSufficientData) continue;

		const subs = await db
			.select()
			.from(pushSubscription)
			.where(and(eq(pushSubscription.userId, userId), eq(pushSubscription.enabled, true)));

		const strongest = retro.strongestSkill
			? getSkillLabel(retro.strongestSkill as ToeicSkill, "vi")
			: null;
		const weakest = retro.weakestSkill
			? getSkillLabel(retro.weakestSkill as ToeicSkill, "vi")
			: null;

		const title =
			retro.tone === "celebrating"
				? "🎉 Tuần TOEIC tuyệt vời!"
				: retro.tone === "encouraging"
					? "💪 Báo cáo tuần TOEIC"
					: "📊 Tuần này hơi chậm — sẵn sàng?";
		const body = [
			retro.completedActions,
			strongest ? `Mạnh: ${strongest}` : null,
			weakest ? `Cần ôn: ${weakest}` : null,
			retro.nextWeekRecommendation,
		]
			.filter(Boolean)
			.join(" · ");

		const payload = JSON.stringify({
			title,
			body: body.slice(0, 240),
			url: "/toeic/progress",
		});

		for (const sub of subs) {
			try {
				await webpush.sendNotification(
					{
						endpoint: sub.endpoint,
						keys: { p256dh: sub.p256dh, auth: sub.auth },
					},
					payload,
				);
				pushed++;
			} catch {
				failed++;
			}
		}
	}

	return NextResponse.json({ processed, pushed, failed });
}
