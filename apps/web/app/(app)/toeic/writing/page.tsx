import Link from "next/link";
import { headers } from "next/headers";
import { Card, Tag, Empty } from "antd";
import { FormOutlined } from "@ant-design/icons";
import { ModuleHeader } from "@/components/shared/ModuleHeader";
import { auth } from "@/lib/auth";
import { db } from "@repo/database";
import { toeicWritingSession, toeicWritingPrompt } from "@repo/database";
import { and, desc, eq, isNotNull, sql } from "drizzle-orm";
import { requireToeicBaseline } from "@/lib/toeic/require-baseline";

export default async function ToeicWritingPage() {
	await requireToeicBaseline();
	const session = await auth.api.getSession({ headers: await headers() });
	const userId = session!.user!.id;

	const promptCount = await db
		.select({ c: sql<number>`count(*)::int` })
		.from(toeicWritingPrompt);
	const setCount = await db
		.select({ c: sql<number>`count(distinct ${toeicWritingPrompt.setCode})::int` })
		.from(toeicWritingPrompt);

	const history = await db
		.select()
		.from(toeicWritingSession)
		.where(
			and(
				eq(toeicWritingSession.userId, userId),
				isNotNull(toeicWritingSession.completedAt),
			),
		)
		.orderBy(desc(toeicWritingSession.completedAt))
		.limit(10);

	const seeded = (promptCount[0]?.c ?? 0) >= 8;

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
				gradient="var(--gradient-writing)"
				title="TOEIC Writing"
				subtitle={`8 câu · 60 phút · ${setCount[0]?.c ?? 0} sets`}
			/>
			<div style={{ padding: 16, display: "grid", gap: 16 }}>
				{seeded ? (
					<Link href="/toeic/writing/runner" style={{ textDecoration: "none" }}>
						<Card hoverable>
							<div style={{ display: "flex", alignItems: "center", gap: 8 }}>
								<FormOutlined style={{ fontSize: 24, color: "var(--accent)" }} />
								<strong style={{ fontSize: 18, color: "var(--ink)" }}>Bắt đầu Writing test</strong>
							</div>
							<div style={{ color: "var(--text-muted)", marginTop: 6 }}>
								Q1-5 picture (8 phút) · Q6-7 email (20 phút) · Q8 opinion (30 phút)
							</div>
							<div style={{ marginTop: 8 }}>
								<Tag color="orange">AI grading sau khi nộp</Tag>
							</div>
						</Card>
					</Link>
				) : (
					<Card>
						<Empty description="Chưa có prompt nào. Chạy `pnpm seed:toeic-writing`" />
					</Card>
				)}

				<Card title="Lịch sử Writing test" size="small">
					{history.length === 0 ? (
						<Empty description="Chưa có session nào" />
					) : (
						<div style={{ display: "grid", gap: 8 }}>
							{history.map((h) => (
								<Link
									key={h.id}
									href={`/toeic/writing/${h.id}/result`}
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
