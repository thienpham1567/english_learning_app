"use client";

import { motion } from "motion/react";

const LEVELS = [
  { id: "easy", label: "Dễ", desc: "Ngữ pháp cơ bản", color: "emerald" },
  { id: "medium", label: "Trung bình", desc: "Ngữ pháp nâng cao", color: "amber" },
  { id: "hard", label: "Khó", desc: "Ngữ pháp chuyên sâu", color: "rose" },
] as const;

const COLORS: Record<string, { bg: string; ring: string; text: string }> = {
  emerald: { bg: "bg-emerald-50", ring: "ring-emerald-300", text: "text-emerald-700" },
  amber: { bg: "bg-amber-50", ring: "ring-amber-300", text: "text-amber-700" },
  rose: { bg: "bg-rose-50", ring: "ring-rose-300", text: "text-rose-700" },
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
        TOEIC Part 5
      </h2>
      <p className="mt-2 text-sm text-(--text-muted)">
        Incomplete Sentences — Chọn độ khó để bắt đầu
      </p>

      <div className="mt-6 flex flex-col gap-2.5 w-full">
        {LEVELS.map((lvl, i) => {
          const s = COLORS[lvl.color];
          const isSelected = selected === lvl.id;
          return (
            <motion.button
              key={lvl.id}
              className={`flex items-center gap-3 rounded-xl px-5 py-3.5 text-left ring-1 transition ${
                isSelected
                  ? `${s.bg} ${s.text} ${s.ring} ring-2 shadow-(--shadow-sm)`
                  : `bg-(--surface) text-(--text-secondary) ring-(--border) hover:${s.bg} hover:${s.text}`
              }`}
              onClick={() => onSelect(lvl.id)}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.07 }}
              whileTap={{ scale: 0.97 }}
            >
              <span className="text-lg font-bold">{lvl.label}</span>
              <span className="text-xs opacity-70">{lvl.desc}</span>
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
