import { headers } from "next/headers";
import { BookOutlined } from "@ant-design/icons";
import { ModuleHeader } from "@/components/shared/ModuleHeader";
import { auth } from "@/lib/auth";
import { db } from "@repo/database";
import { userSkillState, reviewTask, toeicQuestion } from "@repo/database";
import { and, eq, inArray, lte, sql } from "drizzle-orm";
import { requireToeicBaseline } from "@/lib/toeic/require-baseline";
import { GrammarHub } from "./_components/GrammarHub";

const PART_5_6_SKILLS = [
	"toeic.part5.verb_form",
	"toeic.part5.preposition",
	"toeic.part5.conjunction",
	"toeic.part5.vocab",
	"toeic.part5.pronoun",
	"toeic.part6.grammar",
	"toeic.part6.discourse",
];

export default async function ToeicGrammarPage() {
	await requireToeicBaseline();
	const session = await auth.api.getSession({ headers: await headers() });
	const userId = session!.user!.id;

	// Mastery per Part 5/6 skill
	const skillStates = await db
		.select()
		.from(userSkillState)
		.where(and(eq(userSkillState.userId, userId), inArray(userSkillState.skillId, PART_5_6_SKILLS)));
	const masteryBySkill = new Map(skillStates.map((s) => [s.skillId, s.proficiency]));

	// Mistake count: due reviewTasks for Part 5/6 questions
	const dueRows = await db
		.select({ qid: reviewTask.sourceId })
		.from(reviewTask)
		.where(
			and(
				eq(reviewTask.userId, userId),
				eq(reviewTask.sourceType, "error_retry"),
				eq(reviewTask.status, "pending"),
				lte(reviewTask.dueAt, new Date()),
			),
		);
	let mistakeCount = 0;
	if (dueRows.length > 0) {
		const inToeic = await db
			.select({ id: toeicQuestion.id })
			.from(toeicQuestion)
			.where(
				and(
					inArray(toeicQuestion.id, dueRows.map((r) => r.qid)),
					inArray(toeicQuestion.part, [5, 6]),
				),
			);
		mistakeCount = inToeic.length;
	}

	// Per-skill question count (for showing pool size)
	const poolByPart = await db
		.select({
			skill: sql<string>`skill`,
			count: sql<number>`count(*)::int`,
		})
		.from(toeicQuestion)
		.innerJoin(
			sql`jsonb_array_elements_text(${toeicQuestion.skillIds}) AS skill`,
			sql`true`,
		)
		.where(inArray(toeicQuestion.part, [5, 6]))
		.groupBy(sql`skill`);
	const poolBySkill = new Map(poolByPart.map((r) => [r.skill, r.count]));

	const skillsData = PART_5_6_SKILLS.map((skill) => ({
		skill,
		proficiency: masteryBySkill.get(skill) ?? 0,
		pool: poolBySkill.get(skill) ?? 0,
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
				icon={<BookOutlined />}
				gradient="var(--gradient-grammar)"
				title="TOEIC Grammar Drill"
				subtitle="Part 5 & 6 · Phân loại theo kỹ năng nhỏ"
			/>
			<div style={{ padding: 16 }}>
				<GrammarHub skills={skillsData} mistakeCount={mistakeCount} />
			</div>
		</div>
	);
}
