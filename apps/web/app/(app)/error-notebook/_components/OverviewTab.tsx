"use client";

import { useMemo } from "react";
import { Flex, Typography } from "antd";
import {
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  DatabaseOutlined,
} from "@ant-design/icons";
import * as m from "motion/react-client";
import type { ErrorEntry } from "../_types/types";
import { MODULE_LABELS, MODULE_ICONS } from "../_types/types";
import { ErrorPatternSummary } from "./ErrorPatternSummary";
import { ErrorTrendSection } from "./ErrorTrendSection";

const { Text } = Typography;

interface OverviewTabProps {
  errors: ErrorEntry[];
  total: number;
  unresolvedCount: number;
  resolvedCount: number;
  dueCount: number;
  loading: boolean;
  onGoToReview: () => void;
}

export function OverviewTab({
  errors,
  total,
  unresolvedCount,
  resolvedCount,
  dueCount,
  loading,
  onGoToReview,
}: OverviewTabProps) {
  /* ── Module distribution ── */
  const moduleStats = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const e of errors) {
      const mod = e.sourceModule;
      counts[mod] = (counts[mod] ?? 0) + 1;
    }
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);
  }, [errors]);

  if (loading) {
    return (
      <div style={{ padding: "40px 0", textAlign: "center" }}>
        <m.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1.5 }}
          style={{ fontSize: 14, color: "var(--text-muted)", fontWeight: 600 }}>
          Đang tải dữ liệu...
        </m.div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Stats Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
        {[
          {
            label: "Chưa nắm", value: unresolvedCount,
            color: unresolvedCount > 0 ? "var(--error)" : "var(--text-muted)",
            icon: <ExclamationCircleOutlined />,
            bg: "rgba(239, 68, 68, 0.05)", border: "rgba(239, 68, 68, 0.15)",
          },
          {
            label: "Đã hiểu", value: resolvedCount,
            color: "var(--success)",
            icon: <CheckCircleOutlined />,
            bg: "rgba(16, 185, 129, 0.05)", border: "rgba(16, 185, 129, 0.15)",
          },
          {
            label: "Cần ôn tập", value: dueCount,
            color: dueCount > 0 ? "var(--warning, #f59e0b)" : "var(--text-muted)",
            icon: <ClockCircleOutlined />,
            bg: "rgba(245, 158, 11, 0.05)", border: "rgba(245, 158, 11, 0.15)",
          },
          {
            label: "Tổng cộng", value: total,
            color: "var(--accent)",
            icon: <DatabaseOutlined />,
            bg: "var(--accent-light)", border: "color-mix(in srgb, var(--accent) 15%, transparent)",
          },
        ].map((stat) => (
          <m.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -2, boxShadow: "var(--shadow-md)" }}
            style={{
              display: "flex", alignItems: "center", gap: 14,
              padding: "18px 20px",
              background: "var(--surface)",
              borderRadius: "var(--radius-xl)",
              border: `1.5px solid ${stat.border}`,
              boxShadow: "var(--shadow-sm)",
              cursor: "default",
              transition: "all 0.2s",
            }}
          >
            <span style={{
              fontSize: 16, color: stat.color,
              width: 36, height: 36, borderRadius: 10,
              background: stat.bg,
              display: "grid", placeItems: "center",
            }}>
              {stat.icon}
            </span>
            <div>
              <div style={{ fontSize: 28, fontWeight: 900, color: stat.color, lineHeight: 1.1, fontFamily: "var(--font-display)" }}>
                {stat.value}
              </div>
              <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 700, marginTop: 2 }}>
                {stat.label}
              </div>
            </div>
          </m.div>
        ))}
      </div>

      {/* SRS Review CTA */}
      {dueCount > 0 && (
        <m.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ scale: 1.01, y: -2 }}
          whileTap={{ scale: 0.99 }}
          onClick={onGoToReview}
          style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            gap: 12, padding: "18px 24px",
            borderRadius: "var(--radius-xl)",
            border: "2px solid var(--accent)",
            background: "linear-gradient(135deg, color-mix(in srgb, var(--accent) 8%, var(--surface)), color-mix(in srgb, var(--xp) 5%, var(--surface)))",
            cursor: "pointer",
            boxShadow: "0 4px 14px var(--accent-muted)",
            fontFamily: "var(--font-body)",
          }}
        >
          <span style={{ fontSize: 28 }}>🧠</span>
          <div style={{ textAlign: "left" }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: "var(--accent)" }}>
              Ôn tập ngay — {dueCount} lỗi cần nhớ
            </div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 500 }}>
              Flash-card + AI giải thích giúp bạn ghi nhớ lâu hơn
            </div>
          </div>
        </m.button>
      )}

      {/* Module Distribution */}
      {moduleStats.length > 0 && (
        <div style={{
          background: "var(--surface)",
          borderRadius: "var(--radius-xl)",
          border: "1px solid var(--border)",
          padding: "var(--space-5)",
        }}>
          <Text style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 14 }}>
            📊 Phân bố theo nguồn
          </Text>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {moduleStats.map(([mod, count], i) => {
              const pct = total > 0 ? Math.round((count / total) * 100) : 0;
              return (
                <m.div
                  key={mod}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  style={{ display: "flex", alignItems: "center", gap: 10 }}
                >
                  <span style={{ fontSize: 16, width: 28, textAlign: "center" }}>
                    {MODULE_ICONS[mod] ?? "📄"}
                  </span>
                  <Text style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", width: 90, flexShrink: 0 }}>
                    {MODULE_LABELS[mod] ?? mod}
                  </Text>
                  <div style={{ flex: 1, height: 8, borderRadius: 4, background: "var(--border)", overflow: "hidden" }}>
                    <m.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.5, delay: i * 0.05 }}
                      style={{ height: "100%", borderRadius: 4, background: "var(--accent)", minWidth: 4 }}
                    />
                  </div>
                  <Text style={{ fontSize: 12, fontWeight: 800, color: "var(--accent)", width: 40, textAlign: "right" }}>
                    {count}
                  </Text>
                </m.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Error Patterns */}
      {errors.length > 0 && <ErrorPatternSummary errors={errors} />}

      {/* Error Trends */}
      {errors.length > 0 && <ErrorTrendSection errors={errors} />}
    </div>
  );
}
