import { db, reviewTask, toeicQuestion, toeicVocab } from "@repo/database";
import { and, desc, eq, inArray, lte, sql } from "drizzle-orm";
import { AlertTriangle, BookOpenText, RefreshCw } from "lucide-react";
import { headers } from "next/headers";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { requireToeicBaseline } from "@/lib/toeic/require-baseline";
import { RoadmapBanner } from "@/components/shared/RoadmapBanner";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default async function ToeicReviewPage() {
  await requireToeicBaseline();
  const session = await auth.api.getSession({ headers: await headers() });
  const userId = session!.user!.id;

  const allDue = await db
    .select()
    .from(reviewTask)
    .where(
      and(
        eq(reviewTask.userId, userId),
        eq(reviewTask.status, "pending"),
        lte(reviewTask.dueAt, new Date()),
      ),
    );

  const errorRetryDue = allDue.filter((t) => t.sourceType === "error_retry");
  const flashcardDue = allDue.filter((t) => t.sourceType === "flashcard_review");

  // Filter error_retry to only TOEIC questions
  const toeicErrorIds: string[] = [];
  if (errorRetryDue.length > 0) {
    const ids = errorRetryDue.map((t) => t.sourceId);
    const rows = await db
      .select({ id: toeicQuestion.id, part: toeicQuestion.part })
      .from(toeicQuestion)
      .where(inArray(toeicQuestion.id, ids));
    for (const r of rows) toeicErrorIds.push(r.id);
  }

  // Recent activity feed: last 10 reviews
  const recent = await db
    .select()
    .from(reviewTask)
    .where(and(eq(reviewTask.userId, userId), sql`${reviewTask.lastOutcome} IS NOT NULL`))
    .orderBy(desc(reviewTask.updatedAt))
    .limit(10);

  const recentVocabIds = recent
    .filter((r) => r.sourceType === "flashcard_review")
    .map((r) => r.sourceId);
  const vocabRows = recentVocabIds.length
    ? await db.select().from(toeicVocab).where(inArray(toeicVocab.id, recentVocabIds))
    : [];
  const vocabById = new Map(vocabRows.map((v) => [v.id, v]));

  return (
    <div className="flex flex-col h-full min-h-0 flex-1 overflow-auto">
      <div className="p-5 pb-16 max-w-[900px] mx-auto w-full flex flex-col gap-5">
        <RoadmapBanner />
        {/* Due cards */}
        <div className="grid gap-4 grid-cols-[repeat(auto-fit,minmax(280px,1fr))]">
          {/* Incorrect Questions */}
          <Card
            interactive={toeicErrorIds.length > 0}
            shadowSize="sm"
            accentColor={toeicErrorIds.length > 0 ? "error" : undefined}
            accentPosition="top"
            className={cn("p-5", toeicErrorIds.length === 0 && "opacity-60")}
          >
            <div className="flex items-center gap-3 mb-3">
              <div
                className={`w-10 h-10 rounded-xl grid place-items-center shrink-0 border-2 ${
                  toeicErrorIds.length > 0
                    ? "bg-error/10 border-error/20"
                    : "bg-surface-alt border-border"
                }`}
              >
                <AlertTriangle
                  size={18}
                  className={toeicErrorIds.length > 0 ? "text-error" : "text-text-muted"}
                />
              </div>
              <div>
                <CardTitle className="text-sm text-ink">TOEIC Incorrect Questions</CardTitle>
                <CardDescription className="text-[11px] font-semibold">
                  Part 5/6/7 questions you previously got wrong
                </CardDescription>
              </div>
            </div>

            <div className="text-3xl font-black text-ink font-display tabular-nums mb-3">
              {toeicErrorIds.length}
            </div>

            {toeicErrorIds.length > 0 && (
              <Link href="/toeic/grammar/drill?mode=mistake&count=20" className="no-underline">
                <div className="inline-flex items-center gap-2 rounded-xl bg-error hover:bg-error/90 text-white px-4 py-2.5 text-xs font-black cursor-pointer transition-colors shadow-sm">
                  <RefreshCw size={13} />
                  Drill Now
                </div>
              </Link>
            )}
          </Card>

          {/* Vocabulary to Review */}
          <Card
            interactive={flashcardDue.length > 0}
            shadowSize="sm"
            accentColor={flashcardDue.length > 0 ? "accent" : undefined}
            accentPosition="top"
            className={cn("p-5", flashcardDue.length === 0 && "opacity-60")}
          >
            <div className="flex items-center gap-3 mb-3">
              <div
                className={`w-10 h-10 rounded-xl grid place-items-center shrink-0 border-2 ${
                  flashcardDue.length > 0
                    ? "bg-accent/10 border-accent/20"
                    : "bg-surface-alt border-border"
                }`}
              >
                <BookOpenText
                  size={18}
                  className={flashcardDue.length > 0 ? "text-accent" : "text-text-muted"}
                />
              </div>
              <div>
                <CardTitle className="text-sm text-ink">Vocabulary to Review</CardTitle>
                <CardDescription className="text-[11px] font-semibold">
                  TOEIC words due for Spaced Repetition (SRS)
                </CardDescription>
              </div>
            </div>

            <div className="text-3xl font-black text-ink font-display tabular-nums mb-3">
              {flashcardDue.length}
            </div>

            {flashcardDue.length > 0 && (
              <Link href="/toeic/vocab/learn?mode=review" className="no-underline">
                <div className="inline-flex items-center gap-2 rounded-xl bg-accent hover:bg-accent/90 text-ink px-4 py-2.5 text-xs font-black cursor-pointer transition-colors shadow-sm">
                  <BookOpenText size={13} />
                  Review Now
                </div>
              </Link>
            )}
          </Card>
        </div>

        {/* Recent Activity */}
        <Card shadowSize="sm" className="p-0 overflow-hidden">
          <div className="px-5 py-3.5 border-b-2 border-border bg-surface-alt">
            <h3 className="text-sm font-black text-ink font-display uppercase tracking-wider m-0">
              Recent Review Activity
            </h3>
          </div>

          <div className="p-4">
            {recent.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-14 h-14 rounded-2xl bg-surface-alt border-2 border-border grid place-items-center mb-3">
                  <RefreshCw className="text-text-muted" size={24} />
                </div>
                <p className="text-sm font-bold text-text-secondary mb-1">No review activity yet</p>
                <p className="text-xs text-text-muted font-medium">
                  Review errors and vocabulary to see activity here.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {recent.map((r) => {
                  const isVocab = r.sourceType === "flashcard_review";
                  const v = isVocab ? vocabById.get(r.sourceId) : null;
                  return (
                    <div
                      key={r.id}
                      className="flex items-center gap-3 px-4 py-2.5 rounded-xl border-2 border-border bg-surface-alt"
                    >
                      <span
                        className={`text-[10px] font-extrabold rounded-lg px-2 py-0.5 border shrink-0 ${
                          isVocab
                            ? "bg-accent/10 text-accent border-accent/20"
                            : "bg-error/10 text-error border-error/20"
                        }`}
                      >
                        {isVocab ? "Vocab" : "Incorrect"}
                      </span>
                      <span className="text-sm font-bold text-ink truncate flex-1 min-w-0">
                        {v ? v.word : `Question #${r.sourceId.slice(0, 8)}`}
                      </span>
                      <span className="text-[11px] text-text-muted font-semibold shrink-0">
                        {r.lastOutcome ?? "—"}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
