import Link from "next/link";
import { Card, Tag } from "antd";

import { db } from "@repo/database";
import { toeicDictationItem } from "@repo/database";
import { asc } from "drizzle-orm";
import { requireToeicBaseline } from "@/lib/toeic/require-baseline";
import { Headphones } from "lucide-react";

const LEVEL_LABEL: Record<string, string> = {
	beginner: "Cơ bản",
	intermediate: "Trung bình",
	advanced: "Nâng cao",
};
const LEVEL_COLOR: Record<string, string> = {
	beginner: "green",
	intermediate: "orange",
	advanced: "red",
};

export default async function ToeicDictationPage() {
	await requireToeicBaseline();

	const items = await db
		.select({
			id: toeicDictationItem.id,
			level: toeicDictationItem.level,
			topic: toeicDictationItem.topic,
		})
		.from(toeicDictationItem)
		.orderBy(asc(toeicDictationItem.level), asc(toeicDictationItem.topic));

	const grouped: Record<string, typeof items> = {};
	for (const item of items) {
		grouped[item.level] = grouped[item.level] ?? [];
		grouped[item.level].push(item);
	}

	return (
		<div className="flex flex-col h-full h-[0px] flex-1 overflow-auto" >
			<div className="p-4 grid gap-4" >
				{["beginner", "intermediate", "advanced"].map((lv) => {
					const list = grouped[lv] ?? [];
					if (list.length === 0) return null;
					return (
						<Card key={lv} title={LEVEL_LABEL[lv]} size="small" extra={<Tag color={LEVEL_COLOR[lv]}>{list.length} câu</Tag>}>
							<div className="grid gap-2" style={{gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))"}} >
								{list.map((item, i) => (
									<Link
										key={item.id}
										href={`/toeic/dictation/${item.id}`} className="rounded-lg text-ink border border-(--border) flex justify-between items-center text-[13px]" style={{padding: 10, background: "var(--surface-hover)", textDecoration: "none"}} >
										<span>#{i + 1}</span>
										<Tag>{item.topic}</Tag>
									</Link>
								))}
							</div>
						</Card>
					);
				})}
			</div>
		</div>
	);
}
