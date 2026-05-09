import Link from "next/link";
import { headers } from "next/headers";
import { Card, Tag, Empty, Progress } from "antd";
import { LineChartOutlined } from "@ant-design/icons";
import { ModuleHeader } from "@/components/shared/ModuleHeader";
import { auth } from "@/lib/auth";
import { db } from "@repo/database";
import { userSkillState, toeicAttempt, learningEvent } from "@repo/database";
import { and, desc, eq, gte, isNotNull, sql } from "drizzle-orm";
import { TOEIC_SKILLS, getSkillLabel, type ToeicSkill } from "@repo/contracts";
import { computePredictedScore, bandLabel } from "@/lib/toeic/predict";
import { requireToeicBaseline } from "@/lib/toeic/require-baseline";

export default async function ToeicProgressPage() {
	await requireToeicBaseline();
	const session = await auth.api.getSession({ headers: await headers() });
	const userId = session!.user!.id;

	const states = await db.select().from(userSkillState).where(eq(userSkillState.userId, userId));
	const toeicStates = states.filter((s) => (TOEIC_SKILLS as readonly string[]).includes(s.skillId));
	const predicted = computePredictedScore(toeicStates);

	const sortedByProf = [...toeicStates].sort((a, b) => a.proficiency - b.proficiency);
	const weakest = sortedByProf.slice(0, 5);
	const strongest = sortedByProf.slice(-5).reverse();

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

	// 30-day trend
	const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
	const trend = await db
		.select({
			day: sql<string>`DATE(${learningEvent.createdAt})`,
			c: sql<number>`count(*)::int`,
		})
		.from(learningEvent)
		.where(
			and(
				eq(learningEvent.userId, userId),
				gte(learningEvent.createdAt, since),
				sql`${learningEvent.moduleType} LIKE 'toeic_%'`,
			),
		)
		.groupBy(sql`DATE(${learningEvent.createdAt})`)
		.orderBy(sql`DATE(${learningEvent.createdAt})`);

	const maxCount = trend.reduce((m, r) => Math.max(m, r.c), 1);

	return (
		<div
			style={{
				display: "flex",
				flexDirection: "column",
				height: "100%",
				minHeight: 0,
				flex: 1,
				overflow: "auto",
			}}
		>
			<ModuleHeader
				icon={<LineChartOutlined />}
				gradient="linear-gradient(135deg, #1a2332 0%, #2d3748 40%, #4a5568 100%)"
				title="TOEIC Progress"
				subtitle="Điểm dự đoán + xu hướng 30 ngày"
			/>
			<div style={{ padding: 16, display: "grid", gap: 16 }}>
				{/* Predicted score */}
				<Card title="📈 Điểm dự đoán (từ mastery)" size="small">
					{predicted ? (
						<>
							<div style={{ textAlign: "center" }}>
								<div style={{ fontSize: 56, fontWeight: 800, color: "#3b82f6" }}>
									{predicted.total}
								</div>
								<div style={{ color: "var(--text-muted, #94a3b8)" }}>/ 990</div>
								<Tag color="blue" style={{ marginTop: 8 }}>
									{bandLabel(predicted.total)}
								</Tag>
							</div>
							<div
								style={{
									display: "grid",
									gap: 12,
									gridTemplateColumns: "repeat(2, 1fr)",
									marginTop: 12,
								}}
							>
								<div style={{ textAlign: "center" }}>
									<div style={{ fontSize: 13, color: "var(--text-muted)" }}>Listening</div>
									<div style={{ fontSize: 22, fontWeight: 700 }}>
										{predicted.listeningScaled}
									</div>
								</div>
								<div style={{ textAlign: "center" }}>
									<div style={{ fontSize: 13, color: "var(--text-muted)" }}>Reading</div>
									<div style={{ fontSize: 22, fontWeight: 700 }}>{predicted.readingScaled}</div>
								</div>
							</div>
							<div style={{ marginTop: 12, fontSize: 12, color: "var(--text-muted)" }}>
								Confidence: {Math.round(predicted.confidence * 100)}% · Signals:{" "}
								{predicted.signalCount} · Sai số ±50 ở phase MVP
							</div>
						</>
					) : (
						<Empty description="Cần làm diagnostic + vài drill để có dữ liệu" />
					)}
				</Card>

				{/* Last mock */}
				<Card title="🎯 Mock test gần nhất" size="small">
					{lastMock && lastMock.totalScaled !== null ? (
						<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
							<div>
								<div style={{ fontSize: 28, fontWeight: 700 }}>
									{lastMock.totalScaled} / 990
								</div>
								<div style={{ color: "var(--text-muted)", fontSize: 13 }}>
									{new Date(lastMock.completedAt!).toLocaleDateString("vi-VN")} · L{" "}
									{lastMock.scaledListening} · R {lastMock.scaledReading}
								</div>
							</div>
							<Link
								href={`/toeic/mock-test/${lastMock.id}/result`}
								style={{
									padding: "6px 12px",
									borderRadius: 6,
									background: "var(--surface-hover, #1f2937)",
									color: "#fff",
									textDecoration: "none",
									fontSize: 13,
								}}
							>
								Xem chi tiết
							</Link>
						</div>
					) : (
						<Link
							href="/toeic/mock-test"
							style={{ color: "#3b82f6", textDecoration: "underline" }}
						>
							Làm mock test đầu tiên
						</Link>
					)}
				</Card>

				{/* Trend chart */}
				<Card title="🔥 Hoạt động 30 ngày" size="small">
					{trend.length === 0 ? (
						<Empty description="Chưa có hoạt động" />
					) : (
						<div style={{ display: "flex", gap: 2, alignItems: "flex-end", height: 100 }}>
							{trend.map((d) => (
								<div
									key={d.day}
									title={`${d.day}: ${d.c} events`}
									style={{
										flex: 1,
										height: `${Math.round((d.c / maxCount) * 100)}%`,
										minHeight: 4,
										background: "#3b82f6",
										borderRadius: 2,
									}}
								/>
							))}
						</div>
					)}
				</Card>

				{/* Top weak/strong */}
				<div
					style={{
						display: "grid",
						gap: 12,
						gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
					}}
				>
					<Card title="🔻 5 yếu nhất" size="small">
						{weakest.length === 0 ? (
							<Empty description="—" />
						) : (
							<div style={{ display: "grid", gap: 6 }}>
								{weakest.map((s) => (
									<div key={s.skillId}>
										<div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
											<span>{getSkillLabel(s.skillId as ToeicSkill)}</span>
											<span style={{ color: "var(--text-muted)" }}>
												{Math.round(s.proficiency * 100)}/100
											</span>
										</div>
										<Progress
											percent={Math.round(s.proficiency * 100)}
											showInfo={false}
											size="small"
											strokeColor="#ef4444"
										/>
									</div>
								))}
							</div>
						)}
					</Card>
					<Card title="🔺 5 mạnh nhất" size="small">
						{strongest.length === 0 ? (
							<Empty description="—" />
						) : (
							<div style={{ display: "grid", gap: 6 }}>
								{strongest.map((s) => (
									<div key={s.skillId}>
										<div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
											<span>{getSkillLabel(s.skillId as ToeicSkill)}</span>
											<span style={{ color: "var(--text-muted)" }}>
												{Math.round(s.proficiency * 100)}/100
											</span>
										</div>
										<Progress
											percent={Math.round(s.proficiency * 100)}
											showInfo={false}
											size="small"
											strokeColor="#10b981"
										/>
									</div>
								))}
							</div>
						)}
					</Card>
				</div>
			</div>
		</div>
	);
}
