"use client";

import type { ReactNode } from "react";

interface EmptyStateCardProps {
  icon: ReactNode;
  headline: string;
  description?: string;
  ctaLabel?: string;
  onCtaClick?: () => void;
}

export function EmptyStateCard({
  icon,
  headline,
  description,
  ctaLabel,
  onCtaClick,
}: EmptyStateCardProps) {
  return (
    <div
      className="anim-fade-up"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "var(--space-12) var(--space-6)",
        textAlign: "center",
      }}
    >
      {/* Icon */}
      <div
        style={{
          fontSize: 64,
          color: "var(--accent)",
          opacity: 0.7,
          lineHeight: 1,
          marginBottom: "var(--space-4)",
        }}
      >
        {icon}
      </div>

      {/* Headline */}
      <div
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "var(--text-xl)",
          fontWeight: 600,
          color: "var(--text-primary)",
          marginBottom: "var(--space-2)",
        }}
      >
        {headline}
      </div>

      {/* Description */}
      {description && (
        <div
          style={{
            fontSize: "var(--text-sm)",
            color: "var(--text-muted)",
            maxWidth: 280,
            lineHeight: 1.6,
            marginBottom: "var(--space-4)",
          }}
        >
          {description}
        </div>
      )}

      {/* CTA Button */}
      {ctaLabel && onCtaClick && (
        <button
          type="button"
          onClick={onCtaClick}
          style={{
            background: "var(--accent)",
            color: "var(--text-on-accent)",
            border: "none",
            borderRadius: "var(--radius)",
            padding: "var(--space-2) var(--space-6)",
            fontSize: "var(--text-sm)",
            fontFamily: "var(--font-body)",
            fontWeight: 600,
            cursor: "pointer",
            transition: `opacity var(--duration-fast) ease`,
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.opacity = "0.85";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.opacity = "1";
          }}
        >
          {ctaLabel}
        </button>
      )}
    </div>
  );
}
