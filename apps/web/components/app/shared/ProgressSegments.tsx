"use client";

import type { CSSProperties } from "react";

interface ProgressSegmentsProps {
  current: number;
  total: number;
  showLabels?: boolean;
}


export function ProgressSegments({
  current,
  total,
  showLabels = false,
}: ProgressSegmentsProps) {
  const safeTotal = Math.max(total, 1);
  const safeCurrent = Math.max(0, Math.min(current, safeTotal));

  return (
    <div>
      <div
        role="progressbar"
        aria-valuenow={safeCurrent}
        aria-valuemin={0}
        aria-valuemax={safeTotal}
        aria-label={`Progress: ${safeCurrent} of ${safeTotal}`}
        style={{
          display: "flex",
          gap: "var(--space-1)",
          width: "100%",
        }}
      >
        {Array.from({ length: safeTotal }, (_, i) => {
          let background: string;
          let extra: CSSProperties = {};

          if (i < safeCurrent) {
            // Completed
            background = "var(--success)";
          } else if (i === safeCurrent) {
            // Current — animated pulse
            background = "var(--accent)";
            extra = {
              animation: `pulse var(--duration-slow) ease-in-out infinite`,
            };
          } else {
            // Remaining
            background = "var(--border)";
          }

          return (
            <div
              key={i}
              data-segment={
                i < safeCurrent
                  ? "completed"
                  : i === safeCurrent
                    ? "current"
                    : "remaining"
              }
              style={{
                flex: 1,
                height: 6,
                borderRadius: 3,
                background,
                transition: `background var(--duration-fast) ease`,
                ...extra,
              }}
            />
          );
        })}
      </div>

      {showLabels && (
        <div
          style={{
            fontSize: "var(--text-xs)",
            color: "var(--text-muted)",
            marginTop: "var(--space-1)",
            textAlign: "center",
          }}
        >
          {safeCurrent} of {safeTotal}
        </div>
      )}
    </div>
  );
}
