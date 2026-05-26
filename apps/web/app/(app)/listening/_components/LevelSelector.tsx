"use client";

import { Check, ClipboardList, Loader2, Pencil, Star, Target, Volume2 } from "lucide-react";
import { motion } from "motion/react";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import type { CefrLevel, ExerciseType } from "@/lib/listening/types";
import { CEFR_LEVELS, EXERCISE_TYPES } from "@/lib/listening/types";

const LEVEL_META: Record<
  CefrLevel,
  { label: string; color: string; desc: string; darkText?: boolean }
> = {
  A1: { label: "Beginner", color: "var(--success)", desc: "Câu ngắn, từ cơ bản", darkText: true },
  A2: { label: "Elementary", color: "var(--success)", desc: "Hội thoại đơn giản", darkText: true },
  B1: { label: "Intermediate", color: "var(--accent)", desc: "Chủ đề quen thuộc", darkText: true },
  B2: {
    label: "Upper-Int",
    color: "var(--secondary)",
    desc: "Thảo luận chi tiết",
    darkText: false,
  },
  C1: {
    label: "Advanced",
    color: "var(--tertiary, var(--secondary))",
    desc: "Phân tích sâu",
    darkText: false,
  },
  C2: { label: "Proficiency", color: "var(--error)", desc: "Ngôn ngữ phức tạp", darkText: false },
};

const TYPE_META: Record<ExerciseType, { label: string; icon: React.ReactNode; desc: string }> = {
  comprehension: { label: "Nghe hiểu", icon: <Target />, desc: "Trả lời câu hỏi trắc nghiệm" },
  dictation: { label: "Nghe chép", icon: <ClipboardList />, desc: "Viết lại nội dung nghe được" },
  fill_blanks: { label: "Điền từ", icon: <Pencil />, desc: "Điền từ còn thiếu vào chỗ trống" },
};

type Props = {
  onStart: (level: CefrLevel, exerciseType: ExerciseType) => void;
  isLoading: boolean;
  recommendedLevel?: CefrLevel | null;
};

export function LevelSelector({ onStart, isLoading, recommendedLevel }: Props) {
  const [level, setLevel] = useState<CefrLevel | null>(null);
  const [exerciseType, setExerciseType] = useState<ExerciseType>("comprehension");
  const [hoveredLevel, setHoveredLevel] = useState<CefrLevel | null>(null);
  const [hoveredType, setHoveredType] = useState<ExerciseType | null>(null);
  const activeLevel = level ?? recommendedLevel ?? null;

  return (
    <div
      className="flex flex-col w-[600px] mx-auto w-full"
      style={{ gap: 28, padding: "24px 20px" }}
    >
      {/* CEFR Level Grid */}
      <div>
        <div
          className="text-[11px] font-bold text-text-muted mb-3 uppercase"
          style={{ letterSpacing: "0.12em" }}
        >
          Cấp độ CEFR
        </div>
        <div
          className="grid gap-2.5"
          style={{ gridTemplateColumns: "repeat(auto-fit, minmax(90px, 1fr))" }}
        >
          {CEFR_LEVELS.map((l) => {
            const meta = LEVEL_META[l];
            const isSelected = activeLevel === l;
            const isHov = hoveredLevel === l && !isSelected;

            return (
              <button
                key={l}
                onClick={() => setLevel(l)}
                onMouseEnter={() => setHoveredLevel(l)}
                onMouseLeave={() => setHoveredLevel(null)}
                className={`relative cursor-pointer text-center rounded-xl border-2 transition-all duration-100 ${
                  isSelected
                    ? "shadow-(--shadow-sm) -translate-y-0.5"
                    : "border-border bg-surface text-text-secondary hover:bg-surface-hover"
                }`}
                style={{
                  padding: "14px 10px",
                  background: isSelected ? meta.color : undefined,
                  borderColor: "var(--border)",
                  color: isSelected ? (meta.darkText ? "var(--black)" : "var(--white)") : undefined,
                }}
              >
                {/* Recommended badge */}
                {recommendedLevel === l && (
                  <motion.span
                    initial={{ scale: 0.9 }}
                    animate={{ scale: [0.9, 1.05, 0.9] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="absolute rounded-full text-[9px] font-extrabold flex items-center gap-1"
                    style={{
                      top: -8,
                      right: -8,
                      background: "var(--xp)",
                      color: "var(--text-on-accent)",
                      padding: "2px 7px",
                      boxShadow: "var(--shadow-sm)",
                    }}
                  >
                    <Star className="h-2.5 w-2.5 fill-current text-[var(--text-on-accent)] shrink-0" />
                    <span>Đề xuất</span>
                  </motion.span>
                )}
                <div
                  className="text-xl font-black font-mono leading-none"
                  style={{ color: isSelected ? "currentColor" : meta.color }}
                >
                  {l}
                </div>
                <div
                  className="text-[10px] font-bold mt-1"
                  style={{
                    color: isSelected ? "currentColor" : "var(--text-secondary)",
                    opacity: isSelected ? 0.9 : 1,
                  }}
                >
                  {meta.label}
                </div>
                <div
                  className="text-[9px]"
                  style={{
                    color: isSelected ? "currentColor" : "var(--text-muted)",
                    opacity: isSelected ? 0.75 : 1,
                    marginTop: 3,
                    lineHeight: 1.3,
                  }}
                >
                  {meta.desc}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Exercise Type */}
      <div>
        <div
          className="text-[11px] font-bold text-text-muted mb-3 uppercase"
          style={{ letterSpacing: "0.12em" }}
        >
          Loại bài tập
        </div>
        <div className="flex flex-col gap-2">
          {EXERCISE_TYPES.map((t) => {
            const meta = TYPE_META[t];
            const isSelected = exerciseType === t;
            const isHov = hoveredType === t && !isSelected;

            return (
              <button
                key={t}
                onClick={() => setExerciseType(t)}
                onMouseEnter={() => setHoveredType(t)}
                onMouseLeave={() => setHoveredType(null)}
                className="flex items-center gap-3.5 rounded-xl border-2 border-border cursor-pointer text-left"
                style={{
                  padding: "13px 18px",
                  borderLeft: isSelected
                    ? "4px solid var(--accent)"
                    : isHov
                      ? "4px solid var(--border)"
                      : "4px solid transparent",
                  background: isSelected
                    ? "color-mix(in srgb, var(--accent) 8%, var(--surface))"
                    : isHov
                      ? "var(--bg-deep, rgba(0,0,0,0.03))"
                      : "var(--surface)",
                  transition: "all 0.18s ease",
                }}
              >
                <span
                  className="grid w-[42px] h-[42px] text-xl shrink-0"
                  style={{
                    placeItems: "center",
                    borderRadius: 10,
                    background: isSelected
                      ? "linear-gradient(135deg, var(--accent), var(--accent-hover))"
                      : "var(--bg-deep, rgba(0,0,0,0.05))",
                    transition: "background 0.18s",
                    boxShadow: isSelected ? "var(--shadow-md)" : "none",
                  }}
                >
                  {meta.icon}
                </span>
                <div className="flex-1">
                  <div
                    className="text-sm font-bold"
                    style={{ color: isSelected ? "var(--accent)" : "var(--text)" }}
                  >
                    {meta.label}
                  </div>
                  <div className="text-xs text-text-muted" style={{ marginTop: 1 }}>
                    {meta.desc}
                  </div>
                </div>
                {isSelected && (
                  <span
                    className="w-[22px] h-[22px] rounded-full grid shrink-0"
                    style={{ background: "var(--accent)", placeItems: "center" }}
                  >
                    <Check size={11} className="text-(--text-on-accent)" />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Start Button */}
      <Button
        onClick={() => activeLevel && onStart(activeLevel, exerciseType)}
        disabled={!activeLevel || isLoading}
        className="w-full h-13 text-base font-black flex items-center justify-center gap-2.5"
      >
        {isLoading ? <Loader2 className="animate-spin" /> : <Volume2 />}
        {isLoading ? "Đang tạo bài nghe..." : "Bắt đầu luyện nghe"}
      </Button>
    </div>
  );
}
