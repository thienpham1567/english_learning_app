"use client";

import { useState, useCallback } from "react";
import { motion } from "motion/react";
import {
  BarChart3,
  Loader2,
  Calendar,
  Zap,
  Flame,
  BookOpen,
  Trophy,
  AlertTriangle,
  ChevronRight,
} from "lucide-react";
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
      <motion.button
        type="button"
        onClick={fetchReport}
        whileHover={{ y: -2, x: -2, boxShadow: "var(--shadow-lg)" }}
        whileTap={{ y: 2, x: 2, boxShadow: "1px 1px 0 var(--shadow-color)" }}
        className="w-full flex items-center gap-3.5 px-5 py-4 rounded-xl border-2 border-border bg-(--surface) text-left cursor-pointer relative overflow-hidden shadow-(--shadow) transition-all duration-150"
      >
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-accent text-(--text-on-accent) border-2 border-border shadow-[2px_2px_0_var(--shadow-color)]">
          <BarChart3 className="h-5 w-5" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="font-display text-sm font-semibold text-ink leading-tight">
            Báo cáo phân tích tuần
          </div>
          <div className="text-[11px] text-text-muted mt-1 font-semibold leading-none">
            Nhận phân tích từ AI về tiến độ và thói quen học tập của bạn
          </div>
        </div>

        <ChevronRight className="h-4 w-4 text-text-muted shrink-0 ml-1.5" />
      </motion.button>
    );
  }

  // Loading
  if (loading) {
    return (
      <div className="p-5 rounded-xl bg-surface border-2 border-border shadow-(--shadow) flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-accent" />
          <span className="text-xs font-bold text-text-secondary">
            AI đang tổng hợp và phân tích hoạt động của bạn...
          </span>
        </div>
        <div className="w-full space-y-2.5 animate-pulse">
          <div className="h-3.5 bg-bg-deep border-2 border-border rounded-lg w-3/4" />
          <div className="h-3.5 bg-bg-deep border-2 border-border rounded-lg w-1/2" />
          <div className="h-3.5 bg-bg-deep border-2 border-border rounded-lg w-5/6" />
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { stats, report, insufficient } = data;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl bg-surface border-2 border-border shadow-(--shadow) overflow-hidden flex flex-col"
    >
      {/* Header */}
      <div className="px-5 py-4 bg-surface-alt border-b-2 border-border flex items-center gap-2.5">
        <BarChart3 className="h-4 w-4 text-accent" />
        <span className="text-xs font-extrabold text-ink font-display tracking-wide">
          Phân tích học tập tuần này
        </span>
        <span className="ml-auto text-[9px] font-bold text-text-muted uppercase tracking-widest font-mono">
          7 ngày gần nhất
        </span>
      </div>

      {/* Quick Stats Floating Grid */}
      <div className="grid grid-cols-3 gap-2.5 p-5">
        {[
          { icon: <Calendar className="h-4 w-4 text-accent" />, value: `${stats.daysActive}/7`, label: "Ngày học", bg: "bg-accent-muted" },
          { icon: <Zap className="h-4 w-4 text-(--warning) fill-(--warning)" />, value: stats.totalXP.toLocaleString(), label: "XP đạt được", bg: "bg-(--warning-bg)" },
          { icon: <Flame className="h-4 w-4 text-(--fire) fill-(--fire)" />, value: stats.currentStreak, label: "Chuỗi ngày", bg: "bg-(--warning-bg)" },
          { icon: <BookOpen className="h-4 w-4 text-(--success)" />, value: stats.newVocabulary, label: "Từ vựng mới", bg: "bg-(--success-bg)" },
          { icon: <Trophy className="h-4 w-4 text-(--warning)" />, value: stats.avgChallengeScore, label: "Điểm TB", bg: "bg-(--warning-bg)" },
          { icon: <AlertTriangle className="h-4 w-4 text-(--error)" />, value: stats.unresolvedErrors, label: "Lỗi cần sửa", bg: "bg-(--error-bg)" },
        ].map((s) => (
          <div
            key={s.label}
            className="p-3 bg-surface-alt rounded-lg border-2 border-border text-center flex flex-col items-center gap-1.5 shadow-[2px_2px_0_var(--shadow-color)] hover:-translate-y-0.5 hover:-translate-x-0.5 hover:shadow-[3px_3px_0_var(--shadow-color)] transition-all duration-150"
          >
            <div className={`w-7 h-7 rounded-md ${s.bg} border-2 border-border flex items-center justify-center shrink-0`}>
              {s.icon}
            </div>
            <div className="text-base font-extrabold text-ink font-mono leading-none">
              {s.value}
            </div>
            <div className="text-[9px] text-text-muted font-bold uppercase tracking-wider leading-none">
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {/* Dashed divider */}
      <div className="mx-5 border-t-2 border-dashed border-border" />

      {/* AI Report Block */}
      {report && (
        <div className="p-5 pt-0">
          <div
            className="text-xs md:text-sm leading-relaxed text-text-secondary font-semibold p-4 rounded-lg border-2 border-border bg-surface-alt shadow-[2px_2px_0_var(--shadow-color)]"
            dangerouslySetInnerHTML={{
              __html: report
                .replace(/\*\*([^*]+)\*\*/g, '<strong class="text-accent font-extrabold">$1</strong>')
                .replace(/\n/g, "<br />"),
            }}
          />
        </div>
      )}

      {insufficient && (
        <div className="px-5 py-8 text-center flex flex-col items-center justify-center">
          <div className="w-10 h-10 rounded-md bg-surface-alt border-2 border-border shadow-[2px_2px_0_var(--shadow-color)] flex items-center justify-center mb-3">
            <AlertTriangle className="h-5 w-5 text-text-muted" />
          </div>
          <div className="text-xs font-bold text-text-secondary">
            Chưa có đủ dữ liệu học tập
          </div>
          <div className="text-[11px] text-text-muted mt-1.5 font-medium max-w-xs leading-relaxed">
            Hãy tiếp tục luyện tập các bài học hàng ngày để mở khóa báo cáo phân tích chi tiết từ AI!
          </div>
        </div>
      )}
    </motion.div>
  );
}
