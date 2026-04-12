import { headers } from "next/headers";
import { eq, sql, and, gte } from "drizzle-orm";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { activityLog, errorLog, userPreferences } from "@/lib/db/schema";

/**
 * GET /api/study-plan/daily
 *
 * Generates daily study suggestions based on user data.
 * Returns: { tasks: Task[], stats: { totalXP, level, streak } }
 */
export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  try {
    // Fetch user data in parallel
    const [prefRows, unresolvedErrors, todayActivities, totalActivities] = await Promise.all([
      db.select().from(userPreferences).where(eq(userPreferences.userId, userId)).limit(1),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(errorLog)
        .where(and(eq(errorLog.userId, userId), eq(errorLog.isResolved, false))),
      db
        .select()
        .from(activityLog)
        .where(and(eq(activityLog.userId, userId), gte(activityLog.createdAt, today))),
      db
        .select({
          count: sql<number>`count(*)::int`,
          totalScore: sql<number>`coalesce(sum(score), 0)::int`,
        })
        .from(activityLog)
        .where(eq(activityLog.userId, userId)),
    ]);

    const examMode = (prefRows[0]?.examMode as string) ?? "toeic";
    const errorCount = unresolvedErrors[0]?.count ?? 0;
    const todayModules = new Set(todayActivities.map((a) => a.activityType));
    const totalXP = totalActivities[0]?.totalScore ?? 0;

    // Build tasks
    type Task = { id: string; module: string; label: string; href: string; done: boolean; priority: "high" | "medium" | "low" };
    const tasks: Task[] = [];

    // Priority 1: Review errors if any
    if (errorCount > 0) {
      tasks.push({
        id: "review-errors",
        module: "error-notebook",
        label: `Ôn ${Math.min(errorCount, 10)} lỗi sai`,
        href: "/error-notebook",
        done: false,
        priority: "high",
      });
    }

    // Priority 2: Grammar quiz (most impactful for TOEIC/IELTS)
    tasks.push({
      id: "grammar-quiz",
      module: "grammar-quiz",
      label: examMode === "toeic" ? "10 câu Grammar Part 5" : "10 câu Grammar IELTS",
      href: "/grammar-quiz",
      done: todayModules.has("grammar_quiz"),
      priority: "high",
    });

    // Priority 3: Listening practice
    tasks.push({
      id: "listening",
      module: "listening",
      label: "1 bài luyện nghe",
      href: "/listening",
      done: todayModules.has("listening_practice"),
      priority: "medium",
    });

    // Priority 4: Flashcard review
    tasks.push({
      id: "flashcards",
      module: "flashcards",
      label: "Ôn tập flashcard",
      href: "/flashcards",
      done: todayModules.has("flashcard_review"),
      priority: "medium",
    });

    // Priority 5: Daily challenge
    tasks.push({
      id: "daily-challenge",
      module: "daily-challenge",
      label: "Thử thách hàng ngày",
      href: "/daily-challenge",
      done: todayModules.has("daily_challenge"),
      priority: "medium",
    });

    // Priority 6: Writing or Pronunciation (rotate)
    const dayOfWeek = today.getDay();
    if (dayOfWeek % 2 === 0) {
      tasks.push({
        id: "writing",
        module: "writing-practice",
        label: "1 bài luyện viết",
        href: "/writing-practice",
        done: todayModules.has("writing_practice"),
        priority: "low",
      });
    } else {
      tasks.push({
        id: "pronunciation",
        module: "pronunciation",
        label: "5 câu luyện nói",
        href: "/pronunciation",
        done: todayModules.has("voice_practice"),
        priority: "low",
      });
    }

    // Calculate level from XP
    const level = getLevel(totalXP);
    const completedToday = tasks.filter((t) => t.done).length;

    return Response.json({
      tasks,
      stats: {
        totalXP,
        level: level.name,
        levelNumber: level.number,
        nextLevelXP: level.nextXP,
        currentLevelXP: level.currentXP,
        completedToday,
        totalTasks: tasks.length,
        unresolvedErrors: errorCount,
      },
    });
  } catch (err) {
    console.error("[study-plan/daily] Error:", err);
    return Response.json({ error: "Failed to generate plan" }, { status: 500 });
  }
}

function getLevel(xp: number) {
  const levels = [
    { number: 1, name: "Beginner", minXP: 0, nextXP: 100 },
    { number: 2, name: "Elementary", minXP: 100, nextXP: 300 },
    { number: 3, name: "Pre-Intermediate", minXP: 300, nextXP: 600 },
    { number: 4, name: "Intermediate", minXP: 600, nextXP: 1200 },
    { number: 5, name: "Upper-Intermediate", minXP: 1200, nextXP: 2500 },
    { number: 6, name: "Advanced", minXP: 2500, nextXP: 5000 },
    { number: 7, name: "Master", minXP: 5000, nextXP: 10000 },
  ];

  let current = levels[0];
  for (const l of levels) {
    if (xp >= l.minXP) current = l;
  }
  return { ...current, currentXP: current.minXP };
}
