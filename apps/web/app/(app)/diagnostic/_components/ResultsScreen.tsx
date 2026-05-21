"use client";

import { Card, Flex, Typography, Tag } from "antd";
import {
  CheckCircleFilled,
  RadarChartOutlined,
  RightOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import { CEFR_COLORS } from "@/lib/constants/cefr";
import * as m from "motion/react-client";

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
      style={{
        height: "100%",
        overflowY: "auto",
        padding: "24px 20px 48px",
        background: "var(--bg-deep)",
      }}
    >
      <Flex vertical gap={20} style={{ maxWidth: 600, margin: "0 auto" }}>
        
        {/* Hero result card */}
        <m.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 100, damping: 15 }}
          style={{
            background: "linear-gradient(135deg, color-mix(in srgb, var(--accent) 8%, var(--surface)), var(--surface))",
            borderRadius: "var(--radius-xl)",
            border: "1px solid var(--border)",
            padding: "40px 24px",
            textAlign: "center",
            boxShadow: "var(--shadow-sm)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Radial ambient glow matching the CEFR level color */}
          <div style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%)", width: 280, height: 280, borderRadius: "50%", background: `radial-gradient(circle, ${cefrColor}12 0%, transparent 70%)`, pointerEvents: "none" }} />

          <CheckCircleFilled
            style={{ fontSize: 44, color: cefrColor, marginBottom: 16 }}
            className="anim-scale-in"
          />
          <Title level={4} style={{ margin: "0 0 10px", color: "var(--text-primary)", fontWeight: 800 }}>
            Hoàn thành đánh giá trình độ!
          </Title>
          
          <m.div
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 80 }}
            style={{
              fontSize: 68,
              fontWeight: 900,
              color: cefrColor,
              letterSpacing: "-0.04em",
              lineHeight: 1.1,
              fontFamily: "var(--font-display)",
              margin: "12px 0",
              textShadow: `0 8px 24px ${cefrColor}33`,
            }}
          >
            {result.overallCefr}
          </m.div>

          <Flex justify="center" gap={12} style={{ marginTop: 16 }}>
            <span
              style={{
                borderRadius: 99,
                padding: "4px 14px",
                fontSize: 12,
                fontWeight: 800,
                border: "1px solid var(--accent)",
                background: "var(--accent-light)",
                color: "var(--accent)",
                boxShadow: "var(--shadow-sm)",
              }}
            >
              Độ tin cậy: {Math.round(result.confidence * 100)}%
            </span>
            <span
              style={{
                borderRadius: 99,
                padding: "4px 14px",
                fontSize: 12,
                fontWeight: 800,
                border: "1px solid var(--xp)",
                background: "rgba(245, 158, 11, 0.08)",
                color: "var(--xp)",
                boxShadow: "var(--shadow-sm)",
              }}
            >
              +{result.xpAwarded} XP nhận được
            </span>
          </Flex>
        </m.div>

        {/* Skill breakdown card */}
        <m.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          style={{
            borderRadius: "var(--radius-xl)",
            border: "1px solid var(--border)",
            background: "var(--surface)",
            padding: "20px",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18 }}>
            <RadarChartOutlined style={{ fontSize: 14, color: "var(--accent)" }} />
            <span style={{ fontSize: 13, fontWeight: 800, color: "var(--text-primary)", fontFamily: "var(--font-display)" }}>
              Chi tiết năng lực từng kỹ năng
            </span>
          </div>

          <Flex vertical gap={16}>
            {Object.entries(result.skills).map(([skill, skillResult], idx) => {
              const pct = Math.round(
                (skillResult.correct / Math.max(skillResult.total, 1)) * 100,
              );
              const skillColor = CEFR_COLORS[skillResult.cefr] ?? "var(--accent)";

              return (
                <div key={skill} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <Flex justify="space-between" align="center">
                    <span style={{ fontSize: 13.5, fontWeight: 700, color: "var(--text-primary)" }}>
                      {SKILL_LABELS[skill] ?? skill}
                    </span>
                    <Flex gap={8} align="center">
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 800,
                          color: skillColor,
                          border: `1px solid ${skillColor}`,
                          background: "var(--surface-alt)",
                          padding: "2px 8px",
                          borderRadius: 99,
                        }}
                      >
                        {skillResult.cefr}
                      </span>
                      <span style={{ fontSize: 11.5, color: "var(--text-muted)", fontWeight: 600 }}>
                        {skillResult.correct}/{skillResult.total} ({pct}%)
                      </span>
                    </Flex>
                  </Flex>

                  {/* Custom Progress bar */}
                  <div
                    style={{
                      height: 8,
                      borderRadius: 99,
                      background: "var(--border)",
                      position: "relative",
                      overflow: "hidden",
                    }}
                  >
                    <m.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ delay: 0.4 + idx * 0.1, duration: 0.6, ease: "easeOut" }}
                      style={{
                        position: "absolute",
                        left: 0,
                        top: 0,
                        bottom: 0,
                        background: skillColor,
                        borderRadius: 99,
                        boxShadow: `0 0 6px ${skillColor}33`,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </Flex>
        </m.div>

        {/* Action button row */}
        <Flex gap={12}>
          <m.button
            whileHover={{ scale: 1.02, y: -1 }}
            whileTap={{ scale: 0.98 }}
            onClick={onGoHome}
            style={{
              flex: 1,
              height: 48,
              borderRadius: "var(--radius-lg)",
              background: "linear-gradient(135deg, var(--accent), var(--accent-hover))",
              color: "var(--text-on-accent)",
              border: "none",
              fontSize: 15,
              fontWeight: 800,
              cursor: "pointer",
              boxShadow: "0 4px 14px var(--accent-muted)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
            }}
          >
            Về trang chủ
            <RightOutlined style={{ fontSize: 11 }} />
          </m.button>
          
          <m.button
            whileHover={{ scale: 1.02, y: -1 }}
            whileTap={{ scale: 0.98 }}
            onClick={onViewProgress}
            style={{
              height: 48,
              borderRadius: "var(--radius-lg)",
              background: "var(--surface-alt)",
              border: "1px solid var(--border)",
              color: "var(--text-secondary)",
              fontSize: 15,
              fontWeight: 700,
              padding: "0 20px",
              cursor: "pointer",
              boxShadow: "var(--shadow-sm)",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <ReloadOutlined style={{ fontSize: 13 }} />
            Xem tiến trình học
          </m.button>
        </Flex>
      </Flex>
    </div>
  );
}
