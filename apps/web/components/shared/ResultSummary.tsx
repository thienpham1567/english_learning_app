"use client";

import type { ReactNode } from "react";
import { Button } from "antd";

type ResultMetric = {
  label: string;
  value: ReactNode;
};

type ResultAction = {
  label: string;
  onClick: () => void;
  primary?: boolean;
};

type ResultSummaryProps = {
  score: ReactNode;
  title: string;
  subtitle?: string;
  tone?: string;
  metrics?: ResultMetric[];
  actions?: ResultAction[];
};

export function ResultSummary({
  score,
  title,
  subtitle,
  tone = "var(--accent)",
  metrics,
  actions,
}: ResultSummaryProps) {
  return (
    <section
      style={{
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-xl)",
        background: "var(--card-bg)",
        boxShadow: "var(--shadow-sm)",
        padding: "var(--space-6)",
        textAlign: "center",
      }}
    >
      <div
        style={{
          display: "inline-grid",
          minWidth: 112,
          minHeight: 112,
          placeItems: "center",
          border: `2px solid ${tone}`,
          borderRadius: "50%",
          color: tone,
          fontSize: "var(--text-xl)",
          fontWeight: 900,
          lineHeight: 1,
          padding: "var(--space-4)",
        }}
      >
        {score}
      </div>
      <h2 style={{ margin: "var(--space-4) 0 0", color: "var(--text-primary)", fontSize: "var(--text-xl)" }}>
        {title}
      </h2>
      {subtitle && (
        <p style={{ margin: "var(--space-1) 0 0", color: "var(--text-secondary)", fontSize: "var(--text-sm)" }}>
          {subtitle}
        </p>
      )}
      {metrics && metrics.length > 0 && (
        <div style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: "var(--space-3)", marginTop: "var(--space-5)" }}>
          {metrics.map((metric) => (
            <div
              key={metric.label}
              style={{
                minWidth: 96,
                border: "1px solid var(--border)",
                borderRadius: "var(--radius)",
                background: "var(--surface-alt)",
                padding: "var(--space-3)",
              }}
            >
              <div style={{ color: "var(--text-primary)", fontWeight: 800 }}>{metric.value}</div>
              <div style={{ color: "var(--text-muted)", fontSize: "var(--text-xs)" }}>{metric.label}</div>
            </div>
          ))}
        </div>
      )}
      {actions && actions.length > 0 && (
        <div style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: "var(--space-3)", marginTop: "var(--space-5)" }}>
          {actions.map((action) => (
            <Button key={action.label} type={action.primary ? "primary" : "default"} onClick={action.onClick}>
              {action.label}
            </Button>
          ))}
        </div>
      )}
    </section>
  );
}
