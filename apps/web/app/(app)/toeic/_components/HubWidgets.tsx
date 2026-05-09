import { headers } from "next/headers";
import { Card } from "antd";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { db } from "@repo/database";
import { reviewTask, learningEvent } from "@repo/database";
import { and, eq, gte, lte, sql } from "drizzle-orm";

export async function HubWidgets() {
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session?.user?.id) return null;
	const userId = session.user.id;

	// Due review count (TOEIC-related)
	const dueAll = await db
		.select({ c: sql<number>`count(*)::int` })
		.from(reviewTask)
		.where(
			and(
				eq(reviewTask.userId, userId),
				eq(reviewTask.status, "pending"),
				lte(reviewTask.dueAt, new Date()),
			),
		);
	const dueCount = dueAll[0]?.c ?? 0;

	// Recent activity: events in last 7 days
	const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
	const recentEvents = await db
		.select({ c: sql<number>`count(*)::int` })
		.from(learningEvent)
		.where(
			and(
				eq(learningEvent.userId, userId),
				gte(learningEvent.createdAt, sevenDaysAgo),
				sql`${learningEvent.moduleType} LIKE 'toeic_%'`,
			),
		);
	const weekActivity = recentEvents[0]?.c ?? 0;

	// Today's events for streak hint
	const todayStart = new Date();
	todayStart.setHours(0, 0, 0, 0);
	const todayCount = await db
		.select({ c: sql<number>`count(*)::int` })
		.from(learningEvent)
		.where(
			and(
				eq(learningEvent.userId, userId),
				gte(learningEvent.createdAt, todayStart),
				sql`${learningEvent.moduleType} LIKE 'toeic_%'`,
			),
		);
	const todayActivity = todayCount[0]?.c ?? 0;

	return (
		<div
			style={{
				display: "grid",
				gap: 12,
				gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
			}}
		>
			<Card title="📊 Hoạt động 7 ngày" size="small">
				<div style={{ fontSize: 28, fontWeight: 700 }}>{weekActivity}</div>
				<div style={{ color: "var(--text-muted, #94a3b8)", fontSize: 13 }}>
					events TOEIC trong tuần
				</div>
			</Card>

			<Card title="🎯 Hôm nay" size="small">
				<div style={{ fontSize: 28, fontWeight: 700 }}>{todayActivity}</div>
				<div style={{ color: "var(--text-muted, #94a3b8)", fontSize: 13 }}>
					{todayActivity === 0 ? "Bắt đầu bằng 1 drill 10 câu" : "Giữ momentum 🔥"}
				</div>
			</Card>

			<Card title="📚 Cần ôn lại" size="small">
				<div style={{ fontSize: 28, fontWeight: 700 }}>{dueCount}</div>
				<div style={{ color: "var(--text-muted, #94a3b8)", fontSize: 13 }}>
					{dueCount > 0 ? (
						<>
							Câu sai + từ vựng tới hạn ·{" "}
							<Link href="/toeic/grammar/drill?mode=mistake&count=20" style={{ color: "#3b82f6" }}>
								Ôn ngay
							</Link>
						</>
					) : (
						"Chưa có gì cần ôn"
					)}
				</div>
			</Card>

			<Card title="📈 Predicted Score" size="small">
				<div style={{ color: "var(--text-muted, #94a3b8)", fontSize: 13 }}>
					Hoàn thành 1 mock test để xem điểm dự đoán (sub-project #9)
				</div>
			</Card>
		</div>
	);
}
