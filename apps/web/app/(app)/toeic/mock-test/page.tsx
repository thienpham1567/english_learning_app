import { db, toeicAttempt } from "@repo/database";
import { Card, Tag } from "antd";
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
            <Card hoverable style={{ borderColor: "var(--warning)", borderWidth: 2 }}>
              <div className="flex items-center gap-2">
                <Redo className="text-2xl" style={{ color: "var(--warning)" }} />
                <strong className="text-lg">Tiếp tục mock test đang dở</strong>
              </div>
              <div className="mt-2 text-text-muted">
                Bắt đầu lúc {new Date(inProgress.startedAt).toLocaleString("vi-VN")} ·{" "}
                {inProgress.questionCount} câu
              </div>
            </Card>
          </Link>
        )}
        <div
          className="grid gap-3"
          style={{ gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}
        >
          <Link href="/toeic/mock-test/runner?mode=full" style={{ textDecoration: "none" }}>
            <Card hoverable>
              <div className="flex items-center gap-2">
                <Trophy className="text-2xl text-accent" />
                <strong className="text-lg text-ink">Full Mock</strong>
              </div>
              <div className="mt-2 text-text-muted">194 câu · ~1h54 · Strict timer</div>
              <div className="mt-2">
                <Tag color="orange">Part 1: chưa có content</Tag>
              </div>
              <div className="mt-1.5 text-[13px] text-text-muted">
                25 P2 + 39 P3 + 30 P4 + 30 P5 + 16 P6 + 54 P7
              </div>
            </Card>
          </Link>
          <Link href="/toeic/mock-test/runner?mode=mini" style={{ textDecoration: "none" }}>
            <Card hoverable>
              <div className="flex items-center gap-2">
                <Clock className="text-2xl text-emerald-500" />
                <strong className="text-lg text-ink">Mini Mock</strong>
              </div>
              <div className="mt-2 text-text-muted">100 câu · ~1h · Luyện hằng ngày</div>
              <div className="mt-2">
                <Tag color="green">Khuyến nghị</Tag>
              </div>
              <div className="mt-1.5 text-[13px] text-text-muted">
                13 P2 + 20 P3 + 15 P4 + 15 P5 + 8 P6 + 29 P7
              </div>
            </Card>
          </Link>
        </div>

        <Card title="Lịch sử mock test" size="small">
          {history.length === 0 ? (
            <div className="text-text-muted">
              Chưa có mock test nào. Bắt đầu mini mock để có dữ liệu cho điểm dự đoán.
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
                    {new Date(h.completedAt!).toLocaleString("vi-VN")} · {h.questionCount} câu
                  </span>
                  <span className="text-lg font-bold">{h.totalScaled ?? "—"} / 990</span>
                </Link>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
