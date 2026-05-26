"use client";

import { AnimatePresence } from "motion/react";
import * as m from "motion/react-client";

interface LogoProps {
  collapsed?: boolean;
}

/**
 * Custom SVG logo mark — a stylised open-book with a rising spark,
 * representing learning & mastery. Renders at 1em so it scales with
 * the container's font-size.
 */
function LogoMark({ size = 22 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Open book — left page */}
      <path
        d="M16 8C12.5 6.5 8.5 6 4 7v17c4.5-1 8.5-0.5 12 1"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Open book — right page */}
      <path
        d="M16 8c3.5-1.5 7.5-2 12-1v17c-4.5-1-8.5-0.5-12 1"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Spine */}
      <path
        d="M16 8v17"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.4"
      />
      {/* Rising spark — the mastery accent */}
      <circle cx="16" cy="4" r="1.8" fill="currentColor" opacity="0.9" />
      <path
        d="M16 7V5.5"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        opacity="0.5"
      />
    </svg>
  );
}

export function Logo({ collapsed = false }: LogoProps) {
  return (
    <m.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 11,
        userSelect: "none",
      }}
    >
      {/* Icon container */}
      <m.div
        whileHover={{ scale: 1.08, rotate: -4 }}
        whileTap={{ scale: 0.95 }}
        transition={{ type: "spring", stiffness: 400, damping: 20 }}
        style={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 38,
          height: 38,
          borderRadius: 11,
          background:
            "linear-gradient(145deg, var(--accent), color-mix(in srgb, var(--accent) 70%, #1a0a04))",
          boxShadow:
            "0 6px 18px color-mix(in srgb, var(--accent) 35%, transparent), inset 0 1px 1px rgba(255,255,255,0.15)",
          flexShrink: 0,
          cursor: "pointer",
          color: "var(--text-on-accent)",
        }}
      >
        <LogoMark size={22} />

        {/* Pulse ring */}
        <m.div
          animate={{
            scale: [1, 1.25, 1],
            opacity: [0.25, 0.5, 0.25],
          }}
          transition={{ repeat: Infinity, duration: 4.5, ease: "easeInOut" }}
          style={{
            position: "absolute",
            inset: -4,
            borderRadius: 15,
            border: "1.5px solid var(--accent)",
            pointerEvents: "none",
          }}
        />
      </m.div>

      {/* Text */}
      <AnimatePresence>
        {!collapsed && (
          <m.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
            }}
          >
            <m.span
              style={{
                fontFamily: "var(--font-display)",
                fontSize: 17,
                fontWeight: 800,
                lineHeight: 1.15,
                letterSpacing: "-0.02em",
                color: "var(--ink)",
              }}
            >
              TOEIC
              <m.span style={{ color: "var(--accent)", fontWeight: 900 }}> Master</m.span>
            </m.span>
            <m.span
              style={{
                fontSize: 9.5,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.16em",
                color: "var(--text-muted)",
                marginTop: 2,
              }}
            >
              AI Study Hub
            </m.span>
          </m.div>
        )}
      </AnimatePresence>
    </m.div>
  );
}

/**
 * Exportable logo mark for reuse in OG images, sign-in, etc.
 */
export { LogoMark };
