import { db, reviewTask, toeicQuestion, toeicVocab } from "@repo/database";
import { and, desc, eq, inArray, lte, sql } from "drizzle-orm";
import { AlertTriangle, BookOpenText, RefreshCw } from "lucide-react";
import { headers } from "next/headers";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { requireToeicBaseline } from "@/lib/toeic/require-baseline";

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
    <div className="flex flex-col h-full h-[0px] flex-1 overflow-auto">
      <div className="p-4 grid gap-4">
        <div
          className="grid gap-3"
          style={{ gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))" }}
        >
          <div className={`border-2 border-border rounded-xl bg-surface shadow-sm p-4 ${toeicErrorIds.length > 0 ? "hover:shadow-md transition-shadow" : ""}`}
            style={toeicErrorIds.length === 0 ? { opacity: 0.6 } : undefined}
          >
            <div className="flex items-center gap-2">
              <AlertTriangle className="text-2xl text-destructive" />
              <strong>TOEIC Incorrect Questions</strong>
            </div>
            <div className="text-4xl font-bold mt-2 text-ink">{toeicErrorIds.length}</div>
            <div className="text-text-muted text-[13px]">Part 5/6/7 questions you previously got wrong</div>
            {toeicErrorIds.length > 0 && (
              <Link
                href="/toeic/grammar/drill?mode=mistake&count=20"
                className="inline-block mt-3 py-1.5 px-3 rounded-md text-[13px]"
                style={{ background: "var(--error)", color: "#fff", textDecoration: "none" }}
              >
                Drill Now
              </Link>
            )}
          </div>

          <div className={`border-2 border-border rounded-xl bg-surface shadow-sm p-4 ${flashcardDue.length > 0 ? "hover:shadow-md transition-shadow" : ""}`}
            style={flashcardDue.length === 0 ? { opacity: 0.6 } : undefined}
          >
            <div className="flex items-center gap-2">
              <BookOpenText className="text-2xl text-accent" />
              <strong>Vocabulary to Review</strong>
            </div>
            <div className="text-4xl font-bold mt-2 text-ink">{flashcardDue.length}</div>
            <div className="text-text-muted text-[13px]">TOEIC words due for Spaced Repetition (SRS)</div>
            {flashcardDue.length > 0 && (
              <Link
                href="/toeic/vocab/learn?mode=review"
                className="inline-block mt-3 py-1.5 px-3 rounded-md text-[13px]"
                style={{
                  background: "var(--accent)",
                  color: "var(--text-on-accent)",
                  textDecoration: "none",
                }}
              >
                Review Now
              </Link>
            )}
          </div>
        </div>

        <div className="border-2 border-border rounded-xl bg-surface shadow-sm p-4">
          {recent.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-text-muted">
                <div className="text-4xl mb-3">📭</div>
                <div className="text-sm font-semibold">No data available</div>
              </div>
          ) : (
            <div className="grid gap-1.5">
              {recent.map((r) => {
                const isVocab = r.sourceType === "flashcard_review";
                const v = isVocab ? vocabById.get(r.sourceId) : null;
                return (
                  <div
                    key={r.id}
                    className="grid gap-3 items-center text-[13px]"
                    style={{ gridTemplateColumns: "100px 1fr auto" }}
                  >
                    <span className="bg-red-500/15 text-red-600 py-0.5 px-2 inline-block">{isVocab ? "Vocab" : "Incorrect"}</span>
                    <span className="text-ink">
                      {v ? v.word : `Câu hỏi #${r.sourceId.slice(0, 8)}`}
                    </span>
                    <span className="text-text-muted">{r.lastOutcome ?? "—"}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
