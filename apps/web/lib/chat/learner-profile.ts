import { db, diagnosticResult, errorLog, userPreferences, userSkillProfile } from "@repo/database";
import { and, desc, eq, isNotNull, sql } from "drizzle-orm";

import { routeLogger } from "@/lib/logger";

const log = routeLogger("chat/learner-profile");

/** Map an aggregate skill level (1.0–10.0) to a CEFR band. */
function levelToCefr(level: number): "A2" | "B1" | "B2" | "C1" {
  if (level <= 3) return "A2";
  if (level <= 5) return "B1";
  if (level <= 7) return "B2";
  return "C1";
}

/** Latest diagnostic CEFR, or null. Fail-open. */
async function fetchCefr(userId: string): Promise<string | null> {
  try {
    const [diag] = await db
      .select({ cefr: diagnosticResult.overallCefr })
      .from(diagnosticResult)
      .where(eq(diagnosticResult.userId, userId))
      .orderBy(desc(diagnosticResult.completedAt))
      .limit(1);
    if (diag?.cefr) return diag.cefr;

    const rows = await db
      .select({ level: userSkillProfile.currentLevel })
      .from(userSkillProfile)
      .where(eq(userSkillProfile.userId, userId));
    if (rows.length === 0) return null;
    const mean = rows.reduce((sum, r) => sum + r.level, 0) / rows.length;
    return levelToCefr(mean);
  } catch (err) {
    log.warn({ err }, "learner-profile.cefr.failed");
    return null;
  }
}

/** examMode preference, or null. Fail-open. */
async function fetchExamGoal(userId: string): Promise<"toeic" | "ielts" | null> {
  try {
    const [pref] = await db
      .select({ examMode: userPreferences.examMode })
      .from(userPreferences)
      .where(eq(userPreferences.userId, userId))
      .limit(1);
    return pref?.examMode ?? null;
  } catch (err) {
    log.warn({ err }, "learner-profile.examGoal.failed");
    return null;
  }
}

/** Top 3 unresolved grammar-topic weak areas, or []. Fail-open. */
async function fetchWeakAreas(userId: string): Promise<string[]> {
  try {
    const rows = await db
      .select({
        topic: errorLog.grammarTopic,
        count: sql<number>`count(*)`.as("count"),
      })
      .from(errorLog)
      .where(
        and(
          eq(errorLog.userId, userId),
          eq(errorLog.isResolved, false),
          isNotNull(errorLog.grammarTopic),
        ),
      )
      .groupBy(errorLog.grammarTopic)
      .orderBy(desc(sql`count(*)`))
      .limit(3);
    return rows.map((r) => r.topic).filter((t): t is string => Boolean(t));
  } catch (err) {
    log.warn({ err }, "learner-profile.weakAreas.failed");
    return [];
  }
}

/**
 * Build a short "Learner Profile" instruction block from the user's app data.
 * Returns null when no signal is available (new user) so the caller injects nothing.
 * Fail-open: any DB error degrades to omitting that line, never throws.
 */
export async function buildLearnerProfile(userId: string): Promise<string | null> {
  const [cefr, examGoal, weakAreas] = await Promise.all([
    fetchCefr(userId),
    fetchExamGoal(userId),
    fetchWeakAreas(userId),
  ]);

  const lines: string[] = [];
  if (cefr) {
    lines.push(
      `- Level: ${cefr} (CEFR). Calibrate vocabulary and sentence complexity to ~${cefr} (comprehensible input, i+1).`,
    );
  }
  if (examGoal) {
    lines.push(`- Exam goal: ${examGoal.toUpperCase()}. Bias examples toward this when relevant.`);
  }
  if (weakAreas.length > 0) {
    lines.push(
      `- Recurring weak areas: ${weakAreas.join(", ")}. Prioritize these when correcting.`,
    );
  }

  if (lines.length === 0) return null;

  return ["## Learner Profile (adapt to this — do not mention it explicitly)", ...lines].join("\n");
}
