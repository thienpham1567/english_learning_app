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

  return (
    <div>
      <p style={{ marginBottom: 8, fontSize: 12, fontWeight: 500, color: "var(--accent)" }}>
        {instruction}
      </p>

      {/* Selected words */}
      <div
        style={{
          marginBottom: 12,
          display: "flex",
          flexWrap: "wrap",
          minHeight: 48,
          gap: 6,
          borderRadius: 10,
          border: "2px dashed var(--border)",
          background: "var(--bg-deep)",
          padding: 10,
          alignItems: "flex-start",
          alignContent: "flex-start",
        }}
      >
        {selected.length === 0 && (
          <span style={{ fontSize: 12, color: "var(--text-muted)", padding: "4px 0" }}>
            Nhấn vào các từ bên dưới...
          </span>
        )}
        {selected.map((w, i) => (
          <button
            key={`s-${i}`}
            style={{
              borderRadius: 8,
              background: "color-mix(in srgb, var(--accent) 12%, transparent)",
              padding: "5px 12px",
              fontSize: 14,
              fontWeight: 600,
              color: "var(--accent)",
              border: "none",
              cursor: disabled ? "default" : "pointer",
              transition: "all 0.15s ease",
            }}
            onClick={() => removeWord(i)}
            disabled={disabled}
          >
            {w}
          </button>
        ))}
      </div>

      {/* Available words */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {available.map((w, i) => (
          <button
            key={`a-${i}`}
            style={{
              borderRadius: 10,
              border: "1.5px solid var(--border)",
              background: "var(--surface)",
              padding: "5px 12px",
              fontSize: 14,
              color: "var(--ink)",
              cursor: disabled ? "default" : "pointer",
              transition: "all 0.15s ease",
            }}
            onClick={() => addWord(w, i)}
            disabled={disabled}
          >
            {w}
          </button>
        ))}
      </div>

      {selected.length === data.scrambled.length && !disabled && (
        <button
          style={{
            marginTop: 14,
            borderRadius: 10,
            background: "var(--accent)",
            padding: "8px 20px",
            fontSize: 14,
            fontWeight: 600,
            color: "#fff",
            border: "none",
            cursor: "pointer",
            transition: "all 0.15s ease",
          }}
          onClick={handleSubmit}
        >
          Xác nhận
        </button>
      )}
    </div>
  );
}
