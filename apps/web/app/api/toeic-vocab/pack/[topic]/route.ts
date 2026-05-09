import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@repo/database";
import { toeicVocab, reviewTask } from "@repo/database";
import { and, asc, eq, inArray } from "drizzle-orm";

export async function GET(
	_req: Request,
	{ params }: { params: Promise<{ topic: string }> },
) {
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session?.user?.id) {
		return Response.json({ error: "Unauthorized" }, { status: 401 });
	}
	const userId = session.user.id;
	const { topic } = await params;

	const words = await db
		.select()
		.from(toeicVocab)
		.where(eq(toeicVocab.topic, topic))
		.orderBy(asc(toeicVocab.frequency));

	if (words.length === 0) {
		return Response.json({ words: [], progress: {} });
	}

	const wordIds = words.map((w) => w.id);
	const progress = await db
		.select()
		.from(reviewTask)
		.where(
			and(
				eq(reviewTask.userId, userId),
				eq(reviewTask.sourceType, "flashcard_review"),
				inArray(reviewTask.sourceId, wordIds),
			),
		);
	const progressById = Object.fromEntries(
		progress.map((p) => [
			p.sourceId,
			{
				status: p.status,
				dueAt: p.dueAt,
				attemptCount: p.attemptCount,
				easeFactor: p.easeFactor,
			},
		]),
	);

	return Response.json({ words, progress: progressById });
}
