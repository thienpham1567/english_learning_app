import { db, toeicWritingPrompt, toeicWritingSession } from "@repo/database";
import { Card, Empty, Tag } from "antd";
import { and, desc, eq, isNotNull, sql } from "drizzle-orm";
import { ClipboardList } from "lucide-react";
import { headers } from "next/headers";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { requireToeicBaseline } from "@/lib/toeic/require-baseline";

export default async function ToeicWritingPage() {
  await requireToeicBaseline();
  const session = await auth.api.getSession({ headers: await headers() });
  const userId = session!.user!.id;

  const promptCount = await db.select({ c: sql<number>`count(*)::int` }).from(toeicWritingPrompt);
  const setCount = await db
    .select({ c: sql<number>`count(distinct ${toeicWritingPrompt.setCode})::int` })
    .from(toeicWritingPrompt);

  const history = await db
    .select()
    .from(toeicWritingSession)
    .where(and(eq(toeicWritingSession.userId, userId), isNotNull(toeicWritingSession.completedAt)))
    .orderBy(desc(toeicWritingSession.completedAt))
    .limit(10);

  const seeded = (promptCount[0]?.c ?? 0) >= 8;

  return (
    <div className="flex flex-col h-full h-[0px] flex-1 overflow-auto">
      <div className="p-4 grid gap-4">
        {seeded ? (
          <Link href="/toeic/writing/runner" style={{ textDecoration: "none" }}>
            <Card hoverable>
              <div className="flex items-center gap-2">
                <ClipboardList className="text-3xl text-accent" />
                <strong className="text-lg text-ink">Start Writing Test</strong>
              </div>
              <div className="text-text-muted mt-1.5">
                Q1-5 picture (8 mins) · Q6-7 email (20 mins) · Q8 opinion (30 mins)
              </div>
              <div className="mt-2">
                <Tag color="orange">AI grading after submission</Tag>
              </div>
            </Card>
          </Link>
        ) : (
          <Card>
            <Empty description="No prompts found. Run `pnpm seed:toeic-writing`" />
          </Card>
        )}

        <Card title="Writing Test History" size="small">
          {history.length === 0 ? (
            <Empty description="No sessions found" />
          ) : (
            <div className="grid gap-2">
              {history.map((h) => (
                <Link
                  key={h.id}
                  href={`/toeic/writing/${h.id}/result`}
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
        </Card>
      </div>
    </div>
  );
}
