import {
  db,
  toeicAnswer,
  toeicAttempt,
} from "@repo/database";
import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "@/lib/auth";

const BodySchema = z.object({
  attemptId: z.string().uuid(),
});

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = BodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return Response.json({ error: "Invalid body" }, { status: 400 });
  }
  const { attemptId } = parsed.data;
  const userId = session.user.id;

  const [attempt] = await db
    .select()
    .from(toeicAttempt)
    .where(and(eq(toeicAttempt.id, attemptId), eq(toeicAttempt.userId, userId)))
    .limit(1);
  if (!attempt) {
    return Response.json({ error: "Attempt not found" }, { status: 404 });
  }
  if (attempt.completedAt) {
    const answers = await db.select().from(toeicAnswer).where(eq(toeicAnswer.attemptId, attemptId));
    const correct = answers.filter((a) => a.isCorrect === true).length;
    return Response.json({
      alreadyCompleted: true,
      correct,
      total: attempt.questionCount,
      baselineSnapshot: attempt.baselineSnapshot ?? null,
    });
  }

  const answers = await db.select().from(toeicAnswer).where(eq(toeicAnswer.attemptId, attemptId));
  const correct = answers.filter((a) => a.isCorrect === true).length;
  const total = attempt.questionCount;

  let baselineSnapshot: Record<string, number> | null = null;


  const completedAt = new Date();
  const startedAtMs = attempt.startedAt.getTime();
  await db
    .update(toeicAttempt)
    .set({
      completedAt,
      durationMs: completedAt.getTime() - startedAtMs,
      baselineSnapshot,
    })
    .where(eq(toeicAttempt.id, attemptId));

  return Response.json({ correct, total, baselineSnapshot });
}
