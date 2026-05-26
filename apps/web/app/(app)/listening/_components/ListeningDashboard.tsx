"use client";

import { useEffect, useState, useCallback } from "react";

import { Spin } from "antd";
import { api } from "@/lib/api-client";
import type { ListeningStats, ListeningHistoryItem } from "@/lib/listening/types";
import {
  BarChart3,
  Flame,
  History,
  TrendingUp,
  Trophy,
  Volume2,
  Zap,
} from "lucide-react";

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
      <div className="text-center" style={{padding: 60}} >
        <Spin size="large" />
      </div>
    );
  }

  if (!hasData || !stats) {
    return null; // Parent will show LevelSelector via onNoData callback
  }

  const maxTrendCount = Math.max(...(stats.weeklyTrend.map((w) => w.count) || [1]), 1);

  return (
    <div className="w-[600px] mx-auto flex flex-col gap-4" >
      {/* Stats Row */}
      <div className="grid gap-2.5" style={{gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))"}} >
        <StatCard
          icon={<Flame />}
          iconColor="var(--error)"
          label="Streak"
          value={`${stats.currentStreak}`}
          suffix="ngày"
        />
        <StatCard
          icon={<BarChart3 />}
          iconColor="var(--accent)"
          label="Điểm TB"
          value={`${stats.avgScore}%`}
          valueColor={scoreColor(stats.avgScore)}
        />
        <StatCard
          icon={<Zap />}
          iconColor="var(--xp)"
          label="Tuần này"
          value={`${stats.sessionsThisWeek}`}
          suffix="bài"
        />
      </div>

      {/* Weekly Trend */}
      {stats.weeklyTrend.length > 1 && (
        <div className="py-4 px-5 rounded-(--radius-lg) border-2 border-border bg-(--surface)" >
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-text-muted uppercase" style={{letterSpacing: "0.1em", marginBottom: 14}} >
            <TrendingUp /> Xu hướng 8 tuần
          </div>
          <div className="flex items-end gap-1.5 h-[60px]" >
            {stats.weeklyTrend.map((w, i) => (
              <div
                key={i} className="flex-1 flex flex-col items-center gap-1" >
                <span className="text-[9px] text-text-muted font-semibold" >
                  {w.avg}%
                </span>
                <div className="w-full" style={{height: `${Math.max((w.count / maxTrendCount) * 40, 4)}px`, borderRadius: 3, background: `linear-gradient(180deg, ${scoreColor(w.avg)}, color-mix(in srgb, ${scoreColor(w.avg)} 60%, transparent))`, transition: "height 0.3s ease"}} />
                <span className="text-text-muted" style={{fontSize: 8}} >
                  {w.count}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Start */}
      <div className="flex gap-2.5" >
        <button
          onClick={onStartExercise} className="flex-1 flex items-center justify-center gap-2 border-none text-sm font-bold cursor-pointer" style={{padding: "14px 20px", borderRadius: "var(--radius-md)", background: "linear-gradient(135deg, var(--accent), var(--accent-hover))", color: "var(--text-on-accent)", transition: "all 0.2s ease", boxShadow: "var(--shadow-md)"}} >
          <Volume2 />
          {recommendedLevel ? `Luyện ${recommendedLevel}` : "Bài mới"}
        </button>
        <button
          onClick={onOpenHistory} className="flex items-center justify-center gap-1.5 border-2 border-border bg-(--surface) text-text-secondary text-[13px] font-semibold cursor-pointer" style={{padding: "14px 18px", borderRadius: "var(--radius-md)", transition: "all 0.15s ease"}} >
          <History />
          Lịch sử
        </button>
      </div>

      {/* Recent History */}
      {recentHistory.length > 0 && (
        <div className="py-4 px-5 rounded-(--radius-lg) border-2 border-border bg-(--surface)" >
          <div className="flex items-center justify-between mb-3" >
            <span className="text-[11px] font-bold text-text-muted uppercase" style={{letterSpacing: "0.1em"}} >
              <History className="mr-1" /> Gần đây
            </span>
            <button
              onClick={onOpenHistory} className="bg-none border-none text-accent text-[11px] font-semibold cursor-pointer" >
              Xem tất cả →
            </button>
          </div>
          <div className="flex flex-col gap-1.5" >
            {recentHistory.map((item) => (
              <div
                key={item.id} className="flex items-center gap-2.5 rounded-(--radius-sm) text-xs" style={{padding: "8px 10px", background: "color-mix(in srgb, var(--accent) 3%, transparent)"}} >
                <span className="text-[9px] font-extrabold text-accent font-mono" style={{padding: "1px 5px", borderRadius: 3, background: "color-mix(in srgb, var(--accent) 10%, transparent)"}} >
                  {item.level}
                </span>
                <span className="flex-1 text-text-secondary font-medium" >
                  {item.mode === "listening" ? "Nghe hiểu" : item.mode === "shadowing" ? "Shadow" : item.mode === "dictation" ? "Dictation" : "Tóm tắt"}
                </span>
                <span className="font-bold font-mono" style={{color: scoreColor(item.score ?? 0)}} >
                  {item.score != null ? `${item.score}%` : "—"}
                </span>
                <span className="text-text-muted text-[10px]" >
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
        <div className="py-4 px-5 rounded-(--radius-lg) border-2 border-border bg-(--surface)" >
          <div className="text-[11px] font-bold text-text-muted uppercase mb-2.5" style={{letterSpacing: "0.1em"}} >
            <Trophy className="mr-1" /> Theo cấp độ
          </div>
          <div className="flex flex-wrap gap-2" >
            {stats.byLevel.map((bl) => (
              <div
                key={bl.level} className="py-2 px-3 rounded-(--radius-sm) border-2 border-border text-center w-[70px]" style={{background: "color-mix(in srgb, var(--accent) 3%, transparent)"}} >
                <div className="text-sm font-extrabold text-accent font-mono" >
                  {bl.level}
                </div>
                <div className="text-[11px] text-text-secondary" >
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
    <div className="border-2 border-border bg-(--surface) text-center" style={{padding: "14px 12px", borderRadius: "var(--radius-md)"}} >
      <div className="text-lg mb-1.5" style={{color: iconColor}} >{icon}</div>
      <div className="text-2xl font-extrabold font-mono leading-none" style={{color: valueColor ?? "var(--text)"}} >
        {value}
      </div>
      {suffix && (
        <span className="text-[10px] text-text-muted font-medium" > {suffix}</span>
      )}
      <div className="text-[10px] text-text-muted mt-1 font-semibold uppercase tracking-widest" >
        {label}
      </div>
    </div>
  );
}
