import { headers } from "next/headers";
import { eq, and } from "drizzle-orm";

import { auth } from "@/lib/auth";
import { db } from "@repo/database";
import { readingPassage, readingProgress } from "@repo/database";

/**
 * POST /api/reading/passages/[id]/read
 * Marks a passage as read for the current user (idempotent).
 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const userId = session.user.id;

  // Verify passage exists
  const [passage] = await db
    .select({ id: readingPassage.id })
    .from(readingPassage)
    .where(eq(readingPassage.id, id))
    .limit(1);

  if (!passage) {
    return Response.json({ error: "Passage not found" }, { status: 404 });
  }

  // Check if already read
  const [existing] = await db
    .select({ id: readingProgress.id })
    .from(readingProgress)
    .where(and(eq(readingProgress.userId, userId), eq(readingProgress.passageId, id)))
    .limit(1);

  if (!existing) {
    await db.insert(readingProgress).values({ userId, passageId: id });
  }

  return Response.json({ success: true });
}
