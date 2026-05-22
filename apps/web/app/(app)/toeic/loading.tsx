"use client";

import { LoadingOutlined } from "@ant-design/icons";

export default function ToeicLoading() {
	return (
		<div
			style={{
				display: "flex",
				flexDirection: "column",
				alignItems: "center",
				justifyContent: "center",
				padding: 64,
				flex: 1,
				gap: 14,
			}}
		>
			<LoadingOutlined
				style={{ fontSize: 28, color: "var(--accent)" }}
			/>
			<span
				style={{
					fontSize: 14,
					fontWeight: 700,
					color: "var(--text-muted)",
				}}
			>
				Đang tải...
			</span>
		</div>
	);
}
