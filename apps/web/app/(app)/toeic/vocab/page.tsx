import { headers } from "next/headers";
import { ReadOutlined } from "@ant-design/icons";
import { ModuleHeader } from "@/components/shared/ModuleHeader";
import { auth } from "@/lib/auth";
import { db } from "@repo/database";
import { toeicVocab, reviewTask } from "@repo/database";
import { and, eq, lte, sql } from "drizzle-orm";
import { requireToeicBaseline } from "@/lib/toeic/require-baseline";
import { VocabHub } from "./_components/VocabHub";

const TOPIC_LABELS: Record<string, string> = {
	office: "🏢 Văn phòng",
	business: "📊 Kinh doanh",
	finance: "💰 Tài chính",
	marketing: "📣 Marketing",
	manufacturing: "🏭 Sản xuất",
	travel: "✈️ Du lịch",
	restaurants: "🍽️ Nhà hàng",
	health: "🏥 Sức khỏe",
	technology: "💻 Công nghệ",
	general: "📚 Chung",
};

export default async function ToeicVocabPage() {
	await requireToeicBaseline();
	const session = await auth.api.getSession({ headers: await headers() });
	const userId = session!.user!.id;

	// Per-topic counts
	const byTopic = await db
		.select({
			topic: toeicVocab.topic,
			total: sql<number>`count(*)::int`,
		})
		.from(toeicVocab)
		.groupBy(toeicVocab.topic);

	// Words this user has already started learning
	const learning = await db
		.select({
			topic: toeicVocab.topic,
			count: sql<number>`count(*)::int`,
		})
		.from(reviewTask)
		.innerJoin(toeicVocab, eq(reviewTask.sourceId, toeicVocab.id))
		.where(
			and(
				eq(reviewTask.userId, userId),
				eq(reviewTask.sourceType, "flashcard_review"),
			),
		)
		.groupBy(toeicVocab.topic);
	const learningByTopic = new Map(learning.map((r) => [r.topic, r.count]));

	// Words due for review
	const due = await db
		.select({ count: sql<number>`count(*)::int` })
		.from(reviewTask)
		.where(
			and(
				eq(reviewTask.userId, userId),
				eq(reviewTask.sourceType, "flashcard_review"),
				eq(reviewTask.status, "pending"),
				lte(reviewTask.dueAt, new Date()),
			),
		);
	const dueCount = due[0]?.count ?? 0;

	const packs = byTopic.map((r) => ({
		topic: r.topic,
		label: TOPIC_LABELS[r.topic] ?? r.topic,
		total: r.total,
		learned: learningByTopic.get(r.topic) ?? 0,
	}));

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
				icon={<ReadOutlined />}
				gradient="var(--gradient-vocab)"
				title="TOEIC Vocab"
				subtitle="600 từ thiết yếu · 10 chủ đề · SRS"
			/>
			<div style={{ padding: 16 }}>
				<VocabHub packs={packs} dueCount={dueCount} />
			</div>
		</div>
	);
}
