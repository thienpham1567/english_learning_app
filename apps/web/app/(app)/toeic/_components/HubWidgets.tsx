import Link from "next/link";
import { headers } from "next/headers";
import { Card, Tag } from "antd";
import { auth } from "@/lib/auth";
import { db } from "@repo/database";
import { reviewTask, learningEvent, userSkillState, toeicAttempt } from "@repo/database";
import { and, desc, eq, gte, isNotNull, lte, sql } from "drizzle-orm";
import { TOEIC_SKILLS } from "@repo/contracts";
import { computePredictedScore, bandLabel } from "@/lib/toeic/predict";

export async function HubWidgets() {
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session?.user?.id) return null;
	const userId = session.user.id;

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

	// Predicted score
	const states = await db.select().from(userSkillState).where(eq(userSkillState.userId, userId));
	const toeicStates = states.filter((s) => (TOEIC_SKILLS as readonly string[]).includes(s.skillId));
	const predicted = computePredictedScore(toeicStates);

	// Last mock
	const [lastMock] = await db
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
		.limit(1);

	return (
		<div
			style={{
				display: "grid",
				gap: 12,
				gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
			}}
		>
			<Card title="📈 Predicted Score" size="small">
				{predicted ? (
					<>
						<div style={{ fontSize: 28, fontWeight: 700 }}>{predicted.total}</div>
						<div style={{ color: "var(--text-muted, #94a3b8)", fontSize: 13 }}>
							{bandLabel(predicted.total)}
						</div>
						<Link href="/toeic/progress" style={{ color: "#3b82f6", fontSize: 12 }}>
							Chi tiết →
						</Link>
					</>
				) : (
					<div style={{ color: "var(--text-muted, #94a3b8)", fontSize: 13 }}>
						Cần thêm dữ liệu (làm vài bài drill)
					</div>
				)}
			</Card>

			<Card title="🎯 Mock gần nhất" size="small">
				{lastMock?.totalScaled ? (
					<>
						<div style={{ fontSize: 28, fontWeight: 700 }}>{lastMock.totalScaled} / 990</div>
						<Link
							href={`/toeic/mock-test/${lastMock.id}/result`}
							style={{ color: "#3b82f6", fontSize: 12 }}
						>
							Xem →
						</Link>
					</>
				) : (
					<Link href="/toeic/mock-test" style={{ color: "#3b82f6", fontSize: 13 }}>
						Làm mock đầu tiên →
					</Link>
				)}
			</Card>

			<Card title="🔥 Hôm nay" size="small">
				<div style={{ fontSize: 28, fontWeight: 700 }}>{todayActivity}</div>
				<div style={{ color: "var(--text-muted, #94a3b8)", fontSize: 13 }}>
					{todayActivity === 0 ? "Bắt đầu drill 10 câu" : "Giữ momentum 🔥"}
				</div>
			</Card>

			<Card title="📚 Cần ôn lại" size="small">
				<div style={{ fontSize: 28, fontWeight: 700 }}>{dueCount}</div>
				<div style={{ color: "var(--text-muted, #94a3b8)", fontSize: 13 }}>
					{dueCount > 0 ? (
						<Link href="/toeic/review" style={{ color: "#3b82f6" }}>
							Ôn ngay →
						</Link>
					) : (
						"Chưa có gì cần ôn"
					)}
				</div>
			</Card>
		</div>
	);
}
