"use client";

import { useEffect, useState } from "react";

/** Detects prefers-reduced-motion at runtime — returns true when motion should be suppressed */
function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(() =>
    typeof window !== "undefined"
      ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
      : false,
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return reduced;
}

interface StreakFireProps {
  streak: number;
  showCount?: boolean;
}


function getFireSize(streak: number): "small" | "medium" | "large" {
  if (streak >= 30) return "large";
  if (streak >= 7) return "medium";
  return "small";
}

const SIZE_CONFIG = {
  small: { fontSize: 20, particles: 1, label: "🔥" },
  medium: { fontSize: 28, particles: 2, label: "🔥" },
  large: { fontSize: 36, particles: 3, label: "🔥" },
};

export function StreakFire({ streak, showCount = true }: StreakFireProps) {
  const size = getFireSize(streak);
  const config = SIZE_CONFIG[size];
  const reducedMotion = useReducedMotion(); // B3 fix: detect reduced-motion in JS

  return (
    <div
      data-streak-size={size}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "var(--space-1)",
        position: "relative",
      }}
    >
      {/* Flame particles */}
      <div
        style={{
          position: "relative",
          display: "inline-flex",
          alignItems: "center",
        }}
      >
        {/* Main flame emoji with flicker animation */}
        <span
          aria-label={`${streak} day streak`}
          style={{
            fontSize: config.fontSize,
            lineHeight: 1,
            animation: reducedMotion ? "none" : "flameFlicker 1.2s ease-in-out infinite",
            display: "inline-block",
            transformOrigin: "bottom center",
          }}
        >
          {config.label}
        </span>

        {/* Extra glow particles for medium/large */}
        {config.particles >= 2 && (
          <span
            aria-hidden="true"
            style={{
              position: "absolute",
              bottom: -2,
              left: -4,
              fontSize: config.fontSize * 0.55,
              lineHeight: 1,
              animation: reducedMotion ? "none" : "flameFlicker 1.0s 0.2s ease-in-out infinite",
              display: "inline-block",
              transformOrigin: "bottom center",
              opacity: 0.7,
            }}
          >
            🔥
          </span>
        )}
        {config.particles >= 3 && (
          <span
            aria-hidden="true"
            style={{
              position: "absolute",
              bottom: -2,
              right: -4,
              fontSize: config.fontSize * 0.5,
              lineHeight: 1,
              animation: reducedMotion ? "none" : "flameFlicker 1.4s 0.4s ease-in-out infinite",
              display: "inline-block",
              transformOrigin: "bottom center",
              opacity: 0.65,
            }}
          >
            🔥
          </span>
        )}
      </div>

      {/* Streak count */}
      {showCount && streak > 0 && (
        <span
          style={{
            fontSize: "var(--text-sm)",
            fontWeight: 700,
            color: "var(--fire)",
            lineHeight: 1,
          }}
        >
          {streak}
        </span>
      )}
    </div>
  );
}
