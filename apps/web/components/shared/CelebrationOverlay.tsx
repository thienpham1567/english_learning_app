"use client";

import { type ReactNode, useEffect, useMemo, useRef } from "react";

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
  "var(--text-on-accent)",
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
        className="fixed inset-0 pointer-events-none rounded-lg z-[100]"
        style={{
          animation: "borderFlash var(--duration-fast) ease-out forwards", // A1 fix: --duration-fast = 200ms
        }}
      />
    );
  }

  // ── Medium: scale-bounce card + content slot ──
  if (tier === "medium") {
    return (
      <div
        data-tier="medium"
        className="fixed inset-0 flex items-center justify-center bg-black/45 z-[200] p-6"
        onClick={() => onComplete?.()} // B2/E5 fix: safe optional call
      >
        <div
          className="bg-surface rounded-2xl p-8 max-w-[380px] w-full shadow-xl text-center"
          style={{
            animation: "scaleBounce var(--duration-slow) cubic-bezier(0.34,1.56,0.64,1) forwards",
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
      className="fixed inset-0 flex items-center justify-center bg-black/60 z-[300] overflow-hidden p-6"
      onClick={() => onComplete?.()} // B2 fix: safe optional call
    >
      {/* Confetti particles — stable config via useMemo (E1 fix) */}
      {particles.map((p, i) => (
        <div
          key={i}
          aria-hidden="true"
          className="absolute top-0 pointer-events-none"
          style={{
            left: `${p.left}%`,
            width: p.width,
            height: p.height,
            borderRadius: p.isCircle ? "50%" : "2px",
            background: p.color,
            animation: `confettiFall ${p.duration}s ${p.delay}s ease-in forwards`,
          }}
        />
      ))}

      {/* Content card */}
      <div
        className="relative bg-surface rounded-2xl p-8 max-w-[400px] w-full shadow-xl text-center z-10"
        style={{
          animation: "scaleBounce var(--duration-slow) cubic-bezier(0.34,1.56,0.64,1) forwards",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
