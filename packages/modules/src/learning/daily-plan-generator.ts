import type {
	DailyStudyPlan,
	DailyStudyPlanItem,
	TimeBudgetValue,
	RecommendationCandidate,
	Recommendation,
} from "@repo/contracts";
import { scoreAndRank } from "./recommendation-scorer";

// ── Heavy task guard (AC: 4) ────────────────────────────────────────────────

const HEAVY_THRESHOLD_MINUTES = 15;
const MAX_HEAVY_PER_SESSION = 1;

// ── Priority mapping ────────────────────────────────────────────────────────

function groupToPriority(group: string): "high" | "medium" | "low" {
	if (group === "must_do") return "high";
	if (group === "should_do") return "medium";
	return "low";
}

// ── Plan Generator (AC: 1, 2, 3, 4) ────────────────────────────────────────

/**
 * Generate an adaptive daily study plan from scored candidates.
 *
 * - Selects 1–3 items that fit within the time budget (AC: 2)
 * - Prefers due reviews before new study (AC: 3 — via scorer dueUrgency weight)
 * - Guards against multiple heavy tasks in one session (AC: 4)
 * - Deterministic: same candidates + same context → same plan
 */
export function generateDailyPlan(
	candidates: RecommendationCandidate[],
	timeBudget: TimeBudgetValue,
	nowMs: number = Date.now(),
	completedModuleTypes: Set<string> = new Set(),
): DailyStudyPlan {
	const budgetMinutes = Number(timeBudget);

	// Score and rank candidates
	const ranked = scoreAndRank(candidates, {
		nowMs,
		timeBudgetMinutes: budgetMinutes,
	});

	// Select items respecting time budget and fatigue guard
	const selected: Recommendation[] = [];
	let remainingMinutes = budgetMinutes;
	let heavyCount = 0;

	for (const rec of ranked) {
		if (selected.length >= 3) break;
		if (rec.estimatedMinutes > remainingMinutes) continue;

		// Fatigue guard (AC: 4)
		if (rec.estimatedMinutes >= HEAVY_THRESHOLD_MINUTES) {
			if (heavyCount >= MAX_HEAVY_PER_SESSION) continue;
			heavyCount++;
		}

		selected.push(rec);
		remainingMinutes -= rec.estimatedMinutes;
	}

	// Fallback: if no candidates fit, pick the single highest-scored regardless of budget
	if (selected.length === 0 && candidates.length > 0) {
		const unfiltered = scoreAndRank(candidates, { nowMs });
		if (unfiltered.length > 0) {
			selected.push(unfiltered[0]!);
		}
	}

	// Convert to plan items
	const items: DailyStudyPlanItem[] = selected.map((rec) => ({
		id: rec.id,
		title: rec.label,
		reason: rec.reason,
		estimatedMinutes: rec.estimatedMinutes,
		actionUrl: rec.actionUrl,
		skillIds: rec.skillIds,
		priority: groupToPriority(rec.group),
		completed: completedModuleTypes.has(rec.moduleType),
	}));

	return {
		timeBudget,
		items,
		generatedAt: new Date(nowMs).toISOString(),
	};
}
