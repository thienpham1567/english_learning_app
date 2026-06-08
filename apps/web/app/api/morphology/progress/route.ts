import { db, morphemeProgress } from "@repo/database";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import type { MorphemeProgressItem } from "@/lib/morphology/schema";

/**
 * GET /api/morphology/progress
 *
 * Returns the signed-in user's per-morpheme progress, keyed by morphemeId,
 * for rendering catalog completion badges.
 */
export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const rows = await db
    .select()
    .from(morphemeProgress)
    .where(eq(morphemeProgress.userId, session.user.id));

  const progress: Record<string, MorphemeProgressItem> = {};
  for (const row of rows) {
    progress[row.morphemeId] = {
      morphemeId: row.morphemeId,
      status: row.status === "completed" ? "completed" : "in_progress",
      correctCount: row.correctCount,
      totalCount: row.totalCount,
      scorePct: row.scorePct,
      completedAt: row.completedAt ? row.completedAt.toISOString() : null,
      lastStudiedAt: row.lastStudiedAt.toISOString(),
    };
  }

  return Response.json({ progress });
}
