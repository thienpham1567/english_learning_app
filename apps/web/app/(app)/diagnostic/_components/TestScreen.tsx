"use client";

import { Check } from "lucide-react";
import * as m from "motion/react-client";
import { useCallback, useEffect } from "react";
import { CEFR_COLORS } from "@/lib/constants/cefr";
import type { Question } from "./types";

const LABELS = ["A", "B", "C", "D"] as const;

const SKILL_LABELS: Record<string, string> = {
  grammar: "Grammar",
  vocabulary: "Vocabulary",
  reading: "Reading",
  listening: "Listening",
};

type Props = {
  question: Question;
  currentIndex: number;
  total: number;
  selectedOption: number | null;
  onSelectOption: (index: number) => void;
  onSubmit: () => void;
  onSkip: () => void;
};

export function TestScreen({
  question,
  currentIndex,
  total,
  selectedOption,
  onSelectOption,
  onSubmit,
  onSkip,
}: Props) {
  const progressPct = (currentIndex / total) * 100;

  // Keyboard navigation: A/B/C/D to select, Enter to submit
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const key = e.key.toUpperCase();
      if (key >= "A" && key <= "D") {
        const idx = key.charCodeAt(0) - 65;
        if (idx < question.options.length) {
          onSelectOption(idx);
        }
      } else if (key === "ENTER" && selectedOption !== null) {
        e.preventDefault();
        onSubmit();
      }
    },
    [question.options.length, selectedOption, onSelectOption, onSubmit],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const levelColor = CEFR_COLORS[question.level] ?? "var(--accent)";

  return (
    <div className="h-full overflow-y-auto py-6 px-5 pb-12 bg-bg-deep">
      <div className="w-full max-w-[600px] mx-auto flex flex-col gap-5">
        {/* Progress & Metadata Header */}
        <div className="flex flex-col gap-2.5">
          <div className="flex justify-between items-center">
            <span className="text-[13px] font-bold text-text-secondary">
              Question {currentIndex + 1} / {total}
            </span>
            <div className="flex gap-1.5 items-center">
              <span
                className="text-[10px] font-extrabold bg-surface rounded-full py-0.5 px-2"
                style={{
                  color: levelColor,
                  border: `1px solid ${levelColor}`,
                }}
              >
                {question.level}
              </span>
              <span className="text-[11px] font-bold text-text-muted bg-surface-alt py-0.5 px-2 rounded-md">
                {SKILL_LABELS[question.skill] ?? question.skill}
              </span>
            </div>
          </div>

          {/* Animated Custom Progress Bar */}
          <div className="h-1.5 bg-border rounded-full relative overflow-hidden">
            <m.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPct}%` }}
              transition={{ type: "spring", stiffness: 80, damping: 15 }}
              className="absolute left-0 top-0 bottom-0 rounded-full shadow-[0_0_8px_var(--accent)]"
              style={{
                background: "linear-gradient(90deg, var(--accent), var(--xp))",
              }}
            />
          </div>
        </div>

        {/* Question excerpt */}
        <div className="rounded-xl bg-surface p-6 shadow-sm border border-border border-l-4 border-l-accent">
          <p className="m-0 text-[16.5px] font-semibold leading-[1.8] text-text-primary break-words">
            {question.question}
          </p>
        </div>

        {/* Options Stack */}
        <div className="flex flex-col gap-2.5">
          {question.options.map((opt, i) => {
            const isSelected = selectedOption === i;
            return (
              <m.button
                key={i}
                whileHover={{ scale: 1.01, x: 2 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => onSelectOption(i)}
                className={`flex items-center gap-3 py-3.5 px-4.5 rounded-lg cursor-pointer text-left text-[14.5px] transition-all duration-200 ${
                  isSelected
                    ? "border-2 border-accent bg-accent-light font-extrabold text-ink shadow-[0_4px_12px_var(--accent-muted)]"
                    : "border border-border bg-surface font-semibold text-text-primary shadow-sm"
                }`}
              >
                {/* Circle label */}
                <span
                  className={`w-[26px] h-[26px] rounded-full grid place-items-center shrink-0 text-[11px] font-extrabold transition-all duration-150 ${
                    isSelected
                      ? "bg-accent text-[var(--text-on-accent)]"
                      : "bg-border text-text-secondary"
                  }`}
                >
                  {LABELS[i]}
                </span>
                <span className="flex-1">{opt}</span>
              </m.button>
            );
          })}
        </div>

        {/* Keyboard hint */}
        <div className="flex justify-center items-center gap-1.5 opacity-60 text-[11px] font-medium text-text-muted mt-1">
          <span>Shortcuts:</span>
          {["A", "B", "C", "D"].map((k) => (
            <kbd key={k} className="bg-border py-0.5 px-1.5 rounded font-mono text-[10px]">
              {k}
            </kbd>
          ))}
          <span>to select ·</span>
          <kbd className="bg-border py-0.5 px-1.5 rounded font-mono text-[10px]">Enter</kbd>
          <span>to confirm</span>
        </div>

        {/* Actions Button Row */}
        <div className="flex gap-3 mt-2.5">
          <m.button
            whileHover={selectedOption !== null ? { scale: 1.02, y: -1 } : {}}
            whileTap={selectedOption !== null ? { scale: 0.98 } : {}}
            disabled={selectedOption === null}
            onClick={onSubmit}
            className={`flex-1 h-12 rounded-lg border-none text-[15px] font-extrabold transition-all duration-200 ${
              selectedOption === null
                ? "bg-border text-text-muted cursor-default"
                : "text-[var(--text-on-accent)] cursor-pointer shadow-[0_4px_14px_var(--accent-muted)]"
            }`}
            style={{
              background:
                selectedOption !== null
                  ? "linear-gradient(135deg, var(--accent), var(--accent-hover))"
                  : undefined,
            }}
          >
            {currentIndex < total - 1 ? (
              "Next Question →"
            ) : (
              <span className="inline-flex items-center gap-1.5 justify-center">
                Complete Test <Check size={16} />
              </span>
            )}
          </m.button>

          <m.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            type="button"
            onClick={onSkip}
            className="bg-surface-alt border border-border cursor-pointer text-[13px] font-bold text-text-secondary px-5 h-12 rounded-lg shadow-sm transition-all duration-200 hover:bg-surface-hover"
          >
            Skip
          </m.button>
        </div>
      </div>
    </div>
  );
}
