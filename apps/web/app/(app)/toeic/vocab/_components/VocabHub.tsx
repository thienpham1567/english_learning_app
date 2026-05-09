"use client";

import Link from "next/link";
import { Card, Progress, Tag } from "antd";
import { AlertOutlined, BookOutlined } from "@ant-design/icons";

type Pack = { topic: string; label: string; total: number; learned: number };

export function VocabHub({ packs, dueCount }: { packs: Pack[]; dueCount: number }) {
	return (
		<div style={{ display: "grid", gap: 16 }}>
			{/* Due review banner */}
			<Card size="small">
				<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
					<div>
						<div style={{ fontSize: 14, color: "var(--text-muted, #94a3b8)" }}>
							<AlertOutlined /> Cần ôn hôm nay
						</div>
						<div style={{ fontSize: 28, fontWeight: 700 }}>{dueCount} từ</div>
					</div>
					{dueCount > 0 ? (
						<Link
							href="/toeic/vocab/learn?mode=review"
							style={{
								padding: "8px 16px",
								borderRadius: 8,
								background: "#ef4444",
								color: "#fff",
								textDecoration: "none",
							}}
						>
							Ôn ngay
						</Link>
					) : (
						<Tag>Hoàn thành ôn hôm nay 🎉</Tag>
					)}
				</div>
			</Card>

			{/* Topic packs grid */}
			<div
				style={{
					display: "grid",
					gap: 12,
					gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
				}}
			>
				{packs.map((p) => {
					const pct = p.total > 0 ? Math.round((p.learned / p.total) * 100) : 0;
					return (
						<Link
							key={p.topic}
							href={`/toeic/vocab/learn?pack=${encodeURIComponent(p.topic)}&mode=new`}
							style={{ textDecoration: "none" }}
						>
							<Card hoverable size="small" style={{ height: "100%" }}>
								<div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 16 }}>
									<BookOutlined />
									<span>{p.label}</span>
								</div>
								<div style={{ fontSize: 13, color: "var(--text-muted, #94a3b8)", marginTop: 6 }}>
									{p.learned} / {p.total} từ
								</div>
								<Progress
									percent={pct}
									size="small"
									showInfo={false}
									strokeColor={pct < 30 ? "#ef4444" : pct < 70 ? "#f59e0b" : "#10b981"}
								/>
							</Card>
						</Link>
					);
				})}
			</div>
		</div>
	);
}
