import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { db } from "@repo/database";
import { activityLog } from "@repo/database";
import { updateSkillProfile } from "@/lib/adaptive/difficulty";

/**
 * POST /api/dictation/complete
 *
 * Saves dictation session results: awards XP and updates listening skill profile.
 * Body: { scores: number[], avgAccuracy: number }
 */
export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const body = await request.json();
  const { scores, avgAccuracy } = body;

  if (!Array.isArray(scores) || scores.length === 0 || typeof avgAccuracy !== "number") {
    return Response.json({ error: "Invalid body" }, { status: 400 });
  }

  // Award XP: 25 per session
  const xpAmount = 25;
  await db.insert(activityLog).values({
    userId,
    activityType: "voice_practice",
    xpEarned: xpAmount,
    metadata: { mode: "dictation", avgAccuracy, sentenceCount: scores.length, scores },
  });

  // Update listening skill profile based on avg accuracy (0-100 → 0.0-1.0)
  const accuracy = Math.max(0, Math.min(1, avgAccuracy / 100));
  const skillUpdate = await updateSkillProfile(userId, "listening", accuracy);

  return Response.json({
    xpAwarded: xpAmount,
    skillUpdate: {
      cefr: skillUpdate.cefr,
      levelUp: skillUpdate.levelUp,
      newLevel: skillUpdate.newLevel,
    },
  });
}
