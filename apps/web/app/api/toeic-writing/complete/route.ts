import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@repo/database";
import { toeicWritingResponse, toeicWritingSession } from "@repo/database";
import { and, eq, sql } from "drizzle-orm";
import { rawToScaledWriting } from "@/lib/toeic/writing-grader";
import { awardXP, XP_VALUES } from "@/lib/xp";
import { recordActivityStreak } from "@/lib/streak";

const BodySchema = z.object({ sessionId: z.string().uuid() });

export async function POST(req: Request) {
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session?.user?.id) {
		return Response.json({ error: "Unauthorized" }, { status: 401 });
	}
	const parsed = BodySchema.safeParse(await req.json());
	if (!parsed.success) return Response.json({ error: "Invalid body" }, { status: 400 });
	const { sessionId } = parsed.data;
	const userId = session.user.id;

	const [s] = await db
		.select()
		.from(toeicWritingSession)
		.where(and(eq(toeicWritingSession.id, sessionId), eq(toeicWritingSession.userId, userId)))
		.limit(1);
	if (!s) return Response.json({ error: "Not found" }, { status: 404 });

	const [agg] = await db
		.select({ total: sql<number>`coalesce(sum(${toeicWritingResponse.rawScore}), 0)::int` })
		.from(toeicWritingResponse)
		.where(eq(toeicWritingResponse.sessionId, sessionId));
	const rawSum = agg?.total ?? 0;
	const scaled = rawToScaledWriting(rawSum);

	const completedAt = new Date();
	await db
		.update(toeicWritingSession)
		.set({
			completedAt,
			durationMs: completedAt.getTime() - s.startedAt.getTime(),
			rawScore: rawSum,
			scaledScore: scaled,
		})
		.where(eq(toeicWritingSession.id, sessionId));

	void awardXP(userId, XP_VALUES.TOEIC_WRITING_COMPLETE);
	void recordActivityStreak(userId);

	return Response.json({ rawScore: rawSum, scaledScore: scaled });
}
