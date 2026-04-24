/**
 * Widget Priority Layout (Story 26.5, AC: 1-4)
 *
 * Defines the priority ordering for Home/Progress widgets.
 * Outcome insights first, gamification second (AC: 1).
 * All existing widgets remain accessible (AC: 2).
 */

// ── Widget Types ────────────────────────────────────────────────────────────

export type WidgetCategory = "primary" | "secondary" | "gamification";

export interface WidgetSlot {
	id: string;
	label: string;
	category: WidgetCategory;
	/** Priority within category (lower = higher priority) */
	priority: number;
	/** Whether the widget has meaningful data to display */
	hasData: boolean;
	/** Empty state message when no data (AC: 3) */
	emptyMessage: string;
	/** Mobile visibility priority — true means always visible */
	mobileVisible: boolean;
}

// ── Widget Registry (AC: 1, 2) ─────────────────────────────────────────────

/**
 * Builds the prioritized widget layout (AC: 1-4).
 *
 * AC: 1 — Primary: today's action, skill progress, review needs.
 *         Secondary: gamification widgets.
 * AC: 2 — All existing widgets remain accessible.
 * AC: 3 — Empty states explain how to generate data.
 * AC: 4 — Mobile layout keeps primary action visible.
 */
export function buildWidgetLayout(context: {
	hasPathway: boolean;
	hasSkillData: boolean;
	hasReviewDebt: boolean;
	hasStreak: boolean;
	hasXp: boolean;
	hasBadges: boolean;
	hasLeaderboard: boolean;
}): WidgetSlot[] {
	const slots: WidgetSlot[] = [
		// ── Primary widgets (outcome-focused, AC: 1) ─────────────
		{
			id: "daily-action",
			label: "Hành động hôm nay",
			category: "primary",
			priority: 1,
			hasData: context.hasPathway,
			emptyMessage: "Hoàn thành bài chẩn đoán để nhận kế hoạch học tập!",
			mobileVisible: true,
		},
		{
			id: "skill-progress",
			label: "Tiến trình kỹ năng",
			category: "primary",
			priority: 2,
			hasData: context.hasSkillData,
			emptyMessage: "Luyện tập thêm để thấy tiến trình kỹ năng!",
			mobileVisible: true,
		},
		{
			id: "review-needs",
			label: "Cần ôn tập",
			category: "primary",
			priority: 3,
			hasData: context.hasReviewDebt,
			emptyMessage: "Không có bài ôn tập nào đang chờ.",
			mobileVisible: true,
		},

		// ── Secondary widgets (gamification, AC: 2) ──────────────
		{
			id: "streak",
			label: "Chuỗi ngày",
			category: "gamification",
			priority: 10,
			hasData: context.hasStreak,
			emptyMessage: "Luyện tập mỗi ngày để giữ chuỗi!",
			mobileVisible: false,
		},
		{
			id: "xp",
			label: "Điểm kinh nghiệm",
			category: "gamification",
			priority: 11,
			hasData: context.hasXp,
			emptyMessage: "Hoàn thành bài tập để tích điểm!",
			mobileVisible: false,
		},
		{
			id: "badges",
			label: "Huy hiệu",
			category: "gamification",
			priority: 12,
			hasData: context.hasBadges,
			emptyMessage: "Đạt mốc mới để nhận huy hiệu!",
			mobileVisible: false,
		},
		{
			id: "leaderboard",
			label: "Bảng xếp hạng",
			category: "gamification",
			priority: 13,
			hasData: context.hasLeaderboard,
			emptyMessage: "Tham gia luyện tập để lên bảng xếp hạng!",
			mobileVisible: false,
		},
	];

	return slots;
}

// ── Layout Helpers (AC: 4) ──────────────────────────────────────────────────

/**
 * Gets the mobile-optimized widget list (AC: 4).
 * Only shows primary widgets + gamification widgets that have data.
 */
export function getMobileVisibleWidgets(slots: WidgetSlot[]): WidgetSlot[] {
	return slots.filter((s) => s.mobileVisible || (s.hasData && s.category === "gamification"));
}

/**
 * Gets primary widgets only (for compact layouts).
 */
export function getPrimaryWidgets(slots: WidgetSlot[]): WidgetSlot[] {
	return slots.filter((s) => s.category === "primary");
}

/**
 * Gets all widgets with data (hides empty gamification).
 */
export function getActiveWidgets(slots: WidgetSlot[]): WidgetSlot[] {
	return slots.filter((s) => s.category === "primary" || s.hasData);
}
