import { headers } from "next/headers";
import { eq, and } from "drizzle-orm";

import { auth } from "@/lib/auth";
import { db } from "@repo/database";
import { readingPassage, readingProgress } from "@repo/database";

/**
 * GET /api/reading/passages/[id]
 * Returns a single passage with read status for the current user.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const userId = session.user.id;

  const [passage] = await db
    .select()
    .from(readingPassage)
    .where(eq(readingPassage.id, id))
    .limit(1);

  if (!passage) {
    return Response.json({ error: "Passage not found" }, { status: 404 });
  }

  // Check read status
  const [progress] = await db
    .select()
    .from(readingProgress)
    .where(and(eq(readingProgress.userId, userId), eq(readingProgress.passageId, id)))
    .limit(1);

  return Response.json({
    id: passage.id,
    title: passage.title,
    body: passage.body,
    cefrLevel: passage.cefrLevel,
    section: passage.section,
    wordCount: passage.wordCount,
    isRead: !!progress,
  });
}
