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
        whileHover={{ y: -3, scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        className="w-full flex items-center gap-3.5 px-5 py-4.5 rounded-2xl border border-accent/25 bg-gradient-to-br from-accent/5 to-surface hover:from-accent/10 hover:to-surface text-left cursor-pointer relative overflow-hidden shadow-sm transition-all duration-200 active:scale-99"
      >
        {/* Glow backdrop */}
        <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-[radial-gradient(circle,rgba(192,125,43,0.15)_0%,transparent_70%)]" />

        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent text-white shadow-sm">
          <BarChart3 className="h-5 w-5" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="font-display text-sm font-semibold text-slate-100 leading-tight">
            Báo cáo phân tích tuần
          </div>
          <div className="text-[11px] text-slate-400 mt-1 font-semibold leading-none">
            Nhận phân tích từ AI về tiến độ và thói quen học tập của bạn
          </div>
        </div>

        <ChevronRight className="h-4 w-4 text-slate-500 shrink-0 ml-1.5" />
      </motion.button>
    );
  }

  // Loading
  if (loading) {
    return (
      <div className="p-5 rounded-2xl bg-surface border border-border shadow-sm flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-text-accent" />
          <span className="text-xs font-bold text-slate-200">
            AI đang tổng hợp và phân tích hoạt động của bạn...
          </span>
        </div>
        <div className="w-full space-y-2.5 animate-pulse">
          <div className="h-3.5 bg-slate-900 border border-slate-850 rounded-lg w-3/4" />
          <div className="h-3.5 bg-slate-900 border border-slate-850 rounded-lg w-1/2" />
          <div className="h-3.5 bg-slate-900 border border-slate-850 rounded-lg w-5/6" />
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
      className="rounded-2xl bg-surface border border-border shadow-sm overflow-hidden flex flex-col"
    >
      {/* Header */}
      <div className="px-5 py-4 bg-slate-900/30 border-b border-border flex items-center gap-2.5">
        <BarChart3 className="h-4 w-4 text-accent" />
        <span className="text-xs font-extrabold text-slate-100 font-display tracking-wide">
          Phân tích học tập tuần này
        </span>
        <span className="ml-auto text-[9px] font-bold text-slate-500 uppercase tracking-widest font-mono">
          7 ngày gần nhất
        </span>
      </div>

      {/* Quick Stats Floating Grid */}
      <div className="grid grid-cols-3 gap-2.5 p-5">
        {[
          { icon: <Calendar className="h-4 w-4 text-accent" />, value: `${stats.daysActive}/7`, label: "Ngày học", bg: "bg-accent/10" },
          { icon: <Zap className="h-4 w-4 text-amber-500 fill-current" />, value: stats.totalXP.toLocaleString(), label: "XP đạt được", bg: "bg-amber-500/10" },
          { icon: <Flame className="h-4 w-4 text-orange-500 fill-current" />, value: stats.currentStreak, label: "Chuỗi ngày", bg: "bg-orange-500/10" },
          { icon: <BookOpen className="h-4 w-4 text-emerald-500" />, value: stats.newVocabulary, label: "Từ vựng mới", bg: "bg-emerald-550/10" },
          { icon: <Trophy className="h-4 w-4 text-amber-450" />, value: stats.avgChallengeScore, label: "Điểm TB", bg: "bg-amber-500/10" },
          { icon: <AlertTriangle className="h-4 w-4 text-red-500" />, value: stats.unresolvedErrors, label: "Lỗi cần sửa", bg: "bg-red-500/10" },
        ].map((s) => (
          <div
            key={s.label}
            className="p-3 bg-slate-900/10 hover:bg-slate-900/30 rounded-xl border border-border text-center flex flex-col items-center gap-1.5 transition-colors duration-150"
          >
            <div className={`w-7 h-7 rounded-full ${s.bg} flex items-center justify-center shrink-0`}>
              {s.icon}
            </div>
            <div className="text-base font-extrabold text-slate-100 font-mono leading-none">
              {s.value}
            </div>
            <div className="text-[9px] text-slate-550 font-bold uppercase tracking-wider leading-none">
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {/* Gradient divider */}
      <div className="mx-5 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

      {/* AI Report Block */}
      {report && (
        <div className="p-5">
          <div
            className="text-xs md:text-sm leading-relaxed text-slate-300 font-semibold"
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
          <div className="w-10 h-10 rounded-full bg-slate-900 border border-slate-850 flex items-center justify-center mb-3">
            <AlertTriangle className="h-5 w-5 text-slate-500" />
          </div>
          <div className="text-xs font-bold text-slate-200">
            Chưa có đủ dữ liệu học tập
          </div>
          <div className="text-[11px] text-slate-500 mt-1.5 font-medium max-w-xs leading-relaxed">
            Hãy tiếp tục luyện tập các bài học hàng ngày để mở khóa báo cáo phân tích chi tiết từ AI!
          </div>
        </div>
      )}
    </motion.div>
  );
}
