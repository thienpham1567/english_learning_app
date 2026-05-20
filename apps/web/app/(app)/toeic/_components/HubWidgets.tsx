import Link from "next/link";
import { headers } from "next/headers";
import { Card, Tag } from "antd";
import { auth } from "@/lib/auth";
import { db } from "@repo/database";
import {
	reviewTask,
	learningEvent,
	userSkillState,
	toeicAttempt,
	toeicVocab,
} from "@repo/database";
import { and, asc, desc, eq, gte, isNotNull, lte, sql } from "drizzle-orm";
import { TOEIC_SKILLS, getSkillLabel, type ToeicSkill } from "@repo/contracts";
import { computePredictedScore, bandLabel } from "@/lib/toeic/predict";

const PART_5_6_SKILLS = new Set([
	"toeic.part5.verb_form",
	"toeic.part5.preposition",
	"toeic.part5.conjunction",
	"toeic.part5.vocab",
	"toeic.part5.pronoun",
	"toeic.part6.grammar",
	"toeic.part6.discourse",
]);

type PlanItem = {
	id: string;
	title: string;
	reason: string;
	href: string;
	estimatedMinutes: number;
	priority: "high" | "medium" | "low";
};

async function getDailyPlan(userId: string): Promise<PlanItem[]> {
	const items: PlanItem[] = [];

	const dueRow = await db
		.select({ c: sql<number>`count(*)::int` })
		.from(reviewTask)
		.where(
			and(
				eq(reviewTask.userId, userId),
				eq(reviewTask.status, "pending"),
				lte(reviewTask.dueAt, new Date()),
			),
		);
	const dueCount = dueRow[0]?.c ?? 0;
	if (dueCount > 0) {
		items.push({
			id: "review-due",
			title: `Ôn ${Math.min(dueCount, 20)} câu`,
			reason: "Câu sai + từ vựng tới hạn",
			href: "/toeic/review",
			estimatedMinutes: Math.min(20, dueCount),
			priority: "high",
		});
	}

	const states = await db
		.select()
		.from(userSkillState)
		.where(
			and(
				eq(userSkillState.userId, userId),
				sql`${userSkillState.skillId} LIKE 'toeic.%'`,
			),
		)
		.orderBy(asc(userSkillState.proficiency));
	const weakest = states.find((s) => s.proficiency < 0.6) ?? states[0];

	if (weakest) {
		const isPart56 = PART_5_6_SKILLS.has(weakest.skillId);
		const isVocab = weakest.skillId.includes("vocab");
		if (isPart56) {
			items.push({
				id: `drill-${weakest.skillId}`,
				title: `15 câu ${getSkillLabel(weakest.skillId as ToeicSkill)}`,
				reason: `Mastery ${Math.round(weakest.proficiency * 100)}/100 — yếu nhất`,
				href: `/toeic/grammar/drill?skill=${encodeURIComponent(weakest.skillId)}&count=15`,
				estimatedMinutes: 15,
				priority: "high",
			});
		} else if (isVocab) {
			items.push({
				id: "vocab-weakest",
				title: "15 từ vựng",
				reason: `Mastery vocab ${Math.round(weakest.proficiency * 100)}/100`,
				href: "/toeic/vocab",
				estimatedMinutes: 10,
				priority: "high",
			});
		} else {
			items.push({
				id: `practice-${weakest.skillId}`,
				title: `Luyện ${getSkillLabel(weakest.skillId as ToeicSkill)}`,
				reason: `Mastery ${Math.round(weakest.proficiency * 100)}/100`,
				href: "/toeic/practice",
				estimatedMinutes: 15,
				priority: "high",
			});
		}
	}

	if (items.length < 3) {
		const studied = states.filter((s) => s.signalCount > 0).length;
		if (studied >= 5) {
			items.push({
				id: "mock-mini",
				title: "Mini mock test (100 câu)",
				reason: "Calibrate predicted score",
				href: "/toeic/mock-test",
				estimatedMinutes: 60,
				priority: "medium",
			});
		} else {
			const [pack] = await db
				.select({ topic: toeicVocab.topic })
				.from(toeicVocab)
				.orderBy(sql`random()`)
				.limit(1);
			if (pack) {
				items.push({
					id: `vocab-${pack.topic}`,
					title: `15 từ chủ đề ${pack.topic}`,
					reason: "Mở rộng vốn từ TOEIC",
					href: `/toeic/vocab/learn?pack=${encodeURIComponent(pack.topic)}&mode=new`,
					estimatedMinutes: 10,
					priority: "medium",
				});
			}
		}
	}

	return items.slice(0, 3);
}

export async function HubWidgets() {
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session?.user?.id) return null;
	const userId = session.user.id;

	const [dueAll, todayCount, statesAll, lastMockArr, planItems] = await Promise.all([
		db
			.select({ c: sql<number>`count(*)::int` })
			.from(reviewTask)
			.where(
				and(
					eq(reviewTask.userId, userId),
					eq(reviewTask.status, "pending"),
					lte(reviewTask.dueAt, new Date()),
				),
			),
		(() => {
			const todayStart = new Date();
			todayStart.setHours(0, 0, 0, 0);
			return db
				.select({ c: sql<number>`count(*)::int` })
				.from(learningEvent)
				.where(
					and(
						eq(learningEvent.userId, userId),
						gte(learningEvent.createdAt, todayStart),
						sql`${learningEvent.moduleType} LIKE 'toeic_%'`,
					),
				);
		})(),
		db.select().from(userSkillState).where(eq(userSkillState.userId, userId)),
		db
			.select()
			.from(toeicAttempt)
			.where(
				and(
					eq(toeicAttempt.userId, userId),
					eq(toeicAttempt.mode, "mock_test"),
					isNotNull(toeicAttempt.completedAt),
				),
			)
			.orderBy(desc(toeicAttempt.completedAt))
			.limit(1),
		getDailyPlan(userId),
	]);
	const dueCount = dueAll[0]?.c ?? 0;
	const todayActivity = todayCount[0]?.c ?? 0;
	const toeicStates = statesAll.filter((s) =>
		(TOEIC_SKILLS as readonly string[]).includes(s.skillId),
	);
	const predicted = computePredictedScore(toeicStates);
	const lastMock = lastMockArr[0];

	const priorityColor = (p: PlanItem["priority"]) =>
		p === "high" ? "red" : p === "medium" ? "orange" : "default";

	return (
		<div style={{ display: "grid", gap: 12 }}>
			{/* Daily Plan — full width on top */}
			<Card
				title="🎯 Hôm nay nên làm"
				size="small"
				extra={
					<span style={{ fontSize: 12, color: "var(--text-muted, #94a3b8)" }}>
						{planItems.reduce((s, i) => s + i.estimatedMinutes, 0)} phút
					</span>
				}
			>
				{planItems.length === 0 ? (
					<div style={{ color: "var(--text-muted, #94a3b8)", fontSize: 13 }}>
						Hoàn thành diagnostic để có gợi ý cụ thể.
					</div>
				) : (
					<div style={{ display: "grid", gap: 8 }}>
						{planItems.map((item) => (
							<Link
								key={item.id}
								href={item.href}
								style={{
									display: "grid",
									gridTemplateColumns: "auto 1fr auto",
									gap: 12,
									alignItems: "center",
									padding: 10,
									borderRadius: 8,
									background: "var(--surface-hover)",
									border: "1px solid var(--border)",
									textDecoration: "none",
									color: "var(--ink)",
								}}
							>
								<Tag color={priorityColor(item.priority)} style={{ margin: 0 }}>
									{item.estimatedMinutes}p
								</Tag>
								<div>
									<div style={{ fontWeight: 500 }}>{item.title}</div>
									<div style={{ fontSize: 12, color: "var(--text-muted)" }}>
										{item.reason}
									</div>
								</div>
								<span style={{ color: "var(--accent)", fontSize: 13 }}>→</span>
							</Link>
						))}
					</div>
				)}
			</Card>

			{/* Status widgets */}
			<div
				style={{
					display: "grid",
					gap: 12,
					gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
				}}
			>
				<Card title="📈 Predicted Score" size="small">
					{predicted ? (
						<>
							<div style={{ fontSize: 28, fontWeight: 700 }}>{predicted.total}</div>
							<div style={{ color: "var(--text-muted)" }}>
								{bandLabel(predicted.total)}
							</div>
							<Link href="/toeic/progress" style={{ color: "var(--accent)", fontSize: 12 }}>
								Chi tiết →
							</Link>
						</>
					) : (
						<div style={{ color: "var(--text-muted, #94a3b8)", fontSize: 13 }}>
							Cần thêm dữ liệu
						</div>
					)}
				</Card>

				<Card title="🎯 Mock gần nhất" size="small">
					{lastMock?.totalScaled ? (
						<>
							<div style={{ fontSize: 28, fontWeight: 700 }}>{lastMock.totalScaled} / 990</div>
							<Link
								href={`/toeic/mock-test/${lastMock.id}/result`}
								style={{ color: "var(--accent)", fontSize: 12 }}
							>
								Xem →
							</Link>
						</>
					) : (
						<Link href="/toeic/mock-test" style={{ color: "var(--accent)", fontSize: 13 }}>
							Làm mock đầu tiên →
						</Link>
					)}
				</Card>

				<Card title="🔥 Hôm nay" size="small">
					<div style={{ fontSize: 28, fontWeight: 700 }}>{todayActivity}</div>
					<div style={{ color: "var(--text-muted, #94a3b8)", fontSize: 13 }}>
						{todayActivity === 0 ? "Bắt đầu drill 10 câu" : "Giữ momentum 🔥"}
					</div>
				</Card>

				<Card title="📚 Cần ôn lại" size="small">
					<div style={{ fontSize: 28, fontWeight: 700 }}>{dueCount}</div>
					<div style={{ color: "var(--text-muted)" }}>
						{dueCount > 0 ? (
							<Link href="/toeic/review" style={{ color: "var(--accent)" }}>
								Ôn ngay →
							</Link>
						) : (
							"Chưa có gì cần ôn"
						)}
					</div>
				</Card>
			</div>
		</div>
	);
}
