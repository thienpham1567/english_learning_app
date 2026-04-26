"use client";

import { useMemo } from "react";
import { Flex, Typography, Tag, Tooltip } from "antd";
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

const { Text } = Typography;

type Props = {
  errors: TrendInput[];
};

const DIRECTION_CONFIG: Record<string, {
  icon: React.ReactNode;
  color: string;
  labelVi: string;
}> = {
  improved: {
    icon: <ArrowDownOutlined />,
    color: "var(--success)",
    labelVi: "Cải thiện",
  },
  worsened: {
    icon: <ArrowUpOutlined />,
    color: "var(--error)",
    labelVi: "Tăng lên",
  },
  stable: {
    icon: <MinusOutlined />,
    color: "var(--text-muted)",
    labelVi: "Ổn định",
  },
  new: {
    icon: <QuestionCircleOutlined />,
    color: "var(--warning)",
    labelVi: "Mới",
  },
};

function TrendCard({ trend }: { trend: CategoryTrend }) {
  const config = DIRECTION_CONFIG[trend.direction]!;
  const pctResolved = Math.round(trend.resolutionRate * 100);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "10px 14px",
        borderRadius: 10,
        background: "var(--card-bg)",
        border: "1px solid var(--border)",
        boxShadow: "var(--shadow-sm)",
      }}
    >
      <span style={{ fontSize: 18 }}>{trend.category.emoji}</span>
      <Flex vertical style={{ flex: 1, minWidth: 0 }}>
        <Flex align="center" gap={6}>
          <Text style={{ fontWeight: 600, fontSize: 13, color: "var(--ink)" }}>
            {trend.category.labelVi}
          </Text>
          {!trend.confident && (
            <Tooltip title="Cần thêm dữ liệu để đánh giá chính xác">
              <InfoCircleOutlined style={{ fontSize: 11, color: "var(--text-muted)" }} />
            </Tooltip>
          )}
        </Flex>
        <Text type="secondary" style={{ fontSize: 11, lineHeight: 1.3 }}>
          {trend.explanation}
        </Text>
      </Flex>
      <Flex vertical align="flex-end" gap={2}>
        <Tag
          style={{
            borderRadius: 6,
            fontSize: 11,
            fontWeight: 600,
            margin: 0,
            color: config.color,
            borderColor: config.color,
            background: `color-mix(in srgb, ${config.color} 8%, var(--surface))`,
          }}
        >
          {config.icon} {config.labelVi}
        </Tag>
        <Text type="secondary" style={{ fontSize: 10 }}>
          {pctResolved}% đã hiểu
        </Text>
      </Flex>
    </div>
  );
}

/**
 * Error Improvement Trend Section (Story 23.4, AC: 1-4)
 *
 * Shows improved, worsened, and needs-review error categories with
 * trend direction, resolution rate, and low-confidence indicators.
 */
export function ErrorTrendSection({ errors }: Props) {
  const trends = useMemo(() => computeErrorTrends(errors), [errors]);

  if (!trends.hasData) return null;

  const sections: Array<{ key: string; label: React.ReactNode; items: CategoryTrend[]; color: string }> = [
    { key: "improved", label: <><FallOutlined /> Cải thiện</>, items: trends.improved, color: "var(--success)" },
    { key: "worsened", label: <><RiseOutlined /> Cần chú ý</>, items: trends.worsened, color: "var(--error)" },
    { key: "needsReview", label: <><BarChartOutlined /> Cần ôn tập</>, items: trends.needsReview, color: "var(--text-muted)" },
  ].filter((s) => s.items.length > 0);

  if (sections.length === 0) return null;

  return (
    <div style={{ marginBottom: 16 }}>
      <Flex align="center" gap={8} style={{ marginBottom: 10 }}>
        <Text style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)" }}>
          <LineChartOutlined style={{ marginRight: 6 }} />Xu hướng lỗi sai
        </Text>
      </Flex>

      <Flex vertical gap={6}>
        {sections.map((section) => (
          <div key={section.key}>
            <Text
              type="secondary"
              style={{ fontSize: 11, fontWeight: 600, display: "block", marginBottom: 4 }}
            >
              {section.label}
            </Text>
            <Flex vertical gap={4}>
              {section.items.slice(0, 3).map((trend) => (
                <TrendCard key={trend.category.key} trend={trend} />
              ))}
            </Flex>
          </div>
        ))}
      </Flex>
    </div>
  );
}
