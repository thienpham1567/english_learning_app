import Link from "next/link";
import { headers } from "next/headers";
import { Card, Tag } from "antd";
import { TrophyOutlined, ClockCircleOutlined, RedoOutlined } from "@ant-design/icons";
import { ModuleHeader } from "@/components/shared/ModuleHeader";
import { auth } from "@/lib/auth";
import { db } from "@repo/database";
import { toeicAttempt } from "@repo/database";
import { and, desc, eq, isNotNull, isNull } from "drizzle-orm";
import { requireToeicBaseline } from "@/lib/toeic/require-baseline";

export default async function MockTestHubPage() {
	await requireToeicBaseline();
	const session = await auth.api.getSession({ headers: await headers() });
	const userId = session!.user!.id;

	// Detect in-progress mock for resume card
	const [inProgress] = await db
		.select()
		.from(toeicAttempt)
		.where(
			and(
				eq(toeicAttempt.userId, userId),
				eq(toeicAttempt.mode, "mock_test"),
				isNull(toeicAttempt.completedAt),
			),
		)
		.orderBy(desc(toeicAttempt.startedAt))
		.limit(1);

	const history = await db
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
		.limit(10);

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
				icon={<TrophyOutlined />}
				gradient="var(--gradient-mock-test)"
				title="TOEIC Mock Test"
				subtitle="Đề thi giả lập · 5–495 mỗi section"
			/>
			<div style={{ padding: 16, display: "grid", gap: 16 }}>
				{inProgress && (
					<Link
						href={`/toeic/mock-test/runner?resume=${inProgress.id}`}
						style={{ textDecoration: "none" }}
					>
						<Card hoverable style={{ borderColor: "var(--warning)", borderWidth: 2 }}>
							<div style={{ display: "flex", alignItems: "center", gap: 8 }}>
								<RedoOutlined style={{ fontSize: 22, color: "var(--warning)" }} />
								<strong style={{ fontSize: 18 }}>Tiếp tục mock test đang dở</strong>
							</div>
							<div style={{ marginTop: 8, color: "var(--text-muted, #94a3b8)" }}>
								Bắt đầu lúc {new Date(inProgress.startedAt).toLocaleString("vi-VN")} ·{" "}
								{inProgress.questionCount} câu
							</div>
						</Card>
					</Link>
				)}
				<div
					style={{
						display: "grid",
						gap: 12,
						gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
					}}
				>
					<Link
						href="/toeic/mock-test/runner?mode=full"
						style={{ textDecoration: "none" }}
					>
						<Card hoverable>
							<div style={{ display: "flex", alignItems: "center", gap: 8 }}>
								<TrophyOutlined style={{ fontSize: 22, color: "var(--accent)" }} />
								<strong style={{ fontSize: 18, color: "var(--ink)" }}>Full Mock</strong>
							</div>
							<div style={{ marginTop: 8, color: "var(--text-muted, #94a3b8)" }}>
								194 câu · ~1h54 · Strict timer
							</div>
							<div style={{ marginTop: 8 }}>
								<Tag color="orange">Part 1: chưa có content</Tag>
							</div>
							<div style={{ marginTop: 6, fontSize: 13, color: "var(--text-muted)" }}>
								25 P2 + 39 P3 + 30 P4 + 30 P5 + 16 P6 + 54 P7
							</div>
						</Card>
					</Link>
					<Link
						href="/toeic/mock-test/runner?mode=mini"
						style={{ textDecoration: "none" }}
					>
						<Card hoverable>
							<div style={{ display: "flex", alignItems: "center", gap: 8 }}>
								<ClockCircleOutlined style={{ fontSize: 22, color: "var(--success)" }} />
								<strong style={{ fontSize: 18, color: "var(--ink)" }}>Mini Mock</strong>
							</div>
							<div style={{ marginTop: 8, color: "var(--text-muted, #94a3b8)" }}>
								100 câu · ~1h · Luyện hằng ngày
							</div>
							<div style={{ marginTop: 8 }}>
								<Tag color="green">Khuyến nghị</Tag>
							</div>
							<div style={{ marginTop: 6, fontSize: 13, color: "var(--text-muted)" }}>
								13 P2 + 20 P3 + 15 P4 + 15 P5 + 8 P6 + 29 P7
							</div>
						</Card>
					</Link>
				</div>

				<Card title="Lịch sử mock test" size="small">
					{history.length === 0 ? (
						<div style={{ color: "var(--text-muted, #94a3b8)" }}>
							Chưa có mock test nào. Bắt đầu mini mock để có dữ liệu cho điểm dự đoán.
						</div>
					) : (
						<div style={{ display: "grid", gap: 8 }}>
							{history.map((h) => (
								<Link
									key={h.id}
									href={`/toeic/mock-test/${h.id}/result`}
									style={{
										textDecoration: "none",
										color: "var(--ink)",
										padding: 10,
										borderRadius: 8,
										background: "var(--surface-hover)",
										border: "1px solid var(--border)",
										display: "flex",
										justifyContent: "space-between",
										alignItems: "center",
									}}
								>
									<span>
										{new Date(h.completedAt!).toLocaleString("vi-VN")} · {h.questionCount} câu
									</span>
									<span style={{ fontSize: 18, fontWeight: 700 }}>
										{h.totalScaled ?? "—"} / 990
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
