import { db, toeicAttempt } from "@repo/database";
import { and, desc, eq, isNotNull, isNull } from "drizzle-orm";
import { ArrowRight, Clock, Redo, Trophy } from "lucide-react";
import { headers } from "next/headers";
import Link from "next/link";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { auth } from "@/lib/auth";
import { requireToeicBaseline } from "@/lib/toeic/require-baseline";

export default async function MockTestHubPage() {
  await requireToeicBaseline();
  const session = await auth.api.getSession({ headers: await headers() });
  const userId = session!.user!.id;

  // Detect in-progress mock for resume card
  const [inProgress] = await db
    .select()
    .from(toeicAttempt)
    .where(
      and(
        eq(toeicAttempt.userId, userId),
        eq(toeicAttempt.mode, "mock_test"),
        isNull(toeicAttempt.completedAt),
      ),
    )
    .orderBy(desc(toeicAttempt.startedAt))
    .limit(1);

  const history = await db
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
    .limit(10);

  return (
    <div className="flex flex-col h-full min-h-0 flex-1 overflow-auto">
      <div className="p-5 pb-16 max-w-[900px] mx-auto w-full flex flex-col gap-5">
        {/* Resume in-progress card */}
        {inProgress && (
          <Link
            href={`/toeic/mock-test/runner?resume=${inProgress.id}`}
            className="no-underline group"
          >
            <Card
              interactive
              shadowSize="sm"
              accentColor="warning"
              accentPosition="top"
              className="p-5"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-xl grid place-items-center shrink-0 bg-warning/10 border-2 border-warning/30">
                  <Redo className="text-warning" size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-base text-ink">Resume In-Progress Mock Test</CardTitle>
                  <CardDescription className="text-xs mt-1 font-semibold">
                    Started at {new Date(inProgress.startedAt).toLocaleString("en-US")} ·{" "}
                    {inProgress.questionCount} questions
                  </CardDescription>
                </div>
                <ArrowRight
                  size={18}
                  className="text-warning shrink-0 group-hover:translate-x-1 transition-transform"
                />
              </div>
            </Card>
          </Link>
        )}

        {/* Test mode cards */}
        <div className="grid gap-4 grid-cols-[repeat(auto-fit,minmax(280px,1fr))]">
          {/* Full Mock */}
          <Link href="/toeic/mock-test/runner?mode=full" className="no-underline group">
            <Card
              interactive
              shadowSize="sm"
              className="hover:border-accent flex flex-col gap-3.5 h-full p-5"
            >
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl grid place-items-center shrink-0 bg-accent/10 border-2 border-accent/20">
                  <Trophy className="text-accent" size={20} />
                </div>
                <div>
                  <CardTitle className="text-base text-ink">Full Mock</CardTitle>
                  <CardDescription className="text-xs font-semibold">
                    194 questions · ~1h54 · Strict timer
                  </CardDescription>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5">
                <span className="text-[10px] font-extrabold rounded-lg bg-warning/10 text-warning border-2 border-warning/20 px-2 py-0.5">
                  Part 1: no content yet
                </span>
              </div>

              <div className="text-[11px] text-text-muted font-bold tracking-wide font-mono mt-auto">
                25 P2 + 39 P3 + 30 P4 + 30 P5 + 16 P6 + 54 P7
              </div>
            </Card>
          </Link>

          {/* Mini Mock */}
          <Link href="/toeic/mock-test/runner?mode=mini" className="no-underline group">
            <Card
              interactive
              shadowSize="sm"
              className="hover:border-success flex flex-col gap-3.5 h-full p-5"
            >
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl grid place-items-center shrink-0 bg-success/10 border-2 border-success/20">
                  <Clock className="text-success" size={20} />
                </div>
                <div>
                  <CardTitle className="text-base text-ink">Mini Mock</CardTitle>
                  <CardDescription className="text-xs font-semibold">
                    100 questions · ~1h · Daily practice
                  </CardDescription>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5">
                <span className="text-[10px] font-extrabold rounded-lg bg-success/10 text-success border-2 border-warning/20 px-2 py-0.5">
                  Recommended
                </span>
              </div>

              <div className="text-[11px] text-text-muted font-bold tracking-wide font-mono mt-auto">
                13 P2 + 20 P3 + 15 P4 + 15 P5 + 8 P6 + 29 P7
              </div>
            </Card>
          </Link>
        </div>

        {/* History */}
        <Card shadowSize="sm" className="p-0 overflow-hidden">
          <div className="px-5 py-3.5 border-b-2 border-border bg-surface-alt">
            <h3 className="text-sm font-black text-ink font-display uppercase tracking-wider m-0">
              Test History
            </h3>
          </div>

          <div className="p-4">
            {history.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-14 h-14 rounded-2xl bg-surface-alt border-2 border-border grid place-items-center mb-3">
                  <Trophy className="text-text-muted" size={24} />
                </div>
                <p className="text-sm font-bold text-text-secondary mb-1">
                  No mock tests taken yet
                </p>
                <p className="text-xs text-text-muted font-medium">
                  Start a mini mock to generate data for your predicted score.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {history.map((h) => (
                  <Link
                    key={h.id}
                    href={`/toeic/mock-test/${h.id}/result`}
                    className="no-underline group"
                  >
                    <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl border-2 border-border bg-surface-alt hover:border-accent hover:-translate-y-0.5 hover:shadow-sm transition-all duration-150 cursor-pointer">
                      <div className="min-w-0">
                        <div className="text-sm font-bold text-ink truncate">
                          {new Date(h.completedAt!).toLocaleString("en-US")}
                        </div>
                        <div className="text-[11px] text-text-muted font-semibold mt-0.5">
                          {h.questionCount} questions
                        </div>
                      </div>
                      <div className="text-right shrink-0 flex items-center gap-2">
                        <span className="text-lg font-black text-accent font-display tabular-nums">
                          {h.totalScaled ?? "—"}
                        </span>
                        <span className="text-xs text-text-muted font-bold">/ 990</span>
                        <ArrowRight
                          size={14}
                          className="text-text-muted group-hover:text-accent group-hover:translate-x-0.5 transition-all"
                        />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
