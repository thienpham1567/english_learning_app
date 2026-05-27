import { db, toeicSpeakingPrompt, toeicSpeakingSession } from "@repo/database";
import { and, desc, eq, isNotNull, sql } from "drizzle-orm";
import { Mic } from "lucide-react";
import { headers } from "next/headers";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { requireToeicBaseline } from "@/lib/toeic/require-baseline";

export default async function ToeicSpeakingPage() {
  await requireToeicBaseline();
  const session = await auth.api.getSession({ headers: await headers() });
  const userId = session!.user!.id;

  const promptCount = await db.select({ c: sql<number>`count(*)::int` }).from(toeicSpeakingPrompt);
  const setCount = await db
    .select({ c: sql<number>`count(distinct ${toeicSpeakingPrompt.setCode})::int` })
    .from(toeicSpeakingPrompt);

  const history = await db
    .select()
    .from(toeicSpeakingSession)
    .where(
      and(eq(toeicSpeakingSession.userId, userId), isNotNull(toeicSpeakingSession.completedAt)),
    )
    .orderBy(desc(toeicSpeakingSession.completedAt))
    .limit(10);

  const seeded = (promptCount[0]?.c ?? 0) >= 11;

  return (
    <div className="flex flex-col h-full h-[0px] flex-1 overflow-auto">
      <div className="p-4 grid gap-4">
        {seeded ? (
          <Link href="/toeic/speaking/runner" style={{ textDecoration: "none" }}>
            <div className="border-2 border-border rounded-xl bg-surface shadow-sm p-4">
              <div className="flex items-center gap-2">
                <Mic className="text-3xl text-accent" />
                <strong className="text-lg text-ink">Start Speaking Test</strong>
              </div>
              <div className="text-text-muted mt-1.5 text-[13px]">
                Q1-2 Read Aloud · Q3-4 Describe a Picture · Q5-7 Respond to Questions · Q8-10 Respond using Information ·
                Q11 Opinion
              </div>
              <div className="mt-2">
                <span className="bg-amber-500/15 text-amber-600 py-0.5 px-2 inline-block">Requires microphone permission</span>
                <span className="bg-emerald-500/15 text-emerald-600 py-0.5 px-2 inline-block">Whisper STT + Gemini grading</span>
              </div>
            </div>
          </Link>
        ) : (
          <div className="border-2 border-border rounded-xl bg-surface shadow-sm p-4">
            <div className="flex flex-col items-center justify-center py-12 text-text-muted">
                <div className="text-4xl mb-3">📭</div>
                <div className="text-sm font-semibold">No data available</div>
              </div>
          </div>
        )}

        <div className="border-2 border-border rounded-xl bg-surface shadow-sm p-4">
          {history.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-text-muted">
                <div className="text-4xl mb-3">📭</div>
                <div className="text-sm font-semibold">No data available</div>
              </div>
          ) : (
            <div className="grid gap-2">
              {history.map((h) => (
                <Link
                  key={h.id}
                  href={`/toeic/speaking/${h.id}/result`}
                  className="text-ink rounded-lg flex justify-between border-2 border-border"
                  style={{
                    textDecoration: "none",
                    padding: 10,
                    background: "var(--surface-hover)",
                  }}
                >
                  <span>
                    {new Date(h.completedAt!).toLocaleString("en-US")} · {h.setCode}
                  </span>
                  <span className="text-lg font-bold">{h.scaledScore ?? "—"} / 200</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
