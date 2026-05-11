"use client";

import * as m from "motion/react-client";
import { AnimatePresence } from "motion/react";
import { TranslationOutlined } from "@ant-design/icons";

interface LogoProps {
  collapsed?: boolean;
}

export function Logo({ collapsed = false }: LogoProps) {
  return (
    <m.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        userSelect: "none",
      }}
    >
      {/* Icon */}
      <m.div
        whileHover={{ scale: 1.1, rotate: 5 }}
        whileTap={{ scale: 0.95 }}
        style={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 38,
          height: 38,
          borderRadius: 10,
          background: "linear-gradient(135deg, var(--accent), color-mix(in srgb, var(--accent) 50%, black))",
          boxShadow: "0 4px 12px color-mix(in srgb, var(--accent) 40%, transparent)",
          flexShrink: 0,
          cursor: "pointer",
        }}
      >
        <TranslationOutlined style={{ fontSize: 20, color: "var(--text-on-accent)" }} />
        <m.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
          transition={{ repeat: Infinity, duration: 4 }}
          style={{
            position: "absolute",
            inset: -4,
            borderRadius: 14,
            border: "2px solid var(--accent)",
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
            style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}
          >
            <m.span
              style={{
                fontFamily: '"Plus Jakarta Sans", "Inter", sans-serif',
                fontSize: 18,
                fontWeight: 800,
                lineHeight: 1.1,
                letterSpacing: "-0.02em",
                color: "var(--sidebar-text)",
              }}
            >
              TOEIC<m.span style={{ color: "var(--accent)" }}> Master</m.span>
            </m.span>
            <m.span
              style={{
                fontSize: 10,
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.15em",
                color: "var(--sidebar-text-muted, var(--text-muted))",
                marginTop: 2,
              }}
            >
              English Learning
            </m.span>
          </m.div>
        )}
      </AnimatePresence>
    </m.div>
  );
}
