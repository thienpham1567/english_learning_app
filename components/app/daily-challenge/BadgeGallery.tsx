"use client";

import type { Badge } from "@/lib/daily-challenge/types";

type Props = { badges: Badge[] };

export function BadgeGallery({ badges }: Props) {
  return (
    <div className="flex flex-wrap gap-2">
      {badges.map((b, i) => (
        <div
          key={b.id}
          className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm ${
            b.unlocked
              ? "border-amber-300 bg-amber-50 text-amber-800"
              : "border-(--border) bg-(--bg-deep) text-(--text-muted) opacity-50 grayscale"
          }`}
        >
          <span className="text-lg">{b.emoji}</span>
          <div>
            <span className="text-xs font-semibold">{b.label}</span>
            <span className="ml-1 text-[10px] opacity-70">{b.requiredStreak}d</span>
          </div>
        </div>
      ))}
    </div>
  );
}
