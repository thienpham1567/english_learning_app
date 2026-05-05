"use client";

import { useMemo } from "react";
import Link from "next/link";
import { RightOutlined, CloseOutlined, CheckOutlined } from "@ant-design/icons";
import { summarizeErrorPatterns } from "@repo/modules/learning";
import type { ErrorPatternInput } from "@repo/modules/learning";

type Props = {
  errors: ErrorPatternInput[];
};

export function ErrorPatternSummary({ errors }: Props) {
  const patterns = useMemo(() => summarizeErrorPatterns(errors), [errors]);
  if (patterns.length === 0) return null;

  const topPatterns = patterns.slice(0, 5);

  return (
    <div>
      {/* Section label */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <div style={{ width: 3, height: 14, borderRadius: 2, background: "var(--warning)", flexShrink: 0 }} />
        <span style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.14em", color: "var(--warning)" }}>
          Mẫu lỗi thường gặp
        </span>
        <span style={{
          fontSize: 11, fontWeight: 700, padding: "1px 8px", borderRadius: 99,
          background: "color-mix(in srgb, var(--warning) 12%, var(--surface))",
          color: "var(--warning)",
          border: "1px solid color-mix(in srgb, var(--warning) 25%, transparent)",
        }}>
          {patterns.length} mẫu
        </span>
        <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {topPatterns.map((pattern) => (
          <div
            key={pattern.category.key}
            style={{
              borderRadius: 14,
              background: "var(--surface)",
              border: "1px solid var(--border)",
              overflow: "hidden",
              transition: "border-color 0.15s, box-shadow 0.15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "color-mix(in srgb, var(--warning) 35%, var(--border))";
              e.currentTarget.style.boxShadow = "var(--shadow-sm)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "var(--border)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            {/* Pattern header */}
            <div style={{
              display: "flex", alignItems: "center", gap: 12,
              padding: "12px 16px",
              background: "color-mix(in srgb, var(--warning) 5%, var(--bg))",
              borderBottom: pattern.examples.length > 0 ? "1px solid var(--border)" : "none",
            }}>
              <span style={{ fontSize: 18, lineHeight: 1, flexShrink: 0 }}>{pattern.category.emoji}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ink)", lineHeight: 1.3 }}>
                  {pattern.category.labelVi}
                </div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
                  {pattern.totalCount} lỗi · {pattern.unresolvedCount} chưa nắm
                  {pattern.recentCount > 0 && ` · ${pattern.recentCount} gần đây`}
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                {pattern.unresolvedCount > 0 && (
                  <span style={{
                    fontSize: 12, fontWeight: 800, minWidth: 22, textAlign: "center",
                    padding: "2px 8px", borderRadius: 99,
                    background: "var(--error-bg)", color: "var(--error)",
                  }}>
                    {pattern.unresolvedCount}
                  </span>
                )}
                <Link
                  href={pattern.nextAction.href}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 4,
                    fontSize: 11, fontWeight: 700, color: "var(--accent)",
                    textDecoration: "none",
                    padding: "4px 10px", borderRadius: 99,
                    border: "1.5px solid color-mix(in srgb, var(--accent) 25%, transparent)",
                    background: "color-mix(in srgb, var(--accent) 8%, transparent)",
                    transition: "all 0.15s",
                  }}
                >
                  {pattern.nextAction.label} <RightOutlined style={{ fontSize: 9 }} />
                </Link>
              </div>
            </div>

            {/* Examples */}
            {pattern.examples.length > 0 && (
              <div style={{ padding: "10px 16px", display: "flex", flexDirection: "column", gap: 6 }}>
                {pattern.examples.slice(0, 2).map((ex) => (
                  <div
                    key={ex.id}
                    style={{
                      fontSize: 12, lineHeight: 1.55,
                      padding: "8px 12px", borderRadius: 9,
                      background: "var(--bg-deep)",
                      borderLeft: "3px solid var(--border)",
                    }}
                  >
                    <span style={{ color: "var(--text-secondary)" }}>
                      {ex.questionStem.slice(0, 80)}
                    </span>
                    <span style={{ color: "var(--error)", fontWeight: 600, marginLeft: 8 }}>
                      <CloseOutlined style={{ fontSize: 9 }} /> {ex.userAnswer}
                    </span>
                    <span style={{ color: "var(--success)", fontWeight: 600, marginLeft: 6 }}>
                      <CheckOutlined style={{ fontSize: 9 }} /> {ex.correctAnswer}
                    </span>
                  </div>
                ))}
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
                  Kỹ năng: {pattern.affectedSkillIds.join(", ")}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
