import { db } from "@repo/database";
import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { routeLogger } from "@/lib/logger";

const log = routeLogger("listening/history/[id]");

import type { DialogueTurn, ListeningQuestion } from "@repo/database";
import { listeningExercise } from "@repo/database";

/**
 * GET /api/listening/history/[id]
 *
 * Returns full session detail for replay/review.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const userId = session.user.id;

  try {
    const [exercise] = await db
      .select()
      .from(listeningExercise)
      .where(and(eq(listeningExercise.id, id), eq(listeningExercise.userId, userId)))
      .limit(1);

    if (!exercise) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }

    return Response.json({
      id: exercise.id,
      level: exercise.level,
      exerciseType: exercise.exerciseType,
      mode: exercise.mode,
      score: exercise.score,
      bookmarked: exercise.bookmarked,
      scriptRevealed: exercise.scriptRevealed,
      completedAt: exercise.completedAt,
      createdAt: exercise.createdAt,
      passage: exercise.passage,
      audioUrl: exercise.audioUrl,
      questions: exercise.questions as ListeningQuestion[],
      answers: exercise.answers,
      dialogueTurns: exercise.dialogueTurnsJson as DialogueTurn[] | null,
    });
  } catch (err) {
    log.error({ err }, "listening.history.detail.error");
    return Response.json({ error: "Failed to fetch exercise" }, { status: 500 });
  }
}
