"use client";
import { Loader2 } from "lucide-react";

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
			<Loader2 className="animate-spin text-[var(--accent)]" size={28}
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
