import Link from "next/link";
import { headers } from "next/headers";
import { Card, Tag, Empty } from "antd";
import { AudioOutlined } from "@ant-design/icons";
import { ModuleHeader } from "@/components/shared/ModuleHeader";
import { auth } from "@/lib/auth";
import { db } from "@repo/database";
import { toeicSpeakingSession, toeicSpeakingPrompt } from "@repo/database";
import { and, desc, eq, isNotNull, sql } from "drizzle-orm";
import { requireToeicBaseline } from "@/lib/toeic/require-baseline";

export default async function ToeicSpeakingPage() {
	await requireToeicBaseline();
	const session = await auth.api.getSession({ headers: await headers() });
	const userId = session!.user!.id;

	const promptCount = await db
		.select({ c: sql<number>`count(*)::int` })
		.from(toeicSpeakingPrompt);
	const setCount = await db
		.select({ c: sql<number>`count(distinct ${toeicSpeakingPrompt.setCode})::int` })
		.from(toeicSpeakingPrompt);

	const history = await db
		.select()
		.from(toeicSpeakingSession)
		.where(
			and(
				eq(toeicSpeakingSession.userId, userId),
				isNotNull(toeicSpeakingSession.completedAt),
			),
		)
		.orderBy(desc(toeicSpeakingSession.completedAt))
		.limit(10);

	const seeded = (promptCount[0]?.c ?? 0) >= 11;

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
				gradient="var(--gradient-toeic-speaking)"
				title="TOEIC Speaking"
				subtitle={`11 câu · ~20 phút · ${setCount[0]?.c ?? 0} sets · AI grading`}
			/>
			<div style={{ padding: 16, display: "grid", gap: 16 }}>
				{seeded ? (
					<Link href="/toeic/speaking/runner" style={{ textDecoration: "none" }}>
						<Card hoverable>
							<div style={{ display: "flex", alignItems: "center", gap: 8 }}>
								<AudioOutlined style={{ fontSize: 24, color: "var(--accent)" }} />
								<strong style={{ fontSize: 18, color: "var(--ink)" }}>Bắt đầu Speaking test</strong>
							</div>
							<div style={{ color: "var(--text-muted)", marginTop: 6, fontSize: 13 }}>
								Q1-2 đọc to · Q3-4 mô tả ảnh · Q5-7 trả lời câu hỏi · Q8-10 đọc context + trả lời · Q11 opinion
							</div>
							<div style={{ marginTop: 8 }}>
								<Tag color="orange">Cần microphone permission</Tag>
								<Tag color="green">Whisper STT + Gemini grading</Tag>
							</div>
						</Card>
					</Link>
				) : (
					<Card>
						<Empty description="Chưa có prompt. Chạy `pnpm seed:toeic-speaking`" />
					</Card>
				)}

				<Card title="Lịch sử Speaking test" size="small">
					{history.length === 0 ? (
						<Empty description="Chưa có session nào" />
					) : (
						<div style={{ display: "grid", gap: 8 }}>
							{history.map((h) => (
								<Link
									key={h.id}
									href={`/toeic/speaking/${h.id}/result`}
									style={{
										textDecoration: "none",
										color: "var(--ink)",
										padding: 10,
										borderRadius: 8,
										background: "var(--surface-hover)",
										display: "flex",
										justifyContent: "space-between",
										border: "1px solid var(--border)",
									}}
								>
									<span>
										{new Date(h.completedAt!).toLocaleString("vi-VN")} · {h.setCode}
									</span>
									<span style={{ fontSize: 18, fontWeight: 700 }}>
										{h.scaledScore ?? "—"} / 200
									</span>
								</Link>
							))}
						</div>
					)}
				</Card>
			</div>
		</div>
	);
}
