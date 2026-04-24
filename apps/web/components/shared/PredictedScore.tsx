"use client";
import { api } from "@/lib/api-client";
import { useEffect, useState } from "react";
import { Tag } from "antd";
import {
  TrophyOutlined,
  LoadingOutlined,
  ReadOutlined,
  SoundOutlined,
} from "@ant-design/icons";

type ScoreData = {
  predicted: number;
  confidence: number;
  reading: number;
  listening: number;
  components: {
    grammar: number;
    listeningAccuracy: number;
    vocabulary: number;
    topScores: number;
  };
  dataPoints: {
    quizzes: number;
    listening: number;
    vocabulary: number;
  };
  insufficient: false;
};

type InsufficientData = {
  predicted: null;
  insufficient: true;
  quizzesNeeded: number;
  listeningNeeded: number;
};

type ApiResponse = ScoreData | InsufficientData;

/**
 * Predicted TOEIC Score card for the Progress page (Story 14.2).
 */
export function PredictedScore() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<ApiResponse>("/predicted-score")
      .then((d) => { if (d) setData(d); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{
        padding: 24,
        borderRadius: "var(--radius-lg, 16px)",
        border: "1px solid var(--border)",
        background: "var(--card-bg, var(--surface))",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: 140,
      }}>
        <LoadingOutlined style={{ fontSize: 20, color: "var(--accent)" }} />
      </div>
    );
  }

  if (!data) return null;

  // Insufficient data state
  if (data.insufficient) {
    return (
      <div style={{
        padding: "24px",
        borderRadius: "var(--radius-lg, 16px)",
        border: "1px solid var(--border)",
        background: "var(--card-bg, var(--surface))",
        textAlign: "center",
      }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>📊</div>
        <p style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", margin: "0 0 8px" }}>
          Chưa đủ dữ liệu dự đoán
        </p>
        <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: 0, lineHeight: 1.6 }}>
          {data.quizzesNeeded > 0 && `Hoàn thành thêm ${data.quizzesNeeded} bài quiz`}
          {data.quizzesNeeded > 0 && data.listeningNeeded > 0 && " và "}
          {data.listeningNeeded > 0 && `${data.listeningNeeded} bài nghe`}
          {" để xem dự đoán điểm TOEIC 📊"}
        </p>
      </div>
    );
  }

  const scoreColor = data.predicted >= 700 ? "var(--success)" : data.predicted >= 500 ? "var(--warning)" : "var(--error)";

  return (
    <div
      style={{
        padding: "24px",
        borderRadius: "var(--radius-lg, 16px)",
        border: "1px solid var(--border)",
        background: "var(--card-bg, var(--surface))",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Decorative */}
      <div style={{
        position: "absolute",
        top: -20,
        right: -20,
        width: 100,
        height: 100,
        background: `radial-gradient(circle, ${scoreColor}15, transparent 70%)`,
        pointerEvents: "none",
      }} />

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
        <TrophyOutlined style={{ fontSize: 18, color: scoreColor }} />
        <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>Dự đoán điểm TOEIC</span>
      </div>

      {/* Main score */}
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <div style={{ fontSize: 48, fontWeight: 800, color: scoreColor, letterSpacing: "-0.03em", lineHeight: 1 }}>
          ~{data.predicted}
        </div>
        <div style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 6 }}>
          ± {data.confidence} điểm
        </div>
      </div>

      {/* Reading / Listening breakdown */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
        <div style={{
          flex: 1,
          padding: "14px 16px",
          borderRadius: 10,
          background: "color-mix(in srgb, var(--info) 8%, transparent)",
          border: "1px solid color-mix(in srgb, var(--info) 15%, transparent)",
          textAlign: "center",
        }}>
          <ReadOutlined style={{ fontSize: 16, color: "var(--info)", marginBottom: 6 }} />
          <div style={{ fontSize: 11, color: "var(--text-secondary)" }}>Reading</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: "var(--info)" }}>~{data.reading}</div>
        </div>
        <div style={{
          flex: 1,
          padding: "14px 16px",
          borderRadius: 10,
          background: "color-mix(in srgb, var(--success) 8%, transparent)",
          border: "1px solid color-mix(in srgb, var(--success) 15%, transparent)",
          textAlign: "center",
        }}>
          <SoundOutlined style={{ fontSize: 16, color: "var(--success)", marginBottom: 6 }} />
          <div style={{ fontSize: 11, color: "var(--text-secondary)" }}>Listening</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: "var(--success)" }}>~{data.listening}</div>
        </div>
      </div>

      {/* Component breakdown */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {[
          { label: "Ngữ pháp", value: data.components.grammar, color: "var(--accent)", weight: "40%" },
          { label: "Nghe hiểu", value: data.components.listeningAccuracy, color: "var(--success)", weight: "30%" },
          { label: "Từ vựng", value: data.components.vocabulary, color: "var(--warning)", weight: "20%" },
          { label: "Điểm cao nhất", value: data.components.topScores, color: "var(--error)", weight: "10%" },
        ].map((comp) => (
          <div key={comp.label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 11, color: "var(--text-secondary)", width: 90, flexShrink: 0 }}>
              {comp.label}
            </span>
            <div style={{
              flex: 1,
              height: 8,
              borderRadius: 4,
              background: "var(--border)",
              overflow: "hidden",
            }}>
              <div style={{
                width: `${Math.min(comp.value, 100)}%`,
                height: "100%",
                borderRadius: 4,
                background: comp.color,
                transition: "width 0.8s ease",
              }} />
            </div>
            <Tag style={{ fontSize: 10, margin: 0, borderRadius: 99 }} color="default">
              {comp.weight}
            </Tag>
          </div>
        ))}
      </div>

      {/* Data info */}
      <div style={{
        marginTop: 16,
        fontSize: 11,
        color: "var(--text-secondary)",
        textAlign: "center",
        opacity: 0.7,
      }}>
        Dựa trên {data.dataPoints.quizzes} bài quiz · {data.dataPoints.listening} bài nghe · {data.dataPoints.vocabulary} từ vựng
      </div>
    </div>
  );
}
