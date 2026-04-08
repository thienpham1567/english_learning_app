"use client";

import { motion } from "motion/react";

type Props = { currentStreak: number; bestStreak: number };

export function StreakDisplay({ currentStreak, bestStreak }: Props) {
  return (
    <motion.div
      className="flex items-center gap-4"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
    >
      <div className="flex items-center gap-1.5">
        <motion.span
          className="text-3xl"
          animate={{ scale: [1, 1.15, 1] }}
          transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 2 }}
        >
          🔥
        </motion.span>
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
    </motion.div>
  );
}
