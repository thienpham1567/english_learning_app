"use client";

import { motion } from "motion/react";

const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"] as const;

const LEVEL_STYLES: Record<string, { bg: string; ring: string; text: string }> = {
  A1: { bg: "bg-emerald-50", ring: "ring-emerald-300", text: "text-emerald-700" },
  A2: { bg: "bg-teal-50", ring: "ring-teal-300", text: "text-teal-700" },
  B1: { bg: "bg-sky-50", ring: "ring-sky-300", text: "text-sky-700" },
  B2: { bg: "bg-amber-50", ring: "ring-amber-300", text: "text-amber-700" },
  C1: { bg: "bg-orange-50", ring: "ring-orange-300", text: "text-orange-700" },
  C2: { bg: "bg-rose-50", ring: "ring-rose-300", text: "text-rose-700" },
};

type Props = {
  selected: string;
  onSelect: (level: string) => void;
  onStart: () => void;
  isLoading: boolean;
};

export function LevelPicker({ selected, onSelect, onStart, isLoading }: Props) {
  return (
    <motion.div
      className="mx-auto flex max-w-md flex-col items-center"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <h2 className="[font-family:var(--font-display)] text-2xl italic text-(--ink)">
        Chọn trình độ
      </h2>
      <p className="mt-2 text-sm text-(--text-muted)">
        Chọn cấp độ CEFR để bắt đầu luyện ngữ pháp
      </p>

      <div className="mt-6 flex flex-wrap justify-center gap-2.5">
        {LEVELS.map((lvl, i) => {
          const s = LEVEL_STYLES[lvl];
          const isSelected = selected === lvl;
          return (
            <motion.button
              key={lvl}
              className={`rounded-lg px-5 py-2.5 text-sm font-semibold ring-1 transition ${
                isSelected
                  ? `${s.bg} ${s.text} ${s.ring} ring-2 shadow-(--shadow-sm)`
                  : `bg-(--surface) text-(--text-secondary) ring-(--border) hover:${s.bg} hover:${s.text}`
              }`}
              onClick={() => onSelect(lvl)}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {lvl}
            </motion.button>
          );
        })}
      </div>

      <motion.button
        className="mt-8 rounded-xl bg-linear-to-br from-(--accent) to-amber-600 px-8 py-3 text-sm font-semibold text-white shadow-(--shadow-md) transition-transform enabled:hover:-translate-y-0.5 disabled:opacity-50"
        onClick={onStart}
        disabled={isLoading}
        whileTap={{ scale: 0.97 }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        {isLoading ? "Đang tạo đề..." : "🚀 Bắt đầu"}
      </motion.button>
    </motion.div>
  );
}
