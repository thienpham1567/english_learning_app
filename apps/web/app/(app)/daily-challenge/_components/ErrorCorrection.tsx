"use client";

import { useState } from "react";
import type { ErrorCorrectionData } from "@/lib/daily-challenge/types";

type Props = {
  data: ErrorCorrectionData;
  instruction: string;
  onAnswer: (answer: string) => void;
  disabled: boolean;
};

export function ErrorCorrection({ data, instruction, onAnswer, disabled }: Props) {
  const [text, setText] = useState("");
  const [focused, setFocused] = useState(false);

  return (
    <div>
      {/* Instruction */}
      <p
        style={{
          marginBottom: 12,
          fontSize: 11,
          fontWeight: 700,
          color: "#ef4444",
          textTransform: "uppercase",
          letterSpacing: "0.1em",
        }}
      >
        {instruction}
      </p>

      {/* Error sentence — red quote block */}
      <div
        style={{
          marginBottom: 16,
          borderRadius: 12,
          borderLeft: "4px solid #ef4444",
          background: "rgba(254,226,226,0.45)",
          padding: "12px 16px",
        }}
      >
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.12em",
            color: "#ef4444",
            display: "flex",
            alignItems: "center",
            gap: 4,
            marginBottom: 6,
          }}
        >
          ⚠️ Câu có lỗi
        </span>
        <p
          style={{
            margin: 0,
            fontSize: 15,
            color: "#7f1d1d",
            fontWeight: 500,
            lineHeight: 1.65,
          }}
        >
          {data.sentence}
        </p>
      </div>

      {/* Correction input */}
      <label
        style={{
          display: "block",
          fontSize: 11,
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          color: "var(--text-muted)",
          marginBottom: 6,
        }}
      >
        ✏️ Viết từ đúng thay thế
      </label>
      <input
        style={{
          width: "100%",
          borderRadius: 12,
          border: focused
            ? "2px solid #ef4444"
            : "1.5px solid var(--border)",
          background: "var(--surface)",
          padding: "11px 14px",
          fontSize: 14,
          color: "var(--ink)",
          outline: "none",
          transition: "border-color 0.15s ease",
          boxSizing: "border-box",
        }}
        placeholder="Nhập từ đúng..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={disabled}
        onKeyDown={(e) => {
          if (e.key === "Enter" && text.trim()) onAnswer(text.trim());
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />

      {/* Full-width confirm */}
      {text.trim() && !disabled && (
        <button
          onClick={() => onAnswer(text.trim())}
          style={{
            marginTop: 12,
            width: "100%",
            borderRadius: 12,
            background: "linear-gradient(135deg, #ef4444, #f87171)",
            padding: "13px 0",
            fontSize: 14,
            fontWeight: 700,
            color: "#fff",
            border: "none",
            cursor: "pointer",
            boxShadow: "0 3px 12px rgba(239,68,68,0.3)",
            transition: "opacity 0.15s",
          }}
        >
          Xác nhận sửa lỗi ✓
        </button>
      )}
    </div>
  );
}
