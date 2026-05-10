/**
 * Per-user daily rate limits for expensive TOEIC sessions.
 * Prevents abuse: each AI-graded session costs ~$0.005-0.01 (Whisper + Gemini).
 *
 * Override: set TOEIC_RATE_LIMIT_DISABLED=true in env (dev only).
 */
import { db } from "@repo/database";
import { toeicAttempt, toeicSpeakingSession, toeicWritingSession } from "@repo/database";
import { and, eq, gte, sql } from "drizzle-orm";

export type RateLimitedAction =
	| "mock_test"
	| "speaking_session"
	| "writing_session";

const DAILY_LIMITS: Record<RateLimitedAction, number> = {
	mock_test: 3,
	speaking_session: 5,
	writing_session: 5,
};

function startOfTodayUtc(): Date {
	const d = new Date();
	d.setUTCHours(0, 0, 0, 0);
	return d;
}

export async function assertRateLimit(
	userId: string,
	action: RateLimitedAction,
): Promise<{ allowed: boolean; usedToday: number; limit: number }> {
	if (process.env.TOEIC_RATE_LIMIT_DISABLED === "true") {
		return { allowed: true, usedToday: 0, limit: DAILY_LIMITS[action] };
	}
	const since = startOfTodayUtc();
	const limit = DAILY_LIMITS[action];

	let usedToday = 0;
	if (action === "mock_test") {
		const [r] = await db
			.select({ c: sql<number>`count(*)::int` })
			.from(toeicAttempt)
			.where(
				and(
					eq(toeicAttempt.userId, userId),
					eq(toeicAttempt.mode, "mock_test"),
					gte(toeicAttempt.startedAt, since),
				),
			);
		usedToday = r?.c ?? 0;
	} else if (action === "speaking_session") {
		const [r] = await db
			.select({ c: sql<number>`count(*)::int` })
			.from(toeicSpeakingSession)
			.where(
				and(
					eq(toeicSpeakingSession.userId, userId),
					gte(toeicSpeakingSession.startedAt, since),
				),
			);
		usedToday = r?.c ?? 0;
	} else if (action === "writing_session") {
		const [r] = await db
			.select({ c: sql<number>`count(*)::int` })
			.from(toeicWritingSession)
			.where(
				and(
					eq(toeicWritingSession.userId, userId),
					gte(toeicWritingSession.startedAt, since),
				),
			);
		usedToday = r?.c ?? 0;
	}

	return { allowed: usedToday < limit, usedToday, limit };
}
