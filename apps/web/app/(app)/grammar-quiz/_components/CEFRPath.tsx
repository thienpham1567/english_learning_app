"use client";

import { BookOpen, Check, Clock, Loader2, Rocket, Zap } from "lucide-react";
import * as m from "motion/react-client";
import { Card } from "@/components/ui/card";

const CEFR_LEVELS = [
  { id: "A1", tier: "easy", label: "A1", desc: "Basic" },
  { id: "A2", tier: "easy", label: "A2", desc: "Elementary" },
  { id: "B1", tier: "medium", label: "B1", desc: "Intermediate" },
  { id: "B2", tier: "medium", label: "B2", desc: "Upper-Int" },
  { id: "C1", tier: "hard", label: "C1", desc: "Advanced" },
  { id: "C2", tier: "hard", label: "C2", desc: "Proficient" },
] as const;

const TIER_COLORS: Record<string, string> = {
  easy: "var(--success)",
  medium: "var(--accent)",
  hard: "var(--error)",
};

const TIER_GLOWS: Record<string, string> = {
  easy: "color-mix(in srgb, var(--success) 20%, transparent)",
  medium: "color-mix(in srgb, var(--accent) 20%, transparent)",
  hard: "color-mix(in srgb, var(--error) 20%, transparent)",
};

type Props = {
  selected: string;
  onSelect: (level: string) => void;
  onStart: () => void;
  isLoading: boolean;
  timedMode?: boolean;
  onTimedModeChange?: (val: boolean) => void;
  sourceMode?: "ai" | "ets";
  onSourceModeChange?: (val: "ai" | "ets") => void;
};

export function CEFRPath({
  selected,
  onSelect,
  onStart,
  isLoading,
  timedMode,
  onTimedModeChange,
  sourceMode = "ai",
  onSourceModeChange,
}: Props) {
  const isEts = sourceMode === "ets";
  return (
    <Card
      shadowSize="sm"
      className="anim-fade-up w-full max-w-[480px] mx-auto text-center relative overflow-hidden py-8 px-6"
    >
      <div
        className="absolute w-[180px] h-[180px] left-1/2 top-0 -translate-x-1/2 pointer-events-none"
        style={{
          background: "radial-gradient(circle, var(--accent) 5%, transparent 70%)",
        }}
      />

      <h3 className="text-xl font-black font-display text-text-primary m-0">TOEIC Part 5 Quiz</h3>
      <p className="mt-1 text-[13px] text-text-secondary font-medium">
        Practice Part 5 multiple choice questions designed to match real exam standards
      </p>

      {/* Source mode toggle */}
      {onSourceModeChange && (
        <div className="mt-5 mb-1 relative z-[1]">
          <div className="inline-flex gap-1 p-1 bg-surface-alt border-2 border-border rounded-xl">
            {[
              { value: "ai" as const, label: "AI Mode", icon: <Zap size={13} /> },
              { value: "ets" as const, label: "ETS Exam", icon: <BookOpen size={13} /> },
            ].map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => onSourceModeChange(opt.value)}
                className={`flex items-center justify-center gap-1.5 font-bold rounded-lg border-2 py-1 px-3 text-xs cursor-pointer transition-all duration-150 ${
                  sourceMode === opt.value
                    ? "border-accent bg-accent-light text-ink font-extrabold"
                    : "border-border bg-surface-alt text-text-secondary hover:text-ink"
                }`}
              >
                {opt.icon} <span>{opt.label}</span>
              </button>
            ))}
          </div>
          {isEts && (
            <p className="mt-2 text-text-muted font-semibold text-[11.5px]">
              240 questions extracted from real ETS exams · Shuffled randomly
            </p>
          )}
        </div>
      )}

      {/* CEFR Path */}
      <div
        className="mt-6 transition-opacity duration-200"
        style={{
          opacity: isEts ? 0.35 : 1,
          pointerEvents: isEts ? "none" : "auto",
        }}
      >
        <div className="flex items-start justify-center py-1 pb-3">
          {CEFR_LEVELS.map((level, i) => {
            const isSelected = selected === level.tier;
            const tierColor = TIER_COLORS[level.tier];
            const isLast = i === CEFR_LEVELS.length - 1;

            return (
              <div key={level.id} className="flex items-center">
                {/* Node wrapper */}
                <m.button
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.92 }}
                  type="button"
                  onClick={() => onSelect(level.tier)}
                  className="flex flex-col items-center gap-1.5 bg-none border-none cursor-pointer p-0"
                >
                  <div
                    className="w-8 h-8 rounded-full grid place-items-center transition-all duration-200"
                    style={{
                      border: `2px solid ${isSelected ? tierColor : "var(--border)"}`,
                      background: isSelected ? tierColor : "var(--surface-alt)",
                      boxShadow: isSelected ? `2px 2px 0 ${TIER_GLOWS[level.tier]}` : "none",
                    }}
                  >
                    {isSelected ? (
                      <Check className="text-xs font-black text-[var(--text-on-accent)]" />
                    ) : (
                      <span className="text-[10px] font-extrabold text-text-muted">
                        {level.label}
                      </span>
                    )}
                  </div>
                  <span
                    className="text-[10.5px] font-extrabold transition-colors duration-200"
                    style={{ color: isSelected ? tierColor : "var(--text-muted)" }}
                  >
                    {level.desc}
                  </span>
                </m.button>

                {/* Line */}
                {!isLast && (
                  <div
                    className="w-6 h-0.5 rounded-full self-start mt-[15px]"
                    style={{
                      background:
                        isSelected && CEFR_LEVELS[i + 1]?.tier === level.tier
                          ? tierColor
                          : "var(--border)",
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>

        <p
          className="mt-2 font-extrabold text-[12.5px]"
          style={{ color: TIER_COLORS[selected] ?? "var(--text-secondary)" }}
        >
          {selected === "easy" && "Difficulty: Basic Grammar (A1–A2)"}
          {selected === "medium" && "Difficulty: Intermediate Grammar (B1–B2)"}
          {selected === "hard" && "Difficulty: Advanced Grammar (C1–C2)"}
        </p>
      </div>

      {/* Timer toggle */}
      {onTimedModeChange && (
        <div className="mt-5 flex items-center justify-center gap-2.5 pt-4 border-t-2 border-dashed border-border">
          <Clock
            className="text-sm"
            style={{ color: timedMode ? "var(--accent)" : "var(--text-muted)" }}
          />
          <span className="text-[13px] text-text-secondary font-bold">Timed mode</span>
          <button
            type="button"
            onClick={() => onTimedModeChange(!timedMode)}
            className={`relative w-9 h-5 rounded-full cursor-pointer border-none transition-colors duration-200 ${
              timedMode ? "bg-accent" : "bg-border"
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                timedMode ? "translate-x-4" : ""
              }`}
            />
          </button>
          {timedMode && (
            <span className="text-text-muted font-semibold text-[11.5px]">(30s / question)</span>
          )}
        </div>
      )}

      {/* Start Button */}
      <m.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onStart}
        disabled={isLoading}
        className="mt-6 h-11 w-full rounded-lg border-2 border-border font-extrabold cursor-pointer flex items-center justify-center gap-1.5 text-[14.5px] text-[var(--text-on-accent)] shadow-sm"
        style={{
          background: "var(--accent)",
        }}
      >
        {isLoading ? (
          <>
            <Loader2 className="animate-spin" /> Generating quiz...
          </>
        ) : (
          <>
            <Rocket /> Start Practice
          </>
        )}
      </m.button>
    </Card>
  );
}
