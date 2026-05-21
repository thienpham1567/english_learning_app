"use client";

import { useState, useCallback } from "react";
import * as m from "motion/react-client";
import { Skeleton } from "antd";
import {
  BarChartOutlined,
  LoadingOutlined,
  CalendarOutlined,
  ThunderboltOutlined,
  FireOutlined,
  BookOutlined,
  TrophyOutlined,
  WarningOutlined,
  RightOutlined,
} from "@ant-design/icons";
import { api } from "@/lib/api-client";

type WeeklyStats = {
  totalActivities: number;
  totalXP: number;
  daysActive: number;
  challengesCompleted: number;
  avgChallengeScore: string;
  newVocabulary: number;
  listeningExercises: number;
  listeningAccuracy: number | null;
  unresolvedErrors: number;
  weakestTopic: string | null;
  currentStreak: number;
  bestStreak: number;
};

type ReportData = {
  report: string | null;
  stats: WeeklyStats;
  insufficient: boolean;
};

/**
 * AI-powered weekly learning report widget for the dashboard.
 * Shows a CTA button, then fetches and displays personalized weekly analysis.
 */
export function WeeklyReport() {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchReport = useCallback(async () => {
    if (data || loading) return;
    setLoading(true);
    try {
      const result = await api.get<ReportData>("/dashboard/weekly-report");
      setData(result);
    } catch {
      /* ignore */
    }
    setLoading(false);
  }, [data, loading]);

  // CTA state
  if (!data && !loading) {
    return (
      <m.button
        type="button"
        onClick={fetchReport}
        whileHover={{ y: -3, scale: 1.01, boxShadow: "var(--shadow-md)" }}
        whileTap={{ scale: 0.99 }}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: 14,
          padding: "18px 20px",
          borderRadius: "var(--radius-xl)",
          border: "1px solid color-mix(in srgb, var(--accent) 25%, var(--border))",
          background: "linear-gradient(135deg, color-mix(in srgb, var(--accent) 8%, var(--surface)), var(--surface))",
          cursor: "pointer",
          textAlign: "left",
          position: "relative",
          overflow: "hidden",
          boxShadow: "var(--shadow-sm)",
        }}
      >
        {/* Glow backdrop */}
        <div style={{ position: "absolute", right: -40, top: -40, width: 140, height: 140, borderRadius: "50%", background: "radial-gradient(circle, color-mix(in srgb, var(--accent) 15%, transparent) 0%, transparent 70%)", pointerEvents: "none" }} />

        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: "var(--radius-lg)",
            background: "linear-gradient(135deg, var(--accent), var(--accent-hover))",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            boxShadow: "0 4px 12px var(--accent-muted)",
          }}
        >
          <BarChartOutlined style={{ fontSize: 20, color: "#fff" }} />
        </div>
        
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: "var(--text-primary)", fontFamily: "var(--font-display)" }}>
            Báo cáo phân tích tuần
          </div>
          <div style={{ fontSize: 12.5, color: "var(--text-muted)", marginTop: 3, fontWeight: 500 }}>
            Nhận phân tích từ AI về tiến độ và thói quen học tập của bạn
          </div>
        </div>

        <RightOutlined style={{ fontSize: 13, color: "var(--text-muted)", marginLeft: 6 }} />
      </m.button>
    );
  }

  // Loading
  if (loading) {
    return (
      <div
        style={{
          padding: 20,
          borderRadius: "var(--radius-xl)",
          background: "var(--surface)",
          border: "1px solid var(--border)",
          boxShadow: "var(--shadow-sm)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
          <LoadingOutlined spin style={{ fontSize: 14, color: "var(--accent)" }} />
          <span style={{ fontSize: 13.5, fontWeight: 700, color: "var(--text-primary)" }}>
            AI đang tổng hợp và phân tích hoạt động của bạn...
          </span>
        </div>
        <Skeleton active paragraph={{ rows: 4 }} round />
      </div>
    );
  }

  if (!data) return null;

  const { stats, report, insufficient } = data;

  return (
    <m.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        borderRadius: "var(--radius-xl)",
        background: "var(--surface)",
        border: "1px solid var(--border)",
        boxShadow: "var(--shadow-sm)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "16px 20px",
          background: "var(--surface-alt)",
          borderBottom: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <BarChartOutlined style={{ fontSize: 14, color: "var(--accent)" }} />
        <span style={{ fontSize: 14, fontWeight: 800, color: "var(--text-primary)", fontFamily: "var(--font-display)" }}>
          Phân tích học tập tuần này
        </span>
        <span style={{ marginLeft: "auto", fontSize: 11, color: "var(--text-muted)", fontWeight: 700 }}>
          7 ngày gần nhất
        </span>
      </div>

      {/* Quick Stats Floating Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 10,
          padding: "16px 20px",
        }}
      >
        {[
          { icon: <CalendarOutlined style={{ color: "var(--accent)" }} />, value: `${stats.daysActive}/7`, label: "Ngày học", bg: "var(--accent-light)" },
          { icon: <ThunderboltOutlined style={{ color: "var(--xp)" }} />, value: stats.totalXP.toLocaleString(), label: "XP nhận được", bg: "rgba(245, 158, 11, 0.08)" },
          { icon: <FireOutlined style={{ color: "#f97316" }} />, value: stats.currentStreak, label: "Chuỗi ngày", bg: "rgba(249, 115, 22, 0.08)" },
          { icon: <BookOutlined style={{ color: "#10b981" }} />, value: stats.newVocabulary, label: "Từ vựng mới", bg: "rgba(16, 185, 129, 0.08)" },
          { icon: <TrophyOutlined style={{ color: "var(--xp)" }} />, value: stats.avgChallengeScore, label: "Điểm trung bình", bg: "rgba(245, 158, 11, 0.08)" },
          { icon: <WarningOutlined style={{ color: "#ef4444" }} />, value: stats.unresolvedErrors, label: "Lỗi cần sửa", bg: "rgba(239, 68, 68, 0.06)" },
        ].map((s) => (
          <div
            key={s.label}
            style={{
              padding: "12px 8px",
              background: "var(--surface-alt)",
              borderRadius: "var(--radius-lg)",
              border: "1px solid var(--border)",
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 4,
            }}
          >
            <div
              style={{
                width: 24,
                height: 24,
                borderRadius: "50%",
                background: s.bg,
                display: "grid",
                placeItems: "center",
              }}
            >
              {s.icon}
            </div>
            <div style={{ fontSize: 18, fontWeight: 900, color: "var(--text-primary)", fontFamily: "var(--font-mono)", lineHeight: 1.2 }}>
              {s.value}
            </div>
            <div style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 700 }}>
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {/* Gradient divider */}
      <div style={{ height: 1, background: "linear-gradient(90deg, transparent, var(--border), transparent)", marginInline: 20 }} />

      {/* AI Report Block */}
      {report && (
        <div style={{ padding: "18px 20px" }}>
          <div
            style={{
              fontSize: 14,
              lineHeight: 1.8,
              color: "var(--text-primary)",
              whiteSpace: "pre-wrap",
              fontWeight: 500,
            }}
            dangerouslySetInnerHTML={{
              __html: report
                .replace(/\*\*([^*]+)\*\*/g, '<strong style="color: var(--accent); fontWeight: 800;">$1</strong>')
                .replace(/\n/g, "<br />"),
            }}
          />
        </div>
      )}

      {insufficient && (
        <div style={{ padding: "24px 20px", textAlign: "center" }}>
          <div style={{ fontSize: 32, opacity: 0.3, marginBottom: 12, color: "var(--text-muted)" }}>
            <WarningOutlined />
          </div>
          <div style={{ fontSize: 14.5, fontWeight: 800, color: "var(--text-primary)" }}>
            Chưa có đủ dữ liệu học tập
          </div>
          <div style={{ fontSize: 12.5, color: "var(--text-muted)", marginTop: 4, fontWeight: 500 }}>
            Hãy tiếp tục luyện tập các bài học hàng ngày để mở khóa báo cáo phân tích chi tiết!
          </div>
        </div>
      )}
    </m.div>
  );
}
