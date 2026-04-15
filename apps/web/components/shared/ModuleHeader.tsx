"use client";

import type { ReactNode } from "react";

interface ModuleHeaderProps {
  icon: ReactNode;
  gradient: string;
  title: string;
  subtitle?: string;
  action?: ReactNode;
}

export function ModuleHeader({
  icon,
  gradient,
  title,
  subtitle,
  action,
}: ModuleHeaderProps) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "var(--space-3)",
        flexShrink: 0,
        borderBottom: "1px solid var(--border)",
        background: "var(--surface)",
        padding: "var(--space-4) var(--space-6)",
      }}
    >
      {/* Icon container */}
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: "var(--radius)",
          background: gradient,
          color: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          fontSize: 20,
        }}
      >
        {icon}
      </div>

      {/* Title + subtitle */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: "var(--text-base)",
            fontWeight: 600,
            color: "var(--text-primary)",
            lineHeight: 1.3,
          }}
        >
          {title}
        </div>
        {subtitle && (
          <div
            style={{
              fontSize: "var(--text-sm)",
              color: "var(--text-muted)",
              lineHeight: 1.4,
            }}
          >
            {subtitle}
          </div>
        )}
      </div>

      {/* Optional action slot */}
      {action && <div style={{ flexShrink: 0 }}>{action}</div>}
    </div>
  );
}
