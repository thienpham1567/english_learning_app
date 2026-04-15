import { headers } from "next/headers";
import { eq } from "drizzle-orm";

import { auth } from "@/lib/auth";
import { db } from "@repo/database";
import { userStreak } from "@repo/database";
import { getBadges } from "@/lib/daily-challenge/badges";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = await db
    .select()
    .from(userStreak)
    .where(eq(userStreak.userId, session.user.id))
    .limit(1);

  const streak = rows[0] ?? {
    currentStreak: 0,
    bestStreak: 0,
    lastCompletedDate: null,
  };

  return Response.json({
    streak: {
      currentStreak: streak.currentStreak,
      bestStreak: streak.bestStreak,
      lastCompletedDate: streak.lastCompletedDate,
    },
    badges: getBadges(streak.bestStreak),
  });
}
