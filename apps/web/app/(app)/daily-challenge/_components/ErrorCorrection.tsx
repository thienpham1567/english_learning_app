"use client";

import { AlertTriangle, Check, Pencil } from "lucide-react";
import * as m from "motion/react-client";
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
  const [focused, setFocused] = useState(false);

  return (
    <div>
      {/* Instruction */}
      <p
        className="text-[11px] font-extrabold text-destructive uppercase tracking-widest flex items-center gap-1.5"
        style={{ marginBottom: 14 }}
      >
        <AlertTriangle size={12} /> {instruction}
      </p>

      {/* Error sentence — red quote block */}
      <div
        className="mb-5 rounded-xl py-4 px-5"
        style={{
          borderLeft: "4px solid var(--error)",
          background: "var(--error-bg)",
          boxShadow: "var(--shadow-sm)",
        }}
      >
        <span className="text-[10px] font-extrabold uppercase tracking-widest text-destructive flex items-center gap-1.5 mb-2">
          <AlertTriangle size={12} /> Sentence containing grammatical error
        </span>
        <p className="m-0 text-base text-destructive font-semibold" style={{ lineHeight: 1.7 }}>
          {data.sentence}
        </p>
      </div>

      {/* Correction input */}
      <label
        htmlFor="error-correction-input"
        className="block text-[11px] font-extrabold uppercase tracking-widest text-text-muted mb-2 flex items-center gap-1.5"
      >
        <Pencil size={12} /> Correct Replacement Word
      </label>
      <input
        id="error-correction-input"
        placeholder="Type the correct word to fix the error..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={disabled}
        onKeyDown={(e) => {
          if (e.key === "Enter" && text.trim()) onAnswer(text.trim());
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className="w-full rounded-lg bg-surface py-3 px-4 text-text-primary font-medium"
        style={{
          border: focused ? "2px solid var(--error)" : "1.5px solid var(--border)",
          fontSize: 14.5,
          outline: "none",
          transition: "all 0.2s ease",
          boxSizing: "border-box",
          boxShadow: focused
            ? "0 4px 12px color-mix(in srgb, var(--error) 15%, transparent)"
            : "none",
        }}
      />

      {/* Full-width confirm */}
      {text.trim() && !disabled && (
        <m.button
          whileHover={{ scale: 1.02, y: -1 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onAnswer(text.trim())}
          className="mt-4 w-full rounded-lg text-[15px] font-extrabold border-none cursor-pointer flex items-center justify-center gap-1.5"
          style={{
            background:
              "linear-gradient(135deg, var(--error), color-mix(in srgb, var(--error) 80%, white))",
            padding: "14px 0",
            color: "var(--text-on-accent)",
            boxShadow: "0 6px 18px color-mix(in srgb, var(--error) 25%, transparent)",
          }}
        >
          <Check size={12} /> Confirm Correction
        </m.button>
      )}
    </div>
  );
}
