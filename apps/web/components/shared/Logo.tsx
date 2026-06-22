"use client";

import { AnimatePresence } from "motion/react";
import * as m from "motion/react-client";

interface LogoProps {
  collapsed?: boolean;
}

/**
 * Custom SVG logo mark — a bold open-book with writing lines and a rising spark,
 * representing AI study & mastery.
 */
function LogoMark({ size = 20 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className="block"
    >
      {/* 3D cover slab under the pages */}
      <path
        d="M4 16 L4 18.5 L12 21.5 L20 18.5 L20 16 L12 19 Z"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      {/* Left Page (White) */}
      <path
        d="M4 6 L12 9 L12 19 L4 16 Z"
        fill="#FFFFFF"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      {/* Right Page (Gold Accent) */}
      <path
        d="M20 6 L12 9 L12 19 L20 16 Z"
        fill="var(--accent, #FFB800)"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      {/* Left Page Text Lines */}
      <path
        d="M6.5 11 L9.5 12.125 M6.5 13.5 L9.5 14.625"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        opacity="0.8"
      />
      {/* Right Page Text Lines */}
      <path
        d="M14.5 12.125 L17.5 11 M14.5 14.625 L17.5 13.5"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        opacity="0.8"
      />
      {/* Center Spine Crease */}
      <path d="M12 9 V19" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      {/* Floating Sparkle (AI Spark) */}
      <path
        d="M12 1.5 Q12 3.8 14.3 3.8 Q12 3.8 12 6.1 Q12 3.8 9.7 3.8 Q12 3.8 12 1.5 Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function Logo({ collapsed = false }: LogoProps) {
  return (
    <m.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex items-center gap-[11px] select-none"
    >
      {/* Icon container */}
      <m.div
        whileHover={{ scale: 1.05, rotate: -3 }}
        whileTap={{ scale: 0.95 }}
        transition={{ type: "spring", stiffness: 400, damping: 15 }}
        className="relative flex items-center justify-center w-[38px] h-[38px] rounded-lg bg-accent border-[2.5px] border-ink shadow-[3px_3px_0px_var(--ink)] shrink-0 cursor-pointer text-[var(--text-on-accent)]"
      >
        <LogoMark size={20} />
      </m.div>

      {/* Text */}
      <AnimatePresence>
        {!collapsed && (
          <m.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="flex flex-col justify-center"
          >
            <m.span className="font-display text-[18px] font-bold leading-[1.1] tracking-[-0.03em] text-ink uppercase">
              TOEIC
              <m.span className="text-accent"> Master</m.span>
            </m.span>
            <m.span className="text-[9.5px] font-bold uppercase tracking-[0.16em] text-text-muted mt-0.5">
              AI Study Hub
            </m.span>
          </m.div>
        )}
      </AnimatePresence>
    </m.div>
  );
}

export { LogoMark };
