import { db, toeicAttempt } from "@repo/database";
import { and, desc, eq, isNotNull, isNull } from "drizzle-orm";
import { Clock, Redo, Trophy } from "lucide-react";
import { headers } from "next/headers";
import Link from "next/link";
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
    <div className="flex flex-col h-full h-[0px] flex-1 overflow-auto">
      <div className="p-4 grid gap-4">
        {inProgress && (
          <Link
            href={`/toeic/mock-test/runner?resume=${inProgress.id}`}
            style={{ textDecoration: "none" }}
          >
            <div className="border-2 border-border rounded-xl bg-surface shadow-sm p-4" style={{ borderColor: "var(--warning)", borderWidth: 2 }}>
              <div className="flex items-center gap-2">
                <Redo className="text-2xl" style={{ color: "var(--warning)" }} />
                <strong className="text-lg">Resume In-Progress Mock Test</strong>
              </div>
              <div className="mt-2 text-text-muted">
                Started at {new Date(inProgress.startedAt).toLocaleString("en-US")} ·{" "}
                {inProgress.questionCount} questions
              </div>
            </div>
          </Link>
        )}
        <div
          className="grid gap-3"
          style={{ gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}
        >
          <Link href="/toeic/mock-test/runner?mode=full" style={{ textDecoration: "none" }}>
            <div className="border-2 border-border rounded-xl bg-surface shadow-sm p-4">
              <div className="flex items-center gap-2">
                <Trophy className="text-2xl text-accent" />
                <strong className="text-lg text-ink">Full Mock</strong>
              </div>
              <div className="mt-2 text-text-muted">194 questions · ~1h54 · Strict timer</div>
              <div className="mt-2">
                <span className="bg-amber-500/15 text-amber-600 py-0.5 px-2 inline-block">Part 1: no content yet</span>
              </div>
              <div className="mt-1.5 text-[13px] text-text-muted">
                25 P2 + 39 P3 + 30 P4 + 30 P5 + 16 P6 + 54 P7
              </div>
            </div>
          </Link>
          <Link href="/toeic/mock-test/runner?mode=mini" style={{ textDecoration: "none" }}>
            <div className="border-2 border-border rounded-xl bg-surface shadow-sm p-4">
              <div className="flex items-center gap-2">
                <Clock className="text-2xl text-emerald-500" />
                <strong className="text-lg text-ink">Mini Mock</strong>
              </div>
              <div className="mt-2 text-text-muted">100 questions · ~1h · Daily practice</div>
              <div className="mt-2">
                <span className="bg-emerald-500/15 text-emerald-600 py-0.5 px-2 inline-block">Recommended</span>
              </div>
              <div className="mt-1.5 text-[13px] text-text-muted">
                13 P2 + 20 P3 + 15 P4 + 15 P5 + 8 P6 + 29 P7
              </div>
            </div>
          </Link>
        </div>

        <div className="border-2 border-border rounded-xl bg-surface shadow-sm p-4">
          {history.length === 0 ? (
            <div className="text-text-muted">
              No mock tests taken yet. Start a mini mock to generate data for your predicted score.
            </div>
          ) : (
            <div className="grid gap-2">
              {history.map((h) => (
                <Link
                  key={h.id}
                  href={`/toeic/mock-test/${h.id}/result`}
                  className="text-ink rounded-lg border-2 border-border flex justify-between items-center"
                  style={{
                    textDecoration: "none",
                    padding: 10,
                    background: "var(--surface-hover)",
                  }}
                >
                  <span>
                    {new Date(h.completedAt!).toLocaleString("en-US")} · {h.questionCount} questions
                  </span>
                  <span className="text-lg font-bold">{h.totalScaled ?? "—"} / 990</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
