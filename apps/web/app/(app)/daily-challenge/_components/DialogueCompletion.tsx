"use client";

import { MessageSquare } from "lucide-react";
import * as m from "motion/react-client";
import { useState } from "react";
import type { DialogueCompletionData } from "@/lib/daily-challenge/types";

const LABELS = ["A", "B", "C", "D"] as const;

type Props = {
  data: DialogueCompletionData;
  instruction: string;
  onAnswer: (answer: string) => void;
  disabled: boolean;
};

export function DialogueCompletion({ data, instruction, onAnswer, disabled }: Props) {
  const [selected, setSelected] = useState<number | null>(null);

  const handleSelect = (i: number) => {
    if (disabled) return;
    setSelected(i);
    onAnswer(data.options[i]);
  };

  return (
    <div>
      {/* Instruction */}
      <p
        className="text-[11px] font-extrabold text-accent uppercase tracking-widest flex items-center gap-1.5"
        style={{ marginBottom: 14 }}
      >
        <MessageSquare size={12} /> {instruction}
      </p>

      {/* Context badge */}
      <div
        className="items-center gap-1.5 rounded-full bg-surface-alt border-2 border-border mb-4 text-[11px] font-semibold text-text-secondary"
        style={{ display: "inline-flex", padding: "5px 14px" }}
      >
        <MessageSquare className="text-[11px] text-accent" />
        Context: {data.context}
      </div>

      {/* Dialogue display */}
      <div
        className="mb-6 rounded-xl bg-surface-alt border-2 border-border flex flex-col gap-3"
        style={{ padding: "20px 16px" }}
      >
        {data.dialogue.map((line, i) => {
          const isMissing = i === data.missingIndex;
          const isEven = i % 2 === 0;

          return (
            <div
              key={i}
              className="flex flex-col"
              style={{ alignItems: isEven ? "flex-start" : "flex-end" }}
            >
              {/* Speaker label */}
              <span
                className="text-[10px] font-extrabold uppercase tracking-widest text-text-muted mb-1"
                style={{ paddingInline: 6 }}
              >
                {line.speaker}
              </span>

              {/* Bubble */}
              <div
                className="py-2.5 px-4 leading-relaxed"
                style={{
                  maxWidth: "85%",
                  borderRadius: isMissing
                    ? "var(--radius)"
                    : isEven
                      ? "2px 14px 14px 14px"
                      : "14px 2px 14px 14px",
                  background: isMissing
                    ? "transparent"
                    : isEven
                      ? "var(--surface)"
                      : "linear-gradient(135deg, var(--accent-light), var(--surface))",
                  border: isMissing
                    ? "2px dashed var(--accent)"
                    : isEven
                      ? "1px solid var(--border)"
                      : "1px solid color-mix(in srgb, var(--accent) 15%, var(--border))",
                  fontSize: 14.5,
                  fontWeight: isMissing ? 700 : 500,
                  color: isMissing ? "var(--accent)" : "var(--text-primary)",
                  boxShadow: isMissing ? "none" : "var(--shadow-sm)",
                }}
              >
                {isMissing ? "Choose the appropriate response..." : line.text}
              </div>
            </div>
          );
        })}
      </div>

      {/* Options */}
      <div className="flex flex-col gap-2.5">
        {data.options.map((opt, i) => {
          const isSelected = selected === i;

          return (
            <m.button
              key={i}
              whileHover={!disabled ? { scale: 1.01, x: 2 } : {}}
              whileTap={!disabled ? { scale: 0.99 } : {}}
              onClick={() => handleSelect(i)}
              disabled={disabled}
              className="flex items-center gap-3 rounded-lg py-3 px-4 text-left text-sm leading-normal"
              style={{
                border: isSelected ? "2px solid var(--accent)" : "1px solid var(--border)",
                background: isSelected ? "var(--accent-light)" : "var(--surface)",
                fontWeight: isSelected ? 700 : 600,
                color: isSelected ? "var(--accent)" : "var(--text-primary)",
                cursor: disabled ? "default" : "pointer",
                transition: "border-color 0.2s, background-color 0.2s",
                boxShadow: isSelected ? "0 4px 12px var(--accent-muted)" : "var(--shadow-sm)",
              }}
            >
              <span
                className="w-[26px] h-[26px] rounded-full grid shrink-0 text-[11px] font-extrabold"
                style={{
                  placeItems: "center",
                  background: isSelected ? "var(--accent)" : "var(--border)",
                  color: isSelected ? "var(--text-on-accent)" : "var(--text-secondary)",
                  transition: "all 0.15s",
                }}
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
