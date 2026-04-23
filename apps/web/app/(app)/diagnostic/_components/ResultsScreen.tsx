"use client";

import { Card, Flex, Typography, Button, Tag } from "antd";
import {
  CheckCircleFilled,
  RadarChartOutlined,
  RightOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import { CEFR_COLORS } from "@/lib/constants/cefr";

import type { TestResult } from "./types";

const { Title, Text } = Typography;

const SKILL_LABELS: Record<string, string> = {
  grammar: "Ngữ pháp",
  vocabulary: "Từ vựng",
  reading: "Đọc hiểu",
  listening: "Nghe hiểu",
};

type Props = {
  result: TestResult;
  onGoHome: () => void;
  onViewProgress: () => void;
};

export function ResultsScreen({ result, onGoHome, onViewProgress }: Props) {
  const cefrColor = CEFR_COLORS[result.overallCefr] ?? "var(--accent)";

  return (
    <div
      style={{ height: "100%", overflowY: "auto", padding: "24px 16px" }}
      className="anim-fade-up"
    >
      <Flex vertical gap={20} style={{ maxWidth: 600, margin: "0 auto" }}>
        {/* Hero result */}
        <Card
          style={{
            background: "color-mix(in srgb, var(--accent) 6%, var(--surface))",
            borderRadius: "var(--radius-xl)",
            border: "1px solid var(--border)",
            textAlign: "center",
          }}
          styles={{ body: { padding: "36px 24px" } }}
        >
          <CheckCircleFilled
            className="anim-scale-in"
            style={{ fontSize: 36, color: cefrColor, marginBottom: 12 }}
          />
          <Title level={4} style={{ margin: "0 0 8px", color: "var(--ink)" }}>
            Kết quả xếp loại
          </Title>
          <div
            className="anim-scale-in anim-delay-1"
            style={{
              fontSize: 56,
              fontWeight: 800,
              color: cefrColor,
              letterSpacing: "-0.03em",
              lineHeight: 1,
              fontFamily: "var(--font-display)",
            }}
          >
            {result.overallCefr}
          </div>
          <Flex justify="center" gap={12} style={{ marginTop: 12 }}>
            <Tag
              style={{
                borderRadius: 999,
                padding: "2px 12px",
                fontSize: 12,
                fontWeight: 600,
                border: "1px solid var(--accent)",
                background: "var(--accent-muted)",
                color: "var(--accent)",
              }}
            >
              Độ tin cậy: {Math.round(result.confidence * 100)}%
            </Tag>
            <Tag
              style={{
                borderRadius: 999,
                padding: "2px 12px",
                fontSize: 12,
                fontWeight: 600,
                border: "1px solid var(--xp)",
                background: "color-mix(in srgb, var(--xp) 10%, transparent)",
                color: "var(--xp)",
              }}
            >
              +{result.xpAwarded} XP
            </Tag>
          </Flex>
        </Card>

        {/* Skill breakdown */}
        <Card
          title={
            <span>
              <RadarChartOutlined style={{ marginRight: 6 }} /> Kỹ năng chi tiết
            </span>
          }
          style={{ borderRadius: "var(--radius-xl)" }}
          styles={{ header: { borderBottom: "1px solid var(--border)" } }}
        >
          <Flex vertical gap={14}>
            {Object.entries(result.skills).map(([skill, skillResult]) => {
              const pct = Math.round(
                (skillResult.correct / Math.max(skillResult.total, 1)) * 100,
              );
              const skillColor =
                CEFR_COLORS[skillResult.cefr] ?? "var(--accent)";
              return (
                <div key={skill} className="anim-fade-up">
                  <Flex justify="space-between" style={{ marginBottom: 6 }}>
                    <Text style={{ fontSize: 13, fontWeight: 500 }}>
                      {SKILL_LABELS[skill] ?? skill}
                    </Text>
                    <Flex gap={8} align="center">
                      <Tag
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          borderRadius: 99,
                          margin: 0,
                          border: `1px solid ${skillColor}`,
                          color: skillColor,
                          background: "transparent",
                        }}
                      >
                        {skillResult.cefr}
                      </Tag>
                      <Text type="secondary" style={{ fontSize: 11 }}>
                        {skillResult.correct}/{skillResult.total} ({pct}%)
                      </Text>
                    </Flex>
                  </Flex>
                  <div
                    style={{
                      height: 8,
                      borderRadius: 4,
                      background: "var(--border)",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        width: `${pct}%`,
                        height: "100%",
                        borderRadius: 4,
                        background: skillColor,
                        transition: "width 0.8s ease",
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </Flex>
        </Card>

        {/* Actions */}
        <Flex gap={12}>
          <Button
            type="primary"
            size="large"
            icon={<RightOutlined />}
            onClick={onGoHome}
            style={{ flex: 1, height: 48, borderRadius: 12 }}
          >
            Về trang chủ
          </Button>
          <Button
            size="large"
            icon={<ReloadOutlined />}
            onClick={onViewProgress}
            style={{ height: 48, borderRadius: 12 }}
          >
            Xem tiến độ
          </Button>
        </Flex>
      </Flex>
    </div>
  );
}
