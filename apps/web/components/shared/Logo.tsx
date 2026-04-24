"use client";

import React from "react";

interface LogoProps {
  collapsed?: boolean;
}

export function Logo({ collapsed = false }: LogoProps) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        userSelect: "none",
      }}
    >
      {/* Icon */}
      <div
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
        }}
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--text-on-accent)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M5 6h14" />
          <path d="M12 6v11" />
          <circle cx="12" cy="20" r="1.5" fill="var(--text-on-accent)" stroke="none" />
        </svg>
      </div>

      {/* Text */}
      {!collapsed && (
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <span
            style={{
              fontFamily: '"Plus Jakarta Sans", "Inter", sans-serif',
              fontSize: 18,
              fontWeight: 800,
              lineHeight: 1.1,
              letterSpacing: "-0.02em",
              color: "var(--sidebar-text)",
            }}
          >
            THIEN<span style={{ color: "var(--accent)" }}>GLISH</span>
          </span>
          <span
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
          </span>
        </div>
      )}
    </div>
  );
}
