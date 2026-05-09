import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@repo/database";
import { userSkillState, toeicAttempt } from "@repo/database";
import { and, desc, eq, isNotNull } from "drizzle-orm";
import { TOEIC_SKILLS, getSkillLabel, type ToeicSkill } from "@repo/contracts";
import { computePredictedScore } from "@/lib/toeic/predict";

export async function GET() {
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session?.user?.id) {
		return Response.json({ error: "Unauthorized" }, { status: 401 });
	}
	const userId = session.user.id;

	const states = await db.select().from(userSkillState).where(eq(userSkillState.userId, userId));
	const toeicStates = states.filter((s) => (TOEIC_SKILLS as readonly string[]).includes(s.skillId));
	const predicted = computePredictedScore(toeicStates);

	const sortedByProf = [...toeicStates].sort((a, b) => a.proficiency - b.proficiency);
	const weakest = sortedByProf.slice(0, 5).map((s) => ({
		skillId: s.skillId,
		label: getSkillLabel(s.skillId as ToeicSkill),
		proficiency: s.proficiency,
	}));
	const strongest = sortedByProf
		.slice(-5)
		.reverse()
		.map((s) => ({
			skillId: s.skillId,
			label: getSkillLabel(s.skillId as ToeicSkill),
			proficiency: s.proficiency,
		}));

	const [lastMock] = await db
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
		.limit(1);

	return Response.json({
		predicted,
		weakest,
		strongest,
		lastMock: lastMock
			? {
					id: lastMock.id,
					completedAt: lastMock.completedAt,
					listeningScaled: lastMock.scaledListening,
					readingScaled: lastMock.scaledReading,
					totalScaled: lastMock.totalScaled,
				}
			: null,
	});
}
