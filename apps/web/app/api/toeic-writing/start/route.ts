import { db, toeicWritingPrompt, toeicWritingSession } from "@repo/database";
import { asc, eq, sql } from "drizzle-orm";
import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "@/lib/auth";
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

  const rl = await assertRateLimit(userId, "writing_session");
  if (!rl.allowed) {
    return Response.json(
      { error: `Rate limit exceeded (${rl.usedToday}/${rl.limit} writing tests today)`, ...rl },
      { status: 429 },
    );
  }

  let setCode = parsed.data.setCode;
  if (!setCode) {
    const [r] = await db
      .select({ code: toeicWritingPrompt.setCode })
      .from(toeicWritingPrompt)
      .orderBy(sql`random()`)
      .limit(1);
    if (!r) return Response.json({ error: "No prompts seeded" }, { status: 404 });
    setCode = r.code;
  }

  const prompts = await db
    .select()
    .from(toeicWritingPrompt)
    .where(eq(toeicWritingPrompt.setCode, setCode))
    .orderBy(asc(toeicWritingPrompt.questionNumber));
  if (prompts.length === 0) return Response.json({ error: "Set not found" }, { status: 404 });

  const [s] = await db.insert(toeicWritingSession).values({ userId, setCode }).returning();

  return Response.json({ sessionId: s.id, setCode, prompts });
}
