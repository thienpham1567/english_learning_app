import { db } from "@/lib/db";
import { activityLog } from "@/lib/db/schema";

export type ActivityType =
  | "flashcard_review"
  | "grammar_quiz"
  | "writing_practice"
  | "daily_challenge"
  | "chatbot_session"
  | "voice_practice"
  | "listening_practice";

/**
 * Fire-and-forget activity logging — does NOT block the API response.
 * Writes a row to `activity_log` for analytics aggregation.
 */
export function logActivity(
  userId: string,
  activityType: ActivityType,
  xpEarned: number,
  metadata: Record<string, unknown> = {},
): void {
  db.insert(activityLog)
    .values({
      userId,
      activityType,
      xpEarned,
      metadata,
    })
    .execute()
    .catch((err) => {
      console.warn("[logActivity] Failed to log activity:", err);
    });
}
