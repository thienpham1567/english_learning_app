import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { Card, Tag, Empty } from "antd";
import { FormOutlined } from "@ant-design/icons";
import { ModuleHeader } from "@/components/shared/ModuleHeader";
import { auth } from "@/lib/auth";
import { db } from "@repo/database";
import {
	toeicWritingSession,
	toeicWritingResponse,
	toeicWritingPrompt,
} from "@repo/database";
import { and, asc, eq, inArray } from "drizzle-orm";

export default async function WritingResultPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session?.user?.id) notFound();

	const [s] = await db
		.select()
		.from(toeicWritingSession)
		.where(
			and(eq(toeicWritingSession.id, id), eq(toeicWritingSession.userId, session.user.id)),
		)
		.limit(1);
	if (!s) notFound();

	const responses = await db
		.select()
		.from(toeicWritingResponse)
		.where(eq(toeicWritingResponse.sessionId, id));
	const promptIds = responses.map((r) => r.promptId);
	const prompts = promptIds.length
		? await db
				.select()
				.from(toeicWritingPrompt)
				.where(inArray(toeicWritingPrompt.id, promptIds))
				.orderBy(asc(toeicWritingPrompt.questionNumber))
		: [];
	const promptById = new Map(prompts.map((p) => [p.id, p]));

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
				icon={<FormOutlined />}
				gradient="linear-gradient(135deg, #1a2332 0%, #2d3748 40%, #4a5568 100%)"
				title="Writing Result"
				subtitle={new Date(s.completedAt ?? s.startedAt).toLocaleString("vi-VN")}
			/>
			<div style={{ padding: 16, display: "grid", gap: 16, maxWidth: 800 }}>
				<Card>
					<div style={{ textAlign: "center" }}>
						<div style={{ fontSize: 56, fontWeight: 800, color: "#3b82f6" }}>
							{s.scaledScore ?? "—"}
						</div>
						<div style={{ color: "var(--text-muted, #94a3b8)" }}>/ 200 (TOEIC Writing)</div>
						<div style={{ marginTop: 6, color: "var(--text-muted)" }}>
							Raw: {s.rawScore ?? "—"} / 28
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
								title={`Q${p.questionNumber} · ${
									p.type === "q1_5_picture"
										? "Picture"
										: p.type === "q6_7_email"
											? "Email"
											: "Opinion"
								}`}
								extra={
									<Tag color="blue">
										{r?.rawScore ?? 0} / {p.maxScore}
									</Tag>
								}
							>
								{p.type === "q1_5_picture" && p.imageUrl && (
									<img
										src={p.imageUrl}
										alt=""
										style={{ maxWidth: 200, borderRadius: 4, marginBottom: 8 }}
									/>
								)}
								{r ? (
									<>
										<div
											style={{
												background: "var(--surface, #0f172a)",
												padding: 10,
												borderRadius: 6,
												whiteSpace: "pre-wrap",
												marginBottom: 8,
											}}
										>
											{r.text || <em style={{ color: "var(--text-muted)" }}>(empty)</em>}
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
						href="/toeic/writing"
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
