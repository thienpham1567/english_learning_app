"use client";

import type { ReactNode } from "react";
import { Progress } from "antd";

type SessionProgress = {
  current: number;
  total: number;
};

type SessionShellProps = {
  title: string;
  subtitle?: string;
  progress?: SessionProgress;
  action?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  maxWidth?: number;
};

export function SessionShell({
  title,
  subtitle,
  progress,
  action,
  children,
  footer,
  maxWidth = 720,
}: SessionShellProps) {
  const percent = progress ? Math.min(100, Math.round((progress.current / Math.max(progress.total, 1)) * 100)) : 0;

  return (
    <div
      style={{
        display: "flex",
        minHeight: 0,
        height: "100%",
        flex: 1,
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "var(--space-4)",
          borderBottom: "1px solid var(--border)",
          background: "var(--surface)",
          padding: "14px 20px",
          flexShrink: 0,
        }}
      >
        <div style={{ minWidth: 0 }}>
          <h1 style={{ margin: 0, color: "var(--text-primary)", fontSize: "var(--text-lg)", fontWeight: 800 }}>
            {title}
          </h1>
          {subtitle && (
            <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: "var(--text-sm)" }}>
              {subtitle}
            </p>
          )}
        </div>
        {action && <div style={{ flexShrink: 0 }}>{action}</div>}
      </header>

      {progress && (
        <div
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={progress.total}
          aria-valuenow={progress.current}
          style={{ flexShrink: 0, lineHeight: 0 }}
        >
          <Progress
            percent={percent}
            showInfo={false}
            size="small"
            aria-hidden="true"
            strokeColor="var(--accent)"
          />
        </div>
      )}

      <main style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "var(--space-6)" }}>
        <div style={{ width: "100%", maxWidth, margin: "0 auto" }}>
          {children}
        </div>
      </main>

      {footer && (
        <footer
          style={{
            borderTop: "1px solid var(--border)",
            background: "var(--surface)",
            padding: "var(--space-4) var(--space-6)",
            flexShrink: 0,
          }}
        >
          <div style={{ width: "100%", maxWidth, margin: "0 auto" }}>{footer}</div>
        </footer>
      )}
    </div>
  );
}
