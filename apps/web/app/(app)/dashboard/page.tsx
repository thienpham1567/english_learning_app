"use client";

import {
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Clock,
  Flame,
  HelpCircle,
  LayoutDashboard,
  Rocket,
  RotateCw,
  Star,
  Target,
  TrendingUp,
  Zap,
} from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { HeatmapCalendar } from "@/app/(app)/dashboard/_components/HeatmapCalendar";
import { WeeklyReport } from "@/app/(app)/dashboard/_components/WeeklyReport";
import { PageHeader } from "@/components/shared/PageHeader";
import {
  type DailyPlanItem,
  type DailyPlanStats,
  useDailyStudyPlan,
} from "@/hooks/useDailyStudyPlan";
import { type DashboardData, useDashboard } from "@/hooks/useDashboard";
import { api } from "@/lib/api-client";

// ── Types ────────────────────────────────────────────────────────
type PredictedScore = {
  predicted: number | null;
  insufficient: boolean;
  confidence?: number;
  reading?: number;
  listening?: number;
  components?: {
    grammar: number;
    listeningAccuracy: number;
    vocabulary: number;
    topScores: number;
  };
  dataPoints?: { quizzes: number; listening: number; vocabulary: number };
  weeklyXP?: { week: string; xp: number }[];
  quizzesNeeded?: number;
  listeningNeeded?: number;
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const cardClass =
  "relative overflow-hidden rounded-xl border-2 border-border bg-surface shadow-(--shadow) p-6";
const sectionLabelClass =
  "flex items-center gap-2.5 text-[10px] font-extrabold uppercase tracking-widest text-accent mb-4";
const accentBarClass = "w-[3px] h-3.5 rounded-sm bg-accent shrink-0";

// ── Component ────────────────────────────────────────────────────
export default function DashboardPage() {
  const { state: dashState } = useDashboard();
  const { state: planState } = useDailyStudyPlan({ budget: "20" });
  const [score, setScore] = useState<PredictedScore | null>(null);
  const [scoreLoading, setScoreLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    api
      .get<PredictedScore>("/predicted-score")
      .then((d) => {
        if (!cancelled) setScore(d);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setScoreLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const dash: DashboardData | null = dashState.status === "ready" ? dashState.data : null;
  const planReady = planState.status === "ready" ? planState : null;

  return (
    <div className="min-h-full overflow-y-auto px-4 py-4 pb-12">
      {/* ── Hero Header ── */}
      <div className="max-w-5xl mx-auto mb-5">
        <PageHeader
          title="Bảng điều khiển"
          subtitle="Theo dõi tiến độ, kế hoạch học và điểm dự đoán của bạn"
          icon={<LayoutDashboard className="h-6 w-6" />}
          boxed
        />

        {/* ── Streak + XP Banner Row ── */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full"
        >
          <StatCard
            icon={<Flame className="h-5 w-5 text-orange-500 fill-current" />}
            label="Streak"
            value={dash ? `${dash.streak.currentStreak} ngày` : "—"}
            sub={dash ? `Kỷ lục: ${dash.streak.bestStreak}` : ""}
            loading={!dash}
          />
          <StatCard
            icon={<Zap className="h-5 w-5 text-amber-500 fill-current" />}
            label="Tổng XP"
            value={dash ? `${dash.totalXP.toLocaleString()}` : "—"}
            sub="Kinh nghiệm tích lũy"
            loading={!dash}
          />
          <StatCard
            icon={<RotateCw className="h-5 w-5 text-accent" />}
            label="Cần ôn"
            value={dash ? `${dash.flashcardsDue + dash.vocabDue}` : "—"}
            sub={dash ? `${dash.flashcardsDue} thẻ · ${dash.vocabDue} từ` : ""}
            loading={!dash}
          />
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.62fr_1fr] gap-5 items-start max-w-5xl mx-auto px-1">
        {/* Left Column: Focus & Core Actions */}
        <div className="flex flex-col gap-5">
          {/* ── Predicted TOEIC Score ── */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className={cardClass}
          >
            <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-accent to-secondary" />
            <div className={sectionLabelClass}>
              <div className={accentBarClass} />
              <span>Điểm TOEIC dự đoán</span>
              <div className="flex-1 h-px bg-border ml-2" />
            </div>

            {scoreLoading ? (
              <div className="space-y-3 animate-pulse">
                <div className="h-4 bg-bg-deep border border-border/20 rounded-md w-3/4" />
                <div className="h-4 bg-bg-deep border border-border/20 rounded-md w-1/2" />
              </div>
            ) : score?.insufficient ? (
              <InsufficientDataCard score={score} />
            ) : score?.predicted ? (
              <ScoreDisplay score={score} />
            ) : (
              <p className="text-xs text-text-muted text-center py-6 font-semibold">
                Chưa có đủ dữ liệu
              </p>
            )}
          </motion.div>

          {/* ── Daily Study Plan ── */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className={cardClass}
          >
            <div className={sectionLabelClass}>
              <div className={accentBarClass} />
              <span>Kế hoạch hôm nay</span>
              <div className="flex-1 h-px bg-border ml-2" />
            </div>

            {planState.status === "loading" ? (
              <div className="space-y-3 animate-pulse">
                <div className="h-4 bg-bg-deep border border-border/20 rounded-md w-4/5" />
                <div className="h-4 bg-bg-deep border border-border/20 rounded-md w-2/3" />
                <div className="h-4 bg-bg-deep border border-border/20 rounded-md w-3/4" />
              </div>
            ) : planReady ? (
              <StudyPlanSection items={planReady.plan.items} stats={planReady.stats} />
            ) : (
              <p className="text-xs text-text-muted text-center py-4 font-semibold">
                Hãy làm thêm bài tập để hệ thống gợi ý kế hoạch học!
              </p>
            )}
          </motion.div>

          {/* ── Quick Actions ── */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className={cardClass}
          >
            <div className={sectionLabelClass}>
              <div className={accentBarClass} />
              <span>Truy cập nhanh</span>
              <div className="flex-1 h-px bg-border ml-2" />
            </div>
            <QuickActions dash={dash} />
          </motion.div>

          {/* ── AI Weekly Report ── */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55 }}
          >
            <WeeklyReport />
          </motion.div>
        </div>

        {/* Right Column: Analytics & Motivation */}
        <div className="flex flex-col gap-5">
          {/* ── Weekly Activity ── */}
          {dash && dash.weeklyActivity.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className={`${cardClass} w-full`}
            >
              <div className={sectionLabelClass}>
                <div className={accentBarClass} />
                <span>Hoạt động tuần này</span>
                <div className="flex-1 h-px bg-border ml-2" />
              </div>
              <WeeklyChart data={dash.weeklyActivity} />
            </motion.div>
          )}

          {/* ── Heatmap Calendar ── */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className="w-full"
          >
            <HeatmapCalendar />
          </motion.div>

          {/* ── Score Timeline ── */}
          {score?.weeklyXP && score.weeklyXP.length > 1 && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className={`${cardClass} w-full`}
            >
              <div className={sectionLabelClass}>
                <div className={accentBarClass} />
                <span>Xu hướng XP theo tuần</span>
                <div className="flex-1 h-px bg-border ml-2" />
              </div>
              <ScoreTimeline data={score.weeklyXP} />
            </motion.div>
          )}

          {/* ── Recent Badges ── */}
          {dash && dash.badges.filter((b) => b.unlocked).length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55 }}
              className={`${cardClass} w-full`}
            >
              <div className={sectionLabelClass}>
                <div className={accentBarClass} />
                <span>Huy hiệu đã đạt</span>
                <div className="flex-1 h-px bg-border ml-2" />
              </div>
              <div className="flex flex-wrap gap-2">
                {dash.badges
                  .filter((b) => b.unlocked)
                  .map((b) => (
                    <div
                      key={b.id}
                      className="px-3.5 py-2 rounded-lg bg-accent/5 border-2 border-border flex items-center gap-2 text-xs font-black text-text-primary shadow-(--shadow-sm)"
                    >
                      <span className="text-base leading-none">{b.icon}</span>
                      <span>{b.label}</span>
                    </div>
                  ))}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ───────────────────────────────────────────────

function StatCard({
  icon,
  label,
  value,
  sub,
  loading,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  loading: boolean;
}) {
  return (
    <motion.div
      variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } }}
      whileHover={{ y: -2, x: -2, boxShadow: "var(--shadow-lg)" }}
      whileTap={{ y: 2, x: 2, boxShadow: "none" }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="flex-1 min-w-[90px] text-center rounded-xl border-2 border-border bg-surface p-4 shadow-(--shadow) transition-all duration-100"
    >
      {loading ? (
        <div className="h-10 bg-bg-deep border-2 border-border rounded-md animate-pulse mx-auto w-12" />
      ) : (
        <div className="flex flex-col items-center">
          <div className="text-lg mb-2">{icon}</div>
          <div className="text-xl font-black text-text-primary font-mono tracking-tight leading-none">
            {value}
          </div>
          <div className="text-[9px] font-bold uppercase tracking-wider text-text-muted mt-2">
            {label}
          </div>
          {sub && (
            <div className="text-[8px] text-text-muted font-semibold mt-1 truncate max-w-full">
              {sub}
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}

function ScoreDisplay({ score }: { score: PredictedScore }) {
  const pct = Math.round(((score.predicted ?? 0) / 990) * 100);
  const color = pct >= 75 ? "var(--success)" : pct >= 50 ? "var(--warning)" : "var(--accent)";

  const radius = 56;
  const stroke = 6;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (pct / 100) * circumference;

  return (
    <div className="flex items-center gap-6 flex-wrap md:flex-nowrap">
      <div className="relative flex items-center justify-center w-[120px] h-[120px] mx-auto shrink-0">
        <svg height={120} width={120} className="transform -rotate-90">
          <circle
            stroke="var(--border)"
            fill="transparent"
            strokeWidth={stroke}
            r={normalizedRadius}
            cx={60}
            cy={60}
          />
          <motion.circle
            stroke={color}
            fill="transparent"
            strokeWidth={stroke}
            strokeDasharray={circumference + " " + circumference}
            style={{ strokeDashoffset }}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            strokeLinecap="round"
            r={normalizedRadius}
            cx={60}
            cy={60}
          />
        </svg>
        <div className="absolute flex flex-col items-center justify-center">
          <span className="font-display text-2xl font-black text-text-primary leading-none">
            {score.predicted}
          </span>
          <span className="text-[9px] text-text-muted font-bold uppercase tracking-wider mt-1">
            / 990
          </span>
        </div>
      </div>

      <div className="flex-1 min-w-[180px] flex flex-col gap-3">
        {/* L/R split */}
        <div className="flex gap-2">
          <MiniScore
            label="Listening"
            value={score.listening ?? 0}
            max={495}
            color="var(--accent)"
          />
          <MiniScore
            label="Reading"
            value={score.reading ?? 0}
            max={495}
            color="var(--secondary)"
          />
        </div>
        {/* Components */}
        {score.components && (
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 border-t border-border pt-2.5">
            {[
              { k: "Ngữ pháp", v: score.components.grammar },
              { k: "Nghe hiểu", v: score.components.listeningAccuracy },
              { k: "Từ vựng", v: score.components.vocabulary },
              { k: "Điểm tốt", v: score.components.topScores },
            ].map((c) => (
              <div
                key={c.k}
                className="text-[10px] text-text-secondary font-semibold flex justify-between"
              >
                <span>{c.k}</span>
                <span className="font-bold text-text-primary">{c.v}%</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function MiniScore({
  label,
  value,
  max,
  color,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
}) {
  return (
    <div
      style={{
        background: `color-mix(in srgb, ${color} 6%, var(--surface))`,
        borderColor: `color-mix(in srgb, ${color} 15%, transparent)`,
      }}
      className="flex-1 px-3 py-2 rounded-xl border-2 border-border text-center"
    >
      <div style={{ color }} className="text-lg font-extrabold font-mono leading-none">
        {value}
      </div>
      <div className="text-[9px] text-text-muted font-bold uppercase tracking-wider mt-1.5">
        {label}
      </div>
    </div>
  );
}

function InsufficientDataCard({ score }: { score: PredictedScore }) {
  return (
    <div className="text-center py-4 flex flex-col items-center">
      <TrendingUp className="h-8 w-8 text-text-muted mb-3" />
      <p className="text-sm font-extrabold text-text-primary mb-1">Cần thêm dữ liệu để dự đoán</p>
      <p className="text-xs text-text-muted font-bold mb-4">
        {score.quizzesNeeded ? `Cần thêm ${score.quizzesNeeded} bài quiz` : ""}
        {score.quizzesNeeded && score.listeningNeeded ? " và " : ""}
        {score.listeningNeeded ? `${score.listeningNeeded} bài nghe` : ""}
      </p>

      <div className="flex gap-2.5 justify-center flex-wrap">
        <Link
          href="/toeic/skills?tab=part5"
          className="inline-flex items-center gap-1.5 px-4.5 py-2 rounded-lg text-xs font-black border-2 border-border bg-accent text-ink shadow-(--shadow-sm) hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-(--shadow) active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer"
        >
          <HelpCircle className="h-3.5 w-3.5" />
          <span>Làm Grammar Quiz</span>
        </Link>
        <Link
          href="/toeic/skills"
          className="inline-flex items-center gap-1.5 px-4.5 py-2 rounded-lg text-xs font-black border-2 border-border bg-surface text-text-primary shadow-(--shadow-sm) hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-(--shadow) active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer"
        >
          <Target className="h-3.5 w-3.5" />
          <span>Luyện Listening</span>
        </Link>
      </div>
    </div>
  );
}

function StudyPlanSection({ items, stats }: { items: DailyPlanItem[]; stats: DailyPlanStats }) {
  const completed = items.filter((i) => i.completed).length;
  const pct = items.length > 0 ? Math.round((completed / items.length) * 100) : 0;

  return (
    <div className="flex flex-col gap-4">
      {/* Progress bar */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-2 rounded-full bg-bg-deep overflow-hidden relative border-2 border-border">
          <div
            style={{ width: `${pct}%` }}
            className="h-full rounded-full bg-gradient-to-r from-accent to-secondary transition-all duration-500 ease-out"
          />
        </div>
        <span className="text-xs font-extrabold text-accent font-mono leading-none">
          {completed}/{items.length}
        </span>
      </div>

      {/* Task list */}
      <div className="flex flex-col gap-2.5">
        {items.map((item) => (
          <Link
            key={item.id}
            href={item.actionUrl}
            className="block group"
            style={{ textDecoration: "none" }}
          >
            <div
              className={`flex items-center gap-3.5 p-3 rounded-xl border-2 transition-all duration-100 cursor-pointer ${
                item.completed
                  ? "bg-success-bg border-success/30 opacity-60 hover:opacity-80"
                  : "bg-surface border-border hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-(--shadow-sm) active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
              }`}
            >
              <div
                className={`w-7 h-7 rounded-lg border-2 border-border flex items-center justify-center shrink-0 text-xs font-black ${
                  item.completed
                    ? "bg-success text-text-on-accent"
                    : item.priority === "high"
                      ? "bg-accent text-ink"
                      : "bg-bg-deep text-text-muted"
                }`}
              >
                {item.completed ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <Rocket className="h-4 w-4" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="text-xs font-black text-text-primary transition-colors truncate">
                  {item.title}
                </div>
                <div className="text-[10px] text-text-muted font-bold mt-1 flex items-center gap-1.5">
                  <Clock className="h-3 w-3 shrink-0" />
                  <span>
                    {item.estimatedMinutes} phút · {item.reason}
                  </span>
                </div>
              </div>

              {item.priority === "high" && !item.completed && (
                <span className="px-2.5 py-0.5 rounded-lg text-[9px] font-extrabold bg-error/10 border-2 border-error text-error">
                  Ưu tiên
                </span>
              )}
            </div>
          </Link>
        ))}
      </div>

      {/* XP level stats bar */}
      {stats && (
        <div className="p-3 rounded-xl bg-surface border-2 border-border flex items-center gap-2.5 shadow-(--shadow-sm)">
          <Star className="text-amber-500 h-4 w-4 fill-current shrink-0" />
          <div className="flex-1 text-[11px] text-text-secondary font-bold">
            Cấp độ {stats.levelNumber} ·{" "}
            <strong className="text-text-primary">{stats.totalXP.toLocaleString()} XP</strong>
          </div>
          <div className="w-20 h-2 bg-bg-deep rounded-full overflow-hidden border-2 border-border shrink-0">
            <div
              style={{
                width: `${Math.min(100, (stats.currentLevelXP / stats.nextLevelXP) * 100)}%`,
              }}
              className="h-full bg-accent rounded-full"
            />
          </div>
        </div>
      )}
    </div>
  );
}

const QUICK_ACTIONS = [
  {
    href: "/daily-challenge",
    icon: <Flame />,
    label: "Thử thách",
    color: "text-orange-500 bg-orange-500/10",
  },
  {
    href: "/toeic/skills",
    icon: <Target />,
    label: "Luyện TOEIC",
    color: "text-accent bg-accent/10",
  },
  {
    href: "/flashcards",
    icon: <BookOpen />,
    label: "Flashcard",
    color: "text-emerald-500 bg-emerald-550/10",
  },
  {
    href: "/error-notebook",
    icon: <AlertTriangle />,
    label: "Sổ lỗi",
    color: "text-red-500 bg-red-500/10",
  },
  {
    href: "/my-vocabulary",
    icon: <Star />,
    label: "Từ vựng",
    color: "text-amber-500 bg-amber-500/10",
  },
  {
    href: "/grammar-lessons",
    icon: <BookOpen />,
    label: "Ngữ pháp",
    color: "text-secondary bg-secondary/10",
  },
];

type QuickActionsProps = {
  dash: DashboardData | null;
};

function QuickActions({ dash: _dash }: QuickActionsProps) {
  return (
    <div className="grid grid-cols-3 gap-2.5">
      {QUICK_ACTIONS.map((a, i) => (
        <Link key={a.href} href={a.href} className="block" style={{ textDecoration: "none" }}>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 * i }}
            whileHover={{ y: -2, x: -2, boxShadow: "var(--shadow)" }}
            whileTap={{ y: 2, x: 2, boxShadow: "none" }}
            className="p-4.5 rounded-xl border-2 border-border bg-surface text-center cursor-pointer shadow-(--shadow-sm) transition-all duration-100"
          >
            <div
              className={`w-9 h-9 border-2 border-border rounded-lg flex items-center justify-center mx-auto mb-2 text-sm shadow-(--shadow-sm) ${a.color}`}
            >
              {a.icon}
            </div>
            <div className="text-xs font-black text-text-primary">{a.label}</div>
          </motion.div>
        </Link>
      ))}
    </div>
  );
}

function WeeklyChart({ data }: { data: Array<{ day: string; count: number }> }) {
  const max = Math.max(...data.map((d) => d.count), 1);
  const dayLabels = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

  return (
    <div className="flex items-end gap-1.5 h-20 pt-4">
      {data.map((d, i) => {
        const h = Math.max(4, (d.count / max) * 64);
        return (
          <div key={d.day} className="flex-1 flex flex-col items-center gap-1.5">
            <div
              className={`text-[9px] font-bold font-mono ${d.count > 0 ? "text-accent" : "text-text-muted"}`}
            >
              {d.count > 0 ? d.count : ""}
            </div>
            <motion.div
              initial={{ height: 4 }}
              animate={{ height: h }}
              transition={{ delay: 0.05 * i, duration: 0.5, ease: "easeOut" }}
              style={{ height: `${h}px` }}
              className={`w-full max-w-[28px] rounded-t-lg ${
                d.count > 0
                  ? "bg-accent border-t-2 border-x-2 border-border shadow-(--shadow-sm)"
                  : "bg-bg-deep border-t-2 border-x-2 border-border/10"
              }`}
            />
            <div className="text-[10px] text-text-muted font-bold font-mono">
              {dayLabels[i] ?? d.day}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ScoreTimeline({ data }: { data: Array<{ week: string; xp: number }> }) {
  const maxXP = Math.max(...data.map((d) => d.xp), 1);
  const chartH = 100;

  // Build SVG polyline points
  const points = data
    .map((d, i) => {
      const x = data.length > 1 ? (i / (data.length - 1)) * 100 : 50;
      const y = chartH - (d.xp / maxXP) * (chartH - 15) - 8;
      return `${x},${y}`;
    })
    .join(" ");

  // Gradient area
  const areaPoints = `0,${chartH} ${points} 100,${chartH}`;

  return (
    <div className="flex flex-col gap-3">
      <svg
        viewBox={`0 0 100 ${chartH}`}
        className="w-full h-24 overflow-visible"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="xpGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.25" />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.01" />
          </linearGradient>
        </defs>
        <polygon points={areaPoints} fill="url(#xpGradient)" />
        <polyline
          points={points}
          fill="none"
          stroke="var(--accent)"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
        {data.map((d, i) => {
          const x = data.length > 1 ? (i / (data.length - 1)) * 100 : 50;
          const y = chartH - (d.xp / maxXP) * (chartH - 15) - 8;
          return (
            <circle
              key={d.week}
              cx={x}
              cy={y}
              r="2"
              fill="var(--surface)"
              stroke="var(--accent)"
              strokeWidth="1.2"
              vectorEffect="non-scaling-stroke"
            />
          );
        })}
      </svg>
      <div className="flex justify-between border-t border-border pt-2.5">
        {data.map((d) => (
          <div
            key={d.week}
            className="text-[10px] text-text-muted font-bold font-mono text-center flex-1"
          >
            <div className="text-accent leading-none font-extrabold mb-1">{d.xp}</div>
            <div className="text-[9px] text-text-muted leading-none">
              T{new Date(d.week).getDate()}/{new Date(d.week).getMonth() + 1}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
