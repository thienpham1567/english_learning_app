import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@repo/database";
import { toeicSpeakingPrompt, toeicSpeakingSession } from "@repo/database";
import { asc, eq, sql } from "drizzle-orm";
import { assertRateLimit } from "@/lib/toeic/rate-limit";

const BodySchema = z.object({ setCode: z.string().optional() });

export async function POST(req: Request) {
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session?.user?.id) {
		return Response.json({ error: "Unauthorized" }, { status: 401 });
	}
	const parsed = BodySchema.safeParse(await req.json());
	if (!parsed.success) return Response.json({ error: "Invalid body" }, { status: 400 });
	const userId = session.user.id;

	const rl = await assertRateLimit(userId, "speaking_session");
	if (!rl.allowed) {
		return Response.json(
			{ error: `Rate limit exceeded (${rl.usedToday}/${rl.limit} speaking tests today)`, ...rl },
			{ status: 429 },
		);
	}

	let setCode = parsed.data.setCode;
	if (!setCode) {
		const [r] = await db
			.select({ code: toeicSpeakingPrompt.setCode })
			.from(toeicSpeakingPrompt)
			.orderBy(sql`random()`)
			.limit(1);
		if (!r) return Response.json({ error: "No prompts seeded" }, { status: 404 });
		setCode = r.code;
	}

	const prompts = await db
		.select()
		.from(toeicSpeakingPrompt)
		.where(eq(toeicSpeakingPrompt.setCode, setCode))
		.orderBy(asc(toeicSpeakingPrompt.questionNumber));
	if (prompts.length === 0) return Response.json({ error: "Set not found" }, { status: 404 });

	const [s] = await db
		.insert(toeicSpeakingSession)
		.values({ userId, setCode })
		.returning();

	return Response.json({ sessionId: s.id, setCode, prompts });
}
