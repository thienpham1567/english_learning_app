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
      <button
        type="button"
        onClick={fetchReport}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "16px 18px",
          borderRadius: 14,
          border: "1.5px solid color-mix(in srgb, var(--accent) 18%, var(--border))",
          background: "linear-gradient(135deg, color-mix(in srgb, var(--accent) 6%, var(--surface)), color-mix(in srgb, var(--secondary) 4%, var(--surface)))",
          cursor: "pointer",
          transition: "all 0.2s",
          textAlign: "left",
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            background: "linear-gradient(135deg, var(--accent), var(--accent-hover))",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <BarChartOutlined style={{ fontSize: 18, color: "#fff" }} />
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ink)", fontFamily: "var(--font-display)" }}>
            <BarChartOutlined style={{ marginRight: 4 }} /> Báo cáo tuần
          </div>
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
            AI phân tích tiến độ học tập 7 ngày qua
          </div>
        </div>
      </button>
    );
  }

  // Loading
  if (loading) {
    return (
      <div style={{ padding: 20, borderRadius: 16, background: "var(--surface)", border: "1px solid var(--border)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
          <LoadingOutlined spin style={{ fontSize: 14, color: "var(--accent)" }} />
          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>
            Đang tạo báo cáo tuần...
          </span>
        </div>
        <Skeleton active paragraph={{ rows: 4 }} />
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
        borderRadius: 16,
        background: "var(--surface)",
        border: "1px solid var(--border)",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "14px 18px",
          background: "linear-gradient(135deg, color-mix(in srgb, var(--accent) 8%, var(--bg)), color-mix(in srgb, var(--secondary) 5%, var(--bg)))",
          borderBottom: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <BarChartOutlined style={{ fontSize: 14, color: "var(--accent)" }} />
        <span style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)", fontFamily: "var(--font-display)" }}>
          Báo cáo tuần
        </span>
        <span style={{ marginLeft: "auto", fontSize: 11, color: "var(--text-muted)" }}>
          7 ngày qua
        </span>
      </div>

      {/* Quick Stats Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 1,
          background: "var(--border)",
        }}
      >
        {[
          { icon: <CalendarOutlined />, value: `${stats.daysActive}/7`, label: "Ngày học" },
          { icon: <ThunderboltOutlined />, value: stats.totalXP.toLocaleString(), label: "XP" },
          { icon: <FireOutlined />, value: stats.currentStreak, label: "Streak" },
          { icon: <BookOutlined />, value: stats.newVocabulary, label: "Từ mới" },
          { icon: <BarChartOutlined />, value: stats.avgChallengeScore, label: "Avg Score" },
          { icon: <BarChartOutlined />, value: stats.unresolvedErrors, label: "Lỗi chưa nắm" },
        ].map((s) => (
          <div
            key={s.label}
            style={{
              padding: "12px 14px",
              background: "var(--surface)",
              textAlign: "center",
            }}
          >
            <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{s.icon}</span>
            <div style={{ fontSize: 18, fontWeight: 800, color: "var(--ink)", fontFamily: "var(--font-display)", lineHeight: 1 }}>
              {s.value}
            </div>
            <div style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 500, marginTop: 2 }}>
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {/* AI Report */}
      {report && (
        <div style={{ padding: "16px 18px" }}>
          <div
            style={{
              fontSize: 13,
              lineHeight: 1.75,
              color: "var(--text-primary)",
              whiteSpace: "pre-wrap",
            }}
            dangerouslySetInnerHTML={{
              __html: report
                .replace(/\*\*([^*]+)\*\*/g, '<strong style="color: var(--accent)">$1</strong>')
                .replace(/\n/g, "<br />"),
            }}
          />
        </div>
      )}

      {insufficient && (
        <div style={{ padding: "16px 18px", textAlign: "center" }}>
          <div style={{ fontSize: 28, opacity: 0.3, marginBottom: 8 }}><BarChartOutlined /></div>
          <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>
            Chưa đủ dữ liệu tuần này
          </div>
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>
            Hãy hoàn thành thêm bài tập để có báo cáo chi tiết!
          </div>
        </div>
      )}
    </m.div>
  );
}
