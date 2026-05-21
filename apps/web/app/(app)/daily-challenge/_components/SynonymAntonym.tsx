"use client";

import { useState } from "react";
import type { SynonymAntonymData } from "@/lib/daily-challenge/types";
import * as m from "motion/react-client";

const LABELS = ["A", "B", "C", "D"] as const;

type Props = {
  data: SynonymAntonymData;
  instruction: string;
  onAnswer: (answer: string) => void;
  disabled: boolean;
};

export function SynonymAntonym({ data, instruction, onAnswer, disabled }: Props) {
  const [selected, setSelected] = useState<number | null>(null);

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
          marginBottom: 14,
          fontSize: 11,
          fontWeight: 800,
          color: "var(--accent)",
          textTransform: "uppercase",
          letterSpacing: "0.08em",
        }}
      >
        🔗 {instruction}
      </p>

      {/* Target word + mode card */}
      <div
        style={{
          marginBottom: 24,
          padding: "24px 20px",
          borderRadius: "var(--radius-xl)",
          background: "var(--surface-alt)",
          border: "1px solid var(--border)",
          boxShadow: "var(--shadow-sm)",
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 10,
        }}
      >
        {/* Mode badge */}
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "4px 14px",
            borderRadius: 99,
            background: isSynonym
              ? "rgba(16, 185, 129, 0.1)"
              : "rgba(239, 68, 68, 0.08)",
            border: `1px solid ${isSynonym
              ? "rgba(16, 185, 129, 0.25)"
              : "rgba(239, 68, 68, 0.2)"}`,
            fontSize: 11,
            fontWeight: 800,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            color: isSynonym ? "var(--success)" : "var(--error)",
          }}
        >
          {isSynonym ? "🔗 Từ đồng nghĩa" : "↔️ Từ trái nghĩa"}
        </span>

        {/* Target word */}
        <span
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 28,
            fontWeight: 800,
            color: "var(--text-primary)",
            letterSpacing: "-.02em",
            lineHeight: 1.2,
          }}
        >
          {data.word}
        </span>
      </div>

      {/* Options 2x2 grid */}
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
                border: isSelected
                  ? "2px solid var(--accent)"
                  : "1px solid var(--border)",
                background: isSelected
                  ? "var(--accent-light)"
                  : "var(--surface)",
                padding: "14px 12px",
                textAlign: "center",
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
