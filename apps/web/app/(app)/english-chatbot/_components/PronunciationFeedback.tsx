"use client";

import { useState } from "react";
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  LoadingOutlined,
  SoundOutlined,
  DownOutlined,
  UpOutlined,
} from "@ant-design/icons";
import { Tag, Tooltip } from "antd";

type WordAnalysis = {
  word: string;
  spoken: string;
  correct: boolean;
  issue?: string;
};

export type PronFeedbackData = {
  status: "loading" | "done" | "error";
  score?: number;
  accuracy?: number;
  fluency?: number;
  wordAnalysis?: WordAnalysis[];
  tips?: string[];
  feedback?: string;
};

interface Props {
  data: PronFeedbackData;
  onListenCorrect?: () => void;
}

function getScoreColor(score: number): string {
  if (score >= 80) return "var(--success)";
  if (score >= 50) return "var(--warning)";
  return "var(--error)";
}

function getScoreBg(score: number): string {
  if (score >= 80) return "color-mix(in srgb, var(--success) 8%, transparent)";
  if (score >= 50) return "color-mix(in srgb, var(--warning) 8%, transparent)";
  return "color-mix(in srgb, var(--error) 8%, transparent)";
}

function getScoreLabel(score: number): string {
  if (score >= 90) return "Xuất sắc";
  if (score >= 80) return "Rất tốt";
  if (score >= 60) return "Khá tốt";
  if (score >= 40) return "Tạm được";
  return "Cần luyện";
}

export function PronunciationFeedback({ data, onListenCorrect }: Props) {
  const [expanded, setExpanded] = useState(false);

  // Loading state
  if (data.status === "loading") {
    return (
      <div style={{
        display: "inline-flex", alignItems: "center", gap: 6,
        padding: "4px 12px", borderRadius: 99, fontSize: 12,
        background: "var(--accent-muted)", color: "var(--accent)",
        marginTop: 4,
      }}>
        <LoadingOutlined style={{ fontSize: 11 }} />
        <span>Đang phân tích phát âm...</span>
      </div>
    );
  }

  // Error state
  if (data.status === "error") {
    return (
      <div style={{
        display: "inline-flex", alignItems: "center", gap: 6,
        padding: "4px 12px", borderRadius: 99, fontSize: 12,
        background: "var(--error-bg)", color: "var(--error)",
        marginTop: 4,
      }}>
        <CloseCircleOutlined style={{ fontSize: 11 }} />
        <span>Không thể phân tích</span>
      </div>
    );
  }

  // Done state
  const score = data.score ?? 0;
  const color = getScoreColor(score);
  const bg = getScoreBg(score);

  return (
    <div style={{ marginTop: 4 }}>
      {/* Collapsed: Score badge */}
      <button
        onClick={() => setExpanded((e) => !e)}
        style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          padding: "4px 12px", borderRadius: 99, fontSize: 12, fontWeight: 500,
          background: bg, color, border: `1px solid ${color}33`,
          cursor: "pointer", transition: "all 0.2s",
        }}
      >
        🎤 {score}/100 · {getScoreLabel(score)}
        {expanded ? <UpOutlined style={{ fontSize: 10 }} /> : <DownOutlined style={{ fontSize: 10 }} />}
      </button>

      {/* Expanded */}
      {expanded && (
        <div style={{
          marginTop: 8, padding: 12, borderRadius: 10,
          background: "var(--surface)", border: "1px solid var(--border)",
          fontSize: 13,
        }}>
          {/* Scores row */}
          <div style={{ display: "flex", gap: 16, marginBottom: 10 }}>
            <span style={{ color: "var(--text-secondary)" }}>
              Chính xác: <strong style={{ color }}>{data.accuracy ?? 0}%</strong>
            </span>
            <span style={{ color: "var(--text-secondary)" }}>
              Trôi chảy: <strong style={{ color }}>{data.fluency ?? 0}%</strong>
            </span>
          </div>

          {/* Word analysis */}
          {data.wordAnalysis && data.wordAnalysis.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 10 }}>
              {data.wordAnalysis.map((w, i) => (
                <Tooltip key={i} title={w.issue || "Chính xác!"}>
                  <Tag
                    color={w.correct ? "success" : "error"}
                    style={{ fontSize: 12, padding: "2px 6px", cursor: "help", margin: 0 }}
                  >
                    {w.correct ? <CheckCircleOutlined style={{ fontSize: 10 }} /> : <CloseCircleOutlined style={{ fontSize: 10 }} />}
                    {" "}{w.word}
                  </Tag>
                </Tooltip>
              ))}
            </div>
          )}

          {/* Tips */}
          {data.tips && data.tips.length > 0 && (
            <div style={{ marginBottom: 8 }}>
              {data.tips.map((tip, i) => (
                <p key={i} style={{ margin: "0 0 2px", fontSize: 12, color: "var(--text-secondary)" }}>
                  💡 {tip}
                </p>
              ))}
            </div>
          )}

          {/* Listen button */}
          {onListenCorrect && (
            <button
              onClick={onListenCorrect}
              style={{
                display: "inline-flex", alignItems: "center", gap: 4,
                padding: "4px 10px", borderRadius: 6, fontSize: 12,
                border: "1px solid var(--border)", background: "transparent",
                color: "var(--accent)", cursor: "pointer",
              }}
            >
              <SoundOutlined /> Nghe lại
            </button>
          )}
        </div>
      )}
    </div>
  );
}
