import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { Card, Tag, Empty } from "antd";
import { AudioOutlined } from "@ant-design/icons";
import { auth } from "@/lib/auth";
import { db } from "@repo/database";
import {
	toeicSpeakingSession,
	toeicSpeakingResponse,
	toeicSpeakingPrompt,
} from "@repo/database";
import { and, asc, eq, inArray } from "drizzle-orm";

const TYPE_LABEL: Record<string, string> = {
	q1_2_read_aloud: "Read aloud",
	q3_4_describe_picture: "Describe picture",
	q5_7_respond_question: "Respond to question",
	q8_10_respond_info: "Respond using info",
	q11_opinion: "Opinion",
};

type PronMetrics = {
	wpm: number;
	fillerCount: number;
	fillerRate: number;
	longPauseCount: number;
	avgConfidence: number;
	lowConfidenceWords: string[];
	alignment?: {
		expectedWords: number;
		spokenWords: number;
		matchedWords: number;
		missingWords: string[];
		addedWords: string[];
		accuracy: number;
	};
};

function PronunciationSection({ metrics }: { metrics: PronMetrics }) {
	const wpmOk = metrics.wpm >= 110 && metrics.wpm <= 175;
	return (
		<div
			style={{
				background: "var(--surface, #0f172a)",
				padding: 12,
				borderRadius: 6,
				marginTop: 8,
			}}
		>
			<div style={{ fontWeight: 600, marginBottom: 6 }}>📊 Phát âm</div>
			<div
				style={{
					display: "grid",
					gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
					gap: 8,
					fontSize: 13,
				}}
			>
				<div>
					Pace: <strong>{metrics.wpm} WPM</strong> {wpmOk ? "✓" : "⚠"}
				</div>
				<div>
					Filler: <strong>{metrics.fillerCount}</strong>
					{metrics.fillerRate > 0 ? ` (${metrics.fillerRate}/phút)` : ""}
				</div>
				<div>
					Pause dài: <strong>{metrics.longPauseCount}</strong>
				</div>
				<div>
					Confidence: <strong>{metrics.avgConfidence.toFixed(2)}</strong>
				</div>
			</div>
			{metrics.lowConfidenceWords.length > 0 && (
				<div style={{ marginTop: 8, fontSize: 13 }}>
					<span style={{ color: "var(--text-muted, #94a3b8)" }}>Từ phát âm không rõ: </span>
					{metrics.lowConfidenceWords.map((w) => (
						<Tag key={w} color="orange" style={{ margin: "2px 4px 2px 0" }}>
							{w}
						</Tag>
					))}
				</div>
			)}
			{metrics.alignment && (
				<div style={{ marginTop: 8, fontSize: 13 }}>
					<div>
						Accuracy:{" "}
						<strong>
							{Math.round(metrics.alignment.accuracy * 100)}% (
							{metrics.alignment.matchedWords}/{metrics.alignment.expectedWords} từ)
						</strong>
					</div>
					{metrics.alignment.missingWords.length > 0 && (
						<div style={{ marginTop: 4 }}>
							<span style={{ color: "var(--text-muted, #94a3b8)" }}>Bỏ qua: </span>
							{metrics.alignment.missingWords.slice(0, 8).map((w) => (
								<Tag key={w} color="red" style={{ margin: "2px 4px 2px 0" }}>
									{w}
								</Tag>
							))}
						</div>
					)}
					{metrics.alignment.addedWords.length > 0 && (
						<div style={{ marginTop: 4 }}>
							<span style={{ color: "var(--text-muted, #94a3b8)" }}>Thêm: </span>
							{metrics.alignment.addedWords.slice(0, 8).map((w) => (
								<Tag key={w} color="purple" style={{ margin: "2px 4px 2px 0" }}>
									{w}
								</Tag>
							))}
						</div>
					)}
				</div>
			)}
		</div>
	);
}

export default async function SpeakingResultPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session?.user?.id) notFound();

	const [s] = await db
		.select()
		.from(toeicSpeakingSession)
		.where(
			and(eq(toeicSpeakingSession.id, id), eq(toeicSpeakingSession.userId, session.user.id)),
		)
		.limit(1);
	if (!s) notFound();

	const responses = await db
		.select()
		.from(toeicSpeakingResponse)
		.where(eq(toeicSpeakingResponse.sessionId, id));
	const promptIds = responses.map((r) => r.promptId);
	const prompts = promptIds.length
		? await db
				.select()
				.from(toeicSpeakingPrompt)
				.where(inArray(toeicSpeakingPrompt.id, promptIds))
				.orderBy(asc(toeicSpeakingPrompt.questionNumber))
		: [];

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
			<div style={{ padding: 16, display: "grid", gap: 16, maxWidth: 800 }}>
				<Card>
					<div style={{ textAlign: "center" }}>
						<div style={{ fontSize: 56, fontWeight: 800, color: "var(--accent)" }}>
							{s.scaledScore ?? "—"}
						</div>
						<div style={{ color: "var(--text-muted, #94a3b8)" }}>/ 200 (TOEIC Speaking)</div>
						<div style={{ marginTop: 6, color: "var(--text-muted)" }}>
							Raw: {s.rawScore ?? "—"} / 35
						</div>
					</div>
				</Card>

				{prompts
					.sort((a, b) => a.questionNumber - b.questionNumber)
					.map((p) => {
						const r = responses.find((x) => x.promptId === p.id);
						return (
							<Card
								key={p.id}
								size="small"
								title={`Q${p.questionNumber} · ${TYPE_LABEL[p.type] ?? p.type}`}
								extra={
									<Tag color="blue">
										{r?.rawScore ?? 0} / {p.maxScore}
									</Tag>
								}
							>
								{p.imageUrl && (
									<img loading="lazy" decoding="async"
										src={p.imageUrl}
										alt=""
										style={{ maxWidth: 200, borderRadius: 4, marginBottom: 8 }}
									/>
								)}
								{r ? (
									<>
										{r.audioPath && (
											<audio controls style={{ width: "100%", marginBottom: 8 }}>
												<source
													src={`/api/toeic-speaking/audio/${r.id}`}
													type="audio/webm"
												/>
											</audio>
										)}
										<div
											style={{
												background: "var(--surface, #0f172a)",
												padding: 10,
												borderRadius: 6,
												fontStyle: "italic",
												marginBottom: 8,
												fontSize: 14,
											}}
										>
											{r.transcript ? `“${r.transcript}”` : <em style={{ color: "var(--text-muted)" }}>(no transcript)</em>}
										</div>
										{r.feedbackVi && (
											<div
												style={{
													fontSize: 13,
													color: "var(--text-muted)",
													borderLeft: "3px solid var(--accent)",
													paddingLeft: 10,
												}}
											>
												<strong>Feedback:</strong> {r.feedbackVi}
											</div>
										)}
										{(() => {
											const pron = (r.rubricScores as { pronunciation?: PronMetrics } | null)
												?.pronunciation;
											return pron ? <PronunciationSection metrics={pron} /> : null;
										})()}
									</>
								) : (
									<Empty description="No response" />
								)}
							</Card>
						);
					})}

				<div style={{ display: "flex", gap: 8 }}>
					<Link
						href="/toeic/speaking"
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
				</div>
			</div>
		</div>
	);
}
