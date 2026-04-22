"use client";

import type { ReactNode } from "react";
import { CheckCircleOutlined, CloseCircleOutlined } from "@ant-design/icons";

type QuizOptionState = "idle" | "selected" | "correct" | "wrong";

type QuizOptionProps = {
  prefix?: ReactNode;
  label: ReactNode;
  state?: QuizOptionState;
  disabled?: boolean;
  onSelect: () => void;
};

const STATE_STYLES: Record<QuizOptionState, { border: string; background: string; color: string; weight: number }> = {
  idle: {
    border: "var(--border)",
    background: "var(--card-bg)",
    color: "var(--text-primary)",
    weight: 500,
  },
  selected: {
    border: "var(--accent)",
    background: "var(--accent-muted)",
    color: "var(--accent)",
    weight: 700,
  },
  correct: {
    border: "var(--success)",
    background: "var(--success-bg)",
    color: "var(--success)",
    weight: 700,
  },
  wrong: {
    border: "var(--error)",
    background: "var(--error-bg)",
    color: "var(--error)",
    weight: 700,
  },
};

export function QuizOption({
  prefix,
  label,
  state = "idle",
  disabled = false,
  onSelect,
}: QuizOptionProps) {
  const styles = STATE_STYLES[state];

  return (
    <button
      type="button"
      aria-pressed={state === "selected" ? "true" : "false"}
      disabled={disabled}
      onClick={onSelect}
      style={{
        display: "flex",
        width: "100%",
        alignItems: "center",
        gap: "var(--space-3)",
        border: `2px solid ${styles.border}`,
        borderRadius: "var(--radius)",
        background: styles.background,
        color: styles.color,
        cursor: disabled ? "not-allowed" : "pointer",
        font: "inherit",
        fontSize: "var(--text-sm)",
        fontWeight: styles.weight,
        lineHeight: 1.45,
        padding: "12px 14px",
        textAlign: "left",
        transition: "border-color var(--duration-fast), background var(--duration-fast), color var(--duration-fast)",
        opacity: disabled ? 0.72 : 1,
      }}
    >
      {prefix && (
        <span
          style={{
            display: "grid",
            placeItems: "center",
            width: 24,
            height: 24,
            borderRadius: 8,
            background: "color-mix(in srgb, currentColor 12%, transparent)",
            flexShrink: 0,
            fontSize: 12,
            fontWeight: 800,
          }}
        >
          {prefix}.
        </span>
      )}
      <span style={{ flex: 1, minWidth: 0 }}>{label}</span>
      {state === "correct" && <CheckCircleOutlined aria-hidden="true" />}
      {state === "wrong" && <CloseCircleOutlined aria-hidden="true" />}
    </button>
  );
}
