"use client";

import { Card, Flex, Typography, Button, Tag } from "antd";
import {
  ClockCircleOutlined,
  RightOutlined,
  TrophyOutlined,
  PlayCircleOutlined,
  CalendarOutlined,
  InfoCircleOutlined,
  ThunderboltOutlined,
} from "@ant-design/icons";
import { ModuleHeader } from "@/components/shared/ModuleHeader";
import { CEFR_COLORS } from "@/lib/constants/cefr";
import * as m from "motion/react-client";

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
        background: "var(--bg-deep)",
      }}
    >
      <div style={{ padding: "20px 20px 0", flexShrink: 0 }}>
        <div style={{ maxWidth: 600, margin: "0 auto" }}>
          <ModuleHeader
            icon={<TrophyOutlined style={{ color: "#fff" }} />}
            gradient="linear-gradient(135deg, var(--module-assessment), #3b82f6)"
            title="Đánh giá trình độ CEFR"
            badge="Placement Test"
            subtitle="Bài kiểm tra thích ứng thông minh (Adaptive) tự động điều chỉnh độ khó để xác định chính xác trình độ tiếng Anh của bạn."
          />
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "24px 20px 48px" }}>
        <Flex vertical gap={20} style={{ maxWidth: 600, margin: "0 auto" }}>
          
          {/* Test Info Cards Grid */}
          <m.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              borderRadius: "var(--radius-xl)",
              border: "1px solid var(--border)",
              background: "var(--surface)",
              padding: "20px",
              boxShadow: "var(--shadow-sm)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <InfoCircleOutlined style={{ fontSize: 13, color: "var(--accent)" }} />
              <span style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--accent)" }}>
                Cấu trúc bài đánh giá
              </span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {[
                {
                  icon: "📝",
                  label: "30 câu hỏi",
                  desc: "10 Ngữ pháp + 10 Từ vựng + 5 Đọc + 5 Nghe",
                },
                {
                  icon: "🎯",
                  label: "Thích ứng thông minh",
                  desc: "Độ khó tự động tăng/giảm dựa vào câu trước",
                },
                {
                  icon: "⏱️",
                  label: "Khoảng 15 phút",
                  desc: "Không giới hạn thời gian mỗi câu hỏi",
                },
                {
                  icon: "📈",
                  label: "Xếp loại CEFR",
                  desc: "Đánh giá chi tiết trình độ A1 đến C2 kèm biểu đồ",
                },
              ].map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: "12px 14px",
                    background: "var(--surface-alt)",
                    borderRadius: "var(--radius-lg)",
                    border: "1px solid var(--border)",
                    display: "flex",
                    flexDirection: "column",
                    gap: 4,
                  }}
                >
                  <span style={{ fontSize: 20, marginBottom: 2 }}>{item.icon}</span>
                  <span style={{ fontSize: 13, fontWeight: 800, color: "var(--text-primary)" }}>{item.label}</span>
                  <span style={{ fontSize: 11, color: "var(--text-muted)", lineHeight: 1.4, fontWeight: 500 }}>{item.desc}</span>
                </div>
              ))}
            </div>
          </m.div>

          {/* Previous result */}
          {status?.hasResult && status.lastResult && (
            <m.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              style={{
                borderRadius: "var(--radius-xl)",
                border: "1px solid var(--border)",
                background: "var(--surface)",
                padding: "20px",
                boxShadow: "var(--shadow-sm)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                <TrophyOutlined style={{ fontSize: 13, color: "var(--accent)" }} />
                <span style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--accent)" }}>
                  Kết quả đánh giá gần nhất
                </span>
              </div>

              <Flex vertical gap={14}>
                <Flex align="center" gap={14}>
                  <div
                    style={{
                      fontSize: 32,
                      fontWeight: 900,
                      color: CEFR_COLORS[status.lastResult.overallCefr] ?? "var(--accent)",
                      background: "var(--surface-alt)",
                      border: `2px solid ${CEFR_COLORS[status.lastResult.overallCefr] ?? "var(--accent)"}`,
                      width: 58,
                      height: 58,
                      borderRadius: "50%",
                      display: "grid",
                      placeItems: "center",
                      fontFamily: "var(--font-display)",
                      boxShadow: `0 4px 12px ${CEFR_COLORS[status.lastResult.overallCefr]}33`,
                    }}
                  >
                    {status.lastResult.overallCefr}
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: "var(--text-primary)" }}>
                      Trình độ {status.lastResult.overallCefr}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2, fontWeight: 500 }}>
                      Độ tin cậy: {Math.round(status.lastResult.confidence * 100)}% · Ngày kiểm tra: {new Date(status.lastResult.completedAt).toLocaleDateString("vi-VN")}
                    </div>
                  </div>
                </Flex>

                {/* Previous skill breakdown */}
                {status.lastResult.skillBreakdown && (
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 8,
                      marginTop: 4,
                      padding: 12,
                      borderRadius: "var(--radius-lg)",
                      background: "var(--surface-alt)",
                      border: "1px solid var(--border)",
                    }}
                  >
                    {Object.entries(status.lastResult.skillBreakdown).map(
                      ([skill, sr]) => {
                        const skillColor = CEFR_COLORS[sr.cefr] ?? "var(--accent)";
                        return (
                          <div
                            key={skill}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                            }}
                          >
                            <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)" }}>
                              {SKILL_LABELS[skill] ?? skill}
                            </span>
                            <span
                              style={{
                                fontSize: 11,
                                fontWeight: 800,
                                color: skillColor,
                                background: "var(--surface)",
                                border: `1px solid ${skillColor}`,
                                padding: "2px 8px",
                                borderRadius: 99,
                              }}
                            >
                              {sr.cefr} ({sr.correct}/{sr.total})
                            </span>
                          </div>
                        );
                      },
                    )}
                  </div>
                )}
              </Flex>
            </m.div>
          )}

          {/* Start button / CD */}
          {status?.canRetake !== false ? (
            <m.button
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={onStart}
              style={{
                width: "100%",
                height: 52,
                borderRadius: "var(--radius-xl)",
                background: "linear-gradient(135deg, var(--accent), var(--accent-hover))",
                color: "var(--text-on-accent)",
                border: "none",
                fontSize: 16,
                fontWeight: 800,
                cursor: "pointer",
                boxShadow: "0 6px 20px var(--accent-muted)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
            >
              <PlayCircleOutlined />
              {status?.hasResult ? "Bắt đầu làm lại bài đánh giá" : "Bắt đầu bài đánh giá"}
              <RightOutlined style={{ fontSize: 12 }} />
            </m.button>
          ) : (
            <m.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{
                borderRadius: "var(--radius-xl)",
                background: "var(--surface-alt)",
                border: "1px solid var(--border)",
                padding: "20px",
                textAlign: "center",
              }}
            >
              <ClockCircleOutlined
                style={{
                  fontSize: 24,
                  color: "var(--text-muted)",
                  marginBottom: 8,
                }}
              />
              <div style={{ fontSize: 13, color: "var(--text-secondary)", fontWeight: 600 }}>
                Bạn đã hoàn thành bài test gần đây. Hãy ôn tập thêm và thử lại sau{" "}
                <span style={{ color: "var(--accent)", fontWeight: 800 }}>{status?.daysUntilRetake}</span> ngày nữa!
              </div>
            </m.div>
          )}
        </Flex>
      </div>
    </div>
  );
}
