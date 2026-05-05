"use client";

import { useMemo } from "react";
import { Tooltip } from "antd";
import {
  ArrowUpOutlined,
  ArrowDownOutlined,
  MinusOutlined,
  QuestionCircleOutlined,
  InfoCircleOutlined,
  RiseOutlined,
  FallOutlined,
  BarChartOutlined,
  LineChartOutlined,
} from "@ant-design/icons";
import { computeErrorTrends } from "@repo/modules/learning";
import type { TrendInput, CategoryTrend } from "@repo/modules/learning";

type Props = {
  errors: TrendInput[];
};

const DIRECTION_CONFIG: Record<string, { icon: React.ReactNode; color: string; label: string; bg: string }> = {
  improved: {
    icon: <ArrowDownOutlined style={{ fontSize: 10 }} />,
    color: "var(--success)",
    bg: "var(--success-bg)",
    label: "Cải thiện",
  },
  worsened: {
    icon: <ArrowUpOutlined style={{ fontSize: 10 }} />,
    color: "var(--error)",
    bg: "var(--error-bg)",
    label: "Tăng lên",
  },
  stable: {
    icon: <MinusOutlined style={{ fontSize: 10 }} />,
    color: "var(--text-muted)",
    bg: "var(--bg-deep)",
    label: "Ổn định",
  },
  new: {
    icon: <QuestionCircleOutlined style={{ fontSize: 10 }} />,
    color: "var(--warning)",
    bg: "color-mix(in srgb, var(--warning) 10%, var(--surface))",
    label: "Mới",
  },
};

function TrendRow({ trend }: { trend: CategoryTrend }) {
  const config = DIRECTION_CONFIG[trend.direction]!;
  const pctResolved = Math.round(trend.resolutionRate * 100);

  return (
    <div
      style={{
        display: "flex", alignItems: "center", gap: 12,
        padding: "10px 14px", borderRadius: 10,
        background: "var(--surface)", border: "1px solid var(--border)",
        transition: "border-color 0.15s",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = `color-mix(in srgb, ${config.color} 30%, var(--border))`; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border)"; }}
    >
      <span style={{ fontSize: 16, flexShrink: 0 }}>{trend.category.emoji}</span>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)" }}>
            {trend.category.labelVi}
          </span>
          {!trend.confident && (
            <Tooltip title="Cần thêm dữ liệu để đánh giá chính xác">
              <InfoCircleOutlined style={{ fontSize: 11, color: "var(--text-muted)" }} />
            </Tooltip>
          )}
        </div>
        <div style={{ fontSize: 11, color: "var(--text-muted)", lineHeight: 1.4, marginTop: 1 }}>
          {trend.explanation}
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, flexShrink: 0 }}>
        <span style={{
          display: "inline-flex", alignItems: "center", gap: 4,
          fontSize: 11, fontWeight: 700, padding: "2px 9px", borderRadius: 99,
          color: config.color, background: config.bg,
        }}>
          {config.icon} {config.label}
        </span>
        <span style={{ fontSize: 10, color: "var(--text-muted)" }}>{pctResolved}% đã hiểu</span>
      </div>
    </div>
  );
}

export function ErrorTrendSection({ errors }: Props) {
  const trends = useMemo(() => computeErrorTrends(errors), [errors]);
  if (!trends.hasData) return null;

  const sections: Array<{ key: string; icon: React.ReactNode; label: string; items: CategoryTrend[]; color: string }> = [
    { key: "worsened", icon: <RiseOutlined />, label: "Cần chú ý", items: trends.worsened, color: "var(--error)" },
    { key: "improved", icon: <FallOutlined />, label: "Cải thiện", items: trends.improved, color: "var(--success)" },
    { key: "needsReview", icon: <BarChartOutlined />, label: "Cần ôn tập", items: trends.needsReview, color: "var(--text-muted)" },
  ].filter((s) => s.items.length > 0);

  if (sections.length === 0) return null;

  return (
    <div>
      {/* Section label */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <div style={{ width: 3, height: 14, borderRadius: 2, background: "var(--text-muted)", flexShrink: 0 }} />
        <span style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.14em", color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: 6 }}>
          <LineChartOutlined style={{ fontSize: 12 }} /> Xu hướng lỗi sai
        </span>
        <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {sections.map((section) => (
          <div key={section.key}>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              fontSize: 11, fontWeight: 700, color: section.color,
              marginBottom: 6,
            }}>
              {section.icon} {section.label}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              {section.items.slice(0, 3).map((trend) => (
                <TrendRow key={trend.category.key} trend={trend} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
