/**
 * Normalized Error Categories (Story 23.1, AC: 1-4)
 *
 * Maps raw error data (sourceModule + grammarTopic) into learner-friendly
 * categories with skill ID linkage. Works additively — existing error rows
 * without a grammarTopic still classify correctly via source module fallback.
 */

// ── Category Definitions (AC: 1) ────────────────────────────────────────────

export interface ErrorCategory {
	key: string;
	label: string;
	labelVi: string;
	emoji: string;
	/** Primary skill ID this category maps to (AC: 3). */
	skillId: string;
	/** Subskill ID when available. */
	subskillId?: string;
}

export const ERROR_CATEGORIES: readonly ErrorCategory[] = [
	{ key: "tense", label: "Tense", labelVi: "Thì", emoji: "⏰", skillId: "grammar", subskillId: "grammar-form" },
	{ key: "article", label: "Article", labelVi: "Mạo từ", emoji: "📌", skillId: "grammar", subskillId: "grammar-form" },
	{ key: "preposition", label: "Preposition", labelVi: "Giới từ", emoji: "📍", skillId: "grammar", subskillId: "grammar-usage" },
	{ key: "word-form", label: "Word Form", labelVi: "Dạng từ", emoji: "🔤", skillId: "grammar", subskillId: "grammar-form" },
	{ key: "subject-verb", label: "Subject-Verb Agreement", labelVi: "Hòa hợp chủ-vị", emoji: "🔗", skillId: "grammar", subskillId: "grammar-form" },
	{ key: "clause", label: "Clause & Sentence Structure", labelVi: "Cấu trúc câu", emoji: "🏗️", skillId: "grammar", subskillId: "grammar-usage" },
	{ key: "vocabulary", label: "Vocabulary", labelVi: "Từ vựng", emoji: "📚", skillId: "vocabulary", subskillId: "vocab-production" },
	{ key: "coherence", label: "Coherence & Cohesion", labelVi: "Liên kết & mạch lạc", emoji: "🧩", skillId: "writing", subskillId: "writing-coherence" },
	{ key: "task-response", label: "Task Response", labelVi: "Trả lời đúng yêu cầu", emoji: "🎯", skillId: "writing", subskillId: "writing-task-response" },
	{ key: "spelling", label: "Spelling & Punctuation", labelVi: "Chính tả & dấu câu", emoji: "✏️", skillId: "writing", subskillId: "writing-accuracy" },
	{ key: "pronunciation", label: "Pronunciation", labelVi: "Phát âm", emoji: "🗣️", skillId: "pronunciation", subskillId: "pronunciation-segments" },
	{ key: "listening-detail", label: "Listening Detail", labelVi: "Nghe chi tiết", emoji: "🎧", skillId: "listening", subskillId: "listening-detail" },
	{ key: "listening-comprehension", label: "Listening Comprehension", labelVi: "Nghe hiểu", emoji: "👂", skillId: "listening", subskillId: "listening-comprehension" },
	{ key: "reading-comprehension", label: "Reading Comprehension", labelVi: "Đọc hiểu", emoji: "📖", skillId: "reading", subskillId: "reading-comprehension" },
	{ key: "exam-strategy", label: "Exam Strategy", labelVi: "Chiến thuật thi", emoji: "🎓", skillId: "grammar" },
	{ key: "other", label: "Other", labelVi: "Khác", emoji: "❓", skillId: "grammar" },
] as const;

const CATEGORY_MAP = new Map(ERROR_CATEGORIES.map((c) => [c.key, c]));

// ── Grammar Topic → Category Mapping (AC: 1) ───────────────────────────────

const TOPIC_PATTERNS: Array<{ pattern: RegExp; key: string }> = [
	{ pattern: /tense|past|present|future|perfect|continuous|progressive/i, key: "tense" },
	{ pattern: /article|a\/an|the\b|determiner/i, key: "article" },
	{ pattern: /preposition|in\/on\/at|prep\b/i, key: "preposition" },
	{ pattern: /word.?form|noun.?verb|adjective|adverb|suffix|prefix/i, key: "word-form" },
	{ pattern: /subject.?verb|agreement|singular.?plural/i, key: "subject-verb" },
	{ pattern: /clause|relative|conditional|if.?clause|sentence.?structure|complex.?sentence/i, key: "clause" },
	{ pattern: /vocabulary|vocab|word.?choice|collocation|idiom|phrasal/i, key: "vocabulary" },
	{ pattern: /coherence|cohesion|linking|transition|paragraph/i, key: "coherence" },
	{ pattern: /task.?response|answer.?the.?question|off.?topic/i, key: "task-response" },
	{ pattern: /spelling|punctuation|capitali[sz]ation|comma|apostrophe/i, key: "spelling" },
	{ pattern: /pronuncia|phonem|intonation|stress/i, key: "pronunciation" },
	{ pattern: /listening.?detail|specific.?information|number|date/i, key: "listening-detail" },
	{ pattern: /listening|comprehension|main.?idea|gist/i, key: "listening-comprehension" },
	{ pattern: /reading|passage|inference|skim/i, key: "reading-comprehension" },
	{ pattern: /strategy|time.?management|guess|eliminate/i, key: "exam-strategy" },
];

// ── Source Module → Fallback Category (AC: 2) ───────────────────────────────

const MODULE_FALLBACK: Record<string, string> = {
	"grammar-quiz": "other",
	"grammar_quiz": "other",
	"mock-test": "exam-strategy",
	"mock_test": "exam-strategy",
	"daily-challenge": "other",
	"daily_challenge": "other",
	listening: "listening-comprehension",
	writing: "coherence",
	"writing-practice": "coherence",
	speaking: "pronunciation",
	reading: "reading-comprehension",
};

// ── Classify Function (AC: 1, 2) ────────────────────────────────────────────

/**
 * Derives a normalized error category from raw error data.
 *
 * Strategy:
 * 1. If grammarTopic is present, match against known patterns (AC: 1).
 * 2. If no match, fall back to source module default (AC: 2).
 * 3. If source module is unknown, return "other" (AC: 4).
 *
 * This works for both new and legacy error rows without migration.
 */
export function classifyError(input: {
	grammarTopic?: string | null;
	sourceModule?: string | null;
	questionStem?: string | null;
}): ErrorCategory {
	// 1. Try grammarTopic pattern matching
	if (input.grammarTopic) {
		for (const { pattern, key } of TOPIC_PATTERNS) {
			if (pattern.test(input.grammarTopic)) {
				return CATEGORY_MAP.get(key)!;
			}
		}
	}

	// 2. Fall back to source module
	if (input.sourceModule) {
		const fallbackKey = MODULE_FALLBACK[input.sourceModule];
		if (fallbackKey) {
			return CATEGORY_MAP.get(fallbackKey)!;
		}
	}

	// 3. Ultimate fallback (AC: 4)
	return CATEGORY_MAP.get("other")!;
}

// ── Lookup Helpers ──────────────────────────────────────────────────────────

export function getCategoryByKey(key: string): ErrorCategory | undefined {
	return CATEGORY_MAP.get(key);
}

export function getAllCategories(): readonly ErrorCategory[] {
	return ERROR_CATEGORIES;
}

/**
 * Maps a category to its associated skill IDs (AC: 3).
 */
export function categoryToSkillIds(category: ErrorCategory): string[] {
	const ids = [category.skillId];
	if (category.subskillId) ids.push(category.subskillId);
	return ids;
}
