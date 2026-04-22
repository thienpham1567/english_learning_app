import type {
	RecommendationCandidate,
	Recommendation,
	ScoreBreakdown,
	ScorerContext,
	RecommendationGroupValue,
} from "@repo/contracts";

// ── Score Weights (AC: 1) ───────────────────────────────────────────────────

const WEIGHTS = {
	dueUrgency: 0.25,
	masteryGap: 0.20,
	goalRelevance: 0.15,
	skillImportance: 0.10,
	recency: 0.10,
	difficultyFit: 0.08,
	durationFit: 0.07,
	completionLikelihood: 0.05,
};

// ── Score Components (AC: 1) ────────────────────────────────────────────────

function scoreDueUrgency(candidate: RecommendationCandidate, nowMs: number): number {
	if (!candidate.isDueReview || !candidate.dueAt) return 0;
	const dueMs = new Date(candidate.dueAt).getTime();
	const overdueHours = (nowMs - dueMs) / (1000 * 60 * 60);
	if (overdueHours <= 0) return 0.2; // Not yet due but scheduled
	// Scale 0.3–1.0 based on overdue hours (cap at 72h)
	return Math.min(1.0, 0.3 + (overdueHours / 72) * 0.7);
}

function scoreMasteryGap(candidate: RecommendationCandidate): number {
	// Bigger gap = higher score (want to work on weak areas)
	const gap = 100 - candidate.currentProficiency;
	return gap / 100;
}

function scoreGoalRelevance(candidate: RecommendationCandidate): number {
	return candidate.goalAligned ? 1.0 : 0.2;
}

function scoreSkillImportance(candidate: RecommendationCandidate): number {
	// Low confidence = high importance to practice
	return 1 - candidate.currentConfidence;
}

function scoreRecency(candidate: RecommendationCandidate): number {
	// Haven't practiced in a long time → higher score
	const hours = candidate.hoursSinceLastPractice;
	if (hours <= 2) return 0.1;
	if (hours <= 24) return 0.3;
	if (hours <= 72) return 0.6;
	return Math.min(1.0, 0.6 + (hours - 72) / 168 * 0.4);
}

function scoreDifficultyFit(candidate: RecommendationCandidate): number {
	// Best fit: difficulty matches proficiency level
	const profLevel = candidate.currentProficiency;
	const diffMap: Record<string, number> = {
		beginner: 15,
		elementary: 30,
		intermediate: 50,
		upper_intermediate: 70,
		advanced: 90,
	};
	const idealProf = diffMap[candidate.difficulty] ?? 50;
	const distance = Math.abs(profLevel - idealProf);
	return Math.max(0, 1 - distance / 50);
}

function scoreDurationFit(
	candidate: RecommendationCandidate,
	timeBudgetMinutes?: number,
): number {
	if (!timeBudgetMinutes) return 0.5; // No budget → neutral
	if (candidate.estimatedMinutes > timeBudgetMinutes) return 0.0; // Doesn't fit
	// Prefer activities that use most of the budget
	return candidate.estimatedMinutes / timeBudgetMinutes;
}

function scoreCompletionLikelihood(candidate: RecommendationCandidate): number {
	// Higher proficiency + confidence → higher likelihood
	return (candidate.currentProficiency / 100 + candidate.currentConfidence) / 2;
}

// ── Main Scorer (AC: 1, 4 — deterministic) ──────────────────────────────────

function computeBreakdown(
	candidate: RecommendationCandidate,
	ctx: ScorerContext,
): ScoreBreakdown {
	return {
		dueUrgency: scoreDueUrgency(candidate, ctx.nowMs),
		masteryGap: scoreMasteryGap(candidate),
		goalRelevance: scoreGoalRelevance(candidate),
		skillImportance: scoreSkillImportance(candidate),
		recency: scoreRecency(candidate),
		difficultyFit: scoreDifficultyFit(candidate),
		durationFit: scoreDurationFit(candidate, ctx.timeBudgetMinutes),
		completionLikelihood: scoreCompletionLikelihood(candidate),
	};
}

function compositeScore(breakdown: ScoreBreakdown): number {
	let score = 0;
	for (const [key, weight] of Object.entries(WEIGHTS)) {
		score += (breakdown[key as keyof ScoreBreakdown] ?? 0) * weight;
	}
	return Math.round(score * 10000) / 10000;
}

// ── Group Assignment (AC: 2) ────────────────────────────────────────────────

function assignGroup(
	candidate: RecommendationCandidate,
	score: number,
	breakdown: ScoreBreakdown,
): RecommendationGroupValue {
	// Must-do: overdue reviews or very weak skills
	if (breakdown.dueUrgency >= 0.5) return "must_do";
	if (breakdown.masteryGap >= 0.8 && candidate.goalAligned) return "must_do";

	// Should-do: moderate priority
	if (score >= 0.4) return "should_do";

	return "could_do";
}

// ── Reason Text Generator (AC: 3) ──────────────────────────────────────────

function generateReason(
	candidate: RecommendationCandidate,
	breakdown: ScoreBreakdown,
): string {
	const parts: string[] = [];

	if (breakdown.dueUrgency >= 0.5) {
		parts.push("Due for review");
	}
	if (breakdown.masteryGap >= 0.6) {
		parts.push("Needs practice");
	}
	if (candidate.goalAligned && breakdown.goalRelevance >= 0.8) {
		parts.push("Aligned with your exam goal");
	}
	if (breakdown.recency >= 0.6) {
		parts.push("Haven't practiced recently");
	}

	if (parts.length === 0) {
		parts.push("Good for continued progress");
	}

	return parts.join(" · ");
}

// ── Public API ──────────────────────────────────────────────────────────────

/**
 * Score and rank recommendation candidates (AC: 1, 2, 3, 4).
 * Deterministic: same inputs → same outputs.
 */
export function scoreAndRank(
	candidates: RecommendationCandidate[],
	ctx: ScorerContext,
): Recommendation[] {
	const scored = candidates
		.filter((c) => {
			// Time budget filter (AC: 5)
			if (ctx.timeBudgetMinutes && c.estimatedMinutes > ctx.timeBudgetMinutes) {
				return false;
			}
			return true;
		})
		.map((c) => {
			const breakdown = computeBreakdown(c, ctx);
			const score = compositeScore(breakdown);
			const group = assignGroup(c, score, breakdown);
			const reason = generateReason(c, breakdown);

			return {
				id: c.id,
				skillIds: c.skillIds,
				moduleType: c.moduleType,
				actionUrl: c.actionUrl,
				label: c.label,
				estimatedMinutes: c.estimatedMinutes,
				reason,
				score,
				group,
				breakdown,
			} satisfies Recommendation;
		});

	// Sort by group priority then score descending
	const groupOrder: Record<string, number> = { must_do: 0, should_do: 1, could_do: 2 };
	scored.sort((a, b) => {
		const gDiff = (groupOrder[a.group] ?? 9) - (groupOrder[b.group] ?? 9);
		if (gDiff !== 0) return gDiff;
		return b.score - a.score;
	});

	return scored;
}
