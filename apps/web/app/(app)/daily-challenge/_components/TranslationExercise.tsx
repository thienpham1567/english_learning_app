"use client";

import { Check, Languages } from "lucide-react";
import * as m from "motion/react-client";
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
  const [focused, setFocused] = useState(false);

  return (
    <div>
      {/* Instruction */}
      <p
        className="text-[11px] font-extrabold text-accent uppercase tracking-widest flex items-center gap-1.5"
        style={{ marginBottom: 14 }}
      >
        <Languages size={12} /> {instruction}
      </p>

      {/* Vietnamese source — quote block style */}
      <div
        className="mb-5 rounded-xl bg-surface-alt py-4 px-5"
        style={{ borderLeft: "4px solid var(--accent)", boxShadow: "var(--shadow-sm)" }}
      >
        <span className="text-[10px] font-extrabold uppercase tracking-widest text-accent flex items-center gap-1.5 mb-2">
          <Languages size={11} /> Vietnamese Source Text
        </span>
        <p className="m-0 text-base text-text-primary font-semibold" style={{ lineHeight: 1.7 }}>
          {data.vietnamese}
        </p>
      </div>

      {/* English input */}
      <label
        htmlFor="translation-input"
        className="block text-[11px] font-extrabold uppercase tracking-widest text-text-muted mb-2 flex items-center gap-1.5"
      >
        <Languages size={11} /> Your English Translation
      </label>
      <textarea
        id="translation-input"
        rows={3}
        placeholder="Type your English translation here..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={disabled}
        onKeyDown={(e) => {
          if (e.key === "Enter" && e.ctrlKey && text.trim()) onAnswer(text.trim());
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className="w-full rounded-lg bg-surface py-3 px-4 text-text-primary font-medium"
        style={{
          border: focused ? "2px solid var(--accent)" : "1.5px solid var(--border)",
          fontSize: 14.5,
          outline: "none",
          resize: "none",
          transition: "all 0.2s ease",
          lineHeight: 1.7,
          fontFamily: "var(--font-body, inherit)",
          boxSizing: "border-box",
          boxShadow: focused ? "0 4px 12px var(--accent-muted)" : "none",
        }}
      />
      {text.trim().length > 0 && (
        <div className="text-[11px] text-text-muted text-right mt-1.5 mb-3 font-medium">
          Press{" "}
          <kbd
            className="rounded font-mono text-[10px]"
            style={{ background: "var(--border)", padding: "2px 6px" }}
          >
            Ctrl + Enter
          </kbd>{" "}
          to quickly confirm
        </div>
      )}

      {/* Full-width confirm */}
      {text.trim() && !disabled && (
        <m.button
          whileHover={{ scale: 1.02, y: -1 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onAnswer(text.trim())}
          className="w-full rounded-lg text-[15px] font-extrabold border-none cursor-pointer mt-2.5 flex items-center justify-center gap-1.5"
          style={{
            background: "linear-gradient(135deg, var(--accent), var(--accent-hover))",
            padding: "14px 0",
            color: "var(--text-on-accent)",
            boxShadow: "0 6px 18px var(--accent-muted)",
          }}
        >
          <Check size={12} /> Confirm Answer
        </m.button>
      )}
    </div>
  );
}
