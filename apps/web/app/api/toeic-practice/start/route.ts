import { db, reviewTask, toeicAttempt, toeicExam, toeicQuestion } from "@repo/database";
import { and, eq, inArray, lte, sql } from "drizzle-orm";
import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "@/lib/auth";

const BodySchema = z.object({
  mode: z.enum(["practice", "mock_test", "drill"]),
  examCode: z.string().optional(),
  part: z
    .union([z.number().int().min(1).max(7), z.enum(["listening", "reading", "all"])])
    .optional(),
  count: z.number().int().min(1).max(200).default(10),
  /** Filter by a single TOEIC subskill, e.g. "toeic.part5.verb_form". */
  skill: z.string().optional(),
  /** Drill source: "skill" filters by skill, "mistake" pulls from due reviewTask. */
  drillSource: z.enum(["skill", "mistake"]).optional(),
});

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = BodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return Response.json(
      { error: "Invalid body", details: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const body = parsed.data;
  const userId = session.user.id;

  let examIdFilter: string | undefined;

  if (body.examCode && body.mode !== "drill") {
    const [exam] = await db
      .select()
      .from(toeicExam)
      .where(eq(toeicExam.code, body.examCode))
      .limit(1);
    if (!exam) {
      return Response.json({ error: "Exam not found" }, { status: 404 });
    }
    examIdFilter = exam.id;
  }

  let partInClause: number[] | null = null;
  if (typeof body.part === "number") partInClause = [body.part];
  else if (body.part === "listening") partInClause = [1, 2, 3, 4];
  else if (body.part === "reading") partInClause = [5, 6, 7];

  const targetCount =
    body.mode === "mock_test" ? 200 : body.count;

  const conditions = [];
  if (examIdFilter) conditions.push(eq(toeicQuestion.examId, examIdFilter));
  if (partInClause) conditions.push(inArray(toeicQuestion.part, partInClause));
  if (body.skill) {
    conditions.push(sql`${toeicQuestion.skillIds} @> ${JSON.stringify([body.skill])}::jsonb`);
  }

  const isOrderedTest = body.mode === "mock_test";
  let rows: (typeof toeicQuestion.$inferSelect)[];

  if (body.mode === "drill" && body.drillSource === "mistake") {
    // Pull due reviewTasks of sourceType=error_retry, intersect with toeicQuestion
    const due = await db
      .select({ qid: reviewTask.sourceId })
      .from(reviewTask)
      .where(
        and(
          eq(reviewTask.userId, userId),
          eq(reviewTask.sourceType, "error_retry"),
          eq(reviewTask.status, "pending"),
          lte(reviewTask.dueAt, new Date()),
        ),
      )
      .orderBy(reviewTask.dueAt)
      .limit(targetCount * 2);

    if (due.length === 0) {
      return Response.json({ error: "No mistakes due for review" }, { status: 404 });
    }
    rows = await db
      .select()
      .from(toeicQuestion)
      .where(
        inArray(
          toeicQuestion.id,
          due.map((d) => d.qid),
        ),
      )
      .limit(targetCount);
  } else {
    rows = await db
      .select()
      .from(toeicQuestion)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(isOrderedTest ? toeicQuestion.number : sql`random()`)
      .limit(targetCount);
  }

  if (rows.length === 0) {
    return Response.json({ error: "No questions match the filter" }, { status: 404 });
  }

  const [attempt] = await db
    .insert(toeicAttempt)
    .values({
      userId,
      mode: body.mode,
      examId: examIdFilter ?? null,
      partFilter: typeof body.part === "number" ? body.part : null,
      questionCount: rows.length,
    })
    .returning();

  const reveal = body.mode === "practice" || body.mode === "drill";
  const questions = rows.map((q) => ({
    id: q.id,
    part: q.part,
    questionText: q.questionText,
    passageText: q.passageText,
    options: q.options,
    correctIndex: reveal ? q.correctIndex : -1,
    explanationEn: reveal ? q.explanationEn : null,
    explanationVi: reveal ? q.explanationVi : null,
    audioUrl: q.audioUrl,
    audioSegments: q.audioSegments,
    imageUrls: q.imageUrls,
    skillIds: q.skillIds,
    topic: q.topic,
    parentId: q.parentId,
    groupOrder: q.groupOrder,
    number: q.number,
    examCode: body.examCode ?? null,
  }));

  return Response.json({ attemptId: attempt.id, questions });
}
