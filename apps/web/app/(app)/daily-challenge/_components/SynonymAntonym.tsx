"use client";

import { useState } from "react";
import type { SynonymAntonymData } from "@/lib/daily-challenge/types";

const LABELS = ["A", "B", "C", "D"] as const;

type Props = {
  data: SynonymAntonymData;
  instruction: string;
  onAnswer: (answer: string) => void;
  disabled: boolean;
};

export function SynonymAntonym({ data, instruction, onAnswer, disabled }: Props) {
  const [selected, setSelected] = useState<number | null>(null);
  const [hoveredOption, setHoveredOption] = useState<number | null>(null);

  const handleSelect = (i: number) => {
    if (disabled) return;
    setSelected(i);
    onAnswer(data.options[i]);
  };

  const isSynonym = data.mode === "synonym";

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

      {/* Target word + mode card */}
      <div
        style={{
          marginBottom: 20,
          padding: "20px 24px",
          borderRadius: 16,
          background: "var(--bg-deep)",
          border: "1px solid var(--border)",
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 8,
        }}
      >
        {/* Mode badge */}
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
            padding: "3px 12px",
            borderRadius: 99,
            background: isSynonym
              ? "color-mix(in srgb, var(--success) 12%, transparent)"
              : "color-mix(in srgb, var(--error) 12%, transparent)",
            border: `1px solid ${isSynonym
              ? "color-mix(in srgb, var(--success) 25%, transparent)"
              : "color-mix(in srgb, var(--error) 25%, transparent)"}`,
            fontSize: 10,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            color: isSynonym ? "var(--success)" : "var(--error)",
          }}
        >
          {isSynonym ? "🔗 Đồng nghĩa" : "↔️ Trái nghĩa"}
        </span>

        {/* Target word */}
        <span
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 28,
            fontWeight: 800,
            color: "var(--ink)",
            letterSpacing: "-.02em",
            lineHeight: 1.2,
          }}
        >
          {data.word}
        </span>
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
