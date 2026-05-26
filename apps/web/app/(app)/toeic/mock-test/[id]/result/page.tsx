import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { Alert, Card, Tag } from "antd";

import { auth } from "@/lib/auth";
import { db } from "@repo/database";
import { toeicAttempt, toeicAnswer, toeicQuestion } from "@repo/database";
import { and, eq, inArray } from "drizzle-orm";
import { bandLabel } from "@/lib/toeic/predict";
import { ReviewTabs } from "./ReviewTabs";
import { AlertTriangle, Trophy } from "lucide-react";

export default async function MockResultPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session?.user?.id) notFound();

	const [attempt] = await db
		.select()
		.from(toeicAttempt)
		.where(and(eq(toeicAttempt.id, id), eq(toeicAttempt.userId, session.user.id)))
		.limit(1);
	if (!attempt) notFound();

	const answers = await db.select().from(toeicAnswer).where(eq(toeicAnswer.attemptId, id));
	const questionIds = answers.map((a) => a.questionId);
	const questions = questionIds.length
		? await db.select().from(toeicQuestion).where(inArray(toeicQuestion.id, questionIds))
		: [];
	const partById = new Map(questions.map((q) => [q.id, q.part]));

	const byPart: Record<number, { correct: number; total: number }> = {};
	for (const a of answers) {
		const p = partById.get(a.questionId) ?? 0;
		byPart[p] = byPart[p] ?? { correct: 0, total: 0 };
		byPart[p].total++;
		if (a.isCorrect === true) byPart[p].correct++;
	}

	const total = attempt.totalScaled ?? 0;

	const cheat = attempt.cheatViolations;
	const cheatTriggered =
		cheat && (cheat.tabSwitches > 0 || cheat.pasteAttempts > 0 || cheat.longBlurMs > 5000);

	const reviewQuestions = questions.map((q) => ({
		id: q.id,
		part: q.part,
		number: q.number,
		questionText: q.questionText,
		options: q.options,
		correctIndex: q.correctIndex,
		explanationVi: q.explanationVi,
	}));
	const reviewAnswers = answers.map((a) => ({
		questionId: a.questionId,
		selectedIndex: a.selectedIndex,
		isCorrect: a.isCorrect,
		flagged: a.flagged ?? false,
	}));

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
			<div style={{ padding: 16, display: "grid", gap: 16, maxWidth: 720 }}>
				{cheatTriggered && (
					<Alert
						type="warning"
						showIcon
						icon={<AlertTriangle />}
						message="Phát hiện hành vi bất thường trong quá trình làm bài"
						description={
							<div style={{ fontSize: 13 }}>
								{cheat!.tabSwitches > 0 && (
									<div>• Rời tab: {cheat!.tabSwitches} lần (tổng {Math.round(cheat!.longBlurMs / 1000)}s)</div>
								)}
								{cheat!.pasteAttempts > 0 && <div>• Paste: {cheat!.pasteAttempts} lần</div>}
								<div style={{ marginTop: 4, color: "var(--text-muted, #94a3b8)" }}>
									Điểm vẫn được ghi nhận, nhưng nên hạn chế để mô phỏng môi trường thi thật.
								</div>
							</div>
						}
					/>
				)}
				<Card>
					<div style={{ textAlign: "center" }}>
						<div style={{ fontSize: 56, fontWeight: 800, color: "var(--accent)" }}>{total}</div>
						<div style={{ color: "var(--text-muted)" }}>/ 990</div>
						<div style={{ marginTop: 8 }}>
							<Tag color="orange">{bandLabel(total)}</Tag>
						</div>
					</div>
					<div
						style={{
							display: "grid",
							gap: 12,
							gridTemplateColumns: "repeat(2, 1fr)",
							marginTop: 16,
						}}
					>
						<div style={{ textAlign: "center", padding: 12 }}>
							<div style={{ fontSize: 13, color: "var(--text-muted, #94a3b8)" }}>Listening</div>
							<div style={{ fontSize: 28, fontWeight: 700 }}>
								{attempt.scaledListening ?? "—"}
							</div>
							<div style={{ fontSize: 12, color: "var(--text-muted)" }}>
								{attempt.rawListening}/{(byPart[2]?.total ?? 0) + (byPart[3]?.total ?? 0) + (byPart[4]?.total ?? 0)} đúng
							</div>
						</div>
						<div style={{ textAlign: "center", padding: 12 }}>
							<div style={{ fontSize: 13, color: "var(--text-muted, #94a3b8)" }}>Reading</div>
							<div style={{ fontSize: 28, fontWeight: 700 }}>
								{attempt.scaledReading ?? "—"}
							</div>
							<div style={{ fontSize: 12, color: "var(--text-muted)" }}>
								{attempt.rawReading}/{(byPart[5]?.total ?? 0) + (byPart[6]?.total ?? 0) + (byPart[7]?.total ?? 0)} đúng
							</div>
						</div>
					</div>
				</Card>

				<Card title="Phân tích theo Part" size="small">
					<div style={{ display: "grid", gap: 8 }}>
						{[2, 3, 4, 5, 6, 7].map((p) => {
							const stats = byPart[p];
							if (!stats) return null;
							const pct = Math.round((stats.correct / stats.total) * 100);
							return (
								<div
									key={p}
									style={{
										display: "grid",
										gridTemplateColumns: "60px 1fr 80px",
										gap: 12,
										alignItems: "center",
									}}
								>
									<div style={{ fontWeight: 600 }}>Part {p}</div>
									<div
										style={{
											background: "var(--surface, #0f172a)",
											borderRadius: 4,
											height: 8,
											overflow: "hidden",
										}}
									>
										<div
											style={{
												width: `${pct}%`,
												background: pct >= 80 ? "var(--success)" : pct >= 60 ? "var(--warning)" : "var(--error)",
												height: "100%",
											}}
										/>
									</div>
									<div style={{ fontSize: 13, textAlign: "right" }}>
										{stats.correct}/{stats.total} ({pct}%)
									</div>
								</div>
							);
						})}
					</div>
				</Card>

				<ReviewTabs questions={reviewQuestions} answers={reviewAnswers} />

				<div style={{ display: "flex", gap: 8 }}>
					<Link
						href="/toeic/mock-test"
						style={{
							padding: "8px 16px",
							borderRadius: 8,
							background: "var(--surface-hover)",
							color: "var(--ink)",
							border: "1px solid var(--border)",
							textDecoration: "none",
						}}
					>
						Về Hub
					</Link>
					<Link
						href="/toeic/progress"
						style={{
							padding: "8px 16px",
							borderRadius: 8,
							background: "var(--accent)",
							color: "var(--text-on-accent)",
							textDecoration: "none",
						}}
					>
						Xem trend
					</Link>
				</div>
			</div>
		</div>
	);
}
