"use client";

import type { CSSProperties, ReactNode } from "react";

type ModuleHeroStat = {
  label: string;
  value: ReactNode;
};

type ModuleHeroProps = {
  icon: ReactNode;
  tone?: string;
  eyebrow?: string;
  title: string;
  subtitle?: string;
  action?: ReactNode;
  stats?: ModuleHeroStat[];
  style?: CSSProperties;
};

export function ModuleHero({
  icon,
  tone = "var(--accent)",
  eyebrow,
  title,
  subtitle,
  action,
  stats,
  style,
}: ModuleHeroProps) {
  return (
    <section
      style={{
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-xl)",
        background: `linear-gradient(135deg, color-mix(in srgb, ${tone} 16%, var(--surface)), var(--surface))`,
        boxShadow: "var(--shadow-sm)",
        padding: "var(--space-6)",
        ...style,
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: "var(--space-4)" }}>
        <div
          style={{
            display: "grid",
            placeItems: "center",
            width: 48,
            height: 48,
            borderRadius: "var(--radius-lg)",
            background: tone,
            color: "#fff",
            flexShrink: 0,
            fontSize: 22,
          }}
        >
          {icon}
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
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
          <h1
            style={{
              margin: 0,
              color: "var(--text-primary)",
              fontFamily: "var(--font-display)",
              fontSize: "var(--text-2xl)",
              fontStyle: "italic",
              lineHeight: 1.15,
            }}
          >
            {title}
          </h1>
          {subtitle && (
            <p style={{ maxWidth: 720, margin: "6px 0 0", color: "var(--text-secondary)", fontSize: "var(--text-base)" }}>
              {subtitle}
            </p>
          )}
        </div>
        {action && <div style={{ flexShrink: 0 }}>{action}</div>}
      </div>

      {stats && stats.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-3)", marginTop: "var(--space-5)" }}>
          {stats.map((stat) => (
            <div
              key={stat.label}
              style={{
                minWidth: 96,
                border: "1px solid var(--border)",
                borderRadius: "var(--radius)",
                background: "var(--card-bg)",
                padding: "var(--space-3)",
              }}
            >
              <div style={{ color: "var(--text-primary)", fontSize: "var(--text-lg)", fontWeight: 800 }}>
                {stat.value}
              </div>
              <div style={{ color: "var(--text-muted)", fontSize: "var(--text-xs)" }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
