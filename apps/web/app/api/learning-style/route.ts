import { headers } from "next/headers";
import { eq, sql } from "drizzle-orm";

import { auth } from "@/lib/auth";
import { db } from "@repo/database";
import { activityLog } from "@repo/database";

/**
 * GET /api/learning-style
 *
 * Analyzes user's activity patterns to detect learning style.
 * Returns style profile + personalized suggestions.
 */

const STYLE_MAP: Record<string, string[]> = {
  visual: ["flashcard_review", "study_set"],
  reading: ["grammar_lesson"],
  conversational: ["chatbot_session", "voice_practice", "listening_practice"],
  practice: ["grammar_quiz", "daily_challenge", "writing_practice"],
};

const STYLE_INFO: Record<string, { icon: string; name: string; description: string }> = {
  visual: { icon: "👁️", name: "Học trực quan", description: "Bạn học tốt nhất qua hình ảnh và flashcard" },
  reading: { icon: "📖", name: "Học qua đọc", description: "Bạn thích đọc và phân tích ngữ pháp" },
  conversational: { icon: "💬", name: "Học qua giao tiếp", description: "Bạn tiến bộ nhanh qua hội thoại và luyện nói" },
  practice: { icon: "✍️", name: "Học qua thực hành", description: "Bạn học tốt nhất qua bài tập và thử thách" },
};

const MODULE_LABELS: Record<string, { label: string; href: string }> = {
  grammar_quiz: { label: "Grammar Quiz", href: "/grammar-quiz" },
  chatbot_session: { label: "Trò chuyện AI", href: "/english-chatbot" },
  flashcard_review: { label: "Flashcards", href: "/flashcards" },
  writing_practice: { label: "Luyện viết", href: "/writing-practice" },
  grammar_lesson: { label: "Bài học ngữ pháp", href: "/grammar-lessons" },
  study_set: { label: "Chủ đề học tập", href: "/study-sets" },
  voice_practice: { label: "Luyện nói", href: "/pronunciation" },
  listening_practice: { label: "Luyện nghe", href: "/listening" },
  daily_challenge: { label: "Thử thách", href: "/daily-challenge" },
  diagnostic_test: { label: "Bài kiểm tra", href: "/diagnostic" },
};

const MIN_ACTIVITIES = 10;

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  try {
    // Count activities per type
    const rows = await db
      .select({
        type: activityLog.activityType,
        count: sql<number>`count(*)::int`,
      })
      .from(activityLog)
      .where(eq(activityLog.userId, userId))
      .groupBy(activityLog.activityType);

    const totalActivities = rows.reduce((sum, r) => sum + r.count, 0);

    if (totalActivities < MIN_ACTIVITIES) {
      return Response.json({
        hasEnoughData: false,
        activitiesCount: totalActivities,
        remaining: MIN_ACTIVITIES - totalActivities,
      });
    }

    // Compute engagement distribution
    const engagement: Record<string, number> = {};
    for (const row of rows) {
      engagement[row.type] = row.count / totalActivities;
    }

    // Detect style
    const styleScores: Record<string, number> = {};
    for (const [style, modules] of Object.entries(STYLE_MAP)) {
      styleScores[style] = modules.reduce((sum, m) => sum + (engagement[m] ?? 0), 0);
    }
    const sorted = Object.entries(styleScores).sort(([, a], [, b]) => b - a);
    const totalScore = Object.values(styleScores).reduce((a, b) => a + b, 0);
    const primaryStyle = sorted[0][0];
    const confidence = totalScore > 0 ? sorted[0][1] / totalScore : 0;
    const info = STYLE_INFO[primaryStyle];

    // Generate suggestions
    // 1. Reinforce strength (highest engagement module)
    // 2. Nudge weakness (lowest or zero engagement module)
    // 3. Cross-skill recommendation
    const sortedModules = Object.entries(engagement).sort(([, a], [, b]) => b - a);
    const strongModule = sortedModules[0]?.[0];
    const allModules = Object.keys(MODULE_LABELS).filter((m) => m !== "diagnostic_test");
    const weakModule = allModules.find((m) => !engagement[m] || engagement[m] === 0)
      ?? sortedModules[sortedModules.length - 1]?.[0];

    const suggestions: Array<{ label: string; href: string; reason: string }> = [];

    if (strongModule && MODULE_LABELS[strongModule]) {
      suggestions.push({
        label: MODULE_LABELS[strongModule].label,
        href: MODULE_LABELS[strongModule].href,
        reason: "Đây là điểm mạnh của bạn",
      });
    }

    if (weakModule && MODULE_LABELS[weakModule] && weakModule !== strongModule) {
      suggestions.push({
        label: MODULE_LABELS[weakModule].label,
        href: MODULE_LABELS[weakModule].href,
        reason: "Bạn chưa luyện nhiều kỹ năng này",
      });
    }

    // Always suggest study sets for cross-skill
    if (!suggestions.some((s) => s.href === "/study-sets")) {
      suggestions.push({
        label: "Học theo chủ đề",
        href: "/study-sets",
        reason: "Kết hợp nhiều kỹ năng cùng lúc",
      });
    }

    return Response.json({
      hasEnoughData: true,
      activitiesCount: totalActivities,
      style: {
        primary: primaryStyle,
        confidence: Math.round(confidence * 100) / 100,
        ...info,
      },
      engagement,
      suggestions: suggestions.slice(0, 3),
    });
  } catch (err) {
    console.error("[learning-style] Error:", err);
    return Response.json({ error: "Analysis failed" }, { status: 500 });
  }
}
