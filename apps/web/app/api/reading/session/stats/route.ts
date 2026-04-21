import { headers } from "next/headers";
import { eq, and, gte, isNotNull, sql } from "drizzle-orm";

import { auth } from "@/lib/auth";
import { db } from "@repo/database";
import { readingSession } from "@repo/database";

/**
 * GET /api/reading/session/stats
 *
 * Returns reading stats for the progress page (AC3, AC6):
 * - today / thisWeek / thisMonth word counts
 * - current streak (consecutive days with ≥1 completed session)
 * - heatmap data (last 90 days: date → wordCount)
 * - totalWords (all time)
 */
export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const now = new Date();

  // Today/week/month boundaries (UTC)
  const todayStart = new Date(now);
  todayStart.setUTCHours(0, 0, 0, 0);

  const weekStart = new Date(todayStart);
  weekStart.setUTCDate(weekStart.getUTCDate() - weekStart.getUTCDay()); // Sunday

  const monthStart = new Date(todayStart);
  monthStart.setUTCDate(1);

  const ninetyDaysAgo = new Date(todayStart);
  ninetyDaysAgo.setUTCDate(ninetyDaysAgo.getUTCDate() - 90);

  // All completed sessions in the last 90 days
  const sessions = await db
    .select({
      wordCount: readingSession.wordCount,
      completedAt: readingSession.completedAt,
    })
    .from(readingSession)
    .where(
      and(
        eq(readingSession.userId, userId),
        isNotNull(readingSession.completedAt),
        gte(readingSession.completedAt, ninetyDaysAgo),
      ),
    );

  // Aggregate
  let todayWords = 0;
  let weekWords = 0;
  let monthWords = 0;
  const dayMap = new Map<string, number>(); // YYYY-MM-DD → total words

  for (const s of sessions) {
    if (!s.completedAt) continue;
    const d = new Date(s.completedAt);
    const dateKey = d.toISOString().slice(0, 10);
    dayMap.set(dateKey, (dayMap.get(dateKey) || 0) + s.wordCount);

    if (d >= todayStart) todayWords += s.wordCount;
    if (d >= weekStart) weekWords += s.wordCount;
    if (d >= monthStart) monthWords += s.wordCount;
  }

  // All-time total
  const [totalRow] = await db
    .select({ total: sql<number>`COALESCE(SUM(${readingSession.wordCount}), 0)` })
    .from(readingSession)
    .where(
      and(
        eq(readingSession.userId, userId),
        isNotNull(readingSession.completedAt),
      ),
    );
  const totalWords = Number(totalRow?.total) || 0;

  // Streak calculation (consecutive days with completed sessions, ending today or yesterday)
  let streak = 0;
  const checkDate = new Date(todayStart);
  // If no sessions today, start from yesterday
  const todayKey = checkDate.toISOString().slice(0, 10);
  if (!dayMap.has(todayKey)) {
    checkDate.setUTCDate(checkDate.getUTCDate() - 1);
  }
  for (let i = 0; i < 90; i++) {
    const key = checkDate.toISOString().slice(0, 10);
    if (dayMap.has(key)) {
      streak++;
      checkDate.setUTCDate(checkDate.getUTCDate() - 1);
    } else {
      break;
    }
  }

  // Heatmap: last 90 days
  const heatmap: Array<{ date: string; count: number }> = [];
  const cursor = new Date(ninetyDaysAgo);
  while (cursor <= todayStart) {
    const key = cursor.toISOString().slice(0, 10);
    heatmap.push({ date: key, count: dayMap.get(key) || 0 });
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return Response.json({
    todayWords,
    weekWords,
    monthWords,
    totalWords,
    streak,
    heatmap,
  });
}
