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
  const [hoveredOption, setHoveredOption] = useState<number | null>(null);

  const handleSelect = (i: number) => {
    if (disabled) return;
    setSelected(i);
    onAnswer(data.options[i]);
  };

  return (
    <div>
      {/* Instruction label */}
      <p
        style={{
          marginBottom: 12,
          fontSize: 11,
          fontWeight: 700,
          color: "var(--accent)",
          textTransform: "uppercase",
          letterSpacing: "0.1em",
        }}
      >
        {instruction}
      </p>

      {/* Sentence display */}
      <div
        style={{
          marginBottom: 20,
          padding: "14px 16px",
          borderRadius: 12,
          borderLeft: "4px solid var(--accent)",
          background: "color-mix(in srgb, var(--accent) 6%, var(--surface))",
        }}
      >
        <p style={{ margin: 0, fontSize: 15, color: "var(--ink)", lineHeight: 1.8, fontWeight: 500 }}>
          {data.sentence.split("_____").map((part, i, arr) => (
            <span key={i}>
              {part}
              {i < arr.length - 1 && (
                <span
                  style={{
                    display: "inline-block",
                    borderRadius: 6,
                    background: "var(--accent)",
                    padding: "1px 14px",
                    fontWeight: 700,
                    color: "var(--text-on-accent)",
                    fontSize: 13,
                    letterSpacing: "0.05em",
                    marginInline: 2,
                    verticalAlign: "middle",
                  }}
                >
                  ?
                </span>
              )}
            </span>
          ))}
        </p>
      </div>

      {/* Options grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {data.options.map((opt, i) => {
          const isSelected = selected === i;
          const isHov = hoveredOption === i && !isSelected && !disabled;

          return (
            <button
              key={i}
              onClick={() => handleSelect(i)}
              onMouseEnter={() => setHoveredOption(i)}
              onMouseLeave={() => setHoveredOption(null)}
              disabled={disabled}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                borderRadius: 12,
                border: isSelected
                  ? "2px solid var(--accent)"
                  : `1px solid ${isHov ? "var(--accent)" : "var(--border)"}`,
                background: isSelected
                  ? "color-mix(in srgb, var(--accent) 10%, var(--surface))"
                  : isHov
                  ? "color-mix(in srgb, var(--accent) 4%, var(--surface))"
                  : "var(--surface)",
                padding: "11px 14px",
                textAlign: "left",
                fontSize: 14,
                fontWeight: isSelected ? 600 : 400,
                color: "var(--ink)",
                cursor: disabled ? "default" : "pointer",
                transition: "all 0.15s ease",
                transform: isHov ? "translateY(-1px)" : "none",
                boxShadow: isHov ? "0 3px 10px rgba(0,0,0,0.08)" : "none",
              }}
            >
              {/* Circle label */}
              <span
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 99,
                  display: "grid",
                  placeItems: "center",
                  flexShrink: 0,
                  background: isSelected ? "var(--accent)" : "var(--border)",
                  color: isSelected ? "var(--text-on-accent)" : "var(--text-muted)",
                  fontSize: 11,
                  fontWeight: 800,
                  transition: "all 0.15s",
                }}
              >
                {LABELS[i]}
              </span>
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}
