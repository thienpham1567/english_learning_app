import type {
	MasteryUpdateInput,
	MasteryUpdateOutput,
	UserSkillState,
} from "@repo/contracts";

// ── Constants ───────────────────────────────────────────────────────────────

/** Difficulty multipliers — harder tasks give bigger proficiency deltas (AC: 3) */
const DIFFICULTY_WEIGHT: Record<string, number> = {
	beginner: 0.5,
	elementary: 0.7,
	intermediate: 1.0,
	upper_intermediate: 1.3,
	advanced: 1.6,
};

/** Base proficiency gain on a correct answer */
const BASE_GAIN = 5;

/** Base proficiency loss on an incorrect answer */
const BASE_LOSS = 4;

/** Maximum confidence boost per event */
const CONFIDENCE_GAIN = 0.08;

/** Confidence reduction on mistake (AC: 4) */
const CONFIDENCE_LOSS = 0.12;

/** Hint penalty — each hint reduces the effective gain (AC: 3) */
const HINT_PENALTY = 0.15;

/** Daily decay rate applied to proficiency for stale skills (AC: 5) */
const DEFAULT_DECAY_RATE = 0.05;

/** Number of hours before a skill starts decaying */
const DECAY_GRACE_HOURS = 48;

// ── Default state ───────────────────────────────────────────────────────────

export function defaultSkillState(userId: string, skillId: string): UserSkillState {
	const now = new Date().toISOString();
	return {
		userId,
		skillId,
		proficiency: 0,
		confidence: 0.5,
		successStreak: 0,
		failureStreak: 0,
		decayRate: DEFAULT_DECAY_RATE,
		signalCount: 0,
		lastPracticedAt: now,
		lastUpdatedAt: now,
		nextReviewAt: now,
	};
}

// ── Decay (AC: 5) ──────────────────────────────────────────────────────────

/**
 * Apply time-based decay to a skill state.
 *
 * Proficiency drops by `decayRate` per day elapsed beyond the grace period.
 * The calculation is deterministic and uses only the input timestamps.
 */
export function applyDecay(state: UserSkillState, nowMs: number): UserSkillState {
	const lastPracticedMs = new Date(state.lastPracticedAt).getTime();
	const elapsedHours = (nowMs - lastPracticedMs) / (1000 * 60 * 60);

	if (elapsedHours <= DECAY_GRACE_HOURS) return state;

	const decayDays = (elapsedHours - DECAY_GRACE_HOURS) / 24;
	const decayAmount = state.decayRate * decayDays * state.proficiency * 0.01;
	const newProficiency = Math.max(0, state.proficiency - decayAmount);

	// Confidence also decays slightly
	const confidenceDecay = Math.min(state.confidence * 0.02 * decayDays, state.confidence * 0.3);
	const newConfidence = Math.max(0, state.confidence - confidenceDecay);

	return {
		...state,
		proficiency: Math.round(newProficiency * 100) / 100,
		confidence: Math.round(newConfidence * 1000) / 1000,
	};
}

// ── Core update (AC: 1, 3, 4) ───────────────────────────────────────────────

/**
 * Compute the next mastery state from a learning event signal.
 *
 * - Correct + hard + no hints → maximum gain (AC: 3)
 * - Incorrect / partial → loss + confidence drop (AC: 4)
 * - Hints reduce effective gain proportionally (AC: 3)
 * - Neutral results (e.g. AI feedback generated) don't change proficiency
 */
export function computeMasteryUpdate(
	currentState: UserSkillState,
	input: MasteryUpdateInput,
): { nextState: UserSkillState; output: MasteryUpdateOutput } {
	const now = new Date().toISOString();
	const diffWeight = DIFFICULTY_WEIGHT[input.difficulty] ?? 1.0;
	const hintMultiplier = Math.max(0, 1 - input.hintCount * HINT_PENALTY);

	let profDelta = 0;
	let confDelta = 0;
	let newSuccessStreak = currentState.successStreak;
	let newFailureStreak = currentState.failureStreak;

	if (input.result === "correct") {
		// Full gain: base * difficulty * hint discount
		profDelta = BASE_GAIN * diffWeight * hintMultiplier;
		confDelta = CONFIDENCE_GAIN * diffWeight;
		newSuccessStreak += 1;
		newFailureStreak = 0;

		// Streak bonus: extra gain after 3+ consecutive correct
		if (newSuccessStreak >= 3) {
			profDelta *= 1.2;
		}
	} else if (input.result === "partial") {
		// Partial credit: small gain, no confidence boost
		profDelta = BASE_GAIN * diffWeight * 0.3;
		confDelta = 0;
		newSuccessStreak = 0;
		newFailureStreak = 0;
	} else if (input.result === "incorrect") {
		// Loss increases with failure streak (AC: 4)
		const streakPenalty = Math.min(currentState.failureStreak * 0.2, 1.0);
		profDelta = -(BASE_LOSS + BASE_LOSS * streakPenalty) * diffWeight;
		confDelta = -(CONFIDENCE_LOSS + CONFIDENCE_LOSS * streakPenalty);
		newSuccessStreak = 0;
		newFailureStreak += 1;
	}
	// "neutral" result → no proficiency/confidence change

	const newProficiency = Math.round(
		Math.max(0, Math.min(100, currentState.proficiency + profDelta)) * 100,
	) / 100;
	const newConfidence = Math.round(
		Math.max(0, Math.min(1, currentState.confidence + confDelta)) * 1000,
	) / 1000;

	// Compute next review time based on proficiency and confidence
	const reviewIntervalHours = computeReviewInterval(newProficiency, newConfidence);
	const nextReviewMs = Date.now() + reviewIntervalHours * 60 * 60 * 1000;

	// Adjust decay rate: high failure streak → faster decay
	const newDecayRate = Math.min(
		0.2,
		DEFAULT_DECAY_RATE + newFailureStreak * 0.01,
	);

	const nextState: UserSkillState = {
		userId: currentState.userId,
		skillId: currentState.skillId,
		proficiency: newProficiency,
		confidence: newConfidence,
		successStreak: newSuccessStreak,
		failureStreak: newFailureStreak,
		decayRate: Math.round(newDecayRate * 1000) / 1000,
		signalCount: currentState.signalCount + 1,
		lastPracticedAt: now,
		lastUpdatedAt: now,
		nextReviewAt: new Date(nextReviewMs).toISOString(),
	};

	const output: MasteryUpdateOutput = {
		previousProficiency: currentState.proficiency,
		newProficiency: nextState.proficiency,
		previousConfidence: currentState.confidence,
		newConfidence: nextState.confidence,
		delta: Math.round(profDelta * 100) / 100,
		nextReviewAt: nextState.nextReviewAt,
	};

	return { nextState, output };
}

// ── Review interval computation ─────────────────────────────────────────────

/**
 * Compute recommended review interval in hours.
 * High proficiency + high confidence → longer interval.
 * Low proficiency or low confidence → shorter interval.
 */
function computeReviewInterval(proficiency: number, confidence: number): number {
	// Base: 4 hours for 0% mastery, up to 168 hours (7 days) for 100%
	const baseHours = 4 + (proficiency / 100) * 164;
	// Scale by confidence
	return Math.round(baseHours * Math.max(0.3, confidence));
}
