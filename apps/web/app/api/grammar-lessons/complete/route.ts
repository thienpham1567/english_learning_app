import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { db } from "@repo/database";
import { activityLog } from "@repo/database";

/**
 * POST /api/grammar-lessons/complete
 *
 * Awards XP for completing a grammar lesson.
 * Body: { topic: string, correctCount: number, totalCount: number }
 */
export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const body = await request.json();
  const { topic, correctCount, totalCount } = body;

  if (!topic || typeof correctCount !== "number" || typeof totalCount !== "number") {
    return Response.json({ error: "Invalid body" }, { status: 400 });
  }

  const xpAmount = 15;
  await db.insert(activityLog).values({
    userId,
    activityType: "grammar_lesson",
    xpEarned: xpAmount,
    metadata: { topic, correctCount, totalCount },
  });

  return Response.json({ xpAwarded: xpAmount });
}
