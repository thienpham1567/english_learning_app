import { db, reviewTask, toeicVocab } from "@repo/database";
import { and, eq, lte, sql } from "drizzle-orm";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { RoadmapBanner } from "@/components/shared/RoadmapBanner";
import { requireToeicBaseline } from "@/lib/toeic/require-baseline";
import { VocabHub } from "./_components/VocabHub";

const TOPIC_LABELS: Record<string, string> = {
  office: "Office",
  business: "Business",
  finance: "Finance",
  marketing: "Marketing",
  manufacturing: "Manufacturing",
  travel: "Travel",
  restaurants: "Restaurants",
  health: "Health",
  technology: "Technology",
  general: "General",
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
    .where(and(eq(reviewTask.userId, userId), eq(reviewTask.sourceType, "flashcard_review")))
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
    <div className="flex flex-col h-full h-[0px] flex-1 overflow-auto">
      <div className="p-4 max-w-3xl mx-auto w-full">
        <div className="mb-4">
          <RoadmapBanner />
        </div>
        <VocabHub packs={packs} dueCount={dueCount} />
      </div>
    </div>
  );
}
