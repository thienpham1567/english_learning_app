"use client";

import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import * as m from "motion/react-client";
import type { ErrorEntry } from "../_types/types";
import { MODULE_LABELS, MODULE_ICONS } from "../_types/types";

interface ErrorCardProps {
  error: ErrorEntry;
  onClick: () => void;
  index?: number;
}

export function ErrorCard({ error, onClick, index = 0 }: ErrorCardProps) {
  return (
    <m.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.03, 0.3) }}
      whileHover={{ y: -2, boxShadow: "var(--shadow-md)" }}
      onClick={onClick}
      style={{
        background: "var(--surface)",
        borderRadius: "var(--radius-xl)",
        border: "1px solid var(--border)",
        padding: "16px 18px",
        cursor: "pointer",
        transition: "all 0.15s",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Accent bar */}
      <div style={{
        position: "absolute", top: 0, left: 0, width: 3, height: "100%",
        borderRadius: "3px 0 0 3px",
        background: error.isResolved ? "var(--success)" : "var(--error)",
      }} />

      {/* Top row: status + module + date */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        {error.isResolved ? (
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 4,
            fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 6,
            background: "var(--success-bg)", color: "var(--success)",
          }}>
            <CheckCircleOutlined style={{ fontSize: 10 }} /> Đã hiểu
          </span>
        ) : (
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 4,
            fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 6,
            background: "var(--error-bg)", color: "var(--error)",
          }}>
            <WarningOutlined style={{ fontSize: 10 }} /> Chưa nắm
          </span>
        )}
        <span style={{
          display: "inline-flex", alignItems: "center", gap: 4,
          fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 6,
          background: "color-mix(in srgb, var(--accent) 8%, transparent)",
          color: "var(--accent)",
        }}>
          {MODULE_ICONS[error.sourceModule] ?? "📄"} {MODULE_LABELS[error.sourceModule] ?? error.sourceModule}
        </span>
        {error.grammarTopic && (
          <span style={{
            fontSize: 11, fontWeight: 600, color: "var(--text-muted)",
            padding: "1px 6px", borderRadius: 4, background: "var(--surface-alt)",
          }}>
            {error.grammarTopic}
          </span>
        )}
        <span style={{ marginLeft: "auto", fontSize: 11, color: "var(--text-muted)", fontWeight: 500, flexShrink: 0 }}>
          {new Date(error.createdAt).toLocaleDateString("vi-VN", { day: "numeric", month: "short" })}
        </span>
      </div>

      {/* Question */}
      <div style={{
        fontSize: 14, fontWeight: 600, lineHeight: 1.6,
        color: "var(--text-primary)",
        display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
        overflow: "hidden",
        marginBottom: 10,
      }}>
        {error.questionStem}
      </div>

      {/* Answer comparison */}
      <div style={{ display: "flex", gap: 8 }}>
        <span style={{
          display: "inline-flex", alignItems: "center", gap: 4,
          padding: "3px 10px", borderRadius: 8,
          background: "color-mix(in srgb, var(--error) 6%, var(--surface))",
          border: "1px solid color-mix(in srgb, var(--error) 15%, transparent)",
          fontSize: 12, fontWeight: 700, color: "var(--error)",
        }}>
          <CloseCircleOutlined style={{ fontSize: 9 }} /> {error.userAnswer || "(Trống)"}
        </span>
        <span style={{
          display: "inline-flex", alignItems: "center", gap: 4,
          padding: "3px 10px", borderRadius: 8,
          background: "color-mix(in srgb, var(--success) 6%, var(--surface))",
          border: "1px solid color-mix(in srgb, var(--success) 15%, transparent)",
          fontSize: 12, fontWeight: 700, color: "var(--success)",
        }}>
          <CheckCircleOutlined style={{ fontSize: 9 }} /> {error.correctAnswer}
        </span>
      </div>

      {/* Review info */}
      {error.reviewCount > 0 && (
        <div style={{ marginTop: 8, fontSize: 10, color: "var(--text-muted)", fontWeight: 600 }}>
          🧠 Đã ôn {error.reviewCount} lần
          {error.nextReviewAt && ` · Ôn lại: ${new Date(error.nextReviewAt).toLocaleDateString("vi-VN", { day: "numeric", month: "short" })}`}
        </div>
      )}
    </m.div>
  );
}
