import Link from "next/link";
import { headers } from "next/headers";
import { Card, Tag, Empty, Progress } from "antd";

import { auth } from "@/lib/auth";
import { db } from "@repo/database";
import { userSkillState, toeicAttempt, learningEvent, errorLog } from "@repo/database";
import { and, desc, eq, gte, isNotNull, like, or, sql } from "drizzle-orm";
import { TOEIC_SKILLS, getSkillLabel, type ToeicSkill } from "@repo/contracts";
import { computePredictedScore, bandLabel } from "@/lib/toeic/predict";
import { requireToeicBaseline } from "@/lib/toeic/require-baseline";
import { summarizeErrorPatterns } from "@repo/modules";
import { AlertTriangle, TrendingUp } from "lucide-react";

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

	// Error patterns from TOEIC errors (last 30 days)
	const errorRows = await db
		.select()
		.from(errorLog)
		.where(
			and(
				eq(errorLog.userId, userId),
				or(
					like(errorLog.sourceModule, "toeic-%"),
					eq(errorLog.sourceModule, "mock-test"),
				),
				gte(errorLog.createdAt, since),
			),
		)
		.orderBy(desc(errorLog.createdAt))
		.limit(200);

	const patterns = summarizeErrorPatterns(
		errorRows.map((e) => ({
			id: e.id,
			sourceModule: e.sourceModule,
			grammarTopic: e.grammarTopic,
			questionStem: e.questionStem,
			userAnswer: e.userAnswer,
			correctAnswer: e.correctAnswer,
			isResolved: e.isResolved,
			createdAt: e.createdAt.toISOString(),
		})),
	).slice(0, 5);

	return (
		<div className="flex flex-col h-full h-[0px] flex-1 overflow-auto" >
			<div className="p-4 grid gap-4" >
				{/* Predicted score */}
				<Card title="📈 Điểm dự đoán (từ mastery)" size="small">
					{predicted ? (
						<>
							<div className="text-center" >
								<div className="font-extrabold text-accent" style={{fontSize: 56}} >
									{predicted.total}
								</div>
								<div className="text-text-muted" >/ 990</div>
								<Tag color="orange" className="mt-2" >
									{bandLabel(predicted.total)}
								</Tag>
							</div>
							<div className="grid gap-3 mt-3" style={{gridTemplateColumns: "repeat(2, 1fr)"}} >
								<div className="text-center" >
									<div className="text-[13px] text-text-muted" >Listening</div>
									<div className="text-2xl font-bold" >
										{predicted.listeningScaled}
									</div>
								</div>
								<div className="text-center" >
									<div className="text-[13px] text-text-muted" >Reading</div>
									<div className="text-2xl font-bold" >{predicted.readingScaled}</div>
								</div>
							</div>
							<div className="mt-3 text-xs text-text-muted" >
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
						<div className="flex justify-between items-center" >
							<div>
								<div className="text-[28px] font-bold" >
									{lastMock.totalScaled} / 990
								</div>
								<div className="text-text-muted text-[13px]" >
									{new Date(lastMock.completedAt!).toLocaleDateString("vi-VN")} · L{" "}
									{lastMock.scaledListening} · R {lastMock.scaledReading}
								</div>
							</div>
							<Link
								href={`/toeic/mock-test/${lastMock.id}/result`} className="py-1.5 px-3 rounded-md text-[13px]" style={{background: "var(--surface-hover, #1f2937)", color: "#fff", textDecoration: "none"}} >
								Xem chi tiết
							</Link>
						</div>
					) : (
						<Link
							href="/toeic/mock-test" className="text-accent" style={{textDecoration: "underline"}} >
							Làm mock test đầu tiên
						</Link>
					)}
				</Card>

				{/* Trend chart */}
				<Card title="🔥 Hoạt động 30 ngày" size="small">
					{trend.length === 0 ? (
						<Empty description="Chưa có hoạt động" />
					) : (
						<div className="flex items-end h-[100px]" style={{gap: 2}} >
							{trend.map((d) => (
								<div
									key={d.day}
									title={`${d.day}: ${d.c} events`} className="flex-1 h-[4px] rounded-sm" style={{height: `${Math.round((d.c / maxCount) * 100)}%`, background: "var(--accent)"}} />
							))}
						</div>
					)}
				</Card>

				{/* Error patterns */}
				<Card
					title={
						<span>
							<AlertTriangle className="text-destructive" /> Pattern lỗi gần đây
						</span>
					}
					size="small"
				>
					{patterns.length === 0 ? (
						<Empty description="Chưa có pattern lỗi nào" />
					) : (
						<div className="grid gap-2" >
							{patterns.map((p) => (
								<div
									key={p.category.key} className="grid gap-3 items-center rounded-lg bg-(--surface)" style={{gridTemplateColumns: "1fr auto", padding: 10}} >
									<div>
										<div className="font-medium" >{p.category.label}</div>
										<div className="text-xs text-text-muted" >
											{p.unresolvedCount}/{p.totalCount} chưa nắm · {p.recentCount} câu trong 7 ngày
										</div>
										{p.examples[0] && (
											<div className="text-xs text-text-muted mt-1 italic" >
												Ví dụ: "{p.examples[0].questionStem.slice(0, 80)}..."
											</div>
										)}
									</div>
									<Link
										href={p.nextAction.href} className="py-1.5 px-3 rounded-md text-[13px]" style={{background: "var(--error)", color: "#fff", textDecoration: "none", whiteSpace: "nowrap"}} >
										{p.nextAction.label}
									</Link>
								</div>
							))}
						</div>
					)}
				</Card>

				{/* Top weak/strong */}
				<div className="grid gap-3" style={{gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))"}} >
					<Card title="🔻 5 yếu nhất" size="small">
						{weakest.length === 0 ? (
							<Empty description="—" />
						) : (
							<div className="grid gap-1.5" >
								{weakest.map((s) => (
									<div key={s.skillId}>
										<div className="flex justify-between text-[13px]" >
											<span>{getSkillLabel(s.skillId as ToeicSkill)}</span>
											<span className="text-text-muted" >
												{Math.round(s.proficiency * 100)}/100
											</span>
										</div>
										<Progress
											percent={Math.round(s.proficiency * 100)}
											showInfo={false}
											size="small"
											strokeColor="var(--error)"
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
							<div className="grid gap-1.5" >
								{strongest.map((s) => (
									<div key={s.skillId}>
										<div className="flex justify-between text-[13px]" >
											<span>{getSkillLabel(s.skillId as ToeicSkill)}</span>
											<span className="text-text-muted" >
												{Math.round(s.proficiency * 100)}/100
											</span>
										</div>
										<Progress
											percent={Math.round(s.proficiency * 100)}
											showInfo={false}
											size="small"
											strokeColor="var(--success)"
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
