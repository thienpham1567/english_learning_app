"use client";

import { Check, ClipboardList, Loader2, Pencil, Star, Target, Volume2 } from "lucide-react";
import { motion } from "motion/react";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import type { CefrLevel, ExerciseType } from "@/lib/listening/types";
import { CEFR_LEVELS, EXERCISE_TYPES } from "@/lib/listening/types";

const LEVEL_META: Record<
  CefrLevel,
  { label: string; twBg: string; twText: string; desc: string }
> = {
  A1: {
    label: "Beginner",
    twBg: "bg-success",
    twText: "text-success-foreground",
    desc: "Short sentences, basic words",
  },
  A2: {
    label: "Elementary",
    twBg: "bg-success",
    twText: "text-success-foreground",
    desc: "Simple conversations",
  },
  B1: {
    label: "Intermediate",
    twBg: "bg-primary",
    twText: "text-primary-foreground",
    desc: "Familiar topics",
  },
  B2: {
    label: "Upper-Int",
    twBg: "bg-secondary",
    twText: "text-secondary-foreground",
    desc: "Detailed discussions",
  },
  C1: {
    label: "Advanced",
    twBg: "bg-tertiary",
    twText: "text-white",
    desc: "In-depth analysis",
  },
  C2: {
    label: "Proficiency",
    twBg: "bg-error",
    twText: "text-error-foreground",
    desc: "Complex language",
  },
};

const LEVEL_ACCENT: Record<CefrLevel, string> = {
  A1: "text-[var(--success)]",
  A2: "text-[var(--success)]",
  B1: "text-accent",
  B2: "text-[var(--secondary)]",
  C1: "text-[var(--tertiary)]",
  C2: "text-[var(--error)]",
};

const TYPE_META: Record<ExerciseType, { label: string; icon: React.ReactNode; desc: string }> = {
  comprehension: {
    label: "Comprehension",
    icon: <Target size={18} />,
    desc: "Answer multiple choice questions",
  },
  dictation: {
    label: "Dictation",
    icon: <ClipboardList size={18} />,
    desc: "Transcribe the audio text",
  },
  fill_blanks: {
    label: "Fill in Blanks",
    icon: <Pencil size={18} />,
    desc: "Fill in missing words in blanks",
  },
};

type Props = {
  onStart: (level: CefrLevel, exerciseType: ExerciseType) => void;
  isLoading: boolean;
  recommendedLevel?: CefrLevel | null;
};

export function LevelSelector({ onStart, isLoading, recommendedLevel }: Props) {
  const [level, setLevel] = useState<CefrLevel | null>(null);
  const [exerciseType, setExerciseType] = useState<ExerciseType>("comprehension");
  const activeLevel = level ?? recommendedLevel ?? null;

  return (
    <div className="flex flex-col gap-7 w-full max-w-2xl mx-auto py-6 px-5">
      {/* CEFR Level Grid */}
      <div>
        <div className="text-[11px] font-bold text-text-muted mb-3 uppercase tracking-widest">
          CEFR Level
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
          {CEFR_LEVELS.map((l, i) => {
            const meta = LEVEL_META[l];
            const isSelected = activeLevel === l;

            return (
              <motion.button
                key={l}
                onClick={() => setLevel(l)}
                whileHover={{ y: -3, scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04, type: "spring", stiffness: 400, damping: 25 }}
                className={`relative cursor-pointer text-center rounded-lg border border-border py-3.5 px-2.5 transition-all duration-100 ${
                  isSelected
                    ? `${meta.twBg} ${meta.twText} shadow-sm -translate-y-0.5`
                    : "bg-surface text-text-secondary hover:bg-surface-hover"
                }`}
              >
                {/* Recommended badge */}
                {recommendedLevel === l && (
                  <motion.span
                    initial={{ scale: 0.9 }}
                    animate={{ scale: [0.9, 1.05, 0.9] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="absolute -top-2 -right-2 rounded-lg text-[9px] font-extrabold flex items-center gap-0.5 bg-primary text-primary-foreground py-0.5 px-1.5 border border-border shadow-sm z-10"
                  >
                    <Star size={9} className="fill-current" />
                    <span>Rec</span>
                  </motion.span>
                )}
                <div
                  className={`text-xl font-bold font-mono leading-none ${
                    isSelected ? "" : LEVEL_ACCENT[l]
                  }`}
                >
                  {l}
                </div>
                <div
                  className={`text-[10px] font-bold mt-1 ${
                    isSelected ? "opacity-90" : "text-text-secondary"
                  }`}
                >
                  {meta.label}
                </div>
                <div
                  className={`text-[9px] mt-0.5 leading-tight ${
                    isSelected ? "opacity-75" : "text-text-muted"
                  }`}
                >
                  {meta.desc}
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Exercise Type */}
      <div>
        <div className="text-[11px] font-bold text-text-muted mb-3 uppercase tracking-widest">
          Exercise Type
        </div>
        <div className="flex flex-col gap-2">
          {EXERCISE_TYPES.map((t, i) => {
            const meta = TYPE_META[t];
            const isSelected = exerciseType === t;

            return (
              <motion.button
                key={t}
                onClick={() => setExerciseType(t)}
                whileHover={{ x: 3 }}
                whileTap={{ scale: 0.99 }}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05, type: "spring", stiffness: 350, damping: 25 }}
                className={`flex items-center gap-3.5 rounded-lg border border-border cursor-pointer text-left py-3 px-4 transition-all duration-100 ${
                  isSelected
                    ? "bg-accent-light border-l-4 border-l-accent shadow-sm -translate-y-0.5"
                    : "bg-surface hover:bg-surface-hover"
                }`}
              >
                <span
                  className={`grid w-[42px] h-[42px] shrink-0 rounded-lg place-items-center transition-all duration-150 ${
                    isSelected ? "bg-primary text-primary-foreground shadow-sm" : "bg-bg-deep text-text-muted"
                  }`}
                >
                  {meta.icon}
                </span>
                <div className="flex-1">
                  <div
                    className={`text-sm ${
                      isSelected ? "font-bold text-ink" : "font-bold text-text-primary"
                    }`}
                  >
                    {meta.label}
                  </div>
                  <div
                    className={`text-xs mt-0.5 ${
                      isSelected ? "text-text-secondary font-medium" : "text-text-muted"
                    }`}
                  >
                    {meta.desc}
                  </div>
                </div>
                {isSelected && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 500, damping: 20 }}
                    className="w-[22px] h-[22px] rounded-lg grid shrink-0 bg-accent place-items-center"
                  >
                    <Check size={11} className="text-ink" />
                  </motion.span>
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Start Button */}
      <Button
        onClick={() => activeLevel && onStart(activeLevel, exerciseType)}
        disabled={!activeLevel || isLoading}
        className="w-full h-13 text-base font-bold flex items-center justify-center gap-2.5"
      >
        {isLoading ? <Loader2 className="animate-spin" /> : <Volume2 size={18} />}
        {isLoading ? "Generating listening exercise..." : "Start Listening Practice"}
      </Button>
    </div>
  );
}
