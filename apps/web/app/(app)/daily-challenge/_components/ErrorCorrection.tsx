"use client";

import { useState } from "react";
import type { ErrorCorrectionData } from "@/lib/daily-challenge/types";
import { WarningOutlined, EditOutlined, CheckOutlined } from "@ant-design/icons";
import * as m from "motion/react-client";

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
          marginBottom: 14,
          fontSize: 11,
          fontWeight: 800,
          color: "var(--error)",
          textTransform: "uppercase",
          letterSpacing: "0.08em",
        }}
      >
        ⚠️ {instruction}
      </p>

      {/* Error sentence — red quote block */}
      <div
        style={{
          marginBottom: 20,
          borderRadius: "var(--radius-xl)",
          borderLeft: "4px solid var(--error)",
          background: "var(--error-bg)",
          padding: "16px 20px",
          boxShadow: "var(--shadow-sm)",
        }}
      >
        <span
          style={{
            fontSize: 10,
            fontWeight: 800,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            color: "var(--error)",
            display: "flex",
            alignItems: "center",
            gap: 6,
            marginBottom: 8,
          }}
        >
          <WarningOutlined style={{ fontSize: 12 }} /> Câu chứa lỗi sai ngữ pháp
        </span>
        <p
          style={{
            margin: 0,
            fontSize: 16,
            color: "var(--error)",
            fontWeight: 600,
            lineHeight: 1.7,
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
          fontWeight: 800,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          color: "var(--text-muted)",
          marginBottom: 8,
        }}
      >
        <EditOutlined style={{ fontSize: 12 }} /> Từ thay thế chính xác
      </label>
      <input
        id="error-correction-input"
        style={{
          width: "100%",
          borderRadius: "var(--radius-lg)",
          border: focused
            ? "2px solid var(--error)"
            : "1.5px solid var(--border)",
          background: "var(--surface)",
          padding: "12px 16px",
          fontSize: 14.5,
          color: "var(--text-primary)",
          fontWeight: 500,
          outline: "none",
          transition: "all 0.2s ease",
          boxSizing: "border-box",
          boxShadow: focused ? "0 4px 12px rgba(239, 68, 68, 0.15)" : "none",
        }}
        placeholder="Nhập từ đúng để sửa lỗi..."
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
        <m.button
          whileHover={{ scale: 1.02, y: -1 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onAnswer(text.trim())}
          style={{
            marginTop: 16,
            width: "100%",
            borderRadius: "var(--radius-lg)",
            background: "linear-gradient(135deg, var(--error), color-mix(in srgb, var(--error) 80%, white))",
            padding: "14px 0",
            fontSize: 15,
            fontWeight: 800,
            color: "var(--text-on-accent)",
            border: "none",
            cursor: "pointer",
            boxShadow: "0 6px 18px rgba(239, 68, 68, 0.25)",
          }}
        >
          <CheckOutlined style={{ fontSize: 12 }} /> Xác nhận sửa lỗi
        </m.button>
      )}
    </div>
  );
}
