import { headers } from "next/headers";
import { eq, and, sql } from "drizzle-orm";

import { auth } from "@/lib/auth";
import { db } from "@repo/database";
import { errorLog } from "@repo/database";

/**
 * GET /api/review-quiz/due
 *
 * Returns unresolved errors that are due for SRS review.
 * Logic: nextReviewAt <= now OR nextReviewAt IS NULL (new errors, first review due after 24h)
 */
export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();

  const dueErrors = await db
    .select()
    .from(errorLog)
    .where(
      and(
        eq(errorLog.userId, session.user.id),
        eq(errorLog.isResolved, false),
        sql`(${errorLog.nextReviewAt} IS NULL AND ${errorLog.createdAt} <= ${now}::timestamptz - interval '24 hours')
            OR (${errorLog.nextReviewAt} IS NOT NULL AND ${errorLog.nextReviewAt} <= ${now}::timestamptz)`,
      ),
    )
    .orderBy(errorLog.createdAt)
    .limit(10);

  return Response.json({
    dueCount: dueErrors.length,
    errors: dueErrors,
  });
}
