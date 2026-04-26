import { headers } from "next/headers";
import { sql, eq, and } from "drizzle-orm";

import { auth } from "@/lib/auth";
import { db, errorLog, flashcardProgress } from "@repo/database";
import { listDueReviewTasks } from "@repo/database";

// ── Response Shape (Task 1, AC: 1) ──────────────────────────────────────────

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

export interface DueReviewResponse {
	items: DueReviewItem[];
	/** Legacy counts for backward compatibility during migration (AC: 2). */
	legacy: {
		flashcardsDue: number;
		unresolvedErrors: number;
	};
}

// ── Reason metadata (AC: 1) ─────────────────────────────────────────────────

function reasonForSource(sourceType: string, daysOverdue: number): string {
	const overdueSuffix = daysOverdue > 0 ? ` (${daysOverdue} ngày quá hạn)` : "";
	switch (sourceType) {
		case "grammar_quiz":
			return `Ôn ngữ pháp${overdueSuffix}`;
		case "listening":
			return `Ôn nghe${overdueSuffix}`;
		case "vocabulary":
			return `Ôn từ vựng${overdueSuffix}`;
		case "error_log":
			return `Ôn lỗi sai${overdueSuffix}`;
		case "writing":
			return `Ôn bài viết${overdueSuffix}`;
		case "reading":
			return `Ôn bài đọc${overdueSuffix}`;
		default:
			return `Ôn tập${overdueSuffix}`;
	}
}

/**
 * GET /api/review/due
 *
 * Returns due review tasks for the authenticated user plus legacy counts.
 * Thin adapter over the reviewTask query service (Story 22.1).
 */
export async function GET() {
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session) {
		return Response.json({ error: "Unauthorized" }, { status: 401 });
	}

	const userId = session.user.id;
	const now = new Date();

	try {
		const [dueTasks, flashcardDueRows, unresolvedErrorRows] = await Promise.all([
			listDueReviewTasks(userId, now),
			// Legacy: flashcard due count (AC: 2)
			db
				.select({ count: sql<number>`count(*)::int` })
				.from(flashcardProgress)
				.where(
					and(
						eq(flashcardProgress.userId, userId),
						sql`${flashcardProgress.nextReview} <= now()`,
					),
				),
			// Legacy: unresolved error count (AC: 2)
			db
				.select({ count: sql<number>`count(*)::int` })
				.from(errorLog)
				.where(and(eq(errorLog.userId, userId), eq(errorLog.isResolved, false))),
		]);

		// Map review tasks to response items (AC: 1)
		const items: DueReviewItem[] = dueTasks.map((task) => {
			const daysOverdue = Math.max(
				0,
				Math.floor((now.getTime() - task.dueAt.getTime()) / (1000 * 60 * 60 * 24)),
			);
			return {
				id: task.id,
				sourceType: task.sourceType,
				sourceId: task.sourceId,
				skillIds: task.skillIds,
				priority: task.priority,
				dueAt: task.dueAt.toISOString(),
				estimatedMinutes: task.estimatedMinutes,
				reviewMode: task.reviewMode,
				reason: reasonForSource(task.sourceType, daysOverdue),
			};
		});

		const response: DueReviewResponse = {
			items,
			legacy: {
				flashcardsDue: flashcardDueRows[0]?.count ?? 0,
				unresolvedErrors: unresolvedErrorRows[0]?.count ?? 0,
			},
		};

		return Response.json(response);
	} catch (err) {
		console.error("[review/due] Error:", err);
		return Response.json({ error: "Failed to load due reviews" }, { status: 500 });
	}
}
