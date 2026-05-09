import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@repo/database";
import { toeicSpeakingResponse, toeicSpeakingSession } from "@repo/database";
import { and, eq, sql } from "drizzle-orm";
import { rawToScaledSpeaking } from "@/lib/toeic/speaking-grader";

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
		.from(toeicSpeakingSession)
		.where(
			and(eq(toeicSpeakingSession.id, sessionId), eq(toeicSpeakingSession.userId, userId)),
		)
		.limit(1);
	if (!s) return Response.json({ error: "Not found" }, { status: 404 });

	const [agg] = await db
		.select({ total: sql<number>`coalesce(sum(${toeicSpeakingResponse.rawScore}), 0)::int` })
		.from(toeicSpeakingResponse)
		.where(eq(toeicSpeakingResponse.sessionId, sessionId));
	const rawSum = agg?.total ?? 0;
	const scaled = rawToScaledSpeaking(rawSum);

	const completedAt = new Date();
	await db
		.update(toeicSpeakingSession)
		.set({
			completedAt,
			durationMs: completedAt.getTime() - s.startedAt.getTime(),
			rawScore: rawSum,
			scaledScore: scaled,
		})
		.where(eq(toeicSpeakingSession.id, sessionId));

	return Response.json({ rawScore: rawSum, scaledScore: scaled });
}
