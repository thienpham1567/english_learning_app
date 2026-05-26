"use client";

import { Flex, Typography } from "antd";
import * as m from "motion/react-client";

const { Text } = Typography;

export interface WordScore {
  word: string;
  score: "good" | "fair" | "poor";
  tip?: string;
}

export interface EvalResult {
  overall: number;
  pronunciation: number;
  intonation: number;
  fluency: number;
  stress: number;
  transcript: string;
  wordScores: WordScore[];
  summary: string;
}

interface ShadowResultProps {
  result: EvalResult;
  referenceText: string;
}

const SCORE_COLORS: Record<string, string> = {
  good: "var(--success)",
  fair: "var(--warning, #f59e0b)",
  poor: "var(--error)",
};

const SCORE_ICONS: Record<string, string> = {
  good: "✅",
  fair: "⚠️",
  poor: "❌",
};

function getGrade(score: number): { label: string; color: string } {
  if (score >= 85) return { label: "Xuất sắc", color: "var(--success)" };
  if (score >= 70) return { label: "Tốt", color: "var(--info)" };
  if (score >= 50) return { label: "Cần cải thiện", color: "var(--warning, #f59e0b)" };
  return { label: "Cần luyện thêm", color: "var(--error)" };
}

export function ShadowResult({ result, referenceText }: ShadowResultProps) {
  const grade = getGrade(result.overall);

  return (
    <m.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        background: "var(--surface)",
        borderRadius: "var(--radius-xl)",
        border: "1px solid var(--border)",
        padding: "var(--space-5)",
        display: "flex",
        flexDirection: "column",
        gap: 20,
      }}
    >
      {/* Overall Score Ring */}
      <Flex align="center" gap={20}>
        <div
          style={{
            width: 80,
            height: 80,
            borderRadius: "50%",
            background: `conic-gradient(${grade.color} ${result.overall * 3.6}deg, var(--border) 0deg)`,
            display: "grid",
            placeItems: "center",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              background: "var(--surface)",
              display: "grid",
              placeItems: "center",
            }}
          >
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 22, fontWeight: 900, color: grade.color }}>
                {result.overall}
              </div>
              <div style={{ fontSize: 9, fontWeight: 700, color: "var(--text-muted)" }}>/ 100</div>
            </div>
          </div>
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: grade.color, marginBottom: 4 }}>
            🎯 {grade.label}
          </div>
          <Text style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6 }}>
            {result.summary}
          </Text>
        </div>
      </Flex>

      {/* Sub-scores */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        {[
          { label: "🗣️ Phát âm", value: result.pronunciation },
          { label: "🎵 Ngữ điệu", value: result.intonation },
          { label: "💨 Lưu loát", value: result.fluency },
          { label: "💪 Nhấn nhá", value: result.stress },
        ].map((s) => {
          const g = getGrade(s.value);
          return (
            <div
              key={s.label}
              style={{
                padding: "10px 14px",
                borderRadius: 12,
                background: "var(--surface-alt)",
                border: "1px solid var(--border)",
              }}
            >
              <Flex justify="space-between" align="center">
                <Text style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)" }}>
                  {s.label}
                </Text>
                <Text style={{ fontSize: 16, fontWeight: 900, color: g.color }}>{s.value}</Text>
              </Flex>
              {/* Mini progress bar */}
              <div
                style={{
                  height: 4,
                  borderRadius: 2,
                  background: "var(--border)",
                  marginTop: 6,
                  overflow: "hidden",
                }}
              >
                <m.div
                  initial={{ width: 0 }}
                  animate={{ width: `${s.value}%` }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  style={{ height: "100%", borderRadius: 2, background: g.color }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Word-level feedback */}
      {result.wordScores.length > 0 && (
        <div>
          <Text
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: "var(--text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              marginBottom: 10,
              display: "block",
            }}
          >
            📝 Chi tiết từng từ
          </Text>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
            {result.wordScores.map((w, i) => (
              <span
                key={i}
                title={w.tip || undefined}
                style={{
                  padding: "4px 10px",
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: 700,
                  color: SCORE_COLORS[w.score],
                  background: `color-mix(in srgb, ${SCORE_COLORS[w.score]} 8%, var(--surface))`,
                  border: `1px solid color-mix(in srgb, ${SCORE_COLORS[w.score]} 20%, transparent)`,
                  cursor: w.tip ? "help" : "default",
                  transition: "transform 0.1s",
                }}
              >
                {SCORE_ICONS[w.score]} {w.word}
              </span>
            ))}
          </div>

          {/* Tips for poor/fair words */}
          {result.wordScores.filter((w) => w.tip).length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {result.wordScores
                .filter((w) => w.tip)
                .map((w, i) => (
                  <div
                    key={i}
                    style={{
                      padding: "8px 12px",
                      borderRadius: 10,
                      background: "var(--surface-alt)",
                      border: "1px solid var(--border)",
                      fontSize: 12.5,
                      color: "var(--text-secondary)",
                      lineHeight: 1.5,
                      display: "flex",
                      gap: 8,
                      alignItems: "flex-start",
                    }}
                  >
                    <span style={{ color: SCORE_COLORS[w.score], fontWeight: 800, flexShrink: 0 }}>
                      {w.word}:
                    </span>
                    <span>💡 {w.tip}</span>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {/* Transcript comparison */}
      <div
        style={{
          padding: "12px 14px",
          borderRadius: 12,
          background: "var(--surface-alt)",
          border: "1px solid var(--border)",
        }}
      >
        <Text
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: "var(--text-muted)",
            textTransform: "uppercase",
            display: "block",
            marginBottom: 6,
          }}
        >
          🎯 Câu mẫu
        </Text>
        <Text
          style={{
            fontSize: 13,
            color: "var(--text-primary)",
            display: "block",
            marginBottom: 10,
            lineHeight: 1.5,
          }}
        >
          {referenceText}
        </Text>
        <Text
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: "var(--text-muted)",
            textTransform: "uppercase",
            display: "block",
            marginBottom: 6,
          }}
        >
          🎙️ Bạn đã nói
        </Text>
        <Text
          style={{
            fontSize: 13,
            color: "var(--text-secondary)",
            display: "block",
            lineHeight: 1.5,
            fontStyle: "italic",
          }}
        >
          {result.transcript || "Không nhận dạng được giọng nói"}
        </Text>
      </div>
    </m.div>
  );
}
