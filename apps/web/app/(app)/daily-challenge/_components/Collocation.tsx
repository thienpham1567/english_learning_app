"use client";

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
  const [hoveredOption, setHoveredOption] = useState<number | null>(null);

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

      {/* Phrase with blank — prominent display */}
      <div
        style={{
          marginBottom: 20,
          padding: "24px 20px",
          borderRadius: 16,
          background: "var(--bg-deep)",
          border: "1px solid var(--border)",
          textAlign: "center",
        }}
      >
        <p
          style={{
            margin: 0,
            fontFamily: "var(--font-display)",
            fontSize: 22,
            fontWeight: 700,
            color: "var(--ink)",
            letterSpacing: "-.01em",
            lineHeight: 1.5,
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
                    fontWeight: 700,
                    color: "var(--text-on-accent)",
                    fontSize: 18,
                    marginInline: 4,
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

      {/* Options 2x2 grid */}
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
                justifyContent: "center",
                gap: 8,
                borderRadius: 12,
                border: isSelected
                  ? "2px solid var(--accent)"
                  : `1px solid ${isHov ? "var(--accent)" : "var(--border)"}`,
                background: isSelected
                  ? "color-mix(in srgb, var(--accent) 10%, var(--surface))"
                  : isHov
                  ? "color-mix(in srgb, var(--accent) 4%, var(--surface))"
                  : "var(--surface)",
                padding: "14px 12px",
                textAlign: "center",
                fontSize: 15,
                fontWeight: isSelected ? 700 : 500,
                color: "var(--ink)",
                cursor: disabled ? "default" : "pointer",
                transition: "all 0.15s ease",
                transform: isHov ? "translateY(-1px)" : "none",
                boxShadow: isHov ? "0 3px 10px rgba(0,0,0,0.08)" : "none",
              }}
            >
              <span
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 99,
                  display: "grid",
                  placeItems: "center",
                  flexShrink: 0,
                  background: isSelected ? "var(--accent)" : "var(--border)",
                  color: isSelected ? "var(--text-on-accent)" : "var(--text-muted)",
                  fontSize: 10,
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
