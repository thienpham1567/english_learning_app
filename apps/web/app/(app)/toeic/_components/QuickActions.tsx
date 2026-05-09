"use client";

import Link from "next/link";
import { Card } from "antd";

const ACTIONS: Array<{ href: string; label: string; emoji: string; available: boolean }> = [
	{ href: "/toeic/practice", label: "Luyện đề", emoji: "📝", available: true },
	{ href: "/toeic/skills", label: "4 kỹ năng", emoji: "🎯", available: true },
	{ href: "/toeic/mock-test", label: "Mock test", emoji: "⏱️", available: true },
	{ href: "/toeic/review", label: "Ôn câu sai", emoji: "🔁", available: true },
	{ href: "/toeic/progress", label: "Tiến độ", emoji: "📈", available: true },
	{ href: "/toeic/listening", label: "Listening hub", emoji: "🎧", available: true },
	{ href: "/toeic/dictation", label: "Dictation", emoji: "✍️", available: true },
	{ href: "/toeic/grammar", label: "Grammar drill", emoji: "📚", available: true },
	{ href: "/toeic/vocab", label: "Vocab", emoji: "🔤", available: true },
	{ href: "/toeic/speaking", label: "Speaking 11", emoji: "🗣️", available: true },
	{ href: "/toeic/writing", label: "Writing 8", emoji: "✏️", available: true },
];

export function QuickActions() {
	return (
		<Card title="Quick actions" size="small">
			<div
				style={{
					display: "grid",
					gap: 8,
					gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
				}}
			>
				{ACTIONS.map((a) =>
					a.available ? (
						<Link
							key={a.href}
							href={a.href}
							style={{
								padding: 14,
								borderRadius: 10,
								background: "var(--surface-hover, #1f2937)",
								color: "var(--text-primary, #fff)",
								textDecoration: "none",
								textAlign: "center",
							}}
						>
							<div style={{ fontSize: 22 }}>{a.emoji}</div>
							<div style={{ fontSize: 13 }}>{a.label}</div>
						</Link>
					) : (
						<div
							key={a.href}
							style={{
								padding: 14,
								borderRadius: 10,
								background: "var(--surface, #0f172a)",
								color: "var(--text-disabled, #475569)",
								textAlign: "center",
								cursor: "not-allowed",
							}}
							title="Sắp ra mắt"
						>
							<div style={{ fontSize: 22 }}>{a.emoji}</div>
							<div style={{ fontSize: 13 }}>{a.label}</div>
							<div style={{ fontSize: 11, opacity: 0.6 }}>Sắp ra mắt</div>
						</div>
					),
				)}
			</div>
		</Card>
	);
}
