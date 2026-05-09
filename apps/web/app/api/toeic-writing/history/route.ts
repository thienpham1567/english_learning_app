import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@repo/database";
import { toeicWritingSession } from "@repo/database";
import { and, desc, eq, isNotNull } from "drizzle-orm";

export async function GET() {
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session?.user?.id) {
		return Response.json({ error: "Unauthorized" }, { status: 401 });
	}
	const rows = await db
		.select()
		.from(toeicWritingSession)
		.where(
			and(
				eq(toeicWritingSession.userId, session.user.id),
				isNotNull(toeicWritingSession.completedAt),
			),
		)
		.orderBy(desc(toeicWritingSession.completedAt))
		.limit(20);
	return Response.json({ sessions: rows });
}
