import type { DashboardData } from "@/hooks/useDashboard";
import type { DailyPlanState } from "@/hooks/useDailyStudyPlan";

type PredictedScore = {
  predicted: number | null;
  insufficient: boolean;
};

/**
 * Generates a context-aware motivational message for the dashboard hero card.
 * Replaces the static daily quote with something personal and actionable.
 */
export function getMotivationalMessage(
  dash: DashboardData | null,
  score: PredictedScore | null,
  planState: DailyPlanState,
): string {
  if (!dash) return "Every step counts on your TOEIC journey! 🚀";

  const streak = dash.streak.currentStreak;
  const challengeDone = dash.dailyChallenge.completed;
  const dueItems = dash.flashcardsDue + dash.vocabDue;

  // Priority 1: Returning after absence
  if (streak === 0 && dash.streak.bestStreak > 3) {
    return "👋 Welcome back! Let's restart your streak — just 5 minutes of vocabulary will do. You've got this!";
  }

  // Priority 2: Streak milestones
  if (streak >= 30) {
    return `🏆 ${streak} days straight — legendary dedication! You're in the top 1% of learners. Keep this momentum going!`;
  }
  if (streak >= 14) {
    return `💪 ${streak}-day streak! Two weeks of consistency is building real mastery. Your future TOEIC score thanks you.`;
  }
  if (streak >= 7) {
    return `🔥 ${streak} days in a row! One full week of dedication — the habits you're building will pay off massively.`;
  }
  if (streak >= 3) {
    return `📈 ${streak}-day streak building! Consistency is the #1 predictor of TOEIC success. Keep pushing!`;
  }

  // Priority 3: Score context
  if (score?.predicted && score.predicted >= 800) {
    return `⭐ Predicted score: ${score.predicted}! You're in advanced territory. Focus on the edge cases to break through to 900+.`;
  }
  if (score?.predicted && score.predicted >= 600) {
    return `📊 On track for ${score.predicted} points! Master your weak areas to push into the 700+ zone. Every grammar rule counts.`;
  }

  // Priority 4: Daily challenge completion
  if (challengeDone) {
    return "✅ Daily challenge completed! You're ahead of 85% of learners today. Review your flashcards to double down.";
  }

  // Priority 5: Due reviews
  if (dueItems > 10) {
    return `📝 ${dueItems} items due for review — spaced repetition works best when you stay on schedule. Start with the hardest ones!`;
  }

  // Priority 6: Plan context
  if (planState.status === "ready" && planState.plan.items.length > 0) {
    const topItem = planState.plan.items[0];
    return `🎯 Today's focus: ${topItem.title}. ${topItem.reason}`;
  }

  // Fallback: Time-based motivation
  const hr = new Date().getHours();
  if (hr < 10) return "🌅 Morning study sessions boost retention by 20%. Let's make the most of it!";
  if (hr < 14) return "☀️ Midday energy is perfect for grammar drills. Jump into your study plan!";
  if (hr < 18) return "🌤️ Afternoon practice builds long-term memory. Every minute invested compounds!";
  return "🌙 Evening reviews help consolidate what you learned today. Even 10 minutes makes a difference!";
}

/**
 * Get a greeting based on streak + time of day
 */
export function getSmartGreeting(streak: number): string {
  const hr = new Date().getHours();
  const timeGreeting = hr < 12 ? "Good morning" : hr < 18 ? "Good afternoon" : "Good evening";

  if (streak >= 30) return `${timeGreeting}, Champion`;
  if (streak >= 14) return `${timeGreeting}, Dedicated Learner`;
  if (streak >= 7) return `${timeGreeting}, Streak Master`;
  if (streak >= 3) return `${timeGreeting}, Rising Star`;
  return `${timeGreeting}, TOEIC Learner`;
}
