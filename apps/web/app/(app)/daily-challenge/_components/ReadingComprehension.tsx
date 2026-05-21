"use client";

import { useState } from "react";
import type { ReadingComprehensionData } from "@/lib/daily-challenge/types";
import { ReadOutlined } from "@ant-design/icons";
import * as m from "motion/react-client";

const LABELS = ["A", "B", "C", "D"] as const;

type Props = {
  data: ReadingComprehensionData;
  instruction: string;
  onAnswer: (answer: string) => void;
  disabled: boolean;
};

export function ReadingComprehension({ data, instruction, onAnswer, disabled }: Props) {
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

      {/* Passage */}
      <div
        style={{
          marginBottom: 20,
          borderRadius: "var(--radius-xl)",
          borderLeft: "4px solid var(--accent)",
          background: "var(--surface-alt)",
          padding: "18px 20px",
          boxShadow: "var(--shadow-sm)",
        }}
      >
        <span
          style={{
            fontSize: 10,
            fontWeight: 800,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            color: "var(--accent)",
            display: "flex",
            alignItems: "center",
            gap: 6,
            marginBottom: 10,
          }}
        >
          <ReadOutlined style={{ fontSize: 11 }} /> Văn bản đọc hiểu
        </span>
        <p
          style={{
            margin: 0,
            fontSize: 14.5,
            color: "var(--text-primary)",
            fontWeight: 500,
            lineHeight: 1.8,
            fontFamily: "var(--font-body)",
          }}
        >
          {data.passage}
        </p>
      </div>

      {/* Question */}
      <div
        style={{
          marginBottom: 16,
          padding: "12px 16px",
          borderRadius: "var(--radius-lg)",
          background: "var(--surface-alt)",
          border: "1px solid var(--border)",
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: 15,
            fontWeight: 700,
            color: "var(--text-primary)",
            lineHeight: 1.6,
          }}
        >
          {data.question}
        </p>
      </div>

      {/* Options */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {data.options.map((opt, i) => {
          const isSelected = selected === i;

          return (
            <m.button
              key={i}
              whileHover={!disabled ? { scale: 1.01, x: 2 } : {}}
              whileTap={!disabled ? { scale: 0.99 } : {}}
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
                lineHeight: 1.5,
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
              <span style={{ flex: 1 }}>{opt}</span>
            </m.button>
          );
        })}
      </div>
    </div>
  );
}
