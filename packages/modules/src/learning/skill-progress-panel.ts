/**
 * Skill Mastery Progress Panel (Story 26.1, AC: 1-4)
 *
 * Computes the data model for a progress panel showing skill mastery
 * across all core skills. Handles missing/low-confidence data gracefully.
 */

import type { UserSkillState } from "@repo/contracts";

// ── Core Skills ─────────────────────────────────────────────────────────────

export const CORE_SKILLS = [
	"vocabulary",
	"grammar",
	"listening",
	"reading",
	"writing",
	"speaking",
	"pronunciation",
] as const;

export type CoreSkill = (typeof CORE_SKILLS)[number];

// ── Skill Label Map (Vietnamese) ────────────────────────────────────────────

const SKILL_LABELS: Record<string, string> = {
	vocabulary: "Từ vựng",
	grammar: "Ngữ pháp",
	listening: "Nghe",
	reading: "Đọc",
	writing: "Viết",
	speaking: "Nói",
	pronunciation: "Phát âm",
};

const SKILL_EMOJI: Record<string, string> = {
	vocabulary: "📚",
	grammar: "📐",
	listening: "🎧",
	reading: "📰",
	writing: "✏️",
	speaking: "🗣️",
	pronunciation: "🔊",
};

// ── Progress Panel Types (AC: 1, 2) ────────────────────────────────────────

export interface SkillProgressItem {
	skillId: string;
	label: string;
	emoji: string;
	/** 0-100 */
	proficiency: number;
	/** 0-1 */
	confidence: number;
	/** Whether data is reliable enough to show */
	hasReliableData: boolean;
	/** Human-friendly proficiency level */
	level: "beginner" | "elementary" | "intermediate" | "upper_intermediate" | "advanced";
	/** ISO datetime string or null */
	lastPracticedAt: string | null;
	/** Relative time description */
	lastPracticedLabel: string;
	/** Next recommended review ISO string or null */
	nextReviewAt: string | null;
}

export interface SkillProgressPanel {
	skills: SkillProgressItem[];
	/** Strongest skill ID (by proficiency) */
	strongestSkill: string | null;
	/** Weakest skill ID */
	weakestSkill: string | null;
	/** Overall readiness message */
	overallMessage: string;
	/** Whether any data exists */
	hasData: boolean;
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function proficiencyToLevel(p: number): SkillProgressItem["level"] {
	if (p >= 80) return "advanced";
	if (p >= 65) return "upper_intermediate";
	if (p >= 45) return "intermediate";
	if (p >= 25) return "elementary";
	return "beginner";
}

function formatLastPracticed(updatedAt: string | null | undefined, nowMs: number): string {
	if (!updatedAt) return "Chưa luyện tập";
	const diff = nowMs - new Date(updatedAt).getTime();
	const hours = Math.floor(diff / (1000 * 60 * 60));
	if (hours < 1) return "Vừa luyện";
	if (hours < 24) return `${hours} giờ trước`;
	const days = Math.floor(hours / 24);
	if (days === 1) return "Hôm qua";
	if (days < 7) return `${days} ngày trước`;
	const weeks = Math.floor(days / 7);
	return `${weeks} tuần trước`;
}

// ── Panel Builder (AC: 1, 2, 3, 4) ─────────────────────────────────────────

/**
 * Builds the skill mastery progress panel (AC: 1-4).
 *
 * AC: 1 — Shows all 7 core skills
 * AC: 2 — Each includes proficiency, confidence, last practiced, next review
 * AC: 3 — Handles missing/low-confidence gracefully
 * AC: 4 — Data can inform Home recommendation explanations
 */
export function buildSkillProgressPanel(
	skillStates: UserSkillState[],
	nowMs?: number,
): SkillProgressPanel {
	const now = nowMs ?? Date.now();
	const stateMap = new Map(skillStates.map((s) => [s.skillId, s]));

	const skills: SkillProgressItem[] = CORE_SKILLS.map((skillId) => {
		const state = stateMap.get(skillId);

		if (!state) {
			// AC: 3 — Missing data
			return {
				skillId,
				label: SKILL_LABELS[skillId] ?? skillId,
				emoji: SKILL_EMOJI[skillId] ?? "📊",
				proficiency: 0,
				confidence: 0,
				hasReliableData: false,
				level: "beginner" as const,
				lastPracticedAt: null,
				lastPracticedLabel: "Chưa luyện tập",
				nextReviewAt: null,
			};
		}

		return {
			skillId,
			label: SKILL_LABELS[skillId] ?? skillId,
			emoji: SKILL_EMOJI[skillId] ?? "📊",
			proficiency: state.proficiency,
			confidence: state.confidence,
			hasReliableData: state.confidence >= 0.3,
			level: proficiencyToLevel(state.proficiency),
			lastPracticedAt: state.lastUpdatedAt ?? null,
			lastPracticedLabel: formatLastPracticed(state.lastUpdatedAt, now),
			nextReviewAt: null, // Populated by caller from review tasks
		};
	});

	const reliableSkills = skills.filter((s) => s.hasReliableData);
	const hasData = reliableSkills.length > 0;

	let strongestSkill: string | null = null;
	let weakestSkill: string | null = null;

	if (reliableSkills.length > 0) {
		reliableSkills.sort((a, b) => b.proficiency - a.proficiency);
		strongestSkill = reliableSkills[0]!.skillId;
		weakestSkill = reliableSkills[reliableSkills.length - 1]!.skillId;
	}

	let overallMessage: string;
	if (!hasData) {
		overallMessage = "Bắt đầu luyện tập để xem tiến trình kỹ năng của bạn!";
	} else {
		const avgProf = Math.round(reliableSkills.reduce((s, sk) => s + sk.proficiency, 0) / reliableSkills.length);
		if (avgProf >= 70) overallMessage = "Bạn đang tiến bộ tốt! Hãy duy trì nhịp độ học.";
		else if (avgProf >= 40) overallMessage = "Đang trên đà cải thiện. Hãy tập trung vào kỹ năng yếu.";
		else overallMessage = "Hãy luyện tập đều đặn mỗi ngày để nâng cao kỹ năng!";
	}

	return { skills, strongestSkill, weakestSkill, overallMessage, hasData };
}

// ── Explanation Helper (AC: 4) ──────────────────────────────────────────────

/**
 * Generates a recommendation explanation from the progress panel (AC: 4).
 */
export function generateRecommendationExplanation(panel: SkillProgressPanel): string {
	if (!panel.hasData) return "Hãy bắt đầu với bài kiểm tra chẩn đoán.";
	if (panel.weakestSkill) {
		const weak = panel.skills.find((s) => s.skillId === panel.weakestSkill);
		if (weak) return `Tập trung vào ${weak.label} — kỹ năng cần cải thiện nhất.`;
	}
	return "Tiếp tục luyện tập đều đặn để duy trì tiến bộ.";
}
