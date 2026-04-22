import type {
	Skill,
	Subskill,
	SkillTaxonomyVersion,
	ModuleSkillMapping,
	LearningModuleTypeValue,
} from "@repo/contracts";

// ── Taxonomy Version (AC: 5) ───────────────────────────────────────────────
// Bump this when changing the skill tree. Old events keep their version tag
// so historical data is never rewritten.

export const TAXONOMY_VERSION: SkillTaxonomyVersion = {
	version: "1.0.0",
	effectiveDate: "2026-04-22",
};

// ── Canonical Skills (AC: 1) ────────────────────────────────────────────────

export const SKILLS: readonly Skill[] = [
	{ id: "vocabulary", label: "Vocabulary", cefrRelevance: ["A1", "A2", "B1", "B2", "C1", "C2"] },
	{ id: "grammar", label: "Grammar", cefrRelevance: ["A1", "A2", "B1", "B2", "C1", "C2"] },
	{ id: "listening", label: "Listening", cefrRelevance: ["A2", "B1", "B2", "C1", "C2"] },
	{ id: "speaking", label: "Speaking", cefrRelevance: ["A2", "B1", "B2", "C1", "C2"] },
	{ id: "pronunciation", label: "Pronunciation", cefrRelevance: ["A1", "A2", "B1", "B2", "C1"] },
	{ id: "reading", label: "Reading", cefrRelevance: ["A2", "B1", "B2", "C1", "C2"] },
	{ id: "writing", label: "Writing", cefrRelevance: ["A2", "B1", "B2", "C1", "C2"] },
	{ id: "exam_strategy", label: "Exam Strategy", cefrRelevance: ["B1", "B2", "C1", "C2"] },
] as const;

// ── Subskills (AC: 2 — parent-child relationships) ─────────────────────────

export const SUBSKILLS: readonly Subskill[] = [
	// Vocabulary
	{ id: "vocab-recognition", label: "Word Recognition", parentSkillId: "vocabulary", cefrRelevance: ["A1", "A2", "B1"] },
	{ id: "vocab-production", label: "Word Production", parentSkillId: "vocabulary", cefrRelevance: ["A2", "B1", "B2"] },
	{ id: "vocab-collocations", label: "Collocations & Phrases", parentSkillId: "vocabulary", cefrRelevance: ["B1", "B2", "C1"] },

	// Grammar
	{ id: "grammar-form", label: "Grammatical Form", parentSkillId: "grammar", cefrRelevance: ["A1", "A2", "B1"] },
	{ id: "grammar-usage", label: "Grammar in Context", parentSkillId: "grammar", cefrRelevance: ["B1", "B2", "C1"] },
	{ id: "grammar-error-awareness", label: "Error Awareness", parentSkillId: "grammar", cefrRelevance: ["B1", "B2", "C1"] },

	// Listening
	{ id: "listening-comprehension", label: "Listening Comprehension", parentSkillId: "listening", cefrRelevance: ["A2", "B1", "B2"] },
	{ id: "listening-detail", label: "Detail Extraction", parentSkillId: "listening", cefrRelevance: ["B1", "B2", "C1"] },
	{ id: "listening-summarization", label: "Listening Summarization", parentSkillId: "listening", cefrRelevance: ["B2", "C1", "C2"] },

	// Speaking
	{ id: "speaking-fluency", label: "Fluency", parentSkillId: "speaking", cefrRelevance: ["A2", "B1", "B2", "C1"] },
	{ id: "speaking-coherence", label: "Coherence & Organization", parentSkillId: "speaking", cefrRelevance: ["B1", "B2", "C1"] },

	// Pronunciation
	{ id: "pronunciation-segments", label: "Phoneme Accuracy", parentSkillId: "pronunciation", cefrRelevance: ["A1", "A2", "B1"] },
	{ id: "pronunciation-prosody", label: "Stress & Intonation", parentSkillId: "pronunciation", cefrRelevance: ["B1", "B2", "C1"] },

	// Reading
	{ id: "reading-comprehension", label: "Reading Comprehension", parentSkillId: "reading", cefrRelevance: ["A2", "B1", "B2"] },
	{ id: "reading-speed", label: "Reading Speed", parentSkillId: "reading", cefrRelevance: ["B1", "B2", "C1"] },

	// Writing
	{ id: "writing-accuracy", label: "Writing Accuracy", parentSkillId: "writing", cefrRelevance: ["A2", "B1", "B2"] },
	{ id: "writing-coherence", label: "Writing Coherence", parentSkillId: "writing", cefrRelevance: ["B1", "B2", "C1"] },
	{ id: "writing-task-response", label: "Task Response", parentSkillId: "writing", cefrRelevance: ["B1", "B2", "C1", "C2"] },

	// Exam Strategy
	{ id: "exam-time-management", label: "Time Management", parentSkillId: "exam_strategy", cefrRelevance: ["B1", "B2", "C1"] },
	{ id: "exam-question-types", label: "Question Type Familiarity", parentSkillId: "exam_strategy", cefrRelevance: ["B1", "B2", "C1"] },
] as const;

// ── Module → Skill Mapping (AC: 3) ─────────────────────────────────────────
// Maps each LearningModuleType to the skill IDs it primarily exercises.

export const MODULE_SKILL_MAP: readonly ModuleSkillMapping[] = [
	{ moduleType: "chatbot", skillIds: ["speaking", "vocabulary", "grammar"] },
	{ moduleType: "dictionary", skillIds: ["vocabulary"] },
	{ moduleType: "flashcard", skillIds: ["vocabulary"] },
	{ moduleType: "daily_challenge", skillIds: ["grammar", "vocabulary", "reading", "writing"] },
	{ moduleType: "grammar_quiz", skillIds: ["grammar"] },
	{ moduleType: "writing", skillIds: ["writing", "grammar"] },
	{ moduleType: "listening", skillIds: ["listening"] },
	{ moduleType: "speaking", skillIds: ["speaking", "pronunciation"] },
	{ moduleType: "reading", skillIds: ["reading", "vocabulary"] },
	{ moduleType: "diagnostic", skillIds: ["grammar", "vocabulary", "listening", "reading"] },
	{ moduleType: "scenarios", skillIds: ["speaking", "vocabulary", "grammar"] },
] as const;

// ── Activity Type → Skill Mapping (AC: 3) ──────────────────────────────────
// Maps each activityTypeEnum value from the database to skill IDs.

export const ACTIVITY_SKILL_MAP: Record<string, readonly string[]> = {
	flashcard_review: ["vocabulary"],
	grammar_quiz: ["grammar"],
	grammar_lesson: ["grammar"],
	study_set: ["vocabulary", "grammar"],
	writing_practice: ["writing", "grammar"],
	daily_challenge: ["grammar", "vocabulary", "reading", "writing"],
	chatbot_session: ["speaking", "vocabulary", "grammar"],
	voice_practice: ["speaking", "pronunciation"],
	listening_practice: ["listening"],
	diagnostic_test: ["grammar", "vocabulary", "listening", "reading"],
};

// ── Lookup helpers (AC: 3, 4) ───────────────────────────────────────────────

const _skillIndex = new Map(SKILLS.map((s) => [s.id, s]));

/** Get a skill by ID. Returns undefined if not found. */
export function getSkillById(id: string): Skill | undefined {
	return _skillIndex.get(id);
}

/** Get all subskills for a parent skill ID. */
export function getSubskillsForSkill(parentSkillId: string): readonly Subskill[] {
	return SUBSKILLS.filter((s) => s.parentSkillId === parentSkillId);
}

/**
 * Resolve skill IDs for a given module type.
 * Throws if the module has no mapping (AC: 4).
 */
export function resolveSkillsForModule(moduleType: LearningModuleTypeValue): readonly string[] {
	const mapping = MODULE_SKILL_MAP.find((m) => m.moduleType === moduleType);
	if (!mapping) {
		throw new Error(`No skill mapping found for module type: ${moduleType}`);
	}
	return mapping.skillIds;
}

/**
 * Resolve skill IDs for a given activity type (from activityTypeEnum).
 * Throws if the activity has no mapping (AC: 4).
 */
export function resolveSkillsForActivity(activityType: string): readonly string[] {
	const skills = ACTIVITY_SKILL_MAP[activityType];
	if (!skills) {
		throw new Error(`No skill mapping found for activity type: ${activityType}`);
	}
	return skills;
}
