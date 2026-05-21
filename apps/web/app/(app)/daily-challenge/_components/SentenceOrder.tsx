"use client";

import { useState } from "react";
import type { SentenceOrderData } from "@/lib/daily-challenge/types";
import { CheckOutlined, CloseOutlined } from "@ant-design/icons";
import * as m from "motion/react-client";

type Props = {
  data: SentenceOrderData;
  instruction: string;
  onAnswer: (answer: string) => void;
  disabled: boolean;
};

export function SentenceOrder({ data, instruction, onAnswer, disabled }: Props) {
  const [available, setAvailable] = useState([...data.scrambled]);
  const [selected, setSelected] = useState<string[]>([]);
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
          marginBottom: 14,
          fontSize: 11,
          fontWeight: 800,
          color: "var(--accent)",
          textTransform: "uppercase",
          letterSpacing: "0.08em",
        }}
      >
        🔀 {instruction}
      </p>

      {/* Drop zone — sentence being built */}
      <div
        style={{
          marginBottom: 20,
          display: "flex",
          flexWrap: "wrap",
          minHeight: 64,
          gap: 8,
          borderRadius: "var(--radius-lg)",
          border: allSelected
            ? "2px solid var(--accent)"
            : "2px dashed var(--border)",
          background: allSelected
            ? "var(--accent-light)"
            : "var(--surface-alt)",
          padding: "12px 14px",
          alignItems: "flex-start",
          alignContent: "flex-start",
          transition: "all 0.2s ease",
          boxShadow: allSelected ? "0 4px 12px var(--accent-muted)" : "inset 0 1px 3px rgba(0,0,0,0.03)",
        }}
      >
        {selected.length === 0 ? (
          <span
            style={{
              fontSize: 13,
              color: "var(--text-muted)",
              padding: "6px 2px",
              fontStyle: "italic",
            }}
          >
            Nhấn vào các từ bên dưới để ghép thành câu hoàn chỉnh...
          </span>
        ) : (
          selected.map((w, i) => (
            <m.button
              key={`s-${i}`}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => removeWord(i)}
              onMouseEnter={() => setHoveredSel(i)}
              onMouseLeave={() => setHoveredSel(null)}
              disabled={disabled}
              style={{
                borderRadius: 8,
                background:
                  hoveredSel === i && !disabled
                    ? "rgba(239, 68, 68, 0.1)"
                    : "var(--surface)",
                padding: "6px 14px",
                fontSize: 14,
                fontWeight: 600,
                color: hoveredSel === i && !disabled ? "var(--error)" : "var(--accent)",
                border:
                  hoveredSel === i && !disabled
                    ? "1px solid rgba(239, 68, 68, 0.3)"
                    : "1px solid var(--border)",
                cursor: disabled ? "default" : "pointer",
                transition: "all 0.15s ease",
                boxShadow: "var(--shadow-sm)",
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
              }}
            >
              {w}
              {!disabled && (
                <CloseOutlined
                  style={{
                    fontSize: 8,
                    color: hoveredSel === i ? "var(--error)" : "var(--text-muted)",
                    marginLeft: 2,
                  }}
                />
              )}
            </m.button>
          ))
        )}
      </div>

      {/* Available word bank */}
      <div
        style={{
          padding: "16px 18px",
          borderRadius: "var(--radius-lg)",
          border: "1px solid var(--border)",
          background: "var(--surface)",
          boxShadow: "var(--shadow-sm)",
          marginBottom: 20,
        }}
      >
        <div
          style={{
            fontSize: 10,
            fontWeight: 800,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            color: "var(--text-muted)",
            marginBottom: 12,
          }}
        >
          Ngân hàng từ vựng
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {available.length === 0 ? (
            <span style={{ fontSize: 13, color: "var(--text-muted)", fontStyle: "italic" }}>
              Đã sử dụng hết tất cả từ trong ngân hàng từ!
            </span>
          ) : (
            available.map((w, i) => (
              <m.button
                key={`a-${i}`}
                whileHover={!disabled ? { scale: 1.04, y: -1 } : {}}
                whileTap={!disabled ? { scale: 0.96 } : {}}
                onClick={() => addWord(w, i)}
                disabled={disabled}
                style={{
                  borderRadius: 8,
                  border: "1.5px solid var(--border)",
                  background: "var(--surface-alt)",
                  padding: "6px 14px",
                  fontSize: 14,
                  fontWeight: 600,
                  color: "var(--text-primary)",
                  cursor: disabled ? "default" : "pointer",
                  transition: "all 0.15s ease",
                  boxShadow: "var(--shadow-sm)",
                }}
              >
                {w}
              </m.button>
            ))
          )}
        </div>
      </div>

      {/* Confirm button */}
      {allSelected && !disabled && (
        <m.button
          whileHover={{ scale: 1.02, y: -1 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleSubmit}
          style={{
            width: "100%",
            borderRadius: "var(--radius-lg)",
            background: "linear-gradient(135deg, var(--accent), var(--accent-hover))",
            padding: "14px 0",
            fontSize: 15,
            fontWeight: 800,
            color: "var(--text-on-accent)",
            border: "none",
            cursor: "pointer",
            boxShadow: "0 6px 18px var(--accent-muted)",
          }}
        >
          <CheckOutlined style={{ fontSize: 12 }} /> Xác nhận đáp án
        </m.button>
      )}
    </div>
  );
}
