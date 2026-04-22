"use client";

import type { ReactNode } from "react";
import { FilterOutlined } from "@ant-design/icons";

type FilterBarProps = {
  label?: string;
  countLabel?: string;
  action?: ReactNode;
  children: ReactNode;
};

export function FilterBar({ label = "Bộ lọc", countLabel, action, children }: FilterBarProps) {
  return (
    <section
      aria-label={label}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "var(--space-3)",
        flexWrap: "wrap",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-lg)",
        background: "var(--card-bg)",
        padding: "var(--space-3) var(--space-4)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", color: "var(--text-muted)", fontSize: "var(--text-sm)", fontWeight: 700 }}>
        <FilterOutlined aria-hidden="true" />
        <span>{label}</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", flexWrap: "wrap", flex: 1, minWidth: 180 }}>
        {children}
      </div>
      {countLabel && (
        <div style={{ color: "var(--text-muted)", fontSize: "var(--text-xs)", whiteSpace: "nowrap" }}>
          {countLabel}
        </div>
      )}
      {action && <div style={{ flexShrink: 0 }}>{action}</div>}
    </section>
  );
}
