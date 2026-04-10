"use client";

import { useState } from "react";
import type { ErrorCorrectionData } from "@/lib/daily-challenge/types";

type Props = {
  data: ErrorCorrectionData;
  instruction: string;
  onAnswer: (answer: string) => void;
  disabled: boolean;
};

export function ErrorCorrection({ data, instruction, onAnswer, disabled }: Props) {
  const [text, setText] = useState("");

  return (
    <div>
      <p className="mb-2 text-xs font-medium text-(--accent)">{instruction}</p>
      <div className="mb-3 rounded-lg border border-red-200 bg-red-50/50 px-3 py-2">
        <p className="text-sm text-red-900">{data.sentence}</p>
      </div>
      <label className="text-xs text-(--text-muted)">Viết từ đúng thay thế từ sai:</label>
      <input
        className="mt-1 w-full rounded-lg border border-(--border) bg-(--surface) px-3 py-2 text-sm text-(--ink) placeholder:text-(--text-muted) focus:border-(--accent) focus:outline-none"
        placeholder="Nhập từ đúng..."
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
