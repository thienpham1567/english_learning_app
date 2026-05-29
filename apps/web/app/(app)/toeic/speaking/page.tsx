import { db, toeicSpeakingPrompt, toeicSpeakingSession } from "@repo/database";
import { and, desc, eq, isNotNull, sql } from "drizzle-orm";
import { ArrowRight, Mic } from "lucide-react";
import { headers } from "next/headers";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { requireToeicBaseline } from "@/lib/toeic/require-baseline";
import { RoadmapBanner } from "@/components/shared/RoadmapBanner";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";

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
    <div className="flex flex-col h-full min-h-0 flex-1 overflow-auto">
      <div className="p-5 pb-16 max-w-[900px] mx-auto w-full flex flex-col gap-5">
        <RoadmapBanner />
        {/* Start Test Card */}
        {seeded ? (
          <Link href="/toeic/speaking/runner" className="no-underline group">
            <Card
              interactive
              shadowSize="sm"
              className="hover:border-accent p-6 relative overflow-hidden"
            >
              {/* Gradient accent top */}
              <div
                className="absolute top-0 left-0 right-0 h-[3px]"
                style={{
                  background: "linear-gradient(90deg, var(--accent), var(--secondary))",
                }}
              />

              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl grid place-items-center shrink-0 bg-accent/10 border-2 border-accent/20">
                  <Mic className="text-accent" size={24} />
                </div>
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-lg text-ink">Start Speaking Test</CardTitle>
                  <CardDescription className="text-xs text-text-secondary mt-1.5 leading-relaxed font-semibold">
                    Q1-2 Read Aloud · Q3-4 Describe a Picture · Q5-7 Respond to Questions · Q8-10
                    Respond using Information · Q11 Opinion
                  </CardDescription>
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    <span className="text-[10px] font-extrabold rounded-lg bg-warning/10 text-warning border border-warning/20 px-2 py-0.5">
                      Requires microphone
                    </span>
                    <span className="text-[10px] font-extrabold rounded-lg bg-success/10 text-success border border-success/20 px-2 py-0.5">
                      Whisper STT + Gemini grading
                    </span>
                  </div>
                </div>
                <ArrowRight
                  size={20}
                  className="text-text-muted shrink-0 group-hover:text-accent group-hover:translate-x-1 transition-all"
                />
              </div>
            </Card>
          </Link>
        ) : (
          <Card shadowSize="sm" className="p-0 overflow-hidden">
            <div className="flex flex-col items-center justify-center py-16 text-center px-6">
              <div className="w-14 h-14 rounded-2xl bg-surface-alt border-2 border-border grid place-items-center mb-3">
                <Mic className="text-text-muted" size={24} />
              </div>
              <p className="text-sm font-bold text-text-secondary mb-1">
                Speaking prompts not available
              </p>
              <p className="text-xs text-text-muted font-medium">
                Please seed speaking prompts to enable this feature.
              </p>
            </div>
          </Card>
        )}

        {/* History */}
        <Card shadowSize="sm" className="p-0 overflow-hidden">
          <div className="px-5 py-3.5 border-b-2 border-border bg-surface-alt">
            <h3 className="text-sm font-black text-ink font-display uppercase tracking-wider m-0">
              Speaking History
            </h3>
          </div>

          <div className="p-4">
            {history.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-14 h-14 rounded-2xl bg-surface-alt border-2 border-border grid place-items-center mb-3">
                  <Mic className="text-text-muted" size={24} />
                </div>
                <p className="text-sm font-bold text-text-secondary mb-1">
                  No speaking tests taken yet
                </p>
                <p className="text-xs text-text-muted font-medium">
                  Complete a speaking test to see your results here.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {history.map((h) => (
                  <Link
                    key={h.id}
                    href={`/toeic/speaking/${h.id}/result`}
                    className="no-underline group"
                  >
                    <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl border-2 border-border bg-surface-alt hover:border-accent hover:-translate-y-0.5 hover:shadow-sm transition-all duration-150 cursor-pointer">
                      <div className="min-w-0">
                        <div className="text-sm font-bold text-ink truncate">
                          {new Date(h.completedAt!).toLocaleString("en-US")}
                        </div>
                        <div className="text-[11px] text-text-muted font-semibold mt-0.5">
                          Set: {h.setCode}
                        </div>
                      </div>
                      <div className="text-right shrink-0 flex items-center gap-2">
                        <span className="text-lg font-black text-accent font-display tabular-nums">
                          {h.scaledScore ?? "—"}
                        </span>
                        <span className="text-xs text-text-muted font-bold">/ 200</span>
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
