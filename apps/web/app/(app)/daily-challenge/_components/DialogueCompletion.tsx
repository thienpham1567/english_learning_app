"use client";

import { useState } from "react";
import type { DialogueCompletionData } from "@/lib/daily-challenge/types";
import { MessageOutlined } from "@ant-design/icons";

const LABELS = ["A", "B", "C", "D"] as const;

type Props = {
  data: DialogueCompletionData;
  instruction: string;
  onAnswer: (answer: string) => void;
  disabled: boolean;
};

export function DialogueCompletion({ data, instruction, onAnswer, disabled }: Props) {
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

      {/* Context badge */}
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 5,
          padding: "4px 12px",
          borderRadius: 99,
          background: "var(--bg-deep)",
          border: "1px solid var(--border)",
          marginBottom: 14,
          fontSize: 11,
          fontWeight: 500,
          color: "var(--text-secondary)",
        }}
      >
        <MessageOutlined style={{ fontSize: 10 }} />
        {data.context}
      </div>

      {/* Dialogue display */}
      <div
        style={{
          marginBottom: 20,
          padding: "16px",
          borderRadius: 14,
          background: "var(--bg-deep)",
          border: "1px solid var(--border)",
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        {data.dialogue.map((line, i) => {
          const isMissing = i === data.missingIndex;
          const isEven = i % 2 === 0;

          return (
            <div
              key={i}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: isEven ? "flex-start" : "flex-end",
              }}
            >
              {/* Speaker label */}
              <span
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  color: "var(--text-muted)",
                  marginBottom: 3,
                  paddingInline: 4,
                }}
              >
                {line.speaker}
              </span>

              {/* Bubble */}
              <div
                style={{
                  maxWidth: "85%",
                  padding: "9px 14px",
                  borderRadius: isMissing
                    ? 12
                    : isEven
                    ? "2px 12px 12px 12px"
                    : "12px 2px 12px 12px",
                  background: isMissing
                    ? "transparent"
                    : isEven
                    ? "var(--surface)"
                    : "color-mix(in srgb, var(--accent) 10%, var(--surface))",
                  border: isMissing
                    ? "2px dashed var(--accent)"
                    : isEven
                    ? "1px solid var(--border)"
                    : "1px solid color-mix(in srgb, var(--accent) 22%, transparent)",
                  fontSize: 14,
                  lineHeight: 1.6,
                  fontWeight: isMissing ? 600 : 400,
                  color: isMissing ? "var(--accent)" : "var(--ink)",
                }}
              >
                {isMissing ? "❓ Chọn câu trả lời phù hợp" : line.text}
              </div>
            </div>
          );
        })}
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
