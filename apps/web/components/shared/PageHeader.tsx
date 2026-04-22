"use client";

import type { CSSProperties, ReactNode } from "react";

type PageHeaderProps = {
  icon?: ReactNode;
  eyebrow?: string;
  title: string;
  subtitle?: string;
  badge?: ReactNode;
  action?: ReactNode;
  style?: CSSProperties;
};

export function PageHeader({
  icon,
  eyebrow,
  title,
  subtitle,
  badge,
  action,
  style,
}: PageHeaderProps) {
  return (
    <header
      style={{
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: "var(--space-4)",
        paddingBottom: "var(--space-4)",
        borderBottom: "1px solid var(--border)",
        ...style,
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: "var(--space-3)", minWidth: 0 }}>
        {icon && (
          <div
            style={{
              display: "grid",
              placeItems: "center",
              width: 40,
              height: 40,
              borderRadius: "var(--radius)",
              background: "var(--accent-muted)",
              color: "var(--accent)",
              flexShrink: 0,
              fontSize: 18,
            }}
          >
            {icon}
          </div>
        )}
        <div style={{ minWidth: 0 }}>
          {eyebrow && (
            <div
              style={{
                marginBottom: 2,
                color: "var(--text-muted)",
                fontSize: "var(--text-xs)",
                fontWeight: 700,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              {eyebrow}
            </div>
          )}
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", flexWrap: "wrap" }}>
            <h1
              style={{
                margin: 0,
                color: "var(--text-primary)",
                fontFamily: "var(--font-display)",
                fontSize: "var(--text-xl)",
                fontStyle: "italic",
                lineHeight: 1.2,
              }}
            >
              {title}
            </h1>
            {badge && (
              <span
                style={{
                  border: "1px solid var(--border)",
                  borderRadius: 999,
                  padding: "2px 10px",
                  color: "var(--text-secondary)",
                  background: "var(--surface-alt)",
                  fontSize: "var(--text-xs)",
                  fontWeight: 700,
                }}
              >
                {badge}
              </span>
            )}
          </div>
          {subtitle && (
            <p style={{ margin: "4px 0 0", color: "var(--text-secondary)", fontSize: "var(--text-sm)" }}>
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {action && <div style={{ flexShrink: 0 }}>{action}</div>}
    </header>
  );
}
