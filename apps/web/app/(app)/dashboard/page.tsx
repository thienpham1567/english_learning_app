"use client";

import {
  AlertTriangle,
  Award,
  BookOpen,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  Flame,
  Headphones,
  HelpCircle,
  LayoutDashboard,
  Map,
  Rocket,
  RotateCw,
  Sparkles,
  Star,
  Target,
  TrendingUp,
  Trophy,
  Zap,
} from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { HeatmapCalendar } from "@/app/(app)/dashboard/_components/HeatmapCalendar";
import { WeeklyReport } from "@/app/(app)/dashboard/_components/WeeklyReport";
import {
  type DailyPlanItem,
  type DailyPlanStats,
  useDailyStudyPlan,
} from "@/hooks/useDailyStudyPlan";
import { type DashboardData, useDashboard } from "@/hooks/useDashboard";
import { api } from "@/lib/api-client";
import { useRoadmap } from "@/lib/curriculum/roadmap-context";
import { getWeek } from "@/lib/curriculum/data";

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

const sectionLabelClass =
  "flex items-center gap-2.5 text-[10px] font-extrabold uppercase tracking-widest text-accent mb-4.5 font-display";
const accentBarClass = "w-[3.5px] h-4 rounded-sm bg-accent shrink-0";

// ── Component ────────────────────────────────────────────────────
export default function DashboardPage() {
  const { state: dashState } = useDashboard();
  const { state: planState } = useDailyStudyPlan({ budget: "20" });
  const [score, setScore] = useState<PredictedScore | null>(null);
  const [scoreLoading, setScoreLoading] = useState(true);
  const [greeting, setGreeting] = useState("Hello");
  const [quote, setQuote] = useState("Every step counts on your TOEIC journey!");

  const quotes = [
    "Consistency is the key to mastering English. Keep going! 🚀",
    "Focus on your vocabulary today—it is the foundation of reading success. 💡",
    "Mistakes are opportunities. Review your Error Book! 📝",
    "Ready to boost your score? Complete today's study plan! 🎯",
    "Practice listening daily to capture every accent. 🎧",
    "Grammar roadmap is your guide. Master the rules step-by-step! 🗺️",
    "Your future self will thank you for studying English today. ✨",
  ];

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

  useEffect(() => {
    const hr = new Date().getHours();
    if (hr < 12) setGreeting("Good morning");
    else if (hr < 18) setGreeting("Good afternoon");
    else setGreeting("Good evening");

    const dayIndex = new Date().getDay();
    setQuote(quotes[dayIndex % quotes.length]);
  }, []);

  const dash: DashboardData | null = dashState.status === "ready" ? dashState.data : null;
  const planReady = planState.status === "ready" ? planState : null;

  const formattedDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });

  return (
    <div className="min-h-full overflow-y-auto px-4 py-4 pb-12">
      {/* ── Bespoke Welcome Hero Header ── */}
      <div className="max-w-5xl mx-auto mb-6">
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="relative overflow-hidden rounded-2xl bg-surface flex flex-col md:flex-row md:items-center justify-between gap-6">
            {/* Subtle grid pattern background */}
            <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.06] pointer-events-none bg-[linear-gradient(to_right,rgba(0,0,0,0.15)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,0,0,0.15)_1px,transparent_1px)] bg-[size:16px_16px]" />

            {/* Accent decoration blur */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-accent/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex items-start gap-4.5 relative z-10">
              <div className="w-14 h-14 rounded-2xl border-2 border-border bg-accent text-text-on-accent flex items-center justify-center shrink-0 shadow-sm relative overflow-hidden group">
                <motion.div
                  animate={{ rotate: [0, 8, -8, 8, 0] }}
                  transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
                >
                  <Rocket className="h-7 w-7 text-text-on-accent" />
                </motion.div>
              </div>

              <div className="flex flex-col">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-accent mb-1 font-mono">
                  {formattedDate}
                </span>
                <h1 className="m-0 text-2xl md:text-3xl font-black font-display text-ink tracking-tight leading-none">
                  {greeting}, TOEIC Learner!
                </h1>
                <p className="m-0 mt-2 text-xs md:text-sm text-text-secondary font-semibold max-w-xl italic">
                  "{quote}"
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0 relative z-10">
              <Link
                href="/daily-challenge"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-black border-2 border-border bg-accent text-ink shadow-sm hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer"
              >
                <Flame className="h-4 w-4 fill-current text-orange-600 animate-pulse" />
                <span>Daily Challenge</span>
              </Link>
            </div>
          </Card>
        </motion.div>

        {/* ── Streak + XP Banner Row ── */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full mt-4"
        >
          <StatCard
            icon={<Flame className="h-5 w-5 text-orange-500 fill-current" />}
            label="Streak"
            value={dash ? `${dash.streak.currentStreak} days` : "—"}
            sub={dash ? `Best: ${dash.streak.bestStreak} days` : ""}
            loading={!dash}
            iconBg="bg-orange-500/10 border-orange-500/20"
          />
          <StatCard
            icon={<Zap className="h-5 w-5 text-amber-500 fill-current" />}
            label="Total XP"
            value={dash ? `${dash.totalXP.toLocaleString()}` : "—"}
            sub="Experience points"
            loading={!dash}
            iconBg="bg-amber-500/10 border-amber-500/20"
          />
          <StatCard
            icon={<RotateCw className="h-5 w-5 text-accent" />}
            label="Due Reviews"
            value={dash ? `${dash.flashcardsDue + dash.vocabDue}` : "—"}
            sub={dash ? `${dash.flashcardsDue} cards · ${dash.vocabDue} words` : ""}
            loading={!dash}
            iconBg="bg-accent/15 border-accent/20"
          />
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.62fr_1fr] gap-5 items-start max-w-5xl mx-auto px-1">
        {/* Left Column: Focus & Core Actions */}
        <div className="flex flex-col gap-5">
          {/* ── Roadmap Progress ── */}
          <RoadmapProgressCard />

          {/* ── Predicted TOEIC Score ── */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <Card className="rounded-2xl relative overflow-hidden bg-surface">
              <div className={sectionLabelClass}>
                <div className={accentBarClass} />
                <span>Predicted TOEIC Score</span>
                <div className="flex-1 h-px bg-border ml-2" />
              </div>

              {scoreLoading ? (
                <div className="space-y-4 animate-pulse py-4">
                  <div className="h-5 bg-bg-deep border border-border/20 rounded-md w-3/4" />
                  <div className="h-5 bg-bg-deep border border-border/20 rounded-md w-1/2" />
                </div>
              ) : score?.insufficient ? (
                <InsufficientDataCard score={score} />
              ) : score?.predicted ? (
                <ScoreDisplay score={score} />
              ) : (
                <p className="text-xs text-text-muted text-center py-8 font-semibold">
                  No score projection data available. Keep practicing to build stats!
                </p>
              )}
            </Card>
          </motion.div>

          {/* ── Daily Study Plan ── */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <Card className="rounded-2xl relative overflow-hidden bg-surface">
              <div className={sectionLabelClass}>
                <div className={accentBarClass} />
                <span>Today's Study Plan</span>
                <div className="flex-1 h-px bg-border ml-2" />
              </div>

              {planState.status === "loading" ? (
                <div className="space-y-3.5 animate-pulse py-2">
                  <div className="h-5 bg-bg-deep border border-border/20 rounded-md w-4/5" />
                  <div className="h-5 bg-bg-deep border border-border/20 rounded-md w-2/3" />
                  <div className="h-5 bg-bg-deep border border-border/20 rounded-md w-3/4" />
                </div>
              ) : planReady ? (
                <StudyPlanSection items={planReady.plan.items} stats={planReady.stats} />
              ) : (
                <p className="text-xs text-text-muted text-center py-6 font-semibold">
                  Complete more exercises to unlock your personalized daily study plan!
                </p>
              )}
            </Card>
          </motion.div>

          {/* ── Quick Actions ── */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
          >
            <Card className="rounded-2xl relative overflow-hidden bg-surface">
              <div className={sectionLabelClass}>
                <div className={accentBarClass} />
                <span>Quick Access</span>
                <div className="flex-1 h-px bg-border ml-2" />
              </div>
              <QuickActions dash={dash} />
            </Card>
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
            >
              <Card className="rounded-2xl relative overflow-hidden bg-surface">
                <div className={sectionLabelClass}>
                  <div className={accentBarClass} />
                  <span>Weekly Activity</span>
                  <div className="flex-1 h-px bg-border ml-2" />
                </div>
                <WeeklyChart data={dash.weeklyActivity} />
              </Card>
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
              transition={{ delay: 0.55 }}
            >
              <Card className="rounded-2xl relative overflow-hidden bg-surface">
                <div className={sectionLabelClass}>
                  <div className={accentBarClass} />
                  <span>Weekly XP Trend</span>
                  <div className="flex-1 h-px bg-border ml-2" />
                </div>
                <ScoreTimeline data={score.weeklyXP} />
              </Card>
            </motion.div>
          )}

          {/* ── Recent Badges ── */}
          {dash && dash.badges.filter((b) => b.unlocked).length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55 }}
            >
              <Card className="rounded-2xl relative overflow-hidden bg-surface">
                <div className={sectionLabelClass}>
                  <div className={accentBarClass} />
                  <span>Unlocked Badges</span>
                  <div className="flex-1 h-px bg-border ml-2" />
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {dash.badges
                    .filter((b) => b.unlocked)
                    .slice(0, 6)
                    .map((b) => (
                      <motion.div
                        key={b.id}
                        whileHover={{ scale: 1.05, rotate: [0, -2, 2, -2, 0] }}
                        transition={{ type: "spring", stiffness: 300, damping: 15 }}
                        className="p-3.5 rounded-xl border-2 border-border bg-surface-alt flex flex-col items-center justify-center text-center shadow-sm relative overflow-hidden"
                      >
                        <div className="w-11 h-11 rounded-full bg-accent/10 border-2 border-accent/20 flex items-center justify-center mb-2 shadow-sm text-xl">
                          {b.icon}
                        </div>
                        <div className="text-[10px] font-black text-text-primary font-display leading-tight truncate max-w-full px-0.5">
                          {b.label}
                        </div>
                        <span className="text-[7px] text-text-muted font-bold tracking-wider mt-1 uppercase font-mono">
                          Unlocked
                        </span>
                      </motion.div>
                    ))}
                </div>
              </Card>
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
  iconBg = "bg-bg-deep",
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  loading: boolean;
  iconBg?: string;
}) {
  return (
    <motion.div
      variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } }}
      transition={{ type: "spring", stiffness: 350, damping: 25 }}
    >
      <Card
        interactive
        shadowSize="sm"
        className="flex-1 min-w-[120px] rounded-2xl p-4.5 bg-surface relative overflow-hidden"
      >
        {loading ? (
          <div className="h-12 bg-bg-deep border-2 border-border rounded-xl animate-pulse w-full" />
        ) : (
          <div className="flex items-center gap-4 relative z-10">
            <div
              className={`w-12 h-12 rounded-xl border-2 border-border flex items-center justify-center shrink-0 shadow-sm ${iconBg} transition-colors duration-200`}
            >
              {icon}
            </div>
            <div className="text-left min-w-0 flex-1">
              <div className="text-xl md:text-2xl font-black text-text-primary font-mono tracking-tight leading-none truncate">
                {value}
              </div>
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-text-muted mt-2 font-display">
                {label}
              </div>
              {sub && (
                <div className="text-[10px] text-text-secondary mt-1 font-sans truncate font-medium">
                  {sub}
                </div>
              )}
            </div>
          </div>
        )}
      </Card>
    </motion.div>
  );
}

function ScoreDisplay({ score }: { score: PredictedScore }) {
  const pct = Math.round(((score.predicted ?? 0) / 990) * 100);
  const color = pct >= 75 ? "var(--success)" : pct >= 50 ? "var(--warning)" : "var(--accent)";

  const radius = 56;
  const stroke = 8;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (pct / 100) * circumference;

  return (
    <div className="flex items-center gap-6 flex-wrap md:flex-nowrap">
      <div className="relative flex items-center justify-center w-[130px] h-[130px] mx-auto shrink-0 bg-surface rounded-full p-2 border border-border/10 shadow-sm">
        <svg height={130} width={130} className="transform -rotate-90">
          <defs>
            <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="var(--accent)" />
              <stop offset="100%" stopColor="var(--secondary)" />
            </linearGradient>
          </defs>
          <circle
            stroke="var(--bg-deep)"
            fill="transparent"
            strokeWidth={stroke}
            r={normalizedRadius}
            cx={65}
            cy={65}
          />
          <motion.circle
            stroke="url(#scoreGrad)"
            fill="transparent"
            strokeWidth={stroke}
            strokeDasharray={circumference + " " + circumference}
            style={{ strokeDashoffset }}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            strokeLinecap="round"
            r={normalizedRadius}
            cx={65}
            cy={65}
          />
        </svg>
        <div className="absolute flex flex-col items-center justify-center">
          <span className="font-display text-3xl font-black text-text-primary leading-none">
            {score.predicted}
          </span>
          <span className="text-[9px] text-text-muted font-black uppercase tracking-widest mt-1.5 font-mono">
            / 990 max
          </span>
        </div>
      </div>

      <div className="flex-1 min-w-[200px] flex flex-col gap-4">
        {/* L/R split */}
        <div className="flex gap-3">
          <MiniScore
            label="Listening"
            value={score.listening ?? 0}
            max={495}
            color="#2D5BFF"
            icon={<Headphones className="h-4.5 w-4.5" />}
          />
          <MiniScore
            label="Reading"
            value={score.reading ?? 0}
            max={495}
            color="#EC4899"
            icon={<BookOpen className="h-4.5 w-4.5" />}
          />
        </div>

        {/* Components Breakdown */}
        {score.components && (
          <div className="grid grid-cols-2 gap-x-4 gap-y-3.5 border-t border-border pt-4">
            {[
              { k: "Grammar", v: score.components.grammar, color: "bg-purple-500" },
              { k: "Listening", v: score.components.listeningAccuracy, color: "bg-blue-500" },
              { k: "Vocabulary", v: score.components.vocabulary, color: "bg-amber-500" },
              { k: "Strengths", v: score.components.topScores, color: "bg-emerald-500" },
            ].map((c) => (
              <div key={c.k} className="space-y-1.5">
                <div className="flex justify-between text-[10px] font-bold text-text-secondary">
                  <span>{c.k}</span>
                  <span className="font-black text-text-primary">{c.v}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-bg-deep border border-border/60 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${c.v}%` }}
                    transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
                    className={`h-full rounded-full ${c.color}`}
                  />
                </div>
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
  icon,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
  icon: React.ReactNode;
}) {
  return (
    <div
      style={{
        background: `color-mix(in srgb, ${color} 7%, var(--surface))`,
        borderColor: `color-mix(in srgb, ${color} 25%, var(--border))`,
      }}
      className="flex-1 p-3 rounded-xl border-2 text-left flex items-center gap-3 shadow-sm relative overflow-hidden"
    >
      <div
        style={{ color }}
        className="w-8 h-8 rounded-lg border-2 border-current flex items-center justify-center shrink-0 bg-surface"
      >
        {icon}
      </div>
      <div className="min-w-0">
        <div style={{ color }} className="text-lg font-black font-mono leading-none">
          {value}
        </div>
        <div className="text-[9px] text-text-muted font-extrabold uppercase tracking-wider mt-1 font-display truncate">
          {label}
        </div>
      </div>
    </div>
  );
}

function InsufficientDataCard({ score }: { score: PredictedScore }) {
  return (
    <div className="text-center py-6 px-4 bg-surface rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center">
      <div className="w-12 h-12 rounded-2xl bg-bg-deep border-2 border-border flex items-center justify-center mb-3 shadow-sm">
        <TrendingUp className="h-6 w-6 text-text-muted animate-pulse" />
      </div>
      <h3 className="text-sm font-black text-ink tracking-tight mb-1 font-display">
        More Data Needed for Prediction
      </h3>
      <p className="text-xs text-text-secondary font-semibold max-w-sm mb-4.5 leading-relaxed">
        We need a bit more activity to estimate your TOEIC score. Complete:
        <span className="block mt-1 font-bold text-accent font-mono text-xs">
          {score.quizzesNeeded
            ? `${score.quizzesNeeded} more grammar quiz${score.quizzesNeeded > 1 ? "zes" : ""}`
            : ""}
          {score.quizzesNeeded && score.listeningNeeded ? " & " : ""}
          {score.listeningNeeded
            ? `${score.listeningNeeded} more listening practice${score.listeningNeeded > 1 ? "s" : ""}`
            : ""}
        </span>
      </p>

      <div className="flex gap-3 justify-center flex-wrap w-full">
        <Link
          href="/toeic/skills?tab=part5"
          className="flex-1 min-w-[130px] inline-flex items-center justify-center gap-1.5 px-4.5 py-2.5 rounded-xl text-xs font-black border-2 border-border bg-accent text-ink shadow-sm hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer"
        >
          <HelpCircle className="h-3.5 w-3.5" />
          <span>Grammar Quiz</span>
        </Link>
        <Link
          href="/toeic/skills"
          className="flex-1 min-w-[130px] inline-flex items-center justify-center gap-1.5 px-4.5 py-2.5 rounded-xl text-xs font-black border-2 border-border bg-surface text-text-primary shadow-sm hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer"
        >
          <Target className="h-3.5 w-3.5" />
          <span>Practice Listening</span>
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
        <div className="flex-1 h-3 rounded-full bg-bg-deep overflow-hidden relative border-2 border-border">
          <div
            style={{ width: `${pct}%` }}
            className="h-full rounded-full bg-gradient-to-r from-accent to-secondary transition-all duration-500 ease-out"
          />
        </div>
        <span className="text-xs font-extrabold text-accent font-mono leading-none">
          {completed}/{items.length} completed
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
                  ? "bg-success-bg border-success/30 opacity-60 hover:opacity-85"
                  : "bg-surface border-border hover:translate-x-[2px] hover:shadow-sm active:translate-x-0"
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
                <div className="text-[10px] text-text-muted font-bold mt-1.5 flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 shrink-0" />
                  <span>
                    {item.estimatedMinutes} mins · {item.reason}
                  </span>
                </div>
              </div>

              {item.priority === "high" && !item.completed && (
                <span className="px-2 py-0.5 rounded-lg text-[9px] font-extrabold bg-error/10 border-2 border-error/50 text-error">
                  Priority
                </span>
              )}
            </div>
          </Link>
        ))}
      </div>

      {/* Level Banner */}
      {stats && (
        <div className="p-3.5 rounded-xl bg-surface-alt border-2 border-border flex items-center gap-3 shadow-sm mt-1">
          <div className="w-9 h-9 rounded-lg border-2 border-border bg-amber-500/10 flex items-center justify-center shrink-0">
            <Star className="text-amber-500 h-4.5 w-4.5 fill-current shrink-0 animate-pulse" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[10px] font-extrabold uppercase tracking-wider text-text-muted leading-none">
              Level {stats.levelNumber}
            </div>
            <div className="text-[11px] text-text-secondary font-bold mt-1.5 leading-none">
              <span className="text-text-primary font-black font-mono">
                {stats.totalXP.toLocaleString()}
              </span>{" "}
              / {stats.nextLevelXP.toLocaleString()} XP
            </div>
          </div>
          <div className="w-24 h-3 bg-bg-deep rounded-full overflow-hidden border-2 border-border shrink-0 relative">
            <div
              style={{
                width: `${Math.min(100, (stats.currentLevelXP / stats.nextLevelXP) * 100)}%`,
              }}
              className="h-full bg-accent rounded-full transition-all duration-500"
            />
          </div>
        </div>
      )}
    </div>
  );
}

const QUICK_ACTIONS = [
  {
    href: "/roadmap",
    icon: <Map />,
    label: "Roadmap",
    color: "text-blue-500 bg-blue-500/10 hover:bg-blue-500/15",
  },
  {
    href: "/daily-challenge",
    icon: <Flame />,
    label: "Challenge",
    color: "text-orange-500 bg-orange-500/10 hover:bg-orange-500/15",
  },
  {
    href: "/toeic/skills",
    icon: <Target />,
    label: "TOEIC Practice",
    color: "text-accent bg-accent/10 hover:bg-accent/15",
  },
  {
    href: "/flashcards",
    icon: <BookOpen />,
    label: "Flashcards",
    color: "text-emerald-500 bg-emerald-500/10 hover:bg-emerald-500/15",
  },
  {
    href: "/error-notebook",
    icon: <AlertTriangle />,
    label: "Error Book",
    color: "text-red-500 bg-red-500/10 hover:bg-red-500/15",
  },
  {
    href: "/my-vocabulary",
    icon: <Star />,
    label: "Vocabulary",
    color: "text-amber-500 bg-amber-500/10 hover:bg-amber-500/15",
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
            transition={{ delay: 0.04 * i }}
          >
            <Card interactive shadowSize="sm" className="p-4 text-center group bg-surface">
              <div
                className={`w-9 h-9 border-2 border-border rounded-lg flex items-center justify-center mx-auto mb-2 text-sm shadow-sm transition-transform group-hover:scale-110 duration-200 ${a.color}`}
              >
                {a.icon}
              </div>
              <div className="text-xs font-black text-text-primary leading-tight font-display">
                {a.label}
              </div>
            </Card>
          </motion.div>
        </Link>
      ))}
    </div>
  );
}

function WeeklyChart({ data }: { data: Array<{ day: string; count: number }> }) {
  const max = Math.max(...data.map((d) => d.count), 1);
  const dayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <div className="flex items-end gap-2.5 h-32 pt-6 px-2 w-full justify-between">
      {data.map((d, i) => {
        const h = Math.max(6, (d.count / max) * 76);
        return (
          <div key={d.day} className="flex-1 flex flex-col items-center gap-2 group relative">
            <div className="absolute bottom-full mb-1 bg-ink text-surface border border-border text-[9px] font-black font-mono px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10 shadow-sm">
              {d.count} actions
            </div>

            <div
              className={`text-[9px] font-black font-mono leading-none ${d.count > 0 ? "text-accent" : "text-text-muted"}`}
            >
              {d.count > 0 ? d.count : "—"}
            </div>
            <motion.div
              initial={{ height: 6 }}
              animate={{ height: h }}
              transition={{ delay: 0.05 * i, duration: 0.6, ease: "easeOut" }}
              style={{ height: `${h}px` }}
              className={`w-full max-w-[28px] rounded-t-lg transition-colors ${
                d.count > 0
                  ? "bg-gradient-to-t from-accent to-orange-500 border-2 border-border shadow-sm"
                  : "bg-bg-deep border-2 border-border/10"
              }`}
            />
            <div className="text-[10px] text-text-muted font-bold font-mono leading-none">
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

  const points = data.map((d, i) => {
    const x = data.length > 1 ? (i / (data.length - 1)) * 100 : 50;
    const y = chartH - (d.xp / maxXP) * (chartH - 28) - 12;
    return { x, y, week: d.week, xp: d.xp };
  });

  let linePath = "";
  if (points.length > 0) {
    linePath = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p1 = points[i];
      const p2 = points[i + 1];
      const cp1x = p1.x + (p2.x - p1.x) / 3;
      const cp1y = p1.y;
      const cp2x = p1.x + (2 * (p2.x - p1.x)) / 3;
      const cp2y = p2.y;
      linePath += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }
  }

  const areaPath =
    points.length > 0
      ? `${linePath} L ${points[points.length - 1].x} ${chartH} L ${points[0].x} ${chartH} Z`
      : "";

  return (
    <div className="flex flex-col gap-4">
      <div className="relative w-full h-28 px-1">
        <svg
          viewBox={`0 0 100 ${chartH}`}
          className="w-full h-full overflow-visible"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="xpGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.3" />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.0" />
            </linearGradient>
          </defs>
          {areaPath && <path d={areaPath} fill="url(#xpGradient)" />}
          {linePath && (
            <path
              d={linePath}
              fill="none"
              stroke="var(--accent)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}
          {points.map((p) => (
            <g key={p.week} className="group/node">
              <circle
                cx={p.x}
                cy={p.y}
                r="3.5"
                className="fill-surface stroke-accent cursor-pointer transition-all duration-250 hover:r-5 hover:stroke-width-3"
                strokeWidth="2"
              />
            </g>
          ))}
        </svg>
      </div>
      <div className="flex justify-between border-t border-border pt-3">
        {data.map((d) => (
          <div
            key={d.week}
            className="text-[10px] text-text-muted font-bold font-mono text-center flex-1"
          >
            <div className="text-accent leading-none font-black mb-1.5">{d.xp}</div>
            <div className="text-[9px] text-text-muted leading-none">
              {new Date(d.week).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RoadmapProgressCard() {
  const { getCurrentWeek, getOverallProgress, getWeekProgress } = useRoadmap();
  const currentWeek = getCurrentWeek();
  const overall = getOverallProgress();
  const weekProg = getWeekProgress(currentWeek);
  const week = getWeek(currentWeek);

  const circumference = 2 * Math.PI * 38;
  const offset = circumference * (1 - overall.percent / 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.12 }}
    >
      <Card className="rounded-2xl relative overflow-hidden bg-surface">
        <div
          className="absolute top-0 left-0 right-0 h-[3px]"
          style={{
            background: "linear-gradient(90deg, #22c55e, #3b82f6, #f59e0b)",
          }}
        />

        <div className={sectionLabelClass}>
          <div className={accentBarClass} />
          <span>Learning Roadmap</span>
          <span className="text-[9px] font-extrabold rounded-lg bg-accent/10 text-accent border border-accent/20 px-2 py-0.5 ml-1">
            Week {currentWeek}/24
          </span>
          <div className="flex-1 h-px bg-border ml-2" />
        </div>

        <div className="flex items-center gap-5">
          {/* Mini progress ring */}
          <div className="relative w-[76px] h-[76px] shrink-0">
            <svg viewBox="0 0 88 88" className="w-full h-full -rotate-90">
              <circle cx="44" cy="44" r="38" fill="none" stroke="var(--border)" strokeWidth="7" />
              <circle
                cx="44"
                cy="44"
                r="38"
                fill="none"
                stroke="var(--accent)"
                strokeWidth="7"
                strokeLinecap="round"
                strokeDasharray={`${circumference}`}
                strokeDashoffset={`${offset}`}
                className="transition-all duration-700"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-lg font-black text-ink font-display leading-none">
                {overall.percent}%
              </div>
              <div className="text-[7px] text-text-muted font-bold uppercase tracking-wider mt-0.5">
                Overall
              </div>
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="text-sm font-black text-ink font-display leading-tight truncate">
              {week?.focusTopic ?? "Start your journey!"}
            </div>
            <div className="text-[10px] text-text-muted font-bold mt-1">
              This week: {weekProg.completed}/{weekProg.total} units completed
            </div>

            {/* Week progress bar */}
            <div className="flex items-center gap-2 mt-2">
              <div className="flex-1 h-2 rounded-full bg-bg-deep overflow-hidden border border-border">
                <div
                  className="h-full rounded-full bg-accent transition-all duration-500"
                  style={{ width: `${weekProg.percent}%` }}
                />
              </div>
              <span className="text-[10px] font-black text-text-muted tabular-nums font-mono">
                {weekProg.percent}%
              </span>
            </div>

            <Link
              href={`/roadmap/week/${currentWeek}`}
              className="inline-flex items-center gap-1 mt-2.5 text-[11px] font-black text-accent hover:underline no-underline"
            >
              Continue Learning <ChevronRight size={12} />
            </Link>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
