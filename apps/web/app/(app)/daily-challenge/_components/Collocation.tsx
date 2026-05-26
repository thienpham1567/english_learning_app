"use client";

import * as m from "motion/react-client";
import { useState } from "react";
import type { CollocationData } from "@/lib/daily-challenge/types";

const LABELS = ["A", "B", "C", "D"] as const;

type Props = {
  data: CollocationData;
  instruction: string;
  onAnswer: (answer: string) => void;
  disabled: boolean;
};

export function Collocation({ data, instruction, onAnswer, disabled }: Props) {
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
        style={{
          marginBottom: 14,
          fontSize: 11,
          fontWeight: 800,
          color: "var(--accent)",
          textTransform: "uppercase",
          letterSpacing: "0.08em",
        }}
      >
        📚 {instruction}
      </p>

      {/* Phrase with blank — prominent display */}
      <div
        style={{
          marginBottom: 24,
          padding: "24px 20px",
          borderRadius: "var(--radius-xl)",
          background: "var(--surface-alt)",
          border: "1px solid var(--border)",
          boxShadow: "var(--shadow-sm)",
          textAlign: "center",
        }}
      >
        <p
          style={{
            margin: 0,
            fontFamily: "var(--font-display)",
            fontSize: 22,
            fontWeight: 800,
            color: "var(--text-primary)",
            letterSpacing: "-.01em",
            lineHeight: 1.6,
          }}
        >
          {data.phrase.split("_____").map((part, i, arr) => (
            <span key={i}>
              {part}
              {i < arr.length - 1 && (
                <span
                  style={{
                    display: "inline-block",
                    borderRadius: 8,
                    background: "var(--accent)",
                    padding: "2px 18px",
                    fontWeight: 800,
                    color: "var(--text-on-accent)",
                    fontSize: 18,
                    marginInline: 6,
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
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
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
                justifyContent: "center",
                gap: 10,
                borderRadius: "var(--radius-lg)",
                border: isSelected ? "2px solid var(--accent)" : "1px solid var(--border)",
                background: isSelected ? "var(--accent-light)" : "var(--surface)",
                padding: "14px 12px",
                fontSize: 15,
                fontWeight: isSelected ? 700 : 600,
                color: isSelected ? "var(--accent)" : "var(--text-primary)",
                cursor: disabled ? "default" : "pointer",
                transition: "border-color 0.2s, background-color 0.2s",
                boxShadow: isSelected ? "0 4px 12px var(--accent-muted)" : "var(--shadow-sm)",
              }}
            >
              <span
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: "50%",
                  display: "grid",
                  placeItems: "center",
                  flexShrink: 0,
                  background: isSelected ? "var(--accent)" : "var(--border)",
                  color: isSelected ? "var(--text-on-accent)" : "var(--text-secondary)",
                  fontSize: 11,
                  fontWeight: 800,
                  transition: "all 0.15s",
                }}
              >
                {LABELS[i]}
              </span>
              {opt}
            </m.button>
          );
        })}
      </div>
    </div>
  );
}
