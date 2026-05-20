import Link from "next/link";
import { Card, Tag } from "antd";
import { CustomerServiceOutlined } from "@ant-design/icons";
import { ModuleHeader } from "@/components/shared/ModuleHeader";
import { db } from "@repo/database";
import { toeicDictationItem } from "@repo/database";
import { asc } from "drizzle-orm";
import { requireToeicBaseline } from "@/lib/toeic/require-baseline";

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
				icon={<CustomerServiceOutlined />}
				gradient="var(--gradient-dictation)"
				title="TOEIC Dictation"
				subtitle={`${items.length} câu · Nghe-chép theo cấp độ`}
			/>
			<div style={{ padding: 16, display: "grid", gap: 16 }}>
				{["beginner", "intermediate", "advanced"].map((lv) => {
					const list = grouped[lv] ?? [];
					if (list.length === 0) return null;
					return (
						<Card key={lv} title={LEVEL_LABEL[lv]} size="small" extra={<Tag color={LEVEL_COLOR[lv]}>{list.length} câu</Tag>}>
							<div
								style={{
									display: "grid",
									gap: 8,
									gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
								}}
							>
								{list.map((item, i) => (
									<Link
										key={item.id}
										href={`/toeic/dictation/${item.id}`}
										style={{
											padding: 10,
											borderRadius: 8,
											background: "var(--surface-hover)",
											color: "var(--ink)",
											border: "1px solid var(--border)",
											textDecoration: "none",
											display: "flex",
											justifyContent: "space-between",
											alignItems: "center",
											fontSize: 13,
										}}
									>
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
