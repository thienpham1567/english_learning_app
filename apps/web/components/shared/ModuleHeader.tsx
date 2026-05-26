"use client";

import * as m from "motion/react-client";
import type { ReactNode } from "react";

interface ModuleHeaderProps {
  icon: ReactNode;
  gradient: string;
  title: string;
  subtitle?: string;
  action?: ReactNode;
  /** Optional tag label displayed next to icon, e.g. "BETA" */
  badge?: string;
}

export function ModuleHeader({
  icon,
  gradient,
  title,
  subtitle,
  action,
  badge,
}: ModuleHeaderProps) {
  return (
    <m.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      style={{
        borderRadius: 20,
        background: gradient,
        flexShrink: 0,
        position: "relative",
        overflow: "hidden",
        padding: action ? "22px 24px 18px" : "22px 24px",
      }}
    >
      {/* Decorative concentric arcs — top-right corner */}
      <svg
        aria-hidden
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          width: 160,
          height: "100%",
          opacity: 0.1,
          pointerEvents: "none",
          overflow: "visible",
        }}
        viewBox="0 0 160 80"
        preserveAspectRatio="xMaxYMid slice"
      >
        {[30, 55, 80, 108, 138].map((r, i) => (
          <m.circle
            key={r}
            cx={160}
            cy={0}
            r={r}
            fill="none"
            stroke="white"
            strokeWidth={0.8}
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ delay: 0.2 + i * 0.1, duration: 1.5, ease: "easeInOut" }}
          />
        ))}
        {/* Radial spokes */}
        {[0, 30, 60, 90].map((deg) => {
          const rad = (deg * Math.PI) / 180;
          return (
            <m.line
              key={deg}
              x1={160}
              y1={0}
              x2={160 + 138 * Math.cos(Math.PI + rad)}
              y2={0 + 138 * Math.sin(Math.PI + rad)}
              stroke="white"
              strokeWidth={0.5}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8, duration: 1 }}
            />
          );
        })}
      </svg>

      {/* Grain texture */}
      <div className="grain-overlay" style={{ opacity: 0.045, borderRadius: "inherit" }} />

      {/* Radial light bloom — top right */}
      <m.div
        animate={{ scale: [1, 1.1, 1], opacity: [0.15, 0.25, 0.15] }}
        transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
        style={{
          position: "absolute",
          top: "-30%",
          right: "-8%",
          width: 180,
          height: 180,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(255,255,255,0.22) 0%, transparent 65%)",
          pointerEvents: "none",
        }}
      />

      {/* ── Main row ── */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          display: "flex",
          alignItems: "center",
          gap: 18,
        }}
      >
        {/* Icon seal */}
        <m.div
          initial={{ scale: 0.8, rotate: -10, opacity: 0 }}
          animate={{ scale: 1, rotate: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 400, damping: 20, delay: 0.1 }}
          style={{
            width: 54,
            height: 54,
            borderRadius: 15,
            background: "rgba(255,255,255,0.16)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            border: "1px solid rgba(255,255,255,0.26)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            fontSize: 24,
            color: "#fff",
            boxShadow: "0 4px 16px rgba(0,0,0,0.14), inset 0 1px 0 rgba(255,255,255,0.32)",
          }}
        >
          {icon}
        </m.div>

        {/* Text */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {badge && (
            <m.span
              initial={{ opacity: 0, x: -5 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                marginBottom: 5,
              }}
            >
              <m.span
                animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                transition={{ repeat: Infinity, duration: 2 }}
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.55)",
                  display: "inline-block",
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.55)",
                  fontFamily: "var(--font-body)",
                }}
              >
                {badge}
              </span>
            </m.span>
          )}

          <m.h2
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            style={{
              margin: 0,
              fontFamily: "var(--font-display)",
              fontStyle: "italic",
              fontWeight: 700,
              fontSize: "clamp(19px, 3.5vw, 24px)",
              lineHeight: 1.18,
              color: "#fff",
              letterSpacing: "-0.2px",
              textShadow: "0 1px 10px rgba(0,0,0,0.18)",
            }}
          >
            {title}
          </m.h2>

          {subtitle && (
            <m.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.35 }}
              style={{
                margin: "4px 0 0",
                fontSize: 12.5,
                color: "rgba(255,255,255,0.68)",
                lineHeight: 1.45,
                fontFamily: "var(--font-body)",
                fontWeight: 400,
                letterSpacing: "0.01em",
              }}
            >
              {subtitle}
            </m.p>
          )}
        </div>
      </div>

      {/* ── Action slot ── */}
      {action && (
        <m.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
        >
          {/* Thin hairline divider */}
          <div
            style={{
              position: "relative",
              zIndex: 1,
              height: 1,
              background:
                "linear-gradient(90deg, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0.06) 100%)",
              margin: "14px 0 12px",
            }}
          />
          <div
            style={{
              position: "relative",
              zIndex: 1,
              display: "flex",
              gap: 8,
              overflowX: "auto",
              scrollbarWidth: "none",
            }}
          >
            {action}
          </div>
        </m.div>
      )}
    </m.div>
  );
}
