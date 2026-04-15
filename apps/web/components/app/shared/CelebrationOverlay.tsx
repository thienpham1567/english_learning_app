"use client";

import { useEffect, useMemo, useRef, type ReactNode } from "react";

export type CelebrationTier = "small" | "medium" | "big";

interface CelebrationOverlayProps {
  tier: CelebrationTier;
  visible: boolean;
  children?: ReactNode;
  onComplete?: () => void;
}

// Confetti particle colors using project palette
const CONFETTI_COLORS = [
  "var(--accent)",
  "var(--success)",
  "var(--xp)",
  "var(--fire)",
  "var(--warning)",
  "#fff",
];

const PARTICLE_COUNT = 40;

// Pre-generate stable random particle configs to avoid hydration mismatch
// and Strict Mode double-render flickering (B1/E1 fix)
function generateParticles() {
  return Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
    left: Math.random() * 100,
    width: Math.random() * 8 + 6,
    height: Math.random() * 8 + 6,
    isCircle: Math.random() > 0.5,
    duration: 1.5 + Math.random() * 2,
    delay: Math.random() * 0.8,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
  }));
}

export function CelebrationOverlay({
  tier,
  visible,
  children,
  onComplete,
}: CelebrationOverlayProps) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Stable particle configs — generated once per mount (E1 fix)
  const particles = useMemo(() => generateParticles(), []);

  useEffect(() => {
    if (!visible) return;
    // Guard: only schedule if onComplete is defined (E3 fix)
    if (tier === "small" && onComplete) {
      timerRef.current = setTimeout(() => onComplete?.(), 200); // A1 fix: 200ms per spec
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [visible, tier, onComplete]);

  if (!visible) return null;

  // ── Small: just a border flash overlay ──
  if (tier === "small") {
    return (
      <div
        data-tier="small"
        style={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          borderRadius: "var(--radius-lg)",
          animation: "borderFlash var(--duration-fast) ease-out forwards", // A1 fix: --duration-fast = 200ms
          zIndex: 100,
        }}
      />
    );
  }

  // ── Medium: scale-bounce card + content slot ──
  if (tier === "medium") {
    return (
      <div
        data-tier="medium"
        style={{
          position: "fixed",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "rgba(0,0,0,0.45)",
          zIndex: 200,
          padding: "var(--space-6)",
        }}
        onClick={() => onComplete?.()} // B2/E5 fix: safe optional call
      >
        <div
          style={{
            background: "var(--surface)",
            borderRadius: "var(--radius-2xl)",
            padding: "var(--space-8)",
            maxWidth: 380,
            width: "100%",
            boxShadow: "var(--shadow-xl)",
            animation: "scaleBounce var(--duration-slow) cubic-bezier(0.34,1.56,0.64,1) forwards",
            textAlign: "center",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {children}
        </div>
      </div>
    );
  }

  // ── Big: fullscreen confetti + scale-bounce overlay ──
  return (
    <div
      data-tier="big"
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,0.6)",
        zIndex: 300,
        overflow: "hidden",
        padding: "var(--space-6)",
      }}
      onClick={() => onComplete?.()} // B2 fix: safe optional call
    >
      {/* Confetti particles — stable config via useMemo (E1 fix) */}
      {particles.map((p, i) => (
        <div
          key={i}
          aria-hidden="true"
          style={{
            position: "absolute",
            top: 0,
            left: `${p.left}%`,
            width: p.width,
            height: p.height,
            borderRadius: p.isCircle ? "50%" : "2px",
            background: p.color,
            animation: `confettiFall ${p.duration}s ${p.delay}s ease-in forwards`,
            pointerEvents: "none",
          }}
        />
      ))}

      {/* Content card */}
      <div
        style={{
          position: "relative",
          background: "var(--surface)",
          borderRadius: "var(--radius-2xl)",
          padding: "var(--space-8)",
          maxWidth: 400,
          width: "100%",
          boxShadow: "var(--shadow-xl)",
          animation: "scaleBounce var(--duration-slow) cubic-bezier(0.34,1.56,0.64,1) forwards",
          textAlign: "center",
          zIndex: 1,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
