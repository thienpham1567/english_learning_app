import { getSkillLabel, TOEIC_SKILLS, type ToeicSkill } from "@repo/contracts";
import { db, reviewTask, toeicVocab, userSkillState } from "@repo/database";
import { and, asc, eq, lte, sql } from "drizzle-orm";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

type PlanItem = {
  id: string;
  title: string;
  reason: string;
  href: string;
  estimatedMinutes: number;
  priority: "high" | "medium" | "low";
  skillId?: string;
};

const PART_5_6_SKILLS = new Set([
  "toeic.part5.verb_form",
  "toeic.part5.preposition",
  "toeic.part5.conjunction",
  "toeic.part5.vocab",
  "toeic.part5.pronoun",
  "toeic.part6.grammar",
  "toeic.part6.discourse",
]);

/**
 * GET /api/toeic-progress/daily-plan?budget=20
 *
 * Returns 3 prioritized TOEIC tasks for today, derived from:
 *   1. Due reviewTask (errors needing replay)
 *   2. Weakest TOEIC subskills (proficiency < 0.5)
 *   3. Default daily action when nothing else applies
 *
 * URLs route into TOEIC sub-modules (grammar drill, vocab learn, mock test).
 */
export async function GET(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  const url = new URL(req.url);
  const budget = parseInt(url.searchParams.get("budget") ?? "20", 10);

  const items: PlanItem[] = [];

  // 1. Due review_task — error_retry intersect TOEIC questions
  const due = await db
    .select({ c: sql<number>`count(*)::int` })
    .from(reviewTask)
    .where(
      and(
        eq(reviewTask.userId, userId),
        eq(reviewTask.status, "pending"),
        lte(reviewTask.dueAt, new Date()),
      ),
    );
  const dueCount = due[0]?.c ?? 0;
  if (dueCount > 0) {
    items.push({
      id: "review-due",
      title: `Ôn ${Math.min(dueCount, 20)} câu cần ôn`,
      reason: "Câu sai + từ vựng tới hạn SRS",
      href: "/error-notebook",
      estimatedMinutes: Math.min(20, dueCount),
      priority: "high",
    });
  }

  // 2. Weakest TOEIC subskill drill
  const states = await db
    .select()
    .from(userSkillState)
    .where(and(eq(userSkillState.userId, userId), sql`${userSkillState.skillId} LIKE 'toeic.%'`))
    .orderBy(asc(userSkillState.proficiency));

  const weakest = states.find((s) => s.proficiency < 0.6) ?? states[0];
  if (weakest) {
    const isPart56 = PART_5_6_SKILLS.has(weakest.skillId);
    const isVocab = weakest.skillId.includes("vocab");
    if (isPart56) {
      items.push({
        id: `drill-${weakest.skillId}`,
        title: `Drill 15 câu ${getSkillLabel(weakest.skillId as ToeicSkill)}`,
        reason: `Mastery ${Math.round(weakest.proficiency * 100)}/100 — yếu nhất hôm nay`,
        href: `/toeic/grammar/drill?skill=${encodeURIComponent(weakest.skillId)}&count=15`,
        estimatedMinutes: 15,
        priority: "high",
        skillId: weakest.skillId,
      });
    } else if (isVocab) {
      items.push({
        id: "vocab-due",
        title: "Học/ôn 15 từ vựng",
        reason: `Mastery ${Math.round(weakest.proficiency * 100)}/100 ở vocab`,
        href: "/toeic/vocab",
        estimatedMinutes: 10,
        priority: "high",
        skillId: weakest.skillId,
      });
    } else {
      // Listening/Reading — point to practice with part filter
      const partMatch = weakest.skillId.match(/part(\d+)/);
      const part = partMatch ? partMatch[1] : "all";
      items.push({
        id: `practice-${weakest.skillId}`,
        title: `Luyện 10 câu ${getSkillLabel(weakest.skillId as ToeicSkill)}`,
        reason: `Mastery ${Math.round(weakest.proficiency * 100)}/100`,
        href: `/toeic/grammar`,
        estimatedMinutes: 15,
        priority: "high",
        skillId: weakest.skillId,
      });
    }
  }

  // 3. Default action: daily vocab top-up if nothing else, or mini mock if user has been studying
  if (items.length < 3) {
    const studiedDays = states.filter((s) => s.signalCount > 0).length;
    if (studiedDays >= 5 && items.every((i) => i.id !== "mock")) {
      items.push({
        id: "mock-mini",
        title: "Mini mock test (100 câu)",
        reason: "Calibrate predicted score",
        href: "/toeic/mock-test",
        estimatedMinutes: 60,
        priority: "medium",
      });
    } else {
      // Pick a random topic pack from vocab
      const [pack] = await db
        .select({ topic: toeicVocab.topic })
        .from(toeicVocab)
        .orderBy(sql`random()`)
        .limit(1);
      if (pack) {
        items.push({
          id: `vocab-${pack.topic}`,
          title: `Học 15 từ chủ đề ${pack.topic}`,
          reason: "Mở rộng vốn từ TOEIC",
          href: `/toeic/vocab/learn?pack=${encodeURIComponent(pack.topic)}&mode=new`,
          estimatedMinutes: 10,
          priority: "medium",
        });
      }
    }
  }

  // Trim to top 3
  const finalItems = items.slice(0, 3);
  const totalMinutes = finalItems.reduce((s, i) => s + i.estimatedMinutes, 0);

  return Response.json({
    items: finalItems,
    totalMinutes,
    budgetRequested: budget,
  });
}
