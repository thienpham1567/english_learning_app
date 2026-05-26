import { db, toeicAnswer, toeicAttempt, toeicQuestion } from "@repo/database";
import { and, eq, inArray } from "drizzle-orm";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const [attempt] = await db
    .select()
    .from(toeicAttempt)
    .where(and(eq(toeicAttempt.id, id), eq(toeicAttempt.userId, session.user.id)))
    .limit(1);
  if (!attempt) {
    return Response.json({ error: "Attempt not found" }, { status: 404 });
  }

  const answers = await db.select().from(toeicAnswer).where(eq(toeicAnswer.attemptId, id));

  const questionIds = answers.map((a) => a.questionId);
  const questions = questionIds.length
    ? await db.select().from(toeicQuestion).where(inArray(toeicQuestion.id, questionIds))
    : [];

  return Response.json({ attempt, answers, questions });
}
