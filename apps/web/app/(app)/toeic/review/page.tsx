import Link from "next/link";
import { headers } from "next/headers";
import { Card, Tag, Empty } from "antd";
import { ReloadOutlined, AlertOutlined, ReadOutlined } from "@ant-design/icons";
import { auth } from "@/lib/auth";
import { db } from "@repo/database";
import { reviewTask, toeicQuestion, toeicVocab } from "@repo/database";
import { and, eq, lte, sql, inArray, desc } from "drizzle-orm";
import { requireToeicBaseline } from "@/lib/toeic/require-baseline";

export default async function ToeicReviewPage() {
	await requireToeicBaseline();
	const session = await auth.api.getSession({ headers: await headers() });
	const userId = session!.user!.id;

	const allDue = await db
		.select()
		.from(reviewTask)
		.where(
			and(
				eq(reviewTask.userId, userId),
				eq(reviewTask.status, "pending"),
				lte(reviewTask.dueAt, new Date()),
			),
		);

	const errorRetryDue = allDue.filter((t) => t.sourceType === "error_retry");
	const flashcardDue = allDue.filter((t) => t.sourceType === "flashcard_review");

	// Filter error_retry to only TOEIC questions
	const toeicErrorIds: string[] = [];
	if (errorRetryDue.length > 0) {
		const ids = errorRetryDue.map((t) => t.sourceId);
		const rows = await db
			.select({ id: toeicQuestion.id, part: toeicQuestion.part })
			.from(toeicQuestion)
			.where(inArray(toeicQuestion.id, ids));
		for (const r of rows) toeicErrorIds.push(r.id);
	}

	// Recent activity feed: last 10 reviews
	const recent = await db
		.select()
		.from(reviewTask)
		.where(
			and(
				eq(reviewTask.userId, userId),
				sql`${reviewTask.lastOutcome} IS NOT NULL`,
			),
		)
		.orderBy(desc(reviewTask.updatedAt))
		.limit(10);

	const recentVocabIds = recent
		.filter((r) => r.sourceType === "flashcard_review")
		.map((r) => r.sourceId);
	const vocabRows = recentVocabIds.length
		? await db.select().from(toeicVocab).where(inArray(toeicVocab.id, recentVocabIds))
		: [];
	const vocabById = new Map(vocabRows.map((v) => [v.id, v]));

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
			<div style={{ padding: 16, display: "grid", gap: 16 }}>
				<div
					style={{
						display: "grid",
						gap: 12,
						gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
					}}
				>
					<Card
						hoverable={toeicErrorIds.length > 0}
						style={toeicErrorIds.length === 0 ? { opacity: 0.6 } : undefined}
					>
						<div style={{ display: "flex", alignItems: "center", gap: 8 }}>
							<AlertOutlined style={{ fontSize: 22, color: "var(--error)" }} />
							<strong>Câu sai TOEIC</strong>
						</div>
						<div style={{ fontSize: 32, fontWeight: 700, marginTop: 8, color: "var(--ink)" }}>
							{toeicErrorIds.length}
						</div>
						<div style={{ color: "var(--text-muted)", fontSize: 13 }}>
							Câu Part 5/6/7 bạn từng sai
						</div>
						{toeicErrorIds.length > 0 && (
							<Link
								href="/toeic/grammar/drill?mode=mistake&count=20"
								style={{
									display: "inline-block",
									marginTop: 12,
									padding: "6px 12px",
									borderRadius: 6,
									background: "var(--error)",
									color: "#fff",
									textDecoration: "none",
									fontSize: 13,
								}}
							>
								Drill ngay
							</Link>
						)}
					</Card>

					<Card
						hoverable={flashcardDue.length > 0}
						style={flashcardDue.length === 0 ? { opacity: 0.6 } : undefined}
					>
						<div style={{ display: "flex", alignItems: "center", gap: 8 }}>
							<ReadOutlined style={{ fontSize: 22, color: "var(--accent)" }} />
							<strong>Từ vựng cần ôn</strong>
						</div>
						<div style={{ fontSize: 32, fontWeight: 700, marginTop: 8, color: "var(--ink)" }}>
							{flashcardDue.length}
						</div>
						<div style={{ color: "var(--text-muted)", fontSize: 13 }}>
							Từ TOEIC tới hạn SRS
						</div>
						{flashcardDue.length > 0 && (
							<Link
								href="/toeic/vocab/learn?mode=review"
								style={{
									display: "inline-block",
									marginTop: 12,
									padding: "6px 12px",
									borderRadius: 6,
									background: "var(--accent)",
									color: "var(--text-on-accent)",
									textDecoration: "none",
									fontSize: 13,
								}}
							>
								Ôn ngay
							</Link>
						)}
					</Card>
				</div>

				<Card title="Lịch sử ôn gần đây" size="small">
					{recent.length === 0 ? (
						<Empty description="Chưa có hoạt động ôn nào" />
					) : (
						<div style={{ display: "grid", gap: 6 }}>
							{recent.map((r) => {
								const isVocab = r.sourceType === "flashcard_review";
								const v = isVocab ? vocabById.get(r.sourceId) : null;
								return (
									<div
										key={r.id}
										style={{
											display: "grid",
											gridTemplateColumns: "100px 1fr auto",
											gap: 12,
											alignItems: "center",
											fontSize: 13,
										}}
									>
										<Tag color={isVocab ? "orange" : "red"}>
											{isVocab ? "Vocab" : "Câu sai"}
										</Tag>
										<span style={{ color: "var(--ink)" }}>{v ? v.word : `Câu hỏi #${r.sourceId.slice(0, 8)}`}</span>
										<span style={{ color: "var(--text-muted)" }}>
											{r.lastOutcome ?? "—"}
										</span>
									</div>
								);
							})}
						</div>
					)}
				</Card>
			</div>
		</div>
	);
}
