import Link from "next/link";
import { headers } from "next/headers";
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
import { TrophyOutlined, CalendarOutlined, CheckCircleFilled, FireOutlined, StarFilled, ArrowRightOutlined } from "@ant-design/icons";

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

	const priorityColors = (p: PlanItem["priority"]) =>
		p === "high"
			? { bg: "rgba(239, 68, 68, 0.08)", text: "var(--error)", border: "rgba(239, 68, 68, 0.2)" }
			: p === "medium"
			? { bg: "rgba(245, 158, 11, 0.08)", text: "var(--warning)", border: "rgba(245, 158, 11, 0.2)" }
			: { bg: "var(--surface-alt)", text: "var(--text-muted)", border: "var(--border)" };

	return (
		<div style={{ display: "grid", gap: 16 }}>
			{/* Daily Plan — full width on top */}
			<div
				style={{
					background: "var(--surface)",
					border: "1.5px solid var(--border)",
					borderRadius: "var(--radius-xl)",
					padding: "18px 20px",
					boxShadow: "var(--shadow-sm)"
				}}
			>
				<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
					<h3 style={{
						margin: 0,
						fontSize: 15.5,
						fontWeight: 900,
						color: "var(--text-primary)",
						display: "flex",
						alignItems: "center",
						gap: 6
					}}>
						<CalendarOutlined style={{ color: "var(--accent)" }} />
						<span>🎯 Hôm nay nên làm</span>
					</h3>
					<span style={{
						fontSize: 11,
						color: "var(--text-muted)",
						fontWeight: 800,
						padding: "2px 8px",
						borderRadius: 6,
						background: "var(--surface-alt)",
						border: "1px solid var(--border)"
					}}>
						{planItems.reduce((s, i) => s + i.estimatedMinutes, 0)} phút ước tính
					</span>
				</div>

				{planItems.length === 0 ? (
					<div style={{ color: "var(--text-muted)", fontSize: 13, fontWeight: 500, padding: "8px 0" }}>
						Hoàn thành bài kiểm tra đầu vào (diagnostic) để nhận gợi ý học tập cụ thể.
					</div>
				) : (
					<div style={{ display: "grid", gap: 10 }}>
						{planItems.map((item) => {
							const colorSet = priorityColors(item.priority);
							return (
								<Link
									key={item.id}
									href={item.href}
									style={{
										display: "grid",
										gridTemplateColumns: "auto 1fr auto",
										gap: 12,
										alignItems: "center",
										padding: "12px 14px",
										borderRadius: "var(--radius-lg)",
										background: "var(--surface-alt)",
										border: "1.5px solid var(--border)",
										textDecoration: "none",
										color: "var(--text-primary)",
										transition: "all 0.15s ease",
									}}
								>
									<span style={{
										fontSize: 10.5,
										fontWeight: 900,
										padding: "2px 8px",
										borderRadius: 6,
										background: colorSet.bg,
										color: colorSet.text,
										border: `1px solid ${colorSet.border}`
									}}>
										{item.estimatedMinutes}p
									</span>
									<div>
										<div style={{ fontWeight: 800, fontSize: 13.5 }}>{item.title}</div>
										<div style={{ fontSize: 11.5, color: "var(--text-muted)", fontWeight: 500, marginTop: 1 }}>
											{item.reason}
										</div>
									</div>
									<ArrowRightOutlined style={{ color: "var(--accent)", fontSize: 12 }} />
								</Link>
							);
						})}
					</div>
				)}
			</div>

			{/* Status widgets grid */}
			<div
				style={{
					display: "grid",
					gap: 12,
					gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
				}}
			>
				{/* Predicted Score Card */}
				<div style={{
					background: "var(--surface)",
					border: "1.5px solid var(--border)",
					borderRadius: "var(--radius-xl)",
					padding: "16px 18px",
					boxShadow: "var(--shadow-sm)",
					display: "flex",
					flexDirection: "column",
					justifyContent: "space-between",
					gap: 12
				}}>
					<div>
						<span style={{ fontSize: 11, fontWeight: 850, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-secondary)" }}>
							📈 Điểm dự đoán
						</span>
						{predicted ? (
							<div style={{ marginTop: 8 }}>
								<div style={{ fontSize: 26, fontWeight: 950, color: "var(--text-primary)", fontFamily: "var(--font-display)", lineHeight: 1.1 }}>
									{predicted.total}
								</div>
								<div style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 650, marginTop: 2 }}>
									{bandLabel(predicted.total)}
								</div>
							</div>
						) : (
							<div style={{ fontSize: 12.5, color: "var(--text-muted)", fontWeight: 650, marginTop: 12 }}>
								Cần thêm dữ liệu làm đề
							</div>
						)}
					</div>
					{predicted && (
						<Link href="/toeic/progress" style={{ color: "var(--accent)", fontSize: 12, fontWeight: 800, textDecoration: "none" }}>
							Chi tiết biểu đồ →
						</Link>
					)}
				</div>

				{/* Last Mock Card */}
				<div style={{
					background: "var(--surface)",
					border: "1.5px solid var(--border)",
					borderRadius: "var(--radius-xl)",
					padding: "16px 18px",
					boxShadow: "var(--shadow-sm)",
					display: "flex",
					flexDirection: "column",
					justifyContent: "space-between",
					gap: 12
				}}>
					<div>
						<span style={{ fontSize: 11, fontWeight: 850, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-secondary)" }}>
							🎯 Mock gần nhất
						</span>
						{lastMock?.totalScaled ? (
							<div style={{ marginTop: 8 }}>
								<div style={{ fontSize: 26, fontWeight: 950, color: "var(--text-primary)", fontFamily: "var(--font-display)", lineHeight: 1.1 }}>
									{lastMock.totalScaled} <span style={{ fontSize: 14, color: "var(--text-muted)", fontWeight: 700 }}>/ 990</span>
								</div>
							</div>
						) : (
							<div style={{ fontSize: 12.5, color: "var(--text-muted)", fontWeight: 650, marginTop: 12 }}>
								Chưa làm Mock Test nào
							</div>
						)}
					</div>
					{lastMock?.totalScaled ? (
						<Link
							href={`/toeic/mock-test/${lastMock.id}/result`}
							style={{ color: "var(--accent)", fontSize: 12, fontWeight: 800, textDecoration: "none" }}
						>
							Xem kết quả chi tiết →
						</Link>
					) : (
						<Link href="/toeic/mock-test" style={{ color: "var(--accent)", fontSize: 12, fontWeight: 800, textDecoration: "none" }}>
							Làm bài Mock test ngay →
						</Link>
					)}
				</div>

				{/* Activity Card */}
				<div style={{
					background: "var(--surface)",
					border: "1.5px solid var(--border)",
					borderRadius: "var(--radius-xl)",
					padding: "16px 18px",
					boxShadow: "var(--shadow-sm)",
					display: "flex",
					flexDirection: "column",
					justifyContent: "space-between",
					gap: 12
				}}>
					<div>
						<span style={{ fontSize: 11, fontWeight: 850, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-secondary)" }}>
							🔥 Hoạt động hôm nay
						</span>
						<div style={{ marginTop: 8 }}>
							<div style={{ fontSize: 26, fontWeight: 950, color: "var(--text-primary)", fontFamily: "var(--font-display)", lineHeight: 1.1 }}>
								{todayActivity}
							</div>
							<div style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 650, marginTop: 2 }}>
								{todayActivity === 0 ? "Chưa làm bài nào" : "Giữ vững ngọn lửa 🔥"}
							</div>
						</div>
					</div>
					<Link href="/toeic/practice" style={{ color: "var(--accent)", fontSize: 12, fontWeight: 800, textDecoration: "none" }}>
						Luyện đề thi mới →
					</Link>
				</div>

				{/* Due Tasks Card */}
				<div style={{
					background: "var(--surface)",
					border: "1.5px solid var(--border)",
					borderRadius: "var(--radius-xl)",
					padding: "16px 18px",
					boxShadow: "var(--shadow-sm)",
					display: "flex",
					flexDirection: "column",
					justifyContent: "space-between",
					gap: 12
				}}>
					<div>
						<span style={{ fontSize: 11, fontWeight: 850, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-secondary)" }}>
							📚 Cần ôn tập
						</span>
						<div style={{ marginTop: 8 }}>
							<div style={{ fontSize: 26, fontWeight: 950, color: "var(--text-primary)", fontFamily: "var(--font-display)", lineHeight: 1.1 }}>
								{dueCount} <span style={{ fontSize: 14, color: "var(--text-muted)", fontWeight: 700 }}>câu</span>
							</div>
						</div>
					</div>
					{dueCount > 0 ? (
						<Link href="/toeic/review" style={{ color: "var(--error)", fontSize: 12, fontWeight: 800, textDecoration: "none" }}>
							Ôn tập ngay →
						</Link>
					) : (
						<span style={{ color: "var(--text-muted)", fontSize: 12, fontWeight: 800 }}>
							Sạch sẽ, không câu sai!
						</span>
					)}
				</div>
			</div>
		</div>
	);
}
