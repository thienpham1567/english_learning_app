"use client";

import * as m from "motion/react-client";
import { useState } from "react";
import type { FillInBlankData } from "@/lib/daily-challenge/types";

const LABELS = ["A", "B", "C", "D"] as const;

type Props = {
  data: FillInBlankData;
  instruction: string;
  onAnswer: (answer: string) => void;
  disabled: boolean;
};

export function FillInBlank({ data, instruction, onAnswer, disabled }: Props) {
  const [selected, setSelected] = useState<number | null>(null);

  const handleSelect = (i: number) => {
    if (disabled) return;
    setSelected(i);
    onAnswer(data.options[i]);
  };

  return (
    <div>
      {/* Instruction */}
      <p className="mb-4 text-[10px] font-extrabold text-accent uppercase tracking-widest font-display">
        📝 {instruction}
      </p>

      {/* Sentence display */}
      <div className="mb-6 py-4 px-5 rounded-xl border-l-[4px] border-l-accent bg-surface-alt shadow-inner">
        <p className="m-0 text-base text-ink leading-[1.8] font-semibold">
          {data.sentence.split("_____").map((part, i, arr) => (
            <span key={i}>
              {part}
              {i < arr.length - 1 && (
                <span className="inline-block rounded-lg bg-accent py-0.5 px-3.5 font-extrabold text-text-on-accent text-sm mx-1 align-middle shadow-sm">
                  ?
                </span>
              )}
            </span>
          ))}
        </p>
      </div>

      {/* Options grid */}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-3">
        {data.options.map((opt, i) => {
          const isSelected = selected === i;

          return (
            <m.button
              key={i}
              whileHover={!disabled ? { scale: 1.02, y: -2 } : {}}
              whileTap={!disabled ? { scale: 0.97 } : {}}
              onClick={() => handleSelect(i)}
              disabled={disabled}
              className={`flex items-center gap-3 rounded-xl border-2 p-3.5 text-left text-[15px] transition-all duration-150 ${
                isSelected
                  ? "border-accent bg-accent-light font-bold text-accent shadow-sm"
                  : "border-border bg-surface font-semibold text-ink hover:border-accent/40 hover:shadow-sm"
              } ${disabled ? "cursor-default" : "cursor-pointer"}`}
            >
              {/* Label circle */}
              <span
                className={`w-7 h-7 rounded-lg grid place-items-center shrink-0 text-xs font-extrabold border-2 transition-all duration-150 ${
                  isSelected
                    ? "bg-accent border-accent text-text-on-accent"
                    : "bg-bg-deep border-border text-text-secondary"
                }`}
              >
                {LABELS[i]}
              </span>
              <span className="flex-1">{opt}</span>
            </m.button>
          );
        })}
      </div>
    </div>
  );
}
