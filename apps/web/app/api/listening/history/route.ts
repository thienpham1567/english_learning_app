import { headers } from "next/headers";
import { eq, and, desc, isNotNull, sql } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@repo/database";
import { listeningExercise } from "@repo/database";

/**
 * GET /api/listening/history
 *
 * Returns paginated list of completed listening exercises.
 * Query params: mode, level, bookmarked, page, pageSize
 */
export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const url = new URL(request.url);
  const mode = url.searchParams.get("mode");
  const level = url.searchParams.get("level");
  const bookmarked = url.searchParams.get("bookmarked");
  const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1", 10));
  const pageSize = Math.min(50, Math.max(1, parseInt(url.searchParams.get("pageSize") ?? "20", 10)));

  try {
    // Build conditions
    const conditions = [
      eq(listeningExercise.userId, userId),
      isNotNull(listeningExercise.completedAt),
    ];
    if (mode) conditions.push(eq(listeningExercise.mode, mode));
    if (level) conditions.push(eq(listeningExercise.level, level));
    if (bookmarked === "true") conditions.push(eq(listeningExercise.bookmarked, true));

    // Count total
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(listeningExercise)
      .where(and(...conditions));

    // Fetch page
    const items = await db
      .select({
        id: listeningExercise.id,
        level: listeningExercise.level,
        exerciseType: listeningExercise.exerciseType,
        mode: listeningExercise.mode,
        score: listeningExercise.score,
        bookmarked: listeningExercise.bookmarked,
        scriptRevealed: listeningExercise.scriptRevealed,
        completedAt: listeningExercise.completedAt,
        createdAt: listeningExercise.createdAt,
      })
      .from(listeningExercise)
      .where(and(...conditions))
      .orderBy(desc(listeningExercise.completedAt))
      .limit(pageSize)
      .offset((page - 1) * pageSize);

    return Response.json({
      items,
      total: count,
      page,
      pageSize,
    });
  } catch (err) {
    console.error("[Listening] History error:", err);
    return Response.json({ error: "Failed to fetch history" }, { status: 500 });
  }
}
