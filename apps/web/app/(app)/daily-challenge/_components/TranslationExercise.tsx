"use client";

import { useState } from "react";
import type { TranslationData } from "@/lib/daily-challenge/types";

type Props = {
  data: TranslationData;
  instruction: string;
  onAnswer: (answer: string) => void;
  disabled: boolean;
};

export function TranslationExercise({ data, instruction, onAnswer, disabled }: Props) {
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
          color: "var(--accent)",
          textTransform: "uppercase",
          letterSpacing: "0.1em",
        }}
      >
        {instruction}
      </p>

      {/* Vietnamese source — quote block style */}
      <div
        style={{
          marginBottom: 16,
          borderRadius: 12,
          borderLeft: "4px solid var(--accent)",
          background: "color-mix(in srgb, var(--accent) 6%, var(--surface))",
          padding: "12px 16px",
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
            marginBottom: 6,
          }}
        >
          🇻🇳 Tiếng Việt
        </span>
        <p
          style={{
            margin: 0,
            fontSize: 15,
            color: "var(--ink)",
            fontWeight: 500,
            lineHeight: 1.65,
          }}
        >
          {data.vietnamese}
        </p>
      </div>

      {/* English input */}
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
        🇬🇧 Bản dịch tiếng Anh
      </label>
      <textarea
        rows={3}
        style={{
          width: "100%",
          borderRadius: 12,
          border: focused
            ? "2px solid var(--accent)"
            : "1.5px solid var(--border)",
          background: "var(--surface)",
          padding: "11px 14px",
          fontSize: 14,
          color: "var(--ink)",
          outline: "none",
          resize: "none",
          transition: "border-color 0.15s ease",
          lineHeight: 1.6,
          fontFamily: "var(--font-body, inherit)",
          boxSizing: "border-box",
        }}
        placeholder="Type your English translation..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={disabled}
        onKeyDown={(e) => {
          if (e.key === "Enter" && e.ctrlKey && text.trim()) onAnswer(text.trim());
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
      {text.trim().length > 0 && (
        <div
          style={{
            fontSize: 11,
            color: "var(--text-muted)",
            textAlign: "right",
            marginTop: 4,
            marginBottom: 10,
          }}
        >
          Ctrl+Enter để xác nhận
        </div>
      )}

      {/* Full-width confirm */}
      {text.trim() && !disabled && (
        <button
          onClick={() => onAnswer(text.trim())}
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
