import { getSkillLabel, TOEIC_SKILLS, type ToeicSkill } from "@repo/contracts";
import { db, errorLog, learningEvent, toeicAttempt, userSkillState } from "@repo/database";
import { summarizeErrorPatterns } from "@repo/modules";
import { and, desc, eq, gte, isNotNull, like, or, sql } from "drizzle-orm";
import { AlertTriangle, TrendingUp } from "lucide-react";
import { headers } from "next/headers";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { bandLabel, computePredictedScore } from "@/lib/toeic/predict";
import { requireToeicBaseline } from "@/lib/toeic/require-baseline";

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
    <div className="flex flex-col h-full h-[0px] flex-1 overflow-auto">
      <div className="p-4 grid gap-4">
        {/* Predicted score */}
        <div className="border-2 border-border rounded-xl bg-surface shadow-sm p-4">
          {predicted ? (
            <>
              <div className="text-center">
                <div className="font-extrabold text-accent" style={{ fontSize: 56 }}>
                  {predicted.total}
                </div>
                <div className="text-text-muted">/ 990</div>
                <span className="mt-2 bg-amber-500/15 text-amber-600 py-0.5 px-2 inline-block">
                  {bandLabel(predicted.total)}
                </span>
              </div>
              <div className="grid gap-3 mt-3" style={{ gridTemplateColumns: "repeat(2, 1fr)" }}>
                <div className="text-center">
                  <div className="text-[13px] text-text-muted">Listening</div>
                  <div className="text-2xl font-bold">{predicted.listeningScaled}</div>
                </div>
                <div className="text-center">
                  <div className="text-[13px] text-text-muted">Reading</div>
                  <div className="text-2xl font-bold">{predicted.readingScaled}</div>
                </div>
              </div>
              <div className="mt-3 text-xs text-text-muted">
                Confidence: {Math.round(predicted.confidence * 100)}% · Signals:{" "}
                {predicted.signalCount} · Margin of error ±50 in MVP phase
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-text-muted">
                <div className="text-4xl mb-3">📭</div>
                <div className="text-sm font-semibold">No data available</div>
              </div>
          )}
        </div>

        {/* Last mock */}
        <div className="border-2 border-border rounded-xl bg-surface shadow-sm p-4">
          {lastMock && lastMock.totalScaled !== null ? (
            <div className="flex justify-between items-center">
              <div>
                <div className="text-[28px] font-bold">{lastMock.totalScaled} / 990</div>
                <div className="text-text-muted text-[13px]">
                  {new Date(lastMock.completedAt!).toLocaleDateString("en-US")} · L{" "}
                  {lastMock.scaledListening} · R {lastMock.scaledReading}
                </div>
              </div>
              <Link
                href={`/toeic/mock-test/${lastMock.id}/result`}
                className="py-1.5 px-3 rounded-md text-[13px]"
                style={{
                  background: "var(--surface-hover, #1f2937)",
                  color: "#fff",
                  textDecoration: "none",
                }}
              >
                Xem chi tiết
              </Link>
            </div>
          ) : (
            <Link
              href="/toeic/mock-test"
              className="text-accent"
              style={{ textDecoration: "underline" }}
            >
              Take your first mock test
            </Link>
          )}
        </div>

        {/* Trend chart */}
        <div className="border-2 border-border rounded-xl bg-surface shadow-sm p-4">
          {trend.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-text-muted">
                <div className="text-4xl mb-3">📭</div>
                <div className="text-sm font-semibold">No data available</div>
              </div>
          ) : (
            <div className="flex items-end h-[100px]" style={{ gap: 2 }}>
              {trend.map((d) => (
                <div
                  key={d.day}
                  title={`${d.day}: ${d.c} events`}
                  className="flex-1 h-[4px] rounded-sm"
                  style={{
                    height: `${Math.round((d.c / maxCount) * 100)}%`,
                    background: "var(--accent)",
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Error patterns */}
        <div className="border-2 border-border rounded-xl bg-surface shadow-sm p-4">
          <div className="flex items-center gap-2 mb-3 font-semibold text-sm">
            <AlertTriangle size={16} className="text-destructive" /> Recent Error Patterns
          </div>
          {patterns.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-text-muted">
                <div className="text-4xl mb-3">📭</div>
                <div className="text-sm font-semibold">No data available</div>
              </div>
          ) : (
            <div className="grid gap-2">
              {patterns.map((p) => (
                <div
                  key={p.category.key}
                  className="grid gap-3 items-center rounded-lg bg-surface"
                  style={{ gridTemplateColumns: "1fr auto", padding: 10 }}
                >
                  <div>
                    <div className="font-medium">{p.category.label}</div>
                    <div className="text-xs text-text-muted">
                      {p.unresolvedCount}/{p.totalCount} unmastered · {p.recentCount} questions in last 7 days
                    </div>
                    {p.examples[0] && (
                      <div className="text-xs text-text-muted mt-1 italic">
                        Example: "{p.examples[0].questionStem.slice(0, 80)}..."
                      </div>
                    )}
                  </div>
                  <Link
                    href={p.nextAction.href}
                    className="py-1.5 px-3 rounded-md text-[13px]"
                    style={{
                      background: "var(--error)",
                      color: "#fff",
                      textDecoration: "none",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {p.nextAction.label}
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top weak/strong */}
        <div
          className="grid gap-3"
          style={{ gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}
        >
          <div className="border-2 border-border rounded-xl bg-surface shadow-sm p-4">
            {weakest.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-text-muted">
                <div className="text-4xl mb-3">📭</div>
                <div className="text-sm font-semibold">No data available</div>
              </div>
            ) : (
              <div className="grid gap-1.5">
                {weakest.map((s) => (
                  <div key={s.skillId}>
                    <div className="flex justify-between text-[13px]">
                      <span>{getSkillLabel(s.skillId as ToeicSkill)}</span>
                      <span className="text-text-muted">{Math.round(s.proficiency * 100)}/100</span>
                    </div>
                    <div className="h-2 rounded-full bg-border overflow-hidden"><div className="h-full rounded-full bg-accent transition-all duration-500" style={{ width: `${Math.round(s.proficiency * 100)}%` }} /></div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="border-2 border-border rounded-xl bg-surface shadow-sm p-4">
            {strongest.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-text-muted">
                <div className="text-4xl mb-3">📭</div>
                <div className="text-sm font-semibold">No data available</div>
              </div>
            ) : (
              <div className="grid gap-1.5">
                {strongest.map((s) => (
                  <div key={s.skillId}>
                    <div className="flex justify-between text-[13px]">
                      <span>{getSkillLabel(s.skillId as ToeicSkill)}</span>
                      <span className="text-text-muted">{Math.round(s.proficiency * 100)}/100</span>
                    </div>
                    <div className="h-2 rounded-full bg-border overflow-hidden"><div className="h-full rounded-full bg-accent transition-all duration-500" style={{ width: `${Math.round(s.proficiency * 100)}%` }} /></div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
