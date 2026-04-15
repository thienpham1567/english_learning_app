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

  return (
    <div>
      <p style={{ marginBottom: 8, fontSize: 12, fontWeight: 500, color: "var(--accent)" }}>
        {instruction}
      </p>
      <div
        style={{
          marginBottom: 12,
          borderRadius: 10,
          background: "var(--bg-deep)",
          padding: "10px 14px",
        }}
      >
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            color: "var(--text-muted)",
          }}
        >
          Tiếng Việt
        </span>
        <p style={{ marginTop: 4, fontSize: 14, color: "var(--ink)" }}>{data.vietnamese}</p>
      </div>
      <input
        style={{
          width: "100%",
          borderRadius: 10,
          border: "1.5px solid var(--border)",
          background: "var(--surface)",
          padding: "10px 14px",
          fontSize: 14,
          color: "var(--ink)",
          outline: "none",
          transition: "border-color 0.15s ease",
        }}
        placeholder="Type your English translation..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={disabled}
        onKeyDown={(e) => {
          if (e.key === "Enter" && text.trim()) onAnswer(text.trim());
        }}
        onFocus={(e) => (e.currentTarget.style.borderColor = "var(--accent)")}
        onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
      />
      {text.trim() && !disabled && (
        <button
          style={{
            marginTop: 10,
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
          onClick={() => onAnswer(text.trim())}
        >
          Xác nhận
        </button>
      )}
    </div>
  );
}
