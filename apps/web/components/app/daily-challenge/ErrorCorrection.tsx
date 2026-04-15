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

  return (
    <div>
      <p style={{ marginBottom: 8, fontSize: 12, fontWeight: 500, color: "var(--accent)" }}>
        {instruction}
      </p>
      <div
        style={{
          marginBottom: 12,
          borderRadius: 10,
          border: "1.5px solid #fecaca",
          background: "rgba(254,226,226,0.3)",
          padding: "10px 14px",
        }}
      >
        <p style={{ fontSize: 14, color: "#7f1d1d" }}>{data.sentence}</p>
      </div>
      <label style={{ fontSize: 12, color: "var(--text-muted)" }}>
        Viết từ đúng thay thế từ sai:
      </label>
      <input
        style={{
          marginTop: 6,
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
        placeholder="Nhập từ đúng..."
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
