"use client";

import type { ExerciseAnswer, StreakInfo, Badge } from "@/lib/daily-challenge/types";
import { StreakDisplay } from "./StreakDisplay";
import { BadgeGallery } from "./BadgeGallery";

type Props = {
  answers: ExerciseAnswer[];
  score: number;
  streak: StreakInfo;
  badges: Badge[];
  newBadges: Badge[];
  timeElapsedMs: number;
};

export function ChallengeResults({
  answers,
  score,
  streak,
  badges,
  newBadges,
  timeElapsedMs,
}: Props) {
  const emoji = score >= 5 ? "🎉" : score >= 4 ? "👏" : score >= 3 ? "👍" : "💪";
  const minutes = Math.floor(timeElapsedMs / 60000);
  const seconds = Math.floor((timeElapsedMs % 60000) / 1000);

  return (
    <div className="mx-auto flex max-w-md flex-col items-center text-center">
      <span className="text-6xl">{emoji}</span>

      <h2 className="mt-4 [font-family:var(--font-display)] text-3xl italic text-(--ink)">
        {score} / 5
      </h2>
      <p className="mt-1 text-sm text-(--text-muted)">
        ⏱️ {minutes}:{seconds.toString().padStart(2, "0")}
      </p>

      {/* Streak */}
      <div className="mt-6">
        <StreakDisplay currentStreak={streak.currentStreak} bestStreak={streak.bestStreak} />
      </div>

      {/* New badges */}
      {newBadges.length > 0 && (
        <div className="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-amber-700">
            🎊 Huy hiệu mới!
          </p>
          {newBadges.map((b) => (
            <p key={b.id} className="text-sm font-medium text-amber-800">
              {b.emoji} {b.label}
            </p>
          ))}
        </div>
      )}

      {/* Answer breakdown */}
      <div className="mt-6 w-full space-y-1.5">
        {answers.map((a, i) => (
          <div
            key={i}
            className={`flex items-center justify-between rounded-lg border px-3 py-1.5 text-sm ${
              a.isCorrect
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-red-200 bg-red-50 text-red-800"
            }`}
          >
            <span>
              Câu {i + 1}: {a.isCorrect ? "✓ Đúng" : "✗ Sai"}
            </span>
            {!a.isCorrect && <span className="text-xs">{a.explanation}</span>}
          </div>
        ))}
      </div>

      {/* Badges */}
      <div className="mt-6 w-full">
        <BadgeGallery badges={badges} />
      </div>

      <p className="mt-6 text-sm text-(--text-muted)">Quay lại mai nhé! 🌙</p>
    </div>
  );
}
