"use client";

import type { ReactNode } from "react";
import { Button, Spin } from "antd";
import { ExclamationCircleOutlined, InboxOutlined } from "@ant-design/icons";

type StateBlockVariant = "loading" | "empty" | "error";

type StateBlockProps = {
  variant: StateBlockVariant;
  title: string;
  description?: string;
  icon?: ReactNode;
  actionLabel?: string;
  onAction?: () => void;
};

function defaultIconFor(variant: StateBlockVariant) {
  if (variant === "loading") return <Spin />;
  if (variant === "error") return <ExclamationCircleOutlined style={{ color: "var(--error)" }} />;
  return <InboxOutlined style={{ color: "var(--text-muted)" }} />;
}

export function StateBlock({
  variant,
  title,
  description,
  icon,
  actionLabel,
  onAction,
}: StateBlockProps) {
  return (
    <div
      role={variant === "loading" ? "status" : undefined}
      style={{
        display: "flex",
        minHeight: 220,
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "var(--space-3)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-xl)",
        background: variant === "error" ? "var(--error-bg)" : "var(--card-bg)",
        padding: "var(--space-8)",
        textAlign: "center",
      }}
    >
      <div style={{ fontSize: 28, lineHeight: 1 }}>{icon ?? defaultIconFor(variant)}</div>
      <div>
        <h2 style={{ margin: 0, color: "var(--text-primary)", fontSize: "var(--text-lg)", fontWeight: 800 }}>
          {title}
        </h2>
        {description && (
          <p style={{ margin: "4px 0 0", color: "var(--text-secondary)", fontSize: "var(--text-sm)" }}>
            {description}
          </p>
        )}
      </div>
      {actionLabel && onAction && (
        <Button type="primary" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
