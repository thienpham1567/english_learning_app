"use client";

import { Card, Flex, Typography, Button, Tag } from "antd";
import {
  ClockCircleOutlined,
  RightOutlined,
  TrophyOutlined,
} from "@ant-design/icons";
import { ModuleHeader } from "@/components/shared/ModuleHeader";
import { CEFR_COLORS } from "@/lib/constants/cefr";

import type { DiagnosticStatus } from "./types";

const { Text } = Typography;

const SKILL_LABELS: Record<string, string> = {
  grammar: "Ngữ pháp",
  vocabulary: "Từ vựng",
  reading: "Đọc hiểu",
  listening: "Nghe hiểu",
};

type Props = {
  status: DiagnosticStatus | null;
  onStart: () => void;
};

export function WelcomeScreen({ status, onStart }: Props) {
  return (
    <div
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
      className="anim-fade-up"
    >
      <ModuleHeader
        icon={<TrophyOutlined />}
        gradient="var(--gradient-diagnostic)"
        title="Bài test xếp loại CEFR 📊"
        subtitle="Adaptive Placement Test · 30 câu hỏi thích ứng"
      />

      <div style={{ flex: 1, overflow: "auto", padding: "24px 16px" }}>
        <Flex vertical gap={20} style={{ maxWidth: 600, margin: "0 auto" }}>
          {/* Test info */}
          <Card style={{ borderRadius: "var(--radius-xl)" }}>
            <Flex vertical gap={16}>
              <Text strong style={{ fontSize: 15 }}>
                Thông tin bài test:
              </Text>
              {[
                {
                  icon: "📝",
                  label: "30 câu hỏi",
                  desc: "10 ngữ pháp + 10 từ vựng + 5 đọc + 5 nghe",
                },
                {
                  icon: "🎯",
                  label: "Thích ứng",
                  desc: "Độ khó tự động điều chỉnh theo câu trả lời",
                },
                {
                  icon: "⏱️",
                  label: "~15 phút",
                  desc: "Không giới hạn thời gian cho mỗi câu",
                },
                {
                  icon: "📈",
                  label: "Kết quả",
                  desc: "Xếp loại CEFR (A1–C2) + biểu đồ kỹ năng",
                },
              ].map((item) => (
                <Flex key={item.label} align="flex-start" gap={12}>
                  <span style={{ fontSize: 20, lineHeight: 1 }}>
                    {item.icon}
                  </span>
                  <div>
                    <Text strong style={{ fontSize: 13 }}>
                      {item.label}
                    </Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {item.desc}
                    </Text>
                  </div>
                </Flex>
              ))}
            </Flex>
          </Card>

          {/* Previous result */}
          {status?.hasResult && status.lastResult && (
            <Card style={{ borderRadius: "var(--radius-xl)" }}>
              <Flex vertical gap={12}>
                <Flex align="center" gap={8}>
                  <TrophyOutlined
                    style={{
                      color: CEFR_COLORS[status.lastResult.overallCefr],
                    }}
                  />
                  <Text strong>Kết quả lần trước</Text>
                </Flex>
                <Flex align="center" gap={12}>
                  <Tag
                    color={CEFR_COLORS[status.lastResult.overallCefr]}
                    style={{
                      fontSize: 18,
                      fontWeight: 700,
                      padding: "4px 16px",
                      borderRadius: 99,
                    }}
                  >
                    {status.lastResult.overallCefr}
                  </Tag>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Độ tin cậy: {Math.round(status.lastResult.confidence * 100)}
                    %
                  </Text>
                </Flex>

                {/* Previous skill breakdown */}
                {status.lastResult.skillBreakdown && (
                  <Flex vertical gap={8} style={{ marginTop: 4 }}>
                    {Object.entries(status.lastResult.skillBreakdown).map(
                      ([skill, sr]) => (
                        <Flex
                          key={skill}
                          justify="space-between"
                          align="center"
                        >
                          <Text style={{ fontSize: 12 }}>
                            {SKILL_LABELS[skill] ?? skill}
                          </Text>
                          <Tag
                            style={{
                              fontSize: 10,
                              fontWeight: 600,
                              borderRadius: 99,
                              margin: 0,
                              border: `1px solid ${CEFR_COLORS[sr.cefr]}`,
                              color: CEFR_COLORS[sr.cefr],
                              background: "transparent",
                            }}
                          >
                            {sr.cefr} — {sr.correct}/{sr.total}
                          </Tag>
                        </Flex>
                      ),
                    )}
                  </Flex>
                )}

                <Text type="secondary" style={{ fontSize: 11 }}>
                  {new Date(status.lastResult.completedAt).toLocaleDateString(
                    "vi-VN",
                  )}
                </Text>
              </Flex>
            </Card>
          )}

          {/* Start button */}
          {status?.canRetake !== false ? (
            <Button
              type="primary"
              size="large"
              icon={<RightOutlined />}
              onClick={onStart}
              style={{
                height: 52,
                fontSize: 16,
                fontWeight: 600,
                borderRadius: 14,
              }}
            >
              {status?.hasResult ? "Làm lại test" : "Bắt đầu test"}
            </Button>
          ) : (
            <Card
              style={{ borderRadius: "var(--radius-xl)", textAlign: "center" }}
            >
              <ClockCircleOutlined
                style={{
                  fontSize: 24,
                  color: "var(--text-secondary)",
                  marginBottom: 8,
                }}
              />
              <br />
              <Text type="secondary">
                Bạn có thể làm lại test sau{" "}
                <strong>{status?.daysUntilRetake}</strong> ngày
              </Text>
            </Card>
          )}
        </Flex>
      </div>
    </div>
  );
}
