"use client";

import * as m from "motion/react-client";

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
  small: { fontSize: 20, particles: 1 },
  medium: { fontSize: 28, particles: 2 },
  large: { fontSize: 36, particles: 3 },
};

export function StreakFire({ streak, showCount = true }: StreakFireProps) {
  const size = getFireSize(streak);
  const config = SIZE_CONFIG[size];

  return (
    <m.div
      whileHover={{ scale: 1.05 }}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        position: "relative",
        cursor: "default",
      }}
    >
      <div style={{ position: "relative", display: "inline-flex", alignItems: "center" }}>
        {/* Main flame */}
        <m.span
          animate={{
            scale: [1, 1.1, 1],
            rotate: [0, -3, 3, 0],
            filter: [
              "drop-shadow(0 0 2px rgba(249,115,22,0.4))",
              "drop-shadow(0 0 8px rgba(249,115,22,0.7))",
              "drop-shadow(0 0 2px rgba(249,115,22,0.4))",
            ],
          }}
          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
          style={{
            fontSize: config.fontSize,
            lineHeight: 1,
            display: "inline-block",
            transformOrigin: "bottom center",
            zIndex: 2,
          }}
        >
          🔥
        </m.span>

        {/* Particles */}
        {config.particles >= 2 && (
          <m.span
            animate={{
              scale: [1, 1.2, 1],
              rotate: [0, 5, -5, 0],
              opacity: [0.5, 0.8, 0.5],
            }}
            transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut", delay: 0.2 }}
            style={{
              position: "absolute",
              bottom: -2,
              left: -4,
              fontSize: config.fontSize * 0.55,
              lineHeight: 1,
              display: "inline-block",
              transformOrigin: "bottom center",
              zIndex: 1,
            }}
          >
            🔥
          </m.span>
        )}
        {config.particles >= 3 && (
          <m.span
            animate={{
              scale: [1, 1.1, 1],
              rotate: [0, -5, 5, 0],
              opacity: [0.4, 0.7, 0.4],
            }}
            transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut", delay: 0.4 }}
            style={{
              position: "absolute",
              bottom: -2,
              right: -4,
              fontSize: config.fontSize * 0.5,
              lineHeight: 1,
              display: "inline-block",
              transformOrigin: "bottom center",
              zIndex: 1,
            }}
          >
            🔥
          </m.span>
        )}
      </div>

      {showCount && streak > 0 && (
        <m.span
          initial={{ opacity: 0, x: -5 }}
          animate={{ opacity: 1, x: 0 }}
          style={{
            fontSize: size === "large" ? 18 : 14,
            fontWeight: 800,
            color: "var(--fire, #f97316)",
            lineHeight: 1,
            fontFamily: "var(--font-display)",
          }}
        >
          {streak}
        </m.span>
      )}
    </m.div>
  );
}
