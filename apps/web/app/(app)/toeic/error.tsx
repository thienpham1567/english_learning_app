"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function ToeicError({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	useEffect(() => {
		console.error("[ToeicError]", error);
	}, [error]);

	return (
		<div
			style={{
				display: "flex",
				flexDirection: "column",
				alignItems: "center",
				justifyContent: "center",
				padding: "48px 24px",
				textAlign: "center",
				flex: 1,
				minHeight: 300,
			}}
		>
			<div
				style={{
					width: 56,
					height: 56,
					borderRadius: "50%",
					background: "var(--error-bg)",
					display: "grid",
					placeItems: "center",
					marginBottom: 16,
				}}
			>
				<AlertTriangle style={{ fontSize: 24, color: "var(--error)" }} />
			</div>
			<h3
				style={{
					margin: "0 0 8px",
					fontSize: 18,
					fontWeight: 700,
					color: "var(--ink)",
					fontFamily: "var(--font-display)",
				}}
			>
				Không thể tải trang
			</h3>
			<p
				style={{
					margin: "0 0 20px",
					fontSize: 13,
					color: "var(--text-muted)",
					maxWidth: 400,
					lineHeight: 1.6,
				}}
			>
				Có lỗi xảy ra khi tải dữ liệu. Hãy thử lại.
			</p>
			<button
				type="button"
				onClick={reset}
				style={{
					padding: "10px 24px",
					borderRadius: 12,
					border: "none",
					background: "var(--accent)",
					color: "var(--text-on-accent)",
					fontSize: 14,
					fontWeight: 600,
					cursor: "pointer",
					display: "flex",
					alignItems: "center",
					gap: 8,
				}}
			>
				<RefreshCw /> Thử lại
			</button>
		</div>
	);
}
