import { headers } from "next/headers";
import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@repo/database";
import { listeningExercise } from "@repo/database";

const BookmarkSchema = z.object({
  exerciseId: z.string().uuid(),
  bookmarked: z.boolean(),
});

/**
 * POST /api/listening/bookmark
 *
 * Toggle bookmark status on a listening exercise.
 */
export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = BookmarkSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: "Invalid input" }, { status: 400 });
    }

    const { exerciseId, bookmarked } = parsed.data;
    const userId = session.user.id;

    const [updated] = await db
      .update(listeningExercise)
      .set({ bookmarked })
      .where(and(eq(listeningExercise.id, exerciseId), eq(listeningExercise.userId, userId)))
      .returning({ id: listeningExercise.id, bookmarked: listeningExercise.bookmarked });

    if (!updated) {
      return Response.json({ error: "Exercise not found" }, { status: 404 });
    }

    return Response.json({ id: updated.id, bookmarked: updated.bookmarked });
  } catch (err) {
    console.error("[Listening] Bookmark error:", err);
    return Response.json({ error: "Failed to update bookmark" }, { status: 500 });
  }
}
