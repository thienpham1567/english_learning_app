import { headers } from "next/headers";
import { eq, sql, and, gte } from "drizzle-orm";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { db } from "@repo/database";
import { activityLog, errorLog, userPreferences } from "@repo/database";
import { getAllUserSkillStates } from "@repo/database";
import {
  generateDailyPlan,
  candidatesFromDueReviews,
  candidatesFromWeakSkills,
  candidatesFromDefaultActions,
} from "@repo/modules";
import type { TimeBudgetValue } from "@repo/contracts";

const QuerySchema = z.object({
  budget: z.enum(["5", "10", "20"]).default("20"),
});

/**
 * GET /api/study-plan/daily?budget=20
 *
 * Generates an adaptive daily study plan using mastery-based scoring (Story 20.6).
 * Returns: { plan: DailyStudyPlan, stats: { totalXP, level, streak, ... }, legacyTasks: Task[] }
 *
 * The `legacyTasks` field preserves backward compatibility for the Home page (AC: 5).
 */
export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const url = new URL(request.url);
  const parsed = QuerySchema.safeParse({ budget: url.searchParams.get("budget") ?? "20" });
  const timeBudget: TimeBudgetValue = parsed.success ? parsed.data.budget : "20";

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  try {
    // Fetch user data in parallel
    const [prefRows, unresolvedErrors, todayActivities, totalActivities, skillStates] = await Promise.all([
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
      getAllUserSkillStates(userId),
    ]);

    const examMode = (prefRows[0]?.examMode as string) ?? "toeic";
    const errorCount = unresolvedErrors[0]?.count ?? 0;
    const todayModules = new Set(todayActivities.map((a) => a.activityType));
    const totalXP = totalActivities[0]?.totalScore ?? 0;

    // ── Adaptive plan generation (Story 20.6) ──
    const nowMs = Date.now();
    const goalSkillIds = examMode === "ielts"
      ? ["listening", "reading", "writing", "speaking"]
      : ["grammar", "listening", "vocabulary", "reading"];

    // Build candidates from mastery states
    const existingSkillIds = new Set(skillStates.map((s) => s.skillId));
    const masteryStates = skillStates.map((s) => ({
      userId: s.userId,
      skillId: s.skillId,
      proficiency: s.proficiency,
      confidence: s.confidence,
      successStreak: s.successStreak,
      failureStreak: s.failureStreak,
      decayRate: s.decayRate,
      signalCount: s.signalCount,
      lastPracticedAt: s.lastPracticedAt.toISOString(),
      lastUpdatedAt: s.lastUpdatedAt.toISOString(),
      nextReviewAt: s.nextReviewAt.toISOString(),
    }));

    const candidates = [
      ...candidatesFromDueReviews(masteryStates, nowMs),
      ...candidatesFromWeakSkills(masteryStates, nowMs, goalSkillIds),
      ...candidatesFromDefaultActions(existingSkillIds, goalSkillIds),
    ];

    const plan = generateDailyPlan(candidates, timeBudget, nowMs, todayModules);

    // ── Legacy tasks (backward compat, AC: 5) ──
    type Task = { id: string; module: string; label: string; href: string; done: boolean; priority: "high" | "medium" | "low" };
    const legacyTasks: Task[] = plan.items.map((item) => ({
      id: item.id,
      module: item.skillIds[0] ?? "general",
      label: item.title,
      href: item.actionUrl,
      done: item.completed,
      priority: item.priority,
    }));

    // Add error review if any (always show in legacy)
    if (errorCount > 0) {
      legacyTasks.unshift({
        id: "review-errors",
        module: "error-notebook",
        label: `Ôn ${Math.min(errorCount, 10)} lỗi sai`,
        href: "/error-notebook",
        done: false,
        priority: "high",
      });
    }

    // Calculate level from XP
    const level = getLevel(totalXP);
    const completedToday = legacyTasks.filter((t) => t.done).length;

    return Response.json({
      plan,
      tasks: legacyTasks,
      stats: {
        totalXP,
        level: level.name,
        levelNumber: level.number,
        nextLevelXP: level.nextXP,
        currentLevelXP: level.currentXP,
        completedToday,
        totalTasks: legacyTasks.length,
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
