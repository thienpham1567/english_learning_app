import { getSkillLabel, TOEIC_SKILLS, type ToeicSkill } from "@repo/contracts";
import {
  db,
  learningEvent,
  reviewTask,
  toeicAttempt,
  toeicVocab,
  userSkillState,
} from "@repo/database";
import { and, asc, desc, eq, gte, isNotNull, lte, sql } from "drizzle-orm";
import { ArrowRight, Calendar, CheckCircle, Flame, Star, Trophy } from "lucide-react";
import { headers } from "next/headers";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { auth } from "@/lib/auth";
import { bandLabel, computePredictedScore } from "@/lib/toeic/predict";

const PART_5_6_SKILLS = new Set([
  "toeic.part5.verb_form",
  "toeic.part5.preposition",
  "toeic.part5.conjunction",
  "toeic.part5.vocab",
  "toeic.part5.pronoun",
  "toeic.part6.grammar",
  "toeic.part6.discourse",
]);

type PlanItem = {
  id: string;
  title: string;
  reason: string;
  href: string;
  estimatedMinutes: number;
  priority: "high" | "medium" | "low";
};

async function getDailyPlan(userId: string): Promise<PlanItem[]> {
  const items: PlanItem[] = [];

  const dueRow = await db
    .select({ c: sql<number>`count(*)::int` })
    .from(reviewTask)
    .where(
      and(
        eq(reviewTask.userId, userId),
        eq(reviewTask.status, "pending"),
        lte(reviewTask.dueAt, new Date()),
      ),
    );
  const dueCount = dueRow[0]?.c ?? 0;
  if (dueCount > 0) {
    items.push({
      id: "review-due",
      title: `Review ${Math.min(dueCount, 20)} items`,
      reason: "Incorrect items + vocab due",
      href: "/error-notebook",
      estimatedMinutes: Math.min(20, dueCount),
      priority: "high",
    });
  }

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
        title: `15 questions of ${getSkillLabel(weakest.skillId as ToeicSkill)}`,
        reason: `Mastery ${Math.round(weakest.proficiency * 100)}/100 — weakest area`,
        href: `/toeic/grammar/drill?skill=${encodeURIComponent(weakest.skillId)}&count=15`,
        estimatedMinutes: 15,
        priority: "high",
      });
    } else if (isVocab) {
      items.push({
        id: "vocab-weakest",
        title: "Learn 15 vocabulary words",
        reason: `Vocab mastery: ${Math.round(weakest.proficiency * 100)}/100`,
        href: "/toeic/vocab",
        estimatedMinutes: 10,
        priority: "high",
      });
    } else {
      items.push({
        id: `practice-${weakest.skillId}`,
        title: `Practice ${getSkillLabel(weakest.skillId as ToeicSkill)}`,
        reason: `Skill mastery: ${Math.round(weakest.proficiency * 100)}/100`,
        href: "/toeic/practice",
        estimatedMinutes: 15,
        priority: "high",
      });
    }
  }

  if (items.length < 3) {
    items.push({
      id: "extra-practice",
      title: "Practice more TOEIC questions",
      reason: "Keep building your skills",
      href: "/toeic/practice",
      estimatedMinutes: 30,
      priority: "medium",
    });
  }

  return items.slice(0, 3);
}

export async function HubWidgets() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) return null;
  const userId = session.user.id;

  const [dueAll, todayCount, statesAll, lastMockArr, planItems] = await Promise.all([
    db
      .select({ c: sql<number>`count(*)::int` })
      .from(reviewTask)
      .where(
        and(
          eq(reviewTask.userId, userId),
          eq(reviewTask.status, "pending"),
          lte(reviewTask.dueAt, new Date()),
        ),
      ),
    (() => {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      return db
        .select({ c: sql<number>`count(*)::int` })
        .from(learningEvent)
        .where(
          and(
            eq(learningEvent.userId, userId),
            gte(learningEvent.createdAt, todayStart),
            sql`${learningEvent.moduleType} LIKE 'toeic_%'`,
          ),
        );
    })(),
    db.select().from(userSkillState).where(eq(userSkillState.userId, userId)),
    db
      .select()
      .from(toeicAttempt)
      .where(
        and(
          eq(toeicAttempt.userId, userId),
          eq(toeicAttempt.mode, "mock_test"),
          isNotNull(toeicAttempt.completedAt),
        ),
      )
      .orderBy(desc(toeicAttempt.completedAt))
      .limit(1),
    getDailyPlan(userId),
  ]);
  const dueCount = dueAll[0]?.c ?? 0;
  const todayActivity = todayCount[0]?.c ?? 0;
  const toeicStates = statesAll.filter((s) =>
    (TOEIC_SKILLS as readonly string[]).includes(s.skillId),
  );
  const predicted = computePredictedScore(toeicStates);
  const lastMock = lastMockArr[0];

  const priorityColors = (p: PlanItem["priority"]) =>
    p === "high"
      ? {
          bg: "color-mix(in srgb, var(--error) 8%, transparent)",
          text: "var(--error)",
          border: "color-mix(in srgb, var(--error) 20%, transparent)",
        }
      : p === "medium"
        ? {
            bg: "color-mix(in srgb, var(--warning) 8%, transparent)",
            text: "var(--warning)",
            border: "color-mix(in srgb, var(--warning) 20%, transparent)",
          }
        : { bg: "var(--surface-alt)", text: "var(--text-muted)", border: "var(--border)" };

  return (
    <div className="grid gap-4">
      {/* Daily Plan — full width on top */}
      <Card shadowSize="sm" className="p-[18px]">
        <div className="flex justify-between items-center mb-3.5">
          <h3 className="m-0 font-black text-text-primary flex items-center gap-1.5 text-[15.5px]">
            <Calendar className="text-accent w-4.5 h-4.5" />
            <span>🎯 Recommended for Today</span>
          </h3>
          <span className="text-[11px] text-text-muted font-extrabold rounded-md bg-surface-alt border-2 border-border px-2 py-0.5">
            {planItems.reduce((s, i) => s + i.estimatedMinutes, 0)} mins estimated
          </span>
        </div>

        {planItems.length === 0 ? (
          <div className="text-text-muted text-[13px] font-medium py-2">
            Start practicing to receive personalized study recommendations.
          </div>
        ) : (
          <div className="grid gap-2.5">
            {planItems.map((item) => {
              const colorSet = priorityColors(item.priority);
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className="grid gap-3 items-center rounded-lg bg-surface-alt text-text-primary grid-cols-[auto_1fr_auto] p-3 px-3.5 border-2 border-border no-underline transition-all duration-150 hover:border-accent"
                >
                  <span
                    className="text-[10.5px] font-black rounded-md px-2 py-0.5 border"
                    style={{
                      background: colorSet.bg,
                      color: colorSet.text,
                      borderColor: colorSet.border,
                    }}
                  >
                    {item.estimatedMinutes}m
                  </span>
                  <div>
                    <div className="font-extrabold text-[13.5px]">{item.title}</div>
                    <div className="text-text-muted font-medium text-[11.5px] mt-[1px]">
                      {item.reason}
                    </div>
                  </div>
                  <ArrowRight className="text-accent text-xs" />
                </Link>
              );
            })}
          </div>
        )}
      </Card>

      {/* Status widgets grid */}
      <div className="grid gap-3 grid-cols-[repeat(auto-fit,minmax(210px,1fr))]">
        {/* Predicted Score Card */}
        <Card shadowSize="sm" className="flex-col justify-between gap-3 p-[18px]">
          <div>
            <span className="text-[11px] uppercase text-text-secondary font-[850] tracking-[0.06em]">
              📈 Predicted Score
            </span>
            {predicted ? (
              <div className="mt-2">
                <div className="text-text-primary font-display text-[26px] font-[950] leading-[1.1]">
                  {predicted.total}
                </div>
                <div className="text-xs text-text-muted font-[650] mt-0.5">
                  {bandLabel(predicted.total)}
                </div>
              </div>
            ) : (
              <div className="text-text-muted mt-3 text-[12.5px] font-[650]">
                Need mock test data
              </div>
            )}
          </div>
          {predicted && (
            <Link
              href="/toeic/practice"
              className="text-accent text-xs font-extrabold no-underline hover:underline"
            >
              View detailed chart →
            </Link>
          )}
        </Card>

        {/* Practice CTA Card */}
        <Card shadowSize="sm" className="flex-col justify-between gap-3 p-[18px]">
          <div>
            <span className="text-[11px] uppercase text-text-secondary font-[850] tracking-[0.06em]">
              🎯 TOEIC Practice
            </span>
            <div className="text-text-muted mt-3 text-[12.5px] font-[650]">
              Keep practicing to improve your score
            </div>
          </div>
          <Link
            href="/toeic/practice"
            className="text-accent text-xs font-extrabold no-underline hover:underline"
          >
            Start practice →
          </Link>
        </Card>

        {/* Activity Card */}
        <Card shadowSize="sm" className="flex-col justify-between gap-3 p-[18px]">
          <div>
            <span className="text-[11px] uppercase text-text-secondary font-[850] tracking-[0.06em]">
              🔥 Today's Activity
            </span>
            <div className="mt-2">
              <div className="text-text-primary font-display text-[26px] font-[950] leading-[1.1]">
                {todayActivity}
              </div>
              <div className="text-xs text-text-muted font-[650] mt-0.5">
                {todayActivity === 0 ? "No practice today" : "Keep the streak alive 🔥"}
              </div>
            </div>
          </div>
          <Link
            href="/toeic/practice"
            className="text-accent text-xs font-extrabold no-underline hover:underline"
          >
            Practice new exam →
          </Link>
        </Card>

        {/* Due Tasks Card */}
        <Card shadowSize="sm" className="flex-col justify-between gap-3 p-[18px]">
          <div>
            <span className="text-[11px] uppercase text-text-secondary font-[850] tracking-[0.06em]">
              📚 Review Queue
            </span>
            <div className="mt-2">
              <div className="text-text-primary font-display text-[26px] font-[950] leading-[1.1]">
                {dueCount} <span className="text-sm text-text-muted font-bold">questions</span>
              </div>
            </div>
          </div>
          {dueCount > 0 ? (
            <Link
              href="/error-notebook"
              className="text-destructive text-xs font-extrabold no-underline hover:underline"
            >
              Review now →
            </Link>
          ) : (
            <span className="text-text-muted text-xs font-extrabold">
              Clean queue, no incorrect questions!
            </span>
          )}
        </Card>
      </div>
    </div>
  );
}
