import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { Card, Tag, Empty } from "antd";
import { AudioOutlined } from "@ant-design/icons";
import { ModuleHeader } from "@/components/shared/ModuleHeader";
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
			<ModuleHeader
				icon={<AudioOutlined />}
				gradient="linear-gradient(135deg, #1a2332 0%, #2d3748 40%, #4a5568 100%)"
				title="Speaking Result"
				subtitle={new Date(s.completedAt ?? s.startedAt).toLocaleString("vi-VN")}
			/>
			<div style={{ padding: 16, display: "grid", gap: 16, maxWidth: 800 }}>
				<Card>
					<div style={{ textAlign: "center" }}>
						<div style={{ fontSize: 56, fontWeight: 800, color: "#3b82f6" }}>
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
									<img
										src={p.imageUrl}
										alt=""
										style={{ maxWidth: 200, borderRadius: 4, marginBottom: 8 }}
									/>
								)}
								{r ? (
									<>
										{r.audioPath && (
											<audio controls style={{ width: "100%", marginBottom: 8 }}>
												<source src={r.audioPath} type="audio/webm" />
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
													color: "var(--text-muted, #cbd5e1)",
													borderLeft: "3px solid #3b82f6",
													paddingLeft: 10,
												}}
											>
												<strong>Feedback:</strong> {r.feedbackVi}
											</div>
										)}
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
							background: "var(--surface-hover, #1f2937)",
							color: "#fff",
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
