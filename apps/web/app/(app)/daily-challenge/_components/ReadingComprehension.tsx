"use client";

import { useState } from "react";
import type { ReadingComprehensionData } from "@/lib/daily-challenge/types";
import { ReadOutlined } from "@ant-design/icons";

const LABELS = ["A", "B", "C", "D"] as const;

type Props = {
  data: ReadingComprehensionData;
  instruction: string;
  onAnswer: (answer: string) => void;
  disabled: boolean;
};

export function ReadingComprehension({ data, instruction, onAnswer, disabled }: Props) {
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

      {/* Passage */}
      <div
        style={{
          marginBottom: 16,
          borderRadius: 14,
          borderLeft: "4px solid var(--accent)",
          background: "color-mix(in srgb, var(--accent) 5%, var(--surface))",
          padding: "16px 18px",
        }}
      >
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.12em",
            color: "var(--accent)",
            display: "flex",
            alignItems: "center",
            gap: 4,
            marginBottom: 8,
          }}
        >
          <ReadOutlined style={{ fontSize: 10 }} /> Đoạn văn
        </span>
        <p
          style={{
            margin: 0,
            fontSize: 14,
            color: "var(--ink)",
            fontWeight: 400,
            lineHeight: 1.75,
            fontFamily: "var(--font-body)",
          }}
        >
          {data.passage}
        </p>
      </div>

      {/* Question */}
      <div
        style={{
          marginBottom: 14,
          padding: "10px 14px",
          borderRadius: 10,
          background: "var(--bg-deep)",
          border: "1px solid var(--border)",
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: 14,
            fontWeight: 600,
            color: "var(--ink)",
            lineHeight: 1.6,
          }}
        >
          {data.question}
        </p>
      </div>

      {/* Options */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
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
                fontSize: 13,
                fontWeight: isSelected ? 600 : 400,
                color: "var(--ink)",
                cursor: disabled ? "default" : "pointer",
                transition: "all 0.15s ease",
                transform: isHov ? "translateY(-1px)" : "none",
                boxShadow: isHov ? "0 3px 10px rgba(0,0,0,0.08)" : "none",
                lineHeight: 1.5,
              }}
            >
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
