"use client";

import { useEffect, useRef, useState } from "react";

interface ScoreCounterProps {
  /** Target value to animate to */
  value: number;
  /** Duration of animation in ms (default 1200) */
  duration?: number;
  /** Prefix text (e.g., "+" or "$") */
  prefix?: string;
  /** Suffix text (e.g., " pts" or " XP") */
  suffix?: string;
  /** Additional CSS classes */
  className?: string;
  /** Whether to format with locale separators (default true) */
  formatted?: boolean;
  /** Easing function — "easeOut" for dramatic effect (default) */
  easing?: "linear" | "easeOut" | "easeInOut";
}

function ease(t: number, type: "linear" | "easeOut" | "easeInOut"): number {
  switch (type) {
    case "linear":
      return t;
    case "easeOut":
      return 1 - Math.pow(1 - t, 3);
    case "easeInOut":
      return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }
}

/**
 * Animated number counter that rolls up from 0 to `value`.
 * Slot-machine feel for XP, scores, and stats.
 */
export function ScoreCounter({
  value,
  duration = 1200,
  prefix = "",
  suffix = "",
  className = "",
  formatted = true,
  easing: easingType = "easeOut",
}: ScoreCounterProps) {
  const [display, setDisplay] = useState(0);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);
  const prevValueRef = useRef(0);

  useEffect(() => {
    const startValue = prevValueRef.current;
    const diff = value - startValue;

    if (diff === 0) {
      setDisplay(value);
      return;
    }

    startRef.current = null;

    const animate = (timestamp: number) => {
      if (startRef.current === null) startRef.current = timestamp;
      const elapsed = timestamp - startRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = ease(progress, easingType);

      setDisplay(Math.round(startValue + diff * easedProgress));

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        setDisplay(value);
        prevValueRef.current = value;
      }
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [value, duration, easingType]);

  const displayText = formatted ? display.toLocaleString() : String(display);

  return (
    <span className={className}>
      {prefix}
      {displayText}
      {suffix}
    </span>
  );
}
