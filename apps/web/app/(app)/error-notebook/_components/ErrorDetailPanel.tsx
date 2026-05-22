"use client";

import { useCallback } from "react";
import { Typography } from "antd";
import {
  CloseOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import * as m from "motion/react-client";
import { AnimatePresence } from "motion/react";
import type { ErrorEntry } from "../_types/types";
import { MODULE_LABELS, MODULE_ICONS } from "../_types/types";
import { DeepExplanation } from "./DeepExplanation";
import { InlinePractice } from "./InlinePractice";

const { Text } = Typography;

interface ErrorDetailPanelProps {
  error: ErrorEntry | null;
  onClose: () => void;
  onResolve: (id: string) => void;
}

export function ErrorDetailPanel({ error, onClose, onResolve }: ErrorDetailPanelProps) {
  const handleResolve = useCallback(() => {
    if (error) onResolve(error.id);
  }, [error, onResolve]);

  return (
    <>
      {/* Backdrop */}
      <AnimatePresence>
        {error && (
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: "fixed", inset: 0, zIndex: 900,
              background: "rgba(0, 0, 0, 0.3)",
              backdropFilter: "blur(4px)",
            }}
          />
        )}
      </AnimatePresence>

      {/* Panel */}
      <AnimatePresence>
        {error && (
          <m.div
            key={error.id}
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            style={{
              position: "fixed", top: 0, right: 0, bottom: 0,
              width: "min(520px, 90vw)", zIndex: 901,
              background: "var(--bg)",
              borderLeft: "1px solid var(--border)",
              boxShadow: "-8px 0 30px rgba(0, 0, 0, 0.1)",
              display: "flex", flexDirection: "column",
              overflow: "hidden",
            }}
          >
            {/* Header */}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "16px 20px",
              borderBottom: "1px solid var(--border)",
              background: "var(--surface)",
              flexShrink: 0,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {error.isResolved ? (
                  <span style={{
                    display: "inline-flex", alignItems: "center", gap: 4,
                    fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 6,
                    background: "var(--success-bg)", color: "var(--success)",
                  }}>
                    <CheckCircleOutlined style={{ fontSize: 10 }} /> Đã hiểu
                  </span>
                ) : (
                  <span style={{
                    display: "inline-flex", alignItems: "center", gap: 4,
                    fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 6,
                    background: "var(--error-bg)", color: "var(--error)",
                  }}>
                    <WarningOutlined style={{ fontSize: 10 }} /> Chưa nắm
                  </span>
                )}
                <span style={{
                  display: "inline-flex", alignItems: "center", gap: 4,
                  fontSize: 11, fontWeight: 600, color: "var(--text-secondary)",
                }}>
                  {MODULE_ICONS[error.sourceModule] ?? "📄"} {MODULE_LABELS[error.sourceModule] ?? error.sourceModule}
                </span>
              </div>
              <button
                onClick={onClose}
                style={{
                  display: "grid", placeItems: "center",
                  width: 32, height: 32, borderRadius: 8,
                  border: "1px solid var(--border)", background: "transparent",
                  color: "var(--text-muted)", cursor: "pointer",
                  fontSize: 14, transition: "all 0.15s",
                }}
              >
                <CloseOutlined />
              </button>
            </div>

            {/* Scrollable content */}
            <div style={{ flex: 1, overflow: "auto", padding: "20px" }}>
              {/* Question */}
              <Text style={{
                fontSize: 17, fontWeight: 600, lineHeight: 1.7,
                color: "var(--text-primary)", display: "block",
                marginBottom: 16,
              }}>
                {error.questionStem}
              </Text>

              {/* Options */}
              {error.options && error.options.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 20 }}>
                  {error.options.map((opt, i) => (
                    <div
                      key={i}
                      style={{
                        padding: "10px 14px", borderRadius: 10,
                        background: opt === error.correctAnswer
                          ? "color-mix(in srgb, var(--success) 8%, var(--surface))"
                          : opt === error.userAnswer && opt !== error.correctAnswer
                            ? "color-mix(in srgb, var(--error) 8%, var(--surface))"
                            : "var(--surface-alt)",
                        border: opt === error.correctAnswer
                          ? "1.5px solid var(--success)"
                          : opt === error.userAnswer && opt !== error.correctAnswer
                            ? "1.5px solid var(--error)"
                            : "1px solid var(--border)",
                        color: opt === error.correctAnswer
                          ? "var(--success)"
                          : opt === error.userAnswer && opt !== error.correctAnswer
                            ? "var(--error)"
                            : "var(--text-primary)",
                        fontWeight: (opt === error.correctAnswer || opt === error.userAnswer) ? 700 : 500,
                        fontSize: 14,
                      }}
                    >
                      {opt === error.correctAnswer && <CheckCircleOutlined style={{ marginRight: 6, fontSize: 12 }} />}
                      {opt === error.userAnswer && opt !== error.correctAnswer && <CloseCircleOutlined style={{ marginRight: 6, fontSize: 12 }} />}
                      {String.fromCharCode(65 + i)}. {opt}
                    </div>
                  ))}
                </div>
              )}

              {/* Answer comparison (when no options) */}
              {(!error.options || error.options.length === 0) && (
                <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
                  <div style={{
                    flex: 1, padding: "12px 14px", borderRadius: 10,
                    background: "color-mix(in srgb, var(--error) 6%, var(--surface))",
                    border: "1px solid color-mix(in srgb, var(--error) 18%, transparent)",
                  }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "var(--error)", textTransform: "uppercase", marginBottom: 4 }}>
                      <CloseCircleOutlined style={{ fontSize: 9 }} /> Bạn chọn
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "var(--error)" }}>
                      {error.userAnswer || "(Trống)"}
                    </div>
                  </div>
                  <div style={{
                    flex: 1, padding: "12px 14px", borderRadius: 10,
                    background: "color-mix(in srgb, var(--success) 6%, var(--surface))",
                    border: "1px solid color-mix(in srgb, var(--success) 18%, transparent)",
                  }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "var(--success)", textTransform: "uppercase", marginBottom: 4 }}>
                      <CheckCircleOutlined style={{ fontSize: 9 }} /> Đáp án đúng
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "var(--success)" }}>
                      {error.correctAnswer}
                    </div>
                  </div>
                </div>
              )}

              {/* Deep Explanation */}
              <div style={{ marginBottom: 20 }}>
                <DeepExplanation
                  errorId={error.id}
                  cached={error.deepExplanation}
                  fallbackEn={error.explanationEn}
                  fallbackVi={error.explanationVi}
                />
              </div>

              {/* Inline Practice */}
              <div style={{ marginBottom: 20 }}>
                <InlinePractice
                  errorId={error.id}
                  onResolved={() => onResolve(error.id)}
                />
              </div>

              {/* Meta info */}
              <div style={{
                padding: "12px 14px", borderRadius: 10,
                background: "var(--surface-alt)", border: "1px solid var(--border)",
                fontSize: 12, color: "var(--text-muted)",
                display: "flex", flexDirection: "column", gap: 4,
              }}>
                <div>📅 Ngày tạo: {new Date(error.createdAt).toLocaleDateString("vi-VN", { day: "numeric", month: "long", year: "numeric" })}</div>
                {error.reviewCount > 0 && <div>🧠 Đã ôn: {error.reviewCount} lần</div>}
                {error.lastReviewedAt && <div>📖 Ôn gần nhất: {new Date(error.lastReviewedAt).toLocaleDateString("vi-VN")}</div>}
                {error.nextReviewAt && <div>⏰ Ôn lại: {new Date(error.nextReviewAt).toLocaleDateString("vi-VN")}</div>}
              </div>
            </div>

            {/* Footer */}
            {!error.isResolved && (
              <div style={{
                padding: "12px 20px",
                borderTop: "1px solid var(--border)",
                background: "var(--surface)",
                flexShrink: 0,
              }}>
                <m.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleResolve}
                  style={{
                    width: "100%",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    gap: 8, padding: "12px 20px",
                    borderRadius: 12, border: "none",
                    background: "linear-gradient(135deg, var(--success), color-mix(in srgb, var(--success) 80%, var(--accent)))",
                    color: "#fff", fontSize: 14, fontWeight: 800,
                    cursor: "pointer", fontFamily: "var(--font-body)",
                    boxShadow: "0 4px 14px rgba(16, 185, 129, 0.3)",
                  }}
                >
                  <CheckCircleOutlined /> Đánh dấu đã hiểu
                </m.button>
              </div>
            )}
          </m.div>
        )}
      </AnimatePresence>
    </>
  );
}
