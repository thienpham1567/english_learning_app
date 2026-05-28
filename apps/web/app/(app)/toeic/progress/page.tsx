import { getSkillLabel, TOEIC_SKILLS, type ToeicSkill } from "@repo/contracts";
import { db, errorLog, learningEvent, toeicAttempt, userSkillState } from "@repo/database";
import { summarizeErrorPatterns } from "@repo/modules";
import { and, desc, eq, gte, isNotNull, like, or, sql } from "drizzle-orm";
import { AlertTriangle, ArrowRight, TrendingDown, TrendingUp, Trophy, Zap } from "lucide-react";
import { headers } from "next/headers";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { bandLabel, computePredictedScore } from "@/lib/toeic/predict";
import { requireToeicBaseline } from "@/lib/toeic/require-baseline";
import { RoadmapBanner } from "@/components/shared/RoadmapBanner";
import { Card } from "@/components/ui/card";

export default async function ToeicProgressPage() {
  await requireToeicBaseline();
  const session = await auth.api.getSession({ headers: await headers() });
  const userId = session!.user!.id;

  const states = await db.select().from(userSkillState).where(eq(userSkillState.userId, userId));
  const toeicStates = states.filter((s) => (TOEIC_SKILLS as readonly string[]).includes(s.skillId));
  const predicted = computePredictedScore(toeicStates);

  const sortedByProf = [...toeicStates].sort((a, b) => a.proficiency - b.proficiency);
  const weakest = sortedByProf.slice(0, 5);
  const strongest = sortedByProf.slice(-5).reverse();

  const [lastMock] = await db
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
    .limit(1);

  // 30-day trend
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const trend = await db
    .select({
      day: sql<string>`DATE(${learningEvent.createdAt})`,
      c: sql<number>`count(*)::int`,
    })
    .from(learningEvent)
    .where(
      and(
        eq(learningEvent.userId, userId),
        gte(learningEvent.createdAt, since),
        sql`${learningEvent.moduleType} LIKE 'toeic_%'`,
      ),
    )
    .groupBy(sql`DATE(${learningEvent.createdAt})`)
    .orderBy(sql`DATE(${learningEvent.createdAt})`);

  const maxCount = trend.reduce((m, r) => Math.max(m, r.c), 1);

  // Error patterns from TOEIC errors (last 30 days)
  const errorRows = await db
    .select()
    .from(errorLog)
    .where(
      and(
        eq(errorLog.userId, userId),
        or(like(errorLog.sourceModule, "toeic-%"), eq(errorLog.sourceModule, "mock-test")),
        gte(errorLog.createdAt, since),
      ),
    )
    .orderBy(desc(errorLog.createdAt))
    .limit(200);

  const patterns = summarizeErrorPatterns(
    errorRows.map((e) => ({
      id: e.id,
      sourceModule: e.sourceModule,
      grammarTopic: e.grammarTopic,
      questionStem: e.questionStem,
      userAnswer: e.userAnswer,
      correctAnswer: e.correctAnswer,
      isResolved: e.isResolved,
      createdAt: e.createdAt.toISOString(),
    })),
  ).slice(0, 5);

  return (
    <div className="flex flex-col h-full min-h-0 flex-1 overflow-auto">
      <div className="p-5 pb-16 max-w-[900px] mx-auto w-full flex flex-col gap-5">
        <RoadmapBanner />
        {/* Predicted Score Card */}
        <Card shadowSize="sm" className="p-0 overflow-hidden relative">
          <div
            className="absolute top-0 left-0 right-0 h-[3px]"
            style={{
              background: "linear-gradient(90deg, var(--accent), var(--secondary), var(--info))",
            }}
          />

          {predicted ? (
            <div className="p-6">
              <div className="flex items-center gap-6 flex-wrap">
                {/* Score circle */}
                <div className="relative w-[110px] h-[110px] shrink-0">
                  <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                    <circle
                      cx="50"
                      cy="50"
                      r="42"
                      fill="none"
                      stroke="var(--border)"
                      strokeWidth="7"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="42"
                      fill="none"
                      stroke="var(--accent)"
                      strokeWidth="7"
                      strokeLinecap="round"
                      strokeDasharray={`${Math.round((predicted.total / 990) * 264)} 264`}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-black text-ink font-display">
                      {predicted.total}
                    </span>
                    <span className="text-[9px] font-bold text-text-muted">/ 990</span>
                  </div>
                </div>

                {/* Score breakdown */}
                <div className="flex-1 min-w-[200px]">
                  <div className="text-lg font-black text-ink font-display mb-1">
                    Predicted TOEIC Score
                  </div>
                  <span className="text-[10px] font-extrabold rounded-lg bg-amber-500/10 text-amber-600 border border-amber-500/20 px-2.5 py-0.5">
                    {bandLabel(predicted.total)}
                  </span>

                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div className="bg-surface-alt border-2 border-border rounded-xl p-3 text-center">
                      <div className="text-[10px] font-extrabold text-text-muted uppercase tracking-wider">
                        Listening
                      </div>
                      <div className="text-2xl font-black text-ink font-display mt-1">
                        {predicted.listeningScaled}
                      </div>
                    </div>
                    <div className="bg-surface-alt border-2 border-border rounded-xl p-3 text-center">
                      <div className="text-[10px] font-extrabold text-text-muted uppercase tracking-wider">
                        Reading
                      </div>
                      <div className="text-2xl font-black text-ink font-display mt-1">
                        {predicted.readingScaled}
                      </div>
                    </div>
                  </div>

                  <div className="text-[11px] text-text-muted font-semibold mt-3">
                    Confidence: {Math.round(predicted.confidence * 100)}% · Signals:{" "}
                    {predicted.signalCount} · Margin of error ±50
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center px-6">
              <div className="w-14 h-14 rounded-2xl bg-surface-alt border-2 border-border grid place-items-center mb-3">
                <Trophy className="text-text-muted" size={24} />
              </div>
              <p className="text-sm font-bold text-text-secondary mb-1">No prediction data yet</p>
              <p className="text-xs text-text-muted font-medium">
                Complete exercises and mock tests to generate your predicted score.
              </p>
            </div>
          )}
        </Card>

        {/* Last Mock + 30-day Trend row */}
        <div className="grid gap-4 grid-cols-[repeat(auto-fit,minmax(280px,1fr))]">
          {/* Last Mock */}
          <Card shadowSize="sm" className="p-5">
            <div className="text-xs font-extrabold text-text-muted uppercase tracking-wider mb-3 font-display">
              Last Mock Test
            </div>
            {lastMock && lastMock.totalScaled !== null ? (
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-2xl font-black text-ink font-display tabular-nums">
                    {lastMock.totalScaled}
                    <span className="text-sm text-text-muted font-bold ml-1">/ 990</span>
                  </div>
                  <div className="text-[11px] text-text-muted font-semibold mt-1">
                    {new Date(lastMock.completedAt!).toLocaleDateString("en-US")} · L{" "}
                    {lastMock.scaledListening} · R {lastMock.scaledReading}
                  </div>
                </div>
                <Link
                  href={`/toeic/mock-test/${lastMock.id}/result`}
                  className="no-underline shrink-0"
                >
                  <div className="rounded-xl border-2 border-border bg-surface-alt hover:bg-surface-hover px-3.5 py-2 text-xs font-black text-ink cursor-pointer transition-colors">
                    View Details
                  </div>
                </Link>
              </div>
            ) : (
              <Link href="/toeic/mock-test" className="no-underline">
                <span className="text-sm font-bold text-accent hover:underline cursor-pointer">
                  Take your first mock test →
                </span>
              </Link>
            )}
          </Card>

          {/* 30-Day Trend */}
          <Card shadowSize="sm" className="p-5">
            <div className="text-xs font-extrabold text-text-muted uppercase tracking-wider mb-3 font-display">
              30-Day Activity
            </div>
            {trend.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <TrendingUp className="text-text-muted mb-2" size={20} />
                <p className="text-xs text-text-muted font-medium">
                  Activity data will appear here
                </p>
              </div>
            ) : (
              <div className="flex items-end h-[80px] gap-0.5">
                {trend.map((d) => (
                  <div
                    key={d.day}
                    title={`${d.day}: ${d.c} events`}
                    className="flex-1 rounded-sm bg-accent/80 hover:bg-accent transition-colors cursor-default"
                    style={{
                      height: `${Math.max(Math.round((d.c / maxCount) * 100), 4)}%`,
                    }}
                  />
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Error Patterns */}
        <Card shadowSize="sm" className="p-0 overflow-hidden">
          <div className="px-5 py-3.5 border-b-2 border-border bg-surface-alt flex items-center gap-2">
            <AlertTriangle size={15} className="text-error" />
            <h3 className="text-sm font-black text-ink font-display uppercase tracking-wider m-0">
              Error Patterns
            </h3>
          </div>

          <div className="p-4">
            {patterns.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="w-12 h-12 rounded-2xl bg-surface-alt border-2 border-border grid place-items-center mb-3">
                  <AlertTriangle className="text-text-muted" size={20} />
                </div>
                <p className="text-sm font-bold text-text-secondary mb-1">
                  No error patterns detected
                </p>
                <p className="text-xs text-text-muted font-medium">
                  Complete exercises to see patterns here.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-2.5">
                {patterns.map((p) => (
                  <div
                    key={p.category.key}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl border-2 border-border bg-surface-alt"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-extrabold text-ink">{p.category.label}</div>
                      <div className="text-[11px] text-text-muted font-semibold mt-0.5">
                        {p.unresolvedCount}/{p.totalCount} unmastered · {p.recentCount} in last 7
                        days
                      </div>
                      {p.examples[0] && (
                        <div className="text-[10px] text-text-muted italic mt-1 truncate">
                          &ldquo;{p.examples[0].questionStem.slice(0, 80)}...&rdquo;
                        </div>
                      )}
                    </div>
                    <Link href={p.nextAction.href} className="no-underline shrink-0">
                      <div className="rounded-xl bg-error hover:bg-error/90 text-white px-3.5 py-2 text-xs font-black cursor-pointer transition-colors whitespace-nowrap">
                        {p.nextAction.label}
                      </div>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>

        {/* Weak / Strong Skills */}
        <div className="grid gap-4 grid-cols-[repeat(auto-fit,minmax(280px,1fr))]">
          {/* Weakest */}
          <SkillPanel
            title="Weakest Skills"
            icon={<TrendingDown size={15} className="text-error" />}
            skills={weakest}
            accentColor="var(--error)"
          />

          {/* Strongest */}
          <SkillPanel
            title="Strongest Skills"
            icon={<Zap size={15} className="text-emerald-500" />}
            skills={strongest}
            accentColor="var(--success)"
          />
        </div>
      </div>
    </div>
  );
}

function SkillPanel({
  title,
  icon,
  skills,
  accentColor,
}: {
  title: string;
  icon: React.ReactNode;
  skills: { skillId: string; proficiency: number }[];
  accentColor: string;
}) {
  return (
    <Card shadowSize="sm" className="p-0 overflow-hidden">
      <div className="px-5 py-3.5 border-b-2 border-border bg-surface-alt flex items-center gap-2">
        {icon}
        <h3 className="text-sm font-black text-ink font-display uppercase tracking-wider m-0">
          {title}
        </h3>
      </div>

      <div className="p-4">
        {skills.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <p className="text-xs text-text-muted font-medium">No data available yet</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {skills.map((s) => {
              const pct = Math.round(s.proficiency * 100);
              return (
                <div key={s.skillId}>
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-xs font-bold text-ink">
                      {getSkillLabel(s.skillId as ToeicSkill)}
                    </span>
                    <span className="text-[11px] font-extrabold text-text-muted tabular-nums font-mono">
                      {pct}/100
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-border overflow-hidden border border-border">
                    <div
                      className="h-full rounded-full transition-all duration-500 ease-out"
                      style={{ width: `${pct}%`, background: accentColor }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Card>
  );
}
