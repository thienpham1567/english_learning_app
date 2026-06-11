import { db, toeicWritingPrompt, toeicWritingResponse, toeicWritingSession } from "@repo/database";
import { and, asc, eq, inArray } from "drizzle-orm";
import { ClipboardList } from "lucide-react";
import { headers } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";

export default async function WritingResultPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) notFound();

  const [s] = await db
    .select()
    .from(toeicWritingSession)
    .where(and(eq(toeicWritingSession.id, id), eq(toeicWritingSession.userId, session.user.id)))
    .limit(1);
  if (!s) notFound();

  const responses = await db
    .select()
    .from(toeicWritingResponse)
    .where(eq(toeicWritingResponse.sessionId, id));
  const promptIds = responses.map((r) => r.promptId);
  const prompts = promptIds.length
    ? await db
        .select()
        .from(toeicWritingPrompt)
        .where(inArray(toeicWritingPrompt.id, promptIds))
        .orderBy(asc(toeicWritingPrompt.questionNumber))
    : [];
  const promptById = new Map(prompts.map((p) => [p.id, p]));

  return (
    <div className="flex flex-col h-full h-[0px] flex-1 overflow-auto">
      <div className="p-4 grid gap-4 w-full max-w-[800px] mx-auto">
        <div className="border-2 border-border rounded-xl bg-surface shadow-sm p-4">
          <div className="text-center">
            <div className="font-extrabold text-accent" style={{ fontSize: 56 }}>
              {s.scaledScore ?? "—"}
            </div>
            <div className="text-text-muted">/ 200 (TOEIC Writing)</div>
            <div className="mt-1.5 text-text-muted">Raw: {s.rawScore ?? "—"} / 28</div>
          </div>
        </div>

        {prompts
          .sort((a, b) => a.questionNumber - b.questionNumber)
          .map((p) => {
            const r = responses.find((x) => x.promptId === p.id);
            return (
              <div
                key={p.id}
                className="border-2 border-border rounded-xl bg-surface shadow-sm p-4"
              >
                <div className="flex justify-between items-center mb-3">
                  <strong>
                    Q{p.questionNumber} ·{" "}
                    {p.type === "q1_5_picture"
                      ? "Picture"
                      : p.type === "q6_7_email"
                        ? "Email"
                        : "Opinion"}
                  </strong>
                  <span className="bg-info/15 text-info py-0.5 px-2 rounded-md text-sm font-bold">
                    {r?.rawScore ?? 0} / {p.maxScore}
                  </span>
                </div>
                {p.type === "q1_5_picture" && p.imageUrl && (
                  <img
                    loading="lazy"
                    decoding="async"
                    src={p.imageUrl}
                    alt=""
                    className="w-[200px] rounded mb-2"
                  />
                )}
                {r ? (
                  <>
                    <div
                      className="bg-surface rounded-md mb-2"
                      style={{ padding: 10, whiteSpace: "pre-wrap" }}
                    >
                      {r.text || <em className="text-text-muted">(empty)</em>}
                    </div>
                    {r.feedbackVi && (
                      <div
                        className="text-[13px] text-text-muted"
                        style={{ borderLeft: "3px solid var(--accent)", paddingLeft: 10 }}
                      >
                        <strong>Feedback:</strong> {r.feedbackVi}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-text-muted">
                    <div className="text-4xl mb-3">📭</div>
                    <div className="text-sm font-semibold">No data available</div>
                  </div>
                )}
              </div>
            );
          })}

        <div className="flex gap-2">
          <Link
            href="/toeic/writing"
            className="py-2 px-4 rounded-lg text-ink border-2 border-border"
            style={{ background: "var(--surface-hover)", textDecoration: "none" }}
          >
            Back to Hub
          </Link>
        </div>
      </div>
    </div>
  );
}
