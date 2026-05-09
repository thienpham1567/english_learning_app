import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@repo/database";
import { toeicQuestion, toeicExam } from "@repo/database";
import { and, eq, sql } from "drizzle-orm";

const QuerySchema = z.object({
	exam: z.string().optional(),
	part: z.string().optional(),
	count: z.coerce.number().int().min(1).max(100).default(10),
	shuffle: z.coerce.boolean().default(true),
	skill: z.string().optional(),
});

export async function GET(req: Request) {
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session?.user?.id) {
		return Response.json({ error: "Unauthorized" }, { status: 401 });
	}

	const url = new URL(req.url);
	const parsed = QuerySchema.safeParse(Object.fromEntries(url.searchParams));
	if (!parsed.success) {
		return Response.json({ error: "Invalid query" }, { status: 400 });
	}
	const params = parsed.data;

	const conditions = [];
	if (params.exam) {
		const [exam] = await db
			.select()
			.from(toeicExam)
			.where(eq(toeicExam.code, params.exam))
			.limit(1);
		if (!exam) return Response.json({ questions: [] });
		conditions.push(eq(toeicQuestion.examId, exam.id));
	}
	if (params.part) {
		const p = parseInt(params.part, 10);
		if (!Number.isNaN(p)) conditions.push(eq(toeicQuestion.part, p));
	}
	if (params.skill) {
		conditions.push(sql`${toeicQuestion.skillIds} @> ${JSON.stringify([params.skill])}::jsonb`);
	}

	const rows = await db
		.select()
		.from(toeicQuestion)
		.where(conditions.length ? and(...conditions) : undefined)
		.orderBy(params.shuffle ? sql`random()` : toeicQuestion.number)
		.limit(params.count);

	return Response.json({ questions: rows });
}
