"use client";

import { useState } from "react";
import type { TranslationData } from "@/lib/daily-challenge/types";

import * as m from "motion/react-client";
import { Check, Languages } from "lucide-react";

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
          marginBottom: 14,
          fontSize: 11,
          fontWeight: 800,
          color: "var(--accent)",
          textTransform: "uppercase",
          letterSpacing: "0.08em",
        }}
      >
        ✍️ {instruction}
      </p>

      {/* Vietnamese source — quote block style */}
      <div
        style={{
          marginBottom: 20,
          borderRadius: "var(--radius-xl)",
          borderLeft: "4px solid var(--accent)",
          background: "var(--surface-alt)",
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
            color: "var(--accent)",
            display: "flex",
            alignItems: "center",
            gap: 6,
            marginBottom: 8,
          }}
        >
          <Languages size={11} /> Bản gốc tiếng Việt
        </span>
        <p
          style={{
            margin: 0,
            fontSize: 16,
            color: "var(--text-primary)",
            fontWeight: 600,
            lineHeight: 1.7,
          }}
        >
          {data.vietnamese}
        </p>
      </div>

      {/* English input */}
      <label
        htmlFor="translation-input"
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
        <Languages size={11} /> Bản dịch tiếng Anh của bạn
      </label>
      <textarea
        id="translation-input"
        rows={3}
        style={{
          width: "100%",
          borderRadius: "var(--radius-lg)",
          border: focused
            ? "2px solid var(--accent)"
            : "1.5px solid var(--border)",
          background: "var(--surface)",
          padding: "12px 16px",
          fontSize: 14.5,
          color: "var(--text-primary)",
          fontWeight: 500,
          outline: "none",
          resize: "none",
          transition: "all 0.2s ease",
          lineHeight: 1.7,
          fontFamily: "var(--font-body, inherit)",
          boxSizing: "border-box",
          boxShadow: focused ? "0 4px 12px var(--accent-muted)" : "none",
        }}
        placeholder="Nhập bản dịch tiếng Anh của bạn tại đây..."
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
            marginTop: 6,
            marginBottom: 12,
            fontWeight: 500,
          }}
        >
          Nhấn <kbd style={{ background: "var(--border)", padding: "2px 6px", borderRadius: 4, fontFamily: "var(--font-mono)", fontSize: 10 }}>Ctrl + Enter</kbd> để xác nhận nhanh
        </div>
      )}

      {/* Full-width confirm */}
      {text.trim() && !disabled && (
        <m.button
          whileHover={{ scale: 1.02, y: -1 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onAnswer(text.trim())}
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
            marginTop: 10,
          }}
        >
          <Check size={12} /> Xác nhận đáp án
        </m.button>
      )}
    </div>
  );
}
