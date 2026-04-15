import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { db } from "@repo/database";
import { activityLog } from "@repo/database";

/**
 * POST /api/study-sets/complete
 *
 * Awards XP for completing a study set.
 * Body: { topicId: string, sectionsCompleted: number }
 */
export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const body = await request.json();
  const { topicId, sectionsCompleted } = body;

  if (!topicId || typeof sectionsCompleted !== "number") {
    return Response.json({ error: "Invalid body" }, { status: 400 });
  }

  const xpAmount = 30;
  await db.insert(activityLog).values({
    userId,
    activityType: "study_set",
    xpEarned: xpAmount,
    metadata: { topicId, sectionsCompleted },
  });

  return Response.json({ xpAwarded: xpAmount });
}
