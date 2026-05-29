import { db, toeicAnswer, toeicAttempt, toeicQuestion } from "@repo/database";
import { and, eq, inArray } from "drizzle-orm";
import { AlertTriangle, Trophy } from "lucide-react";
import { headers } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Card } from "@/components/ui/card";
import { auth } from "@/lib/auth";
import { bandLabel } from "@/lib/toeic/predict";
import { ReviewTabs } from "./ReviewTabs";

export default async function MockResultPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) notFound();

  const [attempt] = await db
    .select()
    .from(toeicAttempt)
    .where(and(eq(toeicAttempt.id, id), eq(toeicAttempt.userId, session.user.id)))
    .limit(1);
  if (!attempt) notFound();

  const answers = await db.select().from(toeicAnswer).where(eq(toeicAnswer.attemptId, id));
  const questionIds = answers.map((a) => a.questionId);
  const questions = questionIds.length
    ? await db.select().from(toeicQuestion).where(inArray(toeicQuestion.id, questionIds))
    : [];
  const partById = new Map(questions.map((q) => [q.id, q.part]));

  const byPart: Record<number, { correct: number; total: number }> = {};
  for (const a of answers) {
    const p = partById.get(a.questionId) ?? 0;
    byPart[p] = byPart[p] ?? { correct: 0, total: 0 };
    byPart[p].total++;
    if (a.isCorrect === true) byPart[p].correct++;
  }

  const total = attempt.totalScaled ?? 0;

  const cheat = attempt.cheatViolations;
  const cheatTriggered =
    cheat && (cheat.tabSwitches > 0 || cheat.pasteAttempts > 0 || cheat.longBlurMs > 5000);

  const reviewQuestions = questions.map((q) => ({
    id: q.id,
    part: q.part,
    number: q.number,
    questionText: q.questionText,
    options: q.options,
    correctIndex: q.correctIndex,
    explanationVi: q.explanationVi,
  }));
  const reviewAnswers = answers.map((a) => ({
    questionId: a.questionId,
    selectedIndex: a.selectedIndex,
    isCorrect: a.isCorrect,
    flagged: a.flagged ?? false,
  }));

  return (
    <div className="flex flex-col h-full h-[0px] flex-1 overflow-auto">
      <div className="p-4 grid gap-4 w-[720px]">
        {cheatTriggered && (
          <div className="flex items-start gap-3 rounded-xl py-3 px-4 bg-warning/10 text-warning border-2 border-warning/20">
            <AlertTriangle className="shrink-0 mt-0.5" size={18} />
            <div>
              <div className="font-semibold text-sm">Unusual activity detected during the test</div>
              <div className="text-[13px] mt-1">
                {cheat!.tabSwitches > 0 && (
                  <div>
                    • Tab switches: {cheat!.tabSwitches} times (total{" "}
                    {Math.round(cheat!.longBlurMs / 1000)}s)
                  </div>
                )}
                {cheat!.pasteAttempts > 0 && <div>• Pastes: {cheat!.pasteAttempts} times</div>}
                <div className="mt-1 text-text-muted">
                  Score is still recorded, but you should minimize this to simulate a real exam
                  environment.
                </div>
              </div>
            </div>
          </div>
        )}
        <Card shadowSize="sm" className="p-4">
          <div className="text-center">
            <div className="font-extrabold text-accent" style={{ fontSize: 56 }}>
              {total}
            </div>
            <div className="text-text-muted">/ 990</div>
            <div className="mt-2">
              <span className="bg-warning/15 text-warning py-0.5 px-2 inline-block">
                {bandLabel(total)}
              </span>
            </div>
          </div>
          <div className="grid gap-3 mt-4" style={{ gridTemplateColumns: "repeat(2, 1fr)" }}>
            <div className="text-center p-3">
              <div className="text-[13px] text-text-muted">Listening</div>
              <div className="text-[28px] font-bold">{attempt.scaledListening ?? "—"}</div>
              <div className="text-xs text-text-muted">
                {attempt.rawListening}/
                {(byPart[2]?.total ?? 0) + (byPart[3]?.total ?? 0) + (byPart[4]?.total ?? 0)}{" "}
                correct
              </div>
            </div>
            <div className="text-center p-3">
              <div className="text-[13px] text-text-muted">Reading</div>
              <div className="text-[28px] font-bold">{attempt.scaledReading ?? "—"}</div>
              <div className="text-xs text-text-muted">
                {attempt.rawReading}/
                {(byPart[5]?.total ?? 0) + (byPart[6]?.total ?? 0) + (byPart[7]?.total ?? 0)}{" "}
                correct
              </div>
            </div>
          </div>
        </Card>

        <Card shadowSize="sm" className="p-4">
          <div className="grid gap-2">
            {[2, 3, 4, 5, 6, 7].map((p) => {
              const stats = byPart[p];
              if (!stats) return null;
              const pct = Math.round((stats.correct / stats.total) * 100);
              return (
                <div
                  key={p}
                  className="grid gap-3 items-center"
                  style={{ gridTemplateColumns: "60px 1fr 80px" }}
                >
                  <div className="font-semibold">Part {p}</div>
                  <div className="bg-surface rounded h-[8px] overflow-hidden">
                    <div
                      className="h-full"
                      style={{
                        width: `${pct}%`,
                        background:
                          pct >= 80
                            ? "var(--success)"
                            : pct >= 60
                              ? "var(--warning)"
                              : "var(--error)",
                      }}
                    />
                  </div>
                  <div className="text-[13px] text-right">
                    {stats.correct}/{stats.total} ({pct}%)
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <ReviewTabs questions={reviewQuestions} answers={reviewAnswers} />

        <div className="flex gap-2">
          <Link
            href="/toeic/mock-test"
            className="py-2 px-4 rounded-lg text-ink border-2 border-border"
            style={{ background: "var(--surface-hover)", textDecoration: "none" }}
          >
            Back to Hub
          </Link>
          <Link
            href="/toeic/progress"
            className="py-2 px-4 rounded-lg"
            style={{
              background: "var(--accent)",
              color: "var(--text-on-accent)",
              textDecoration: "none",
            }}
          >
            View Progress Trends
          </Link>
        </div>
      </div>
    </div>
  );
}
