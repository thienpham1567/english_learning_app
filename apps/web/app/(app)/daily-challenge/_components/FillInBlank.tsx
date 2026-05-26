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
      {/* Instruction label */}
      <p
        style={{
          marginBottom: 14,
          fontSize: 11,
          fontWeight: 800,
          color: "var(--accent)",
          textTransform: "uppercase",
          letterSpacing: "0.08em",
        }}
      >
        📝 {instruction}
      </p>

      {/* Sentence display */}
      <div
        style={{
          marginBottom: 24,
          padding: "16px 20px",
          borderRadius: "var(--radius-lg)",
          borderLeft: "4px solid var(--accent)",
          background: "var(--surface-alt)",
          boxShadow: "inset 0 1px 3px rgba(0,0,0,0.03)",
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: 16,
            color: "var(--text-primary)",
            lineHeight: 1.8,
            fontWeight: 600,
          }}
        >
          {data.sentence.split("_____").map((part, i, arr) => (
            <span key={i}>
              {part}
              {i < arr.length - 1 && (
                <span
                  style={{
                    display: "inline-block",
                    borderRadius: 6,
                    background: "var(--accent)",
                    padding: "2px 14px",
                    fontWeight: 800,
                    color: "var(--text-on-accent)",
                    fontSize: 14,
                    marginInline: 4,
                    verticalAlign: "middle",
                    boxShadow: "0 2px 6px var(--accent-muted)",
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
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 12,
        }}
      >
        {data.options.map((opt, i) => {
          const isSelected = selected === i;

          return (
            <m.button
              key={i}
              whileHover={!disabled ? { scale: 1.02, y: -1 } : {}}
              whileTap={!disabled ? { scale: 0.98 } : {}}
              onClick={() => handleSelect(i)}
              disabled={disabled}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                borderRadius: "var(--radius-lg)",
                border: isSelected ? "2px solid var(--accent)" : "1px solid var(--border)",
                background: isSelected ? "var(--accent-light)" : "var(--surface)",
                padding: "14px 18px",
                textAlign: "left",
                fontSize: 15,
                fontWeight: isSelected ? 700 : 600,
                color: isSelected ? "var(--accent)" : "var(--text-primary)",
                cursor: disabled ? "default" : "pointer",
                transition: "border-color 0.2s, background-color 0.2s",
                boxShadow: isSelected ? "0 4px 12px var(--accent-muted)" : "var(--shadow-sm)",
              }}
            >
              {/* Circle label */}
              <span
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  display: "grid",
                  placeItems: "center",
                  flexShrink: 0,
                  background: isSelected ? "var(--accent)" : "var(--border)",
                  color: isSelected ? "var(--text-on-accent)" : "var(--text-secondary)",
                  fontSize: 12,
                  fontWeight: 800,
                  transition: "all 0.15s",
                }}
              >
                {LABELS[i]}
              </span>
              <span style={{ flex: 1 }}>{opt}</span>
            </m.button>
          );
        })}
      </div>
    </div>
  );
}
