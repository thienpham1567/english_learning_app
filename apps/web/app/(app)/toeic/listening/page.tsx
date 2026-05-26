import Link from "next/link";
import { Card, Tag } from "antd";
import { CustomerServiceOutlined } from "@ant-design/icons";
import { db } from "@repo/database";
import { toeicQuestion, toeicDictationItem } from "@repo/database";
import { eq, sql } from "drizzle-orm";
import { requireToeicBaseline } from "@/lib/toeic/require-baseline";

export default async function ToeicListeningPage() {
	await requireToeicBaseline();

	const counts = await db
		.select({ part: toeicQuestion.part, c: sql<number>`count(*)::int` })
		.from(toeicQuestion)
		.groupBy(toeicQuestion.part);
	const byPart = new Map(counts.map((r) => [r.part, r.c]));

	const dictationCount = await db
		.select({ c: sql<number>`count(*)::int` })
		.from(toeicDictationItem);
	const dictation = dictationCount[0]?.c ?? 0;

	const cards = [
		{
			href: "/toeic/practice?part=1",
			title: "Part 1 — Photos",
			count: byPart.get(1) ?? 0,
			subtitle: "Mô tả ảnh · 4 caption audio",
			disabled: (byPart.get(1) ?? 0) === 0,
			note: (byPart.get(1) ?? 0) === 0 ? "Chạy seed:toeic-part1 để có content" : undefined,
		},
		{
			href: "/toeic/practice?part=2",
			title: "Part 2 — Q-R",
			count: byPart.get(2) ?? 0,
			subtitle: "Audio Q + 3 R · 25 câu/test",
			disabled: (byPart.get(2) ?? 0) === 0,
		},
		{
			href: "/toeic/practice?part=3",
			title: "Part 3 — Conversations",
			count: byPart.get(3) ?? 0,
			subtitle: "Hội thoại · 39 câu/test",
		},
		{
			href: "/toeic/practice?part=4",
			title: "Part 4 — Talks",
			count: byPart.get(4) ?? 0,
			subtitle: "Bài nói · 30 câu/test",
		},
		{
			href: "/toeic/dictation",
			title: "Dictation",
			count: dictation,
			subtitle: "Nghe-chép câu · luyện tai",
			disabled: dictation === 0,
		},
	];

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
			<div
				style={{
					padding: 16,
					display: "grid",
					gap: 12,
					gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
				}}
			>
				{cards.map((c) => {
					const inner = (
						<Card hoverable={!c.disabled} style={c.disabled ? { opacity: 0.6, cursor: "not-allowed" } : undefined}>
							<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
								<strong>{c.title}</strong>
								<Tag>{c.count} câu</Tag>
							</div>
							<div style={{ color: "var(--text-muted)", fontSize: 13, marginTop: 6 }}>
								{c.subtitle}
							</div>
							{c.note && (
								<div style={{ color: "var(--warning)", fontSize: 12, marginTop: 8 }}>{c.note}</div>
							)}
						</Card>
					);
					return c.href && !c.disabled ? (
						<Link key={c.title} href={c.href} style={{ textDecoration: "none" }}>
							{inner}
						</Link>
					) : (
						<div key={c.title}>{inner}</div>
					);
				})}
			</div>
		</div>
	);
}
