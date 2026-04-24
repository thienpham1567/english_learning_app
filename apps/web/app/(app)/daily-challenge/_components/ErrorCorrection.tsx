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
          color: "var(--error)",
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
          borderLeft: "4px solid var(--error)",
          background: "var(--error-bg)",
          padding: "12px 16px",
        }}
      >
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.12em",
            color: "var(--error)",
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
            color: "var(--error)",
            fontWeight: 500,
            lineHeight: 1.65,
          }}
        >
          {data.sentence}
        </p>
      </div>

      {/* Correction input */}
      <label
        htmlFor="error-correction-input"
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
        id="error-correction-input"
        style={{
          width: "100%",
          borderRadius: 12,
          border: focused
            ? "2px solid var(--error)"
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
            background: "linear-gradient(135deg, var(--error), color-mix(in srgb, var(--error) 80%, white))",
            padding: "13px 0",
            fontSize: 14,
            fontWeight: 700,
            color: "var(--text-on-accent)",
            border: "none",
            cursor: "pointer",
            boxShadow: "0 3px 12px color-mix(in srgb, var(--error) 30%, transparent)",
            transition: "opacity 0.15s",
          }}
        >
          Xác nhận sửa lỗi ✓
        </button>
      )}
    </div>
  );
}
