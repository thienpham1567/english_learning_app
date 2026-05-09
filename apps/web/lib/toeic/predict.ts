/**
 * Predicted TOEIC LR score from per-skill mastery.
 *
 * Average proficiency across Listening subskills (Part 1-4) → scaled 5-495.
 * Same for Reading (Part 5-7).
 *
 * Confidence is the average `confidence` field across same skills; widget
 * suppresses when confidence < 0.3 (insufficient signal).
 */

export type SkillState = {
	skillId: string;
	proficiency: number;
	confidence: number;
	signalCount: number;
};

export type PredictedScore = {
	listeningScaled: number;
	readingScaled: number;
	total: number;
	confidence: number;
	signalCount: number;
};

const LISTENING_RE = /^toeic\.part[1234]\./;
const READING_RE = /^toeic\.part[567]\./;

function avg(nums: number[]): number {
	if (nums.length === 0) return 0;
	return nums.reduce((s, n) => s + n, 0) / nums.length;
}

function scale(prof: number): number {
	const clamped = Math.max(0, Math.min(1, prof));
	return Math.round(5 + clamped * 490);
}

export function computePredictedScore(states: SkillState[]): PredictedScore | null {
	if (states.length === 0) return null;

	const listening = states.filter((s) => LISTENING_RE.test(s.skillId));
	const reading = states.filter((s) => READING_RE.test(s.skillId));

	if (listening.length === 0 && reading.length === 0) return null;

	const lProf = avg(listening.map((s) => s.proficiency));
	const rProf = avg(reading.map((s) => s.proficiency));
	const lConf = avg(listening.map((s) => s.confidence));
	const rConf = avg(reading.map((s) => s.confidence));
	const totalSignals = states.reduce((s, x) => s + x.signalCount, 0);

	const listeningScaled = scale(lProf);
	const readingScaled = scale(rProf);

	return {
		listeningScaled,
		readingScaled,
		total: listeningScaled + readingScaled,
		confidence: Math.min(1, (lConf + rConf) / 2),
		signalCount: totalSignals,
	};
}

/** Suggest target band label from total scaled score. */
export function bandLabel(total: number): string {
	if (total >= 900) return "🌟 Top tier (900+)";
	if (total >= 800) return "💪 Mục tiêu 800-900";
	if (total >= 700) return "👍 Mục tiêu 700-800";
	if (total >= 600) return "📈 Mục tiêu 600-700";
	if (total >= 500) return "🌱 Mục tiêu 500-600";
	return "🎯 Bắt đầu từ nền";
}
