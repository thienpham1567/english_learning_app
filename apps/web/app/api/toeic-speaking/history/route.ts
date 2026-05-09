import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@repo/database";
import { toeicSpeakingSession } from "@repo/database";
import { and, desc, eq, isNotNull } from "drizzle-orm";

export async function GET() {
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session?.user?.id) {
		return Response.json({ error: "Unauthorized" }, { status: 401 });
	}
	const rows = await db
		.select()
		.from(toeicSpeakingSession)
		.where(
			and(
				eq(toeicSpeakingSession.userId, session.user.id),
				isNotNull(toeicSpeakingSession.completedAt),
			),
		)
		.orderBy(desc(toeicSpeakingSession.completedAt))
		.limit(20);
	return Response.json({ sessions: rows });
}
