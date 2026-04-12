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

  const handleSelect = (i: number) => {
    if (disabled) return;
    setSelected(i);
    onAnswer(data.options[i]);
  };

  return (
    <div>
      <p style={{ marginBottom: 8, fontSize: 12, fontWeight: 500, color: "var(--accent)" }}>
        {instruction}
      </p>
      <p style={{ marginBottom: 16, fontSize: 15, color: "var(--ink)", lineHeight: 1.7 }}>
        {data.sentence.split("_____").map((part, i, arr) => (
          <span key={i}>
            {part}
            {i < arr.length - 1 && (
              <span
                style={{
                  display: "inline-block",
                  borderRadius: 6,
                  background: "color-mix(in srgb, var(--accent) 12%, transparent)",
                  padding: "2px 10px",
                  fontWeight: 600,
                  color: "var(--accent)",
                }}
              >
                _____
              </span>
            )}
          </span>
        ))}
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {data.options.map((opt, i) => (
          <button
            key={i}
            style={{
              borderRadius: 10,
              border: `1.5px solid ${selected === i ? "var(--accent)" : "var(--border)"}`,
              background: selected === i
                ? "color-mix(in srgb, var(--accent) 10%, transparent)"
                : "var(--surface)",
              padding: "10px 14px",
              textAlign: "left",
              fontSize: 14,
              fontWeight: selected === i ? 600 : 400,
              color: "var(--ink)",
              cursor: disabled ? "default" : "pointer",
              transition: "all 0.15s ease",
            }}
            onClick={() => handleSelect(i)}
            disabled={disabled}
          >
            <span style={{ marginRight: 8, fontSize: 12, fontWeight: 700, color: "var(--text-muted)" }}>
              {LABELS[i]}
            </span>
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}
