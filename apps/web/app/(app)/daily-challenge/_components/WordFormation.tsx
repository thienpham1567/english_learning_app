"use client";

import { useState } from "react";
import type { WordFormationData } from "@/lib/daily-challenge/types";
import * as m from "motion/react-client";

const LABELS = ["A", "B", "C", "D"] as const;

type Props = {
  data: WordFormationData;
  instruction: string;
  onAnswer: (answer: string) => void;
  disabled: boolean;
};

export function WordFormation({ data, instruction, onAnswer, disabled }: Props) {
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
        📖 {instruction}
      </p>

      {/* Root word badge */}
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          padding: "6px 14px",
          borderRadius: 99,
          background: "var(--accent-light)",
          border: "1.5px solid color-mix(in srgb, var(--accent) 30%, transparent)",
          marginBottom: 16,
        }}
      >
        <span
          style={{
            fontSize: 10,
            fontWeight: 800,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            color: "var(--text-muted)",
          }}
        >
          Từ gốc:
        </span>
        <span
          style={{
            fontSize: 15,
            fontWeight: 800,
            color: "var(--accent)",
            fontFamily: "var(--font-display)",
            letterSpacing: "-.01em",
          }}
        >
          {data.rootWord}
        </span>
      </div>

      {/* Sentence with blank */}
      <div
        style={{
          marginBottom: 24,
          padding: "16px 20px",
          borderRadius: "var(--radius-xl)",
          borderLeft: "4px solid var(--accent)",
          background: "var(--surface-alt)",
          boxShadow: "var(--shadow-sm)",
        }}
      >
        <p style={{ margin: 0, fontSize: 15.5, color: "var(--text-primary)", lineHeight: 1.8, fontWeight: 600 }}>
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
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 }}>
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
                border: isSelected
                  ? "2px solid var(--accent)"
                  : "1px solid var(--border)",
                background: isSelected
                  ? "var(--accent-light)"
                  : "var(--surface)",
                padding: "12px 16px",
                textAlign: "left",
                fontSize: 14,
                fontWeight: isSelected ? 700 : 600,
                color: isSelected ? "var(--accent)" : "var(--text-primary)",
                cursor: disabled ? "default" : "pointer",
                transition: "border-color 0.2s, background-color 0.2s",
                boxShadow: isSelected ? "0 4px 12px var(--accent-muted)" : "var(--shadow-sm)",
              }}
            >
              <span
                style={{
                  width: 26,
                  height: 26,
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
