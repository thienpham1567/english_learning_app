"use client";

import { motion } from "motion/react";

type Props = {
  current: number;
  total: number;
};

export function SessionProgress({ current, total }: Props) {
  const pct = total > 0 ? (current / total) * 100 : 0;

  return (
    <div className="mb-6 flex items-center gap-3">
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-(--bg-deep)">
        <motion.div
          className="h-full rounded-full bg-linear-to-r from-(--accent) to-amber-500"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        />
      </div>
      <span className="shrink-0 text-sm font-medium text-(--text-secondary)">
        {current} / {total}
      </span>
    </div>
  );
}
