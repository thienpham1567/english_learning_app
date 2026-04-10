"use client";

import { useState } from "react";
import type { TranslationData } from "@/lib/daily-challenge/types";

type Props = {
  data: TranslationData;
  instruction: string;
  onAnswer: (answer: string) => void;
  disabled: boolean;
};

export function TranslationExercise({ data, instruction, onAnswer, disabled }: Props) {
  const [text, setText] = useState("");

  return (
    <div>
      <p className="mb-2 text-xs font-medium text-(--accent)">{instruction}</p>
      <div className="mb-3 rounded-lg bg-(--bg-deep) px-3 py-2">
        <span className="text-[11px] font-semibold uppercase tracking-widest text-(--text-muted)">
          Tiếng Việt
        </span>
        <p className="mt-1 text-sm text-(--ink)">{data.vietnamese}</p>
      </div>
      <input
        className="w-full rounded-lg border border-(--border) bg-(--surface) px-3 py-2 text-sm text-(--ink) placeholder:text-(--text-muted) focus:border-(--accent) focus:outline-none"
        placeholder="Type your English translation..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={disabled}
        onKeyDown={(e) => {
          if (e.key === "Enter" && text.trim()) onAnswer(text.trim());
        }}
      />
      {text.trim() && !disabled && (
        <button
          className="mt-2 rounded-lg bg-(--accent) px-4 py-1.5 text-sm font-medium text-white"
          onClick={() => onAnswer(text.trim())}
        >
          Xác nhận
        </button>
      )}
    </div>
  );
}
