"use client";

import { useState } from "react";
import type { SentenceOrderData } from "@/lib/daily-challenge/types";

type Props = {
  data: SentenceOrderData;
  instruction: string;
  onAnswer: (answer: string) => void;
  disabled: boolean;
};

export function SentenceOrder({ data, instruction, onAnswer, disabled }: Props) {
  const [available, setAvailable] = useState([...data.scrambled]);
  const [selected, setSelected] = useState<string[]>([]);
  const [hoveredAvail, setHoveredAvail] = useState<number | null>(null);
  const [hoveredSel, setHoveredSel] = useState<number | null>(null);

  const addWord = (word: string, idx: number) => {
    if (disabled) return;
    setSelected((prev) => [...prev, word]);
    setAvailable((prev) => prev.filter((_, i) => i !== idx));
  };

  const removeWord = (idx: number) => {
    if (disabled) return;
    const word = selected[idx];
    setSelected((prev) => prev.filter((_, i) => i !== idx));
    setAvailable((prev) => [...prev, word]);
  };

  const handleSubmit = () => {
    onAnswer(selected.join(" "));
  };

  const allSelected = selected.length === data.scrambled.length;

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

      {/* Drop zone — sentence being built */}
      <div
        style={{
          marginBottom: 16,
          display: "flex",
          flexWrap: "wrap",
          minHeight: 56,
          gap: 6,
          borderRadius: 12,
          border: allSelected
            ? "2px solid var(--accent)"
            : "2px dashed var(--border)",
          background: allSelected
            ? "color-mix(in srgb, var(--accent) 6%, var(--surface))"
            : "var(--bg-deep, rgba(0,0,0,0.03))",
          padding: "10px 12px",
          alignItems: "flex-start",
          alignContent: "flex-start",
          transition: "all 0.2s ease",
        }}
      >
        {selected.length === 0 ? (
          <span
            style={{
              fontSize: 12,
              color: "var(--text-muted)",
              padding: "4px 2px",
              fontStyle: "italic",
            }}
          >
            Nhấn vào các từ bên dưới để sắp xếp câu...
          </span>
        ) : (
          selected.map((w, i) => (
            <button
              key={`s-${i}`}
              onClick={() => removeWord(i)}
              onMouseEnter={() => setHoveredSel(i)}
              onMouseLeave={() => setHoveredSel(null)}
              disabled={disabled}
              style={{
                borderRadius: 8,
                background:
                  hoveredSel === i && !disabled
                    ? "#ef444420"
                    : "color-mix(in srgb, var(--accent) 14%, var(--surface))",
                padding: "5px 12px",
                fontSize: 14,
                fontWeight: 600,
                color: hoveredSel === i && !disabled ? "#ef4444" : "var(--accent)",
                border:
                  hoveredSel === i && !disabled
                    ? "1px solid #ef444440"
                    : "1px solid color-mix(in srgb, var(--accent) 25%, transparent)",
                cursor: disabled ? "default" : "pointer",
                transition: "all 0.12s ease",
              }}
            >
              {w}
              {!disabled && (
                <span
                  style={{
                    marginLeft: 5,
                    fontSize: 10,
                    opacity: hoveredSel === i ? 1 : 0,
                    transition: "opacity 0.12s",
                  }}
                >
                  ✕
                </span>
              )}
            </button>
          ))
        )}
      </div>

      {/* Available word bank */}
      <div
        style={{
          padding: "10px 12px",
          borderRadius: 12,
          border: "1px solid var(--border)",
          background: "var(--surface)",
          marginBottom: 14,
        }}
      >
        <div
          style={{
            fontSize: 10,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            color: "var(--text-muted)",
            marginBottom: 8,
          }}
        >
          Ngân hàng từ
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
          {available.length === 0 ? (
            <span style={{ fontSize: 12, color: "var(--text-muted)", fontStyle: "italic" }}>
              Đã dùng hết tất cả các từ
            </span>
          ) : (
            available.map((w, i) => (
              <button
                key={`a-${i}`}
                onClick={() => addWord(w, i)}
                onMouseEnter={() => setHoveredAvail(i)}
                onMouseLeave={() => setHoveredAvail(null)}
                disabled={disabled}
                style={{
                  borderRadius: 8,
                  border:
                    hoveredAvail === i && !disabled
                      ? "1.5px solid var(--accent)"
                      : "1.5px solid var(--border)",
                  background:
                    hoveredAvail === i && !disabled
                      ? "color-mix(in srgb, var(--accent) 8%, var(--surface))"
                      : "var(--surface)",
                  padding: "5px 13px",
                  fontSize: 14,
                  fontWeight: 500,
                  color: hoveredAvail === i && !disabled ? "var(--accent)" : "var(--ink)",
                  cursor: disabled ? "default" : "pointer",
                  transition: "all 0.12s ease",
                  transform: hoveredAvail === i && !disabled ? "translateY(-1px)" : "none",
                  boxShadow: hoveredAvail === i && !disabled ? "0 2px 8px rgba(0,0,0,0.08)" : "none",
                }}
              >
                {w}
              </button>
            ))
          )}
        </div>
      </div>

      {/* Confirm button */}
      {allSelected && !disabled && (
        <button
          onClick={handleSubmit}
          style={{
            width: "100%",
            borderRadius: 12,
            background: "linear-gradient(135deg, var(--accent), var(--accent-hover))",
            padding: "13px 0",
            fontSize: 14,
            fontWeight: 700,
            color: "#fff",
            border: "none",
            cursor: "pointer",
            boxShadow: "0 3px 12px rgba(154,177,122,0.35)",
            transition: "opacity 0.15s",
          }}
        >
          Xác nhận ✓
        </button>
      )}
    </div>
  );
}
