"use client";

import { useEffect, useState, useCallback } from "react";
import {
  FireOutlined,
  BarChartOutlined,
  ThunderboltOutlined,
  RiseOutlined,
  SoundOutlined,
  HistoryOutlined,
  TrophyOutlined,
} from "@ant-design/icons";
import { Spin } from "antd";
import { api } from "@/lib/api-client";
import type { ListeningStats, ListeningHistoryItem } from "@/lib/listening/types";

type Props = {
  onStartExercise: () => void;
  onOpenHistory: () => void;
  recommendedLevel?: string | null;
  /** Called when dashboard has no data — parent should show LevelSelector instead */
  onNoData?: () => void;
};

/**
 * ListeningDashboard — smart landing for returning users.
 * Shows streak, avg score, sessions this week, weekly trend mini-chart, and recent history.
 */
export function ListeningDashboard({ onStartExercise, onOpenHistory, recommendedLevel, onNoData }: Props) {
  const [stats, setStats] = useState<ListeningStats | null>(null);
  const [recentHistory, setRecentHistory] = useState<ListeningHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasData, setHasData] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    Promise.all([
      api.get<ListeningStats>("/listening/stats").catch(() => null),
      api
        .get<{ items: ListeningHistoryItem[] }>("/listening/history?pageSize=5")
        .then((d) => d?.items ?? [])
        .catch(() => []),
    ]).then(([statsData, historyData]) => {
      setStats(statsData);
      setRecentHistory(historyData);
      setIsLoading(false);
      if (!statsData || statsData.totalSessions === 0) {
        setHasData(false);
        onNoData?.();
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const scoreColor = useCallback((score: number) => {
    if (score >= 80) return "var(--success)";
    if (score >= 50) return "var(--warning)";
    return "var(--error)";
  }, []);

  if (isLoading) {
    return (
      <div style={{ textAlign: "center", padding: 60 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!hasData || !stats) {
    return null; // Parent will show LevelSelector via onNoData callback
  }

  const maxTrendCount = Math.max(...(stats.weeklyTrend.map((w) => w.count) || [1]), 1);

  return (
    <div
      style={{
        maxWidth: 600,
        margin: "0 auto",
        display: "flex",
        flexDirection: "column",
        gap: 16,
      }}
    >
      {/* Stats Row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
          gap: 10,
        }}
      >
        <StatCard
          icon={<FireOutlined />}
          iconColor="var(--error)"
          label="Streak"
          value={`${stats.currentStreak}`}
          suffix="ngày"
        />
        <StatCard
          icon={<BarChartOutlined />}
          iconColor="var(--accent)"
          label="Điểm TB"
          value={`${stats.avgScore}%`}
          valueColor={scoreColor(stats.avgScore)}
        />
        <StatCard
          icon={<ThunderboltOutlined />}
          iconColor="var(--xp)"
          label="Tuần này"
          value={`${stats.sessionsThisWeek}`}
          suffix="bài"
        />
      </div>

      {/* Weekly Trend */}
      {stats.weeklyTrend.length > 1 && (
        <div
          style={{
            padding: "16px 20px",
            borderRadius: "var(--radius-lg)",
            border: "1px solid var(--border)",
            background: "var(--surface)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: 11,
              fontWeight: 700,
              color: "var(--text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              marginBottom: 14,
            }}
          >
            <RiseOutlined /> Xu hướng 8 tuần
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 60 }}>
            {stats.weeklyTrend.map((w, i) => (
              <div
                key={i}
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <span style={{ fontSize: 9, color: "var(--text-muted)", fontWeight: 600 }}>
                  {w.avg}%
                </span>
                <div
                  style={{
                    width: "100%",
                    height: `${Math.max((w.count / maxTrendCount) * 40, 4)}px`,
                    borderRadius: 3,
                    background: `linear-gradient(180deg, ${scoreColor(w.avg)}, color-mix(in srgb, ${scoreColor(w.avg)} 60%, transparent))`,
                    transition: "height 0.3s ease",
                  }}
                />
                <span style={{ fontSize: 8, color: "var(--text-muted)" }}>
                  {w.count}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Start */}
      <div style={{ display: "flex", gap: 10 }}>
        <button
          onClick={onStartExercise}
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            padding: "14px 20px",
            borderRadius: "var(--radius-md)",
            border: "none",
            background: "linear-gradient(135deg, var(--accent), var(--accent-hover))",
            color: "var(--text-on-accent)",
            fontSize: 14,
            fontWeight: 700,
            cursor: "pointer",
            transition: "all 0.2s ease",
            boxShadow: "var(--shadow-md)",
          }}
        >
          <SoundOutlined />
          {recommendedLevel ? `Luyện ${recommendedLevel}` : "Bài mới"}
        </button>
        <button
          onClick={onOpenHistory}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            padding: "14px 18px",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--border)",
            background: "var(--surface)",
            color: "var(--text-secondary)",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
            transition: "all 0.15s ease",
          }}
        >
          <HistoryOutlined />
          Lịch sử
        </button>
      </div>

      {/* Recent History */}
      {recentHistory.length > 0 && (
        <div
          style={{
            padding: "16px 20px",
            borderRadius: "var(--radius-lg)",
            border: "1px solid var(--border)",
            background: "var(--surface)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 12,
            }}
          >
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: "var(--text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
              }}
            >
              <HistoryOutlined style={{ marginRight: 4 }} /> Gần đây
            </span>
            <button
              onClick={onOpenHistory}
              style={{
                background: "none",
                border: "none",
                color: "var(--accent)",
                fontSize: 11,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Xem tất cả →
            </button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {recentHistory.map((item) => (
              <div
                key={item.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "8px 10px",
                  borderRadius: "var(--radius-sm)",
                  background: "color-mix(in srgb, var(--accent) 3%, transparent)",
                  fontSize: 12,
                }}
              >
                <span
                  style={{
                    fontSize: 9,
                    fontWeight: 800,
                    color: "var(--accent)",
                    fontFamily: "var(--font-mono)",
                    padding: "1px 5px",
                    borderRadius: 3,
                    background: "color-mix(in srgb, var(--accent) 10%, transparent)",
                  }}
                >
                  {item.level}
                </span>
                <span style={{ flex: 1, color: "var(--text-secondary)", fontWeight: 500 }}>
                  {item.mode === "listening" ? "Nghe hiểu" : item.mode === "shadowing" ? "Shadow" : item.mode === "dictation" ? "Dictation" : "Tóm tắt"}
                </span>
                <span
                  style={{
                    fontWeight: 700,
                    color: scoreColor(item.score ?? 0),
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  {item.score != null ? `${item.score}%` : "—"}
                </span>
                <span style={{ color: "var(--text-muted)", fontSize: 10 }}>
                  {item.completedAt
                    ? new Date(item.completedAt).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" })
                    : ""}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Level Breakdown */}
      {stats.byLevel.length > 0 && (
        <div
          style={{
            padding: "16px 20px",
            borderRadius: "var(--radius-lg)",
            border: "1px solid var(--border)",
            background: "var(--surface)",
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "var(--text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              marginBottom: 10,
            }}
          >
            <TrophyOutlined style={{ marginRight: 4 }} /> Theo cấp độ
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {stats.byLevel.map((bl) => (
              <div
                key={bl.level}
                style={{
                  padding: "8px 12px",
                  borderRadius: "var(--radius-sm)",
                  border: "1px solid var(--border)",
                  background: "color-mix(in srgb, var(--accent) 3%, transparent)",
                  textAlign: "center",
                  minWidth: 70,
                }}
              >
                <div style={{ fontSize: 14, fontWeight: 800, color: "var(--accent)", fontFamily: "var(--font-mono)" }}>
                  {bl.level}
                </div>
                <div style={{ fontSize: 11, color: "var(--text-secondary)" }}>
                  {bl.count} bài · {bl.avgScore}%
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── StatCard ──

function StatCard({
  icon,
  iconColor,
  label,
  value,
  suffix,
  valueColor,
}: {
  icon: React.ReactNode;
  iconColor: string;
  label: string;
  value: string;
  suffix?: string;
  valueColor?: string;
}) {
  return (
    <div
      style={{
        padding: "14px 12px",
        borderRadius: "var(--radius-md)",
        border: "1px solid var(--border)",
        background: "var(--surface)",
        textAlign: "center",
      }}
    >
      <div style={{ fontSize: 18, color: iconColor, marginBottom: 6 }}>{icon}</div>
      <div style={{ fontSize: 22, fontWeight: 800, color: valueColor ?? "var(--text)", fontFamily: "var(--font-mono)", lineHeight: 1 }}>
        {value}
      </div>
      {suffix && (
        <span style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 500 }}> {suffix}</span>
      )}
      <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 4, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>
        {label}
      </div>
    </div>
  );
}
