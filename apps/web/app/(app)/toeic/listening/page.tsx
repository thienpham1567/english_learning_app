import Link from "next/link";
import { Card, Tag } from "antd";

import { db } from "@repo/database";
import { toeicQuestion, toeicDictationItem } from "@repo/database";
import { eq, sql } from "drizzle-orm";
import { requireToeicBaseline } from "@/lib/toeic/require-baseline";
import { Headphones } from "lucide-react";

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
		<div className="flex flex-col h-full h-[0px] flex-1 overflow-auto" >
			<div className="p-4 grid gap-3" style={{gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))"}} >
				{cards.map((c) => {
					const inner = (
						<Card hoverable={!c.disabled} style={c.disabled ? { opacity: 0.6, cursor: "not-allowed" } : undefined}>
							<div className="flex justify-between items-center" >
								<strong>{c.title}</strong>
								<Tag>{c.count} câu</Tag>
							</div>
							<div className="text-text-muted text-[13px] mt-1.5" >
								{c.subtitle}
							</div>
							{c.note && (
								<div className="text-xs mt-2" style={{color: "var(--warning)"}} >{c.note}</div>
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
