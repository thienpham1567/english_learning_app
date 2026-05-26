import { db, reviewTask, toeicVocab } from "@repo/database";
import { and, asc, eq, inArray, lte } from "drizzle-orm";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  const dueTasks = await db
    .select()
    .from(reviewTask)
    .where(
      and(
        eq(reviewTask.userId, userId),
        eq(reviewTask.sourceType, "flashcard_review"),
        eq(reviewTask.status, "pending"),
        lte(reviewTask.dueAt, new Date()),
      ),
    )
    .orderBy(asc(reviewTask.dueAt))
    .limit(50);

  if (dueTasks.length === 0) {
    return Response.json({ words: [] });
  }

  const wordIds = dueTasks.map((t) => t.sourceId);
  const wordsRows = await db.select().from(toeicVocab).where(inArray(toeicVocab.id, wordIds));
  const byId = new Map(wordsRows.map((w) => [w.id, w]));
  const words = wordIds.map((id) => byId.get(id)).filter(Boolean);

  return Response.json({ words });
}
