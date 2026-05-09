import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@repo/database";
import { toeicAttempt, toeicQuestion, toeicExam } from "@repo/database";
import { and, eq, ne, inArray, sql } from "drizzle-orm";

const BodySchema = z.object({ mode: z.enum(["full", "mini"]) });

const FULL_QUOTAS: Record<number, number> = { 2: 25, 3: 39, 4: 30, 5: 30, 6: 16, 7: 54 };
const MINI_QUOTAS: Record<number, number> = { 2: 13, 3: 20, 4: 15, 5: 15, 6: 8, 7: 29 };

export async function POST(req: Request) {
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session?.user?.id) {
		return Response.json({ error: "Unauthorized" }, { status: 401 });
	}
	const parsed = BodySchema.safeParse(await req.json());
	if (!parsed.success) return Response.json({ error: "Invalid body" }, { status: 400 });
	const userId = session.user.id;
	const { mode } = parsed.data;

	const quotas = mode === "full" ? FULL_QUOTAS : MINI_QUOTAS;

	// Find diagnostic exam to exclude
	const [diag] = await db
		.select()
		.from(toeicExam)
		.where(eq(toeicExam.code, "diagnostic_v1"))
		.limit(1);

	const allQuestions = [];
	for (const [partStr, count] of Object.entries(quotas)) {
		const part = parseInt(partStr, 10);
		const conditions = [eq(toeicQuestion.part, part)];
		if (diag) conditions.push(ne(toeicQuestion.examId, diag.id));
		const rows = await db
			.select()
			.from(toeicQuestion)
			.where(and(...conditions))
			.orderBy(sql`random()`)
			.limit(count);
		allQuestions.push(...rows);
	}

	if (allQuestions.length === 0) {
		return Response.json({ error: "No questions available" }, { status: 404 });
	}

	const [attempt] = await db
		.insert(toeicAttempt)
		.values({
			userId,
			mode: "mock_test",
			examId: null,
			partFilter: null,
			questionCount: allQuestions.length,
		})
		.returning();

	const questions = allQuestions.map((q) => ({
		id: q.id,
		part: q.part,
		questionText: q.questionText,
		passageText: q.passageText,
		options: q.options,
		correctIndex: -1, // hidden during mock
		explanationEn: null,
		explanationVi: null,
		audioUrl: q.audioUrl,
		audioSegments: q.audioSegments,
		imageUrls: q.imageUrls,
		skillIds: q.skillIds,
		topic: q.topic,
		parentId: q.parentId,
		groupOrder: q.groupOrder,
		number: q.number,
		examCode: null,
	}));

	return Response.json({ attemptId: attempt.id, questions, totalQuestions: allQuestions.length });
}
