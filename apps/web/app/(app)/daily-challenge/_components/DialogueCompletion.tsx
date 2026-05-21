"use client";

import { useState } from "react";
import type { DialogueCompletionData } from "@/lib/daily-challenge/types";
import { MessageOutlined } from "@ant-design/icons";
import * as m from "motion/react-client";

const LABELS = ["A", "B", "C", "D"] as const;

type Props = {
  data: DialogueCompletionData;
  instruction: string;
  onAnswer: (answer: string) => void;
  disabled: boolean;
};

export function DialogueCompletion({ data, instruction, onAnswer, disabled }: Props) {
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
        💬 {instruction}
      </p>

      {/* Context badge */}
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          padding: "5px 14px",
          borderRadius: 99,
          background: "var(--surface-alt)",
          border: "1px solid var(--border)",
          marginBottom: 16,
          fontSize: 11,
          fontWeight: 600,
          color: "var(--text-secondary)",
        }}
      >
        <MessageOutlined style={{ fontSize: 11, color: "var(--accent)" }} />
        Bối cảnh: {data.context}
      </div>

      {/* Dialogue display */}
      <div
        style={{
          marginBottom: 24,
          padding: "20px 16px",
          borderRadius: "var(--radius-xl)",
          background: "var(--surface-alt)",
          border: "1px solid var(--border)",
          display: "flex",
          flexDirection: "column",
          gap: 12,
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
                  fontSize: 10,
                  fontWeight: 800,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  color: "var(--text-muted)",
                  marginBottom: 4,
                  paddingInline: 6,
                }}
              >
                {line.speaker}
              </span>

              {/* Bubble */}
              <div
                style={{
                  maxWidth: "85%",
                  padding: "10px 16px",
                  borderRadius: isMissing
                    ? "var(--radius)"
                    : isEven
                    ? "2px 14px 14px 14px"
                    : "14px 2px 14px 14px",
                  background: isMissing
                    ? "transparent"
                    : isEven
                    ? "var(--surface)"
                    : "linear-gradient(135deg, var(--accent-light), var(--surface))",
                  border: isMissing
                    ? "2px dashed var(--accent)"
                    : isEven
                    ? "1px solid var(--border)"
                    : "1px solid color-mix(in srgb, var(--accent) 15%, var(--border))",
                  fontSize: 14.5,
                  lineHeight: 1.6,
                  fontWeight: isMissing ? 700 : 500,
                  color: isMissing ? "var(--accent)" : "var(--text-primary)",
                  boxShadow: isMissing ? "none" : "var(--shadow-sm)",
                }}
              >
                {isMissing ? "❓ Hãy chọn phản hồi phù hợp..." : line.text}
              </div>
            </div>
          );
        })}
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
