"use client";

import { BarChart3, Flame, History, Loader2, TrendingUp, Trophy, Volume2, Zap } from "lucide-react";
import { motion } from "motion/react";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api-client";
import type { ListeningHistoryItem, ListeningStats } from "@/lib/listening/types";

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
export function ListeningDashboard({
  onStartExercise,
  onOpenHistory,
  recommendedLevel,
  onNoData,
}: Props) {
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
    if (score >= 80) return "text-[var(--success)]";
    if (score >= 50) return "text-[var(--warning)]";
    return "text-[var(--error)]";
  }, []);

  const scoreBarColor = useCallback((score: number) => {
    if (score >= 80) return "var(--success)";
    if (score >= 50) return "var(--warning)";
    return "var(--error)";
  }, []);

  if (isLoading) {
    return (
      <div className="text-center py-16">
        <Loader2 className="animate-spin text-accent mx-auto" size={32} />
        <p className="text-text-muted text-sm mt-3 font-medium">Loading your stats...</p>
      </div>
    );
  }

  if (!hasData || !stats) {
    return null; // Parent will show LevelSelector via onNoData callback
  }

  const maxTrendCount = Math.max(...(stats.weeklyTrend.map((w) => w.count) || [1]), 1);

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col gap-4">
      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-2.5">
        <StatCard
          icon={<Flame size={20} />}
          iconColor="text-[var(--error)]"
          label="Streak"
          value={`${stats.currentStreak}`}
          suffix="days"
        />
        <StatCard
          icon={<BarChart3 size={20} />}
          iconColor="text-accent"
          label="Avg Score"
          value={`${stats.avgScore}%`}
          valueColor={scoreColor(stats.avgScore)}
        />
        <StatCard
          icon={<Zap size={20} />}
          iconColor="text-[var(--xp)]"
          label="This Week"
          value={`${stats.sessionsThisWeek}`}
          suffix="exercises"
        />
      </div>

      {/* Weekly Trend */}
      {stats.weeklyTrend.length > 1 && (
        <div className="py-4 px-5 rounded-lg border-2 border-border bg-surface shadow-sm">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-text-muted uppercase tracking-widest mb-3.5">
            <TrendingUp size={13} /> 8-Week Trend
          </div>
          <div className="flex items-end gap-1.5 h-[60px]">
            {stats.weeklyTrend.map((w, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-[9px] text-text-muted font-semibold">{w.avg}%</span>
                <div
                  className="w-full rounded-sm transition-[height] duration-300 ease-out"
                  style={{
                    height: `${Math.max((w.count / maxTrendCount) * 40, 4)}px`,
                    background: `linear-gradient(180deg, ${scoreBarColor(w.avg)}, color-mix(in srgb, ${scoreBarColor(w.avg)} 60%, transparent))`,
                  }}
                />
                <span className="text-text-muted text-[8px]">{w.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Start */}
      <div className="flex gap-2.5">
        <Button
          onClick={onStartExercise}
          className="flex-1 h-12 text-sm font-black flex items-center justify-center gap-2"
        >
          <Volume2 size={16} />
          {recommendedLevel ? `Practice ${recommendedLevel}` : "New Exercise"}
        </Button>
        <motion.button
          onClick={onOpenHistory}
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.97 }}
          className="flex items-center justify-center gap-1.5 border-2 border-border bg-surface text-text-secondary text-[13px] font-bold cursor-pointer py-3.5 px-4.5 rounded-lg hover:bg-surface-hover hover:shadow-sm transition-all duration-100"
        >
          <History size={15} />
          History
        </motion.button>
      </div>

      {/* Recent History */}
      {recentHistory.length > 0 && (
        <div className="py-4 px-5 rounded-lg border-2 border-border bg-surface shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold text-text-muted uppercase tracking-widest flex items-center gap-1.5">
              <History size={12} /> Recent
            </span>
            <button
              onClick={onOpenHistory}
              className="bg-transparent border-none text-accent text-[11px] font-bold cursor-pointer hover:underline"
            >
              View All →
            </button>
          </div>
          <div className="flex flex-col gap-1.5">
            {recentHistory.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-2.5 rounded-lg text-xs py-2 px-2.5 bg-accent-muted"
              >
                <span className="text-[9px] font-extrabold text-accent font-mono py-0.5 px-1.5 rounded-sm bg-accent-muted border border-accent/20">
                  {item.level}
                </span>
                <span className="flex-1 text-text-secondary font-medium">
                  {item.mode === "listening"
                    ? "Comprehension"
                    : item.mode === "shadowing"
                      ? "Shadowing"
                      : item.mode === "dictation"
                        ? "Dictation"
                        : "Summary"}
                </span>
                <span className={`font-bold font-mono ${scoreColor(item.score ?? 0)}`}>
                  {item.score != null ? `${item.score}%` : "—"}
                </span>
                <span className="text-text-muted text-[10px]">
                  {item.completedAt
                    ? new Date(item.completedAt).toLocaleDateString("en-US", {
                        day: "2-digit",
                        month: "2-digit",
                      })
                    : ""}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Level Breakdown */}
      {stats.byLevel.length > 0 && (
        <div className="py-4 px-5 rounded-lg border-2 border-border bg-surface shadow-sm">
          <div className="text-[11px] font-bold text-text-muted uppercase mb-2.5 tracking-widest flex items-center gap-1.5">
            <Trophy size={12} /> By Level
          </div>
          <div className="flex flex-wrap gap-2">
            {stats.byLevel.map((bl) => (
              <div
                key={bl.level}
                className="py-2 px-3 rounded-lg border-2 border-border text-center w-[70px] bg-accent-muted"
              >
                <div className="text-sm font-extrabold text-accent font-mono">{bl.level}</div>
                <div className="text-[11px] text-text-secondary">
                  {bl.count} exercises · {bl.avgScore}%
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
    <motion.div
      whileHover={{ y: -3, scale: 1.02 }}
      className="border-2 border-border bg-surface text-center py-3.5 px-3 rounded-lg shadow-sm cursor-default"
    >
      <div className={`text-lg mb-1.5 flex justify-center ${iconColor}`}>{icon}</div>
      <div className={`text-2xl font-extrabold font-mono leading-none ${valueColor ?? "text-text-primary"}`}>
        {value}
      </div>
      {suffix && <span className="text-[10px] text-text-muted font-medium"> {suffix}</span>}
      <div className="text-[10px] text-text-muted mt-1 font-bold uppercase tracking-widest">
        {label}
      </div>
    </motion.div>
  );
}
