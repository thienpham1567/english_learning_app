"use client";

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
      <p className="mb-2 text-xs font-medium text-(--accent)">{instruction}</p>
      <p className="mb-4 text-base text-(--ink)">
        {data.sentence.split("_____").map((part, i, arr) => (
          <span key={i}>
            {part}
            {i < arr.length - 1 && (
              <span className="inline-block rounded bg-(--accent)/10 px-2 py-0.5 font-semibold text-(--accent)">
                _____
              </span>
            )}
          </span>
        ))}
      </p>
      <div className="grid grid-cols-2 gap-2">
        {data.options.map((opt, i) => (
          <button
            key={i}
            className={`rounded-lg border px-3 py-2 text-left text-sm transition ${
              selected === i
                ? "border-(--accent) bg-(--accent)/10 font-medium"
                : "border-(--border) bg-(--surface) hover:border-(--accent)/40"
            }`}
            onClick={() => handleSelect(i)}
            disabled={disabled}
          >
            <span className="mr-2 text-xs font-bold text-(--text-muted)">{LABELS[i]}</span>
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}
