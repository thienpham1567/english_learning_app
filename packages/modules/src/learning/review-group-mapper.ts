/**
 * Review Task Group Mapper (Story 22.2, AC: 1-2)
 *
 * Groups raw due review tasks into learner-friendly categories
 * instead of exposing internal source type names.
 */

// ── Learner-Friendly Group Definitions ──────────────────────────────────────

export interface ReviewGroup {
	key: string;
	label: string;
	emoji: string;
	actionUrl: string;
	/** Sum of estimated minutes across items in this group. */
	estimatedMinutes: number;
	/** Count of tasks in this group. */
	count: number;
	/** Highest priority across items in this group (lower = more important). */
	priority: number;
}

export interface DueReviewItem {
	id: string;
	sourceType: string;
	sourceId: string;
	skillIds: string[];
	priority: number;
	dueAt: string;
	estimatedMinutes: number;
	reviewMode: string;
	reason: string;
}

// ── Source Type → Learner Need Mapping (AC: 1) ──────────────────────────────

const SOURCE_TO_GROUP: Record<string, { key: string; label: string; emoji: string; actionUrl: string }> = {
	vocabulary: { key: "words", label: "Từ vựng cần nhớ", emoji: "📚", actionUrl: "/flashcards" },
	flashcard: { key: "words", label: "Từ vựng cần nhớ", emoji: "📚", actionUrl: "/flashcards" },
	error_log: { key: "mistakes", label: "Lỗi sai cần sửa", emoji: "🔧", actionUrl: "/review-quiz" },
	grammar_quiz: { key: "grammar", label: "Ngữ pháp cần ôn", emoji: "📖", actionUrl: "/grammar-quiz" },
	listening: { key: "listening", label: "Nghe cần luyện", emoji: "🎧", actionUrl: "/listening" },
	reading: { key: "reading", label: "Bài đọc cần ôn", emoji: "📄", actionUrl: "/reading" },
	writing: { key: "writing", label: "Bài viết cần sửa", emoji: "✍️", actionUrl: "/writing-practice" },
	pronunciation: { key: "pronunciation", label: "Phát âm cần luyện", emoji: "🗣️", actionUrl: "/pronunciation" },
};

const FALLBACK_GROUP = { key: "other", label: "Ôn tập khác", emoji: "🔄", actionUrl: "/review-quiz" };

// ── Group Function ──────────────────────────────────────────────────────────

/**
 * Groups due review items by learner need (AC: 1).
 * Each group includes count, estimated time, and priority (AC: 2).
 * Sorted by highest priority (lowest number first).
 */
export function groupReviewTasks(items: DueReviewItem[]): ReviewGroup[] {
	const groupMap = new Map<string, ReviewGroup>();

	for (const item of items) {
		const config = SOURCE_TO_GROUP[item.sourceType] ?? FALLBACK_GROUP;

		const existing = groupMap.get(config.key);
		if (existing) {
			existing.count += 1;
			existing.estimatedMinutes += item.estimatedMinutes;
			existing.priority = Math.min(existing.priority, item.priority);
		} else {
			groupMap.set(config.key, {
				key: config.key,
				label: config.label,
				emoji: config.emoji,
				actionUrl: config.actionUrl,
				estimatedMinutes: item.estimatedMinutes,
				count: 1,
				priority: item.priority,
			});
		}
	}

	// Sort by priority (highest priority = lowest number first)
	return [...groupMap.values()].sort((a, b) => a.priority - b.priority);
}
