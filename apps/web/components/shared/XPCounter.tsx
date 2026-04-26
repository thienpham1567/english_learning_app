"use client";

import { useEffect, useRef, useState } from "react";

interface XPCounterProps {
  value: number;
  previousValue?: number;
  label?: string;
  duration?: number;
}

function easeOutCubic(t: number): number {
  return 1 - (1 - t) ** 3;
}

export function XPCounter({
  value,
  previousValue = 0,
  label = "XP",
  duration = 600,
}: XPCounterProps) {
  const [displayValue, setDisplayValue] = useState(previousValue);
  const animFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const displayValueRef = useRef(previousValue); // B4 fix: track current display value to avoid stale closure

  useEffect(() => {
    // Cancel any in-flight animation
    if (animFrameRef.current !== null) {
      cancelAnimationFrame(animFrameRef.current);
    }

    const from = displayValueRef.current; // B4 fix: use ref not stale state closure
    const to = value;

    if (from === to) return;

    startTimeRef.current = null;

    const animate = (timestamp: number) => {
      if (startTimeRef.current === null) {
        startTimeRef.current = timestamp;
      }

      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutCubic(progress);
      const current = Math.round(from + (to - from) * easedProgress);

      displayValueRef.current = current; // keep ref in sync
      setDisplayValue(current);

      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(animate);
      } else {
        animFrameRef.current = null;
      }
    };

    animFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animFrameRef.current !== null) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [value, duration]);

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "baseline",
        gap: "var(--space-1)",
      }}
    >
      <span
        aria-live="polite"
        aria-label={`${displayValue} ${label}`}
        style={{
          fontSize: "var(--text-lg)",
          fontWeight: 700,
          color: "var(--xp)",
          fontVariantNumeric: "tabular-nums",
          lineHeight: 1,
        }}
      >
        {displayValue.toLocaleString()}
      </span>
      <span
        style={{
          fontSize: "var(--text-xs)",
          fontWeight: 600,
          color: "var(--text-muted)",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
        }}
      >
        {label}
      </span>
    </div>
  );
}
