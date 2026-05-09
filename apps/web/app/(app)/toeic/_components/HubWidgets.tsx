"use client";

import { Card } from "antd";

export function HubWidgets() {
	return (
		<div
			style={{
				display: "grid",
				gap: 12,
				gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
			}}
		>
			<Card title="📊 Điểm dự đoán" size="small">
				<div style={{ color: "var(--text-muted, #94a3b8)" }}>
					Hoàn thành 1 mock test để xem điểm dự đoán.
				</div>
			</Card>
			<Card title="🎯 Daily plan" size="small">
				<div style={{ color: "var(--text-muted, #94a3b8)" }}>
					Daily plan sẽ xuất hiện sau khi bạn làm vài bài.
				</div>
			</Card>
			<Card title="🔥 Streak" size="small">
				<div style={{ fontSize: 28, fontWeight: 700 }}>—</div>
				<div style={{ color: "var(--text-muted, #94a3b8)" }}>
					Bắt đầu để giữ streak.
				</div>
			</Card>
			<Card title="📚 Cần ôn lại" size="small">
				<div style={{ fontSize: 28, fontWeight: 700 }}>0</div>
				<div style={{ color: "var(--text-muted, #94a3b8)" }}>
					Câu sai sẽ vào hàng đợi ôn.
				</div>
			</Card>
		</div>
	);
}
