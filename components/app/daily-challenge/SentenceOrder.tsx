"use client";

import { useState } from "react";
import type { SentenceOrderData } from "@/lib/daily-challenge/types";

type Props = {
  data: SentenceOrderData;
  instruction: string;
  onAnswer: (answer: string) => void;
  disabled: boolean;
};

export function SentenceOrder({ data, instruction, onAnswer, disabled }: Props) {
  const [available, setAvailable] = useState([...data.scrambled]);
  const [selected, setSelected] = useState<string[]>([]);

  const addWord = (word: string, idx: number) => {
    if (disabled) return;
    setSelected((prev) => [...prev, word]);
    setAvailable((prev) => prev.filter((_, i) => i !== idx));
  };

  const removeWord = (idx: number) => {
    if (disabled) return;
    const word = selected[idx];
    setSelected((prev) => prev.filter((_, i) => i !== idx));
    setAvailable((prev) => [...prev, word]);
  };

  const handleSubmit = () => {
    onAnswer(selected.join(" "));
  };

  return (
    <div>
      <p className="mb-2 text-xs font-medium text-(--accent)">{instruction}</p>

      {/* Selected words */}
      <div className="mb-3 flex min-h-[48px] flex-wrap gap-1.5 rounded-lg border border-dashed border-(--border) bg-(--bg-deep) p-2.5">
        {selected.length === 0 && (
          <span className="text-xs text-(--text-muted)">Nhấn vào các từ bên dưới...</span>
        )}
        {selected.map((w, i) => (
          <button
            key={`s-${i}`}
            layout
            className="rounded bg-(--accent)/10 px-2.5 py-1 text-sm font-medium text-(--accent)"
            onClick={() => removeWord(i)}
            disabled={disabled}
          >
            {w}
          </button>
        ))}
      </div>

      {/* Available words */}
      <div className="flex flex-wrap gap-1.5">
        {available.map((w, i) => (
          <button
            key={`a-${i}`}
            layout
            className="rounded-lg border border-(--border) bg-(--surface) px-2.5 py-1 text-sm transition hover:border-(--accent)/40"
            onClick={() => addWord(w, i)}
            disabled={disabled}
          >
            {w}
          </button>
        ))}
      </div>

      {selected.length === data.scrambled.length && !disabled && (
        <button
          className="mt-3 rounded-lg bg-(--accent) px-4 py-1.5 text-sm font-medium text-white"
          onClick={handleSubmit}
        >
          Xác nhận
        </button>
      )}
    </div>
  );
}
