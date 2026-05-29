"use client";

import { useCallback, useEffect, useRef } from "react";

/**
 * Lightweight confetti burst using CSS animations + DOM elements.
 * No external dependency needed — pure DOM particles.
 */

const COLORS = [
  "var(--accent)",
  "var(--fire)",
  "var(--xp)",
  "var(--success)",
  "var(--secondary)",
  "var(--info)",
];

function createParticle(container: HTMLElement, x: number, y: number) {
  const el = document.createElement("div");
  const color = COLORS[Math.floor(Math.random() * COLORS.length)];
  const size = 6 + Math.random() * 6;
  const angle = Math.random() * Math.PI * 2;
  const velocity = 80 + Math.random() * 160;
  const dx = Math.cos(angle) * velocity;
  const dy = Math.sin(angle) * velocity - 100; // bias upward
  const rotation = Math.random() * 720 - 360;
  const duration = 800 + Math.random() * 600;

  Object.assign(el.style, {
    position: "fixed",
    left: `${x}px`,
    top: `${y}px`,
    width: `${size}px`,
    height: `${size}px`,
    backgroundColor: color,
    borderRadius: Math.random() > 0.5 ? "2px" : "50%",
    border: "1.5px solid var(--ink)",
    pointerEvents: "none",
    zIndex: "9999",
    transform: "translate(0, 0) rotate(0deg)",
    transition: `transform ${duration}ms cubic-bezier(0.25, 0.46, 0.45, 0.94), opacity ${duration}ms ease-out`,
    opacity: "1",
  });

  container.appendChild(el);

  // Trigger animation in next frame
  requestAnimationFrame(() => {
    el.style.transform = `translate(${dx}px, ${dy}px) rotate(${rotation}deg)`;
    el.style.opacity = "0";
  });

  setTimeout(() => el.remove(), duration + 50);
}

/**
 * Trigger a confetti burst at a specific position.
 * @param x - X coordinate (viewport)
 * @param y - Y coordinate (viewport)
 * @param count - Number of particles (default 40)
 */
export function triggerConfetti(x: number, y: number, count = 40) {
  const container = document.createElement("div");
  container.style.position = "fixed";
  container.style.inset = "0";
  container.style.pointerEvents = "none";
  container.style.zIndex = "9999";
  document.body.appendChild(container);

  for (let i = 0; i < count; i++) {
    setTimeout(() => createParticle(container, x, y), i * 15);
  }

  setTimeout(() => container.remove(), 2000);
}

/**
 * Trigger a celebration appropriate for the streak milestone.
 */
export function triggerStreakCelebration(days: number) {
  const cx = window.innerWidth / 2;
  const cy = window.innerHeight * 0.4;

  if (days >= 30) {
    // Legendary: 3 bursts from different positions
    triggerConfetti(cx, cy, 60);
    setTimeout(() => triggerConfetti(cx - 200, cy + 50, 30), 200);
    setTimeout(() => triggerConfetti(cx + 200, cy + 50, 30), 400);
  } else if (days >= 14) {
    // Strong: double burst
    triggerConfetti(cx, cy, 50);
    setTimeout(() => triggerConfetti(cx, cy - 50, 30), 300);
  } else if (days >= 7) {
    // Weekly: single burst
    triggerConfetti(cx, cy, 40);
  } else if (days >= 3) {
    // Starting: small burst
    triggerConfetti(cx, cy, 20);
  }
}

/**
 * Hook to trigger streak celebration on dashboard mount.
 * Only fires once per milestone (tracked in localStorage).
 */
export function useStreakCelebration(currentStreak: number | undefined) {
  const triggeredRef = useRef(false);

  const checkAndCelebrate = useCallback(() => {
    if (triggeredRef.current || !currentStreak || currentStreak < 3) return;
    triggeredRef.current = true;

    const lastCelebrated = Number(localStorage.getItem("streak-celebrated") ?? "0");
    const milestones = [3, 7, 14, 21, 30, 50, 100];
    const currentMilestone = milestones.filter((m) => currentStreak >= m).pop() ?? 0;

    if (currentMilestone > lastCelebrated) {
      localStorage.setItem("streak-celebrated", String(currentMilestone));
      // Delay slightly for dashboard to render
      setTimeout(() => triggerStreakCelebration(currentStreak), 800);
    }
  }, [currentStreak]);

  useEffect(() => {
    checkAndCelebrate();
  }, [checkAndCelebrate]);
}
