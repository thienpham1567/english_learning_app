"use client";

type Props = { currentStreak: number; bestStreak: number };

export function StreakDisplay({ currentStreak, bestStreak }: Props) {
  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-1.5">
        <span className="text-3xl">🔥</span>
        <div>
          <span className="text-2xl font-bold text-(--ink)">{currentStreak}</span>
          <span className="ml-1 text-xs text-(--text-muted)">ngày liên tiếp</span>
        </div>
      </div>
      {bestStreak > 0 && (
        <span className="rounded-full bg-(--bg-deep) px-2.5 py-0.5 text-[11px] font-medium text-(--text-secondary)">
          Kỷ lục: {bestStreak}
        </span>
      )}
    </div>
  );
}
