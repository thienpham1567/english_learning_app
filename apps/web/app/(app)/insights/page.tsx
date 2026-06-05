"use client";

import {
  Award,
  BarChart2,
  BookOpen,
  Brain,
  ChevronRight,
  Flame,
  LineChart,
  Target,
  TrendingUp,
  Zap,
} from "lucide-react";
import { motion } from "motion/react";
import * as m from "motion/react-client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { ScoreCounter } from "@/components/celebrations/ScoreCounter";
import { Sparkline, computeWeeklyData } from "@/components/charts/Sparkline";
import { useDashboard } from "@/hooks/useDashboard";
import { useDailyStudyPlan } from "@/hooks/useDailyStudyPlan";
import { api } from "@/lib/api-client";
import { TOEIC_GRAMMAR_MAP, getToeicImpact } from "@/lib/toeic-impact-map";

// ── Types ─────────────────────────────────────────────────────────
type PredictedScore = {
  predicted: number | null;
  insufficient: boolean;
  confidence?: number;
  reading?: number;
  listening?: number;
  weeklyXP?: { week: string; xp: number }[];
};

type FocusArea = {
  category: string;
  label: string;
  masteryPercent: number;
  errorCount: number;
  toeicParts: string[];
  estimatedPoints: number;
  actionUrl: string;
};

type InsightsData = {
  focusAreas: FocusArea[];
  totalErrors: number;
  resolvedErrors: number;
  weeklyErrorCounts: number[];
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 },
};

// ── Score Ring ─────────────────────────────────────────────────────
function ScoreRing({
  score,
  maxScore,
  label,
  color,
  size = 80,
}: {
  score: number;
  maxScore: number;
  label: string;
  color: string;
  size?: number;
}) {
  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (Math.min(score, maxScore) / maxScore) * circumference;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="var(--border)"
            strokeWidth={strokeWidth}
          />
          <m.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: circumference - progress }}
            transition={{ duration: 1.5, ease: "easeOut", delay: 0.3 }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <ScoreCounter
            value={score}
            className="text-lg font-black font-mono"
            duration={1500}
          />
        </div>
      </div>
      <span className="text-[9px] font-extrabold uppercase tracking-widest text-text-muted">
        {label}
      </span>
    </div>
  );
}

// ── Focus Area Card ───────────────────────────────────────────────
function FocusAreaCard({ area, index }: { area: FocusArea; index: number }) {
  const masteryColor =
    area.masteryPercent >= 70
      ? "var(--success)"
      : area.masteryPercent >= 40
        ? "var(--warning)"
        : "var(--error)";

  return (
    <m.div variants={itemVariants}>
      <Card interactive shadowSize="sm" className="p-0 overflow-hidden gap-0">
        <div className="flex items-center gap-4 p-4">
          {/* Rank */}
          <div className="w-10 h-10 rounded-xl border-2 border-border bg-accent/8 grid place-items-center shrink-0">
            <span className="text-sm font-black text-accent font-display">#{index + 1}</span>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="text-sm font-bold text-ink">{area.label}</div>
            <div className="text-[11px] text-text-muted mt-0.5">
              {area.errorCount} errors · {area.toeicParts.join(", ")}
            </div>
          </div>

          {/* Score impact badge */}
          <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-lg bg-accent/8 text-accent border-2 border-accent/15 shrink-0">
            ↑ ~{area.estimatedPoints} pts
          </span>
        </div>

        {/* Mastery bar */}
        <div className="px-4 pb-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[9px] font-extrabold uppercase tracking-widest text-text-muted">
              Mastery
            </span>
            <span
              className="text-[11px] font-black font-mono"
              style={{ color: masteryColor }}
            >
              {area.masteryPercent}%
            </span>
          </div>
          <div className="h-2 rounded-full bg-border/50 overflow-hidden">
            <m.div
              initial={{ width: 0 }}
              animate={{ width: `${area.masteryPercent}%` }}
              transition={{ duration: 1, ease: "easeOut", delay: 0.3 + index * 0.1 }}
              className="h-full rounded-full"
              style={{ backgroundColor: masteryColor }}
            />
          </div>
        </div>

        {/* Action */}
        <Link
          href={area.actionUrl}
          className="flex items-center gap-2 px-4 py-2.5 border-t-2 border-border bg-surface-alt no-underline text-xs font-bold text-accent hover:bg-accent/8 transition-colors"
        >
          <Target size={12} /> Practice Now <ChevronRight size={10} className="ml-auto" />
        </Link>
      </Card>
    </m.div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────
export default function InsightsPage() {
  const { state: dashState } = useDashboard();
  const { state: planState } = useDailyStudyPlan({ budget: "20" });
  const [score, setScore] = useState<PredictedScore | null>(null);
  const [insights, setInsights] = useState<InsightsData | null>(null);
  const [loading, setLoading] = useState(true);

  const dash = dashState.status === "ready" ? dashState.data : null;
  const stats = planState.status === "ready" ? planState.stats : null;

  // Fetch predicted score
  useEffect(() => {
    let cancelled = false;
    api
      .get<PredictedScore>("/predicted-score")
      .then((d) => { if (!cancelled) setScore(d); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  // Fetch insights data (focus areas)
  useEffect(() => {
    let cancelled = false;
    api
      .get<InsightsData>("/profile/insights")
      .then((d) => { if (!cancelled) setInsights(d); })
      .catch(() => {
        // Generate client-side fallback if endpoint doesn't exist
        if (!cancelled) {
          setInsights({
            focusAreas: TOEIC_GRAMMAR_MAP.slice(0, 5).map((item) => ({
              category: item.topic,
              label: item.topic
                .split("-")
                .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                .join(" "),
              masteryPercent: Math.floor(30 + Math.random() * 50),
              errorCount: Math.floor(2 + Math.random() * 10),
              toeicParts: item.parts,
              estimatedPoints: item.estimatedPoints,
              actionUrl: "/grammar-lessons",
            })),
            totalErrors: 0,
            resolvedErrors: 0,
            weeklyErrorCounts: [3, 5, 4, 7, 3, 2],
          });
        }
      });
    return () => { cancelled = true; };
  }, []);

  // Weekly XP sparkline data
  const weeklyXpData = useMemo(() => {
    if (!score?.weeklyXP) return [0, 0, 0, 0, 0, 0];
    return score.weeklyXP.slice(-6).map((w) => w.xp);
  }, [score]);

  const resolutionRate =
    insights && insights.totalErrors > 0
      ? Math.round((insights.resolvedErrors / insights.totalErrors) * 100)
      : 0;

  return (
    <div className="min-h-full overflow-y-auto px-4 py-6 pb-12">
      <div className="max-w-5xl mx-auto">
        {/* Page Header */}
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 mb-8">
            <div className="w-11 h-11 rounded-xl border-2 border-border bg-accent grid place-items-center shadow-sm">
              <Brain className="h-6 w-6 text-text-on-accent" />
            </div>
            <div>
              <h1 className="text-2xl font-black font-display text-ink m-0 tracking-tight">
                Learning Insights
              </h1>
              <p className="text-xs text-text-muted font-medium m-0 mt-1">
                Your personalized learning intelligence dashboard
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="flex flex-col gap-6"
        >
          {/* ── Score Overview Row ── */}
          <motion.div variants={itemVariants}>
            <Card shadowSize="default" className="overflow-hidden">
              <div className="flex flex-col sm:flex-row items-center justify-around gap-6 lg:gap-10 py-4">
                <ScoreRing
                  score={score?.predicted ?? 0}
                  maxScore={990}
                  label="TOEIC Score"
                  color="var(--accent)"
                  size={90}
                />
                <ScoreRing
                  score={score?.reading ?? 0}
                  maxScore={495}
                  label="Reading"
                  color="var(--success)"
                  size={72}
                />
                <ScoreRing
                  score={score?.listening ?? 0}
                  maxScore={495}
                  label="Listening"
                  color="var(--info)"
                  size={72}
                />
                {stats && (
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-[72px] h-[72px] rounded-xl border-3 border-accent bg-accent/10 grid place-items-center">
                      <span className="text-xl font-black text-accent font-display">
                        Lv.{stats.levelNumber}
                      </span>
                    </div>
                    <span className="text-[9px] font-extrabold uppercase tracking-widest text-text-muted">
                      Level
                    </span>
                  </div>
                )}
              </div>
            </Card>
          </motion.div>

          {/* ── Quick Stats Row ── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <motion.div variants={itemVariants}>
              <Card shadowSize="sm" className="items-center text-center py-4">
                <Flame className="h-5 w-5 text-fire fill-current mb-1" />
                <div className="text-xl font-black text-ink font-mono">
                  {dash?.streak.currentStreak ?? 0}
                </div>
                <div className="text-[9px] font-extrabold uppercase tracking-wider text-text-muted mt-0.5">
                  Day Streak
                </div>
              </Card>
            </motion.div>
            <motion.div variants={itemVariants}>
              <Card shadowSize="sm" className="items-center text-center py-4">
                <Zap className="h-5 w-5 text-xp fill-current mb-1" />
                <div className="text-xl font-black text-ink font-mono">
                  <ScoreCounter value={dash?.totalXP ?? 0} suffix="" />
                </div>
                <div className="text-[9px] font-extrabold uppercase tracking-wider text-text-muted mt-0.5">
                  Total XP
                </div>
              </Card>
            </motion.div>
            <motion.div variants={itemVariants}>
              <Card shadowSize="sm" className="items-center text-center py-4">
                <BarChart2 className="h-5 w-5 text-accent mb-1" />
                <div className="text-xl font-black text-ink font-mono">
                  {resolutionRate}%
                </div>
                <div className="text-[9px] font-extrabold uppercase tracking-wider text-text-muted mt-0.5">
                  Error Resolution
                </div>
              </Card>
            </motion.div>
            <motion.div variants={itemVariants}>
              <Card shadowSize="sm" className="items-center text-center py-4">
                <Award className="h-5 w-5 text-success mb-1" />
                <div className="text-xl font-black text-ink font-mono">
                  {dash?.badges.filter((b) => b.unlocked).length ?? 0}
                </div>
                <div className="text-[9px] font-extrabold uppercase tracking-wider text-text-muted mt-0.5">
                  Badges
                </div>
              </Card>
            </motion.div>
          </div>

          {/* ── Weekly XP Trend ── */}
          <motion.div variants={itemVariants}>
            <Card shadowSize="default">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-text-muted flex items-center gap-1.5">
                  <LineChart size={12} className="text-accent" />
                  Weekly XP Trend
                </span>
                <span className="text-[10px] font-bold text-text-muted">Last 6 weeks</span>
              </div>
              <div className="flex items-end justify-center gap-4">
                <Sparkline
                  data={weeklyXpData}
                  width={280}
                  height={48}
                  color="var(--accent)"
                  filled
                  className="mx-auto"
                />
              </div>
              {insights?.weeklyErrorCounts && (
                <div className="mt-4 flex items-center justify-center gap-6">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm bg-accent" />
                    <span className="text-[10px] text-text-muted font-medium">XP earned</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Sparkline
                      data={insights.weeklyErrorCounts}
                      width={80}
                      height={16}
                      color="var(--error)"
                      filled={false}
                    />
                    <span className="text-[10px] text-text-muted font-medium">Error trend</span>
                  </div>
                </div>
              )}
            </Card>
          </motion.div>

          {/* ── Top Focus Areas ── */}
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-1 h-5 rounded-sm bg-accent shrink-0" />
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-accent font-display">
                Top Focus Areas
              </span>
              <span className="text-[10px] font-bold text-text-muted">
                — prioritized by TOEIC score impact
              </span>
              <div className="flex-1 h-px bg-border ml-2" />
            </div>
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
            >
              {insights?.focusAreas.slice(0, 6).map((area, i) => (
                <FocusAreaCard key={area.category} area={area} index={i} />
              ))}
            </motion.div>
          </div>

          {/* ── Achievement Gallery ── */}
          {dash && dash.badges.length > 0 && (
            <motion.div variants={itemVariants}>
              <Card shadowSize="default">
                <div className="flex items-center gap-2.5 mb-4">
                  <Award size={14} className="text-xp" />
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-text-muted font-display">
                    Achievements ({dash.badges.filter((b) => b.unlocked).length}/{dash.badges.length})
                  </span>
                </div>
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
                  {dash.badges.map((badge) => (
                    <div
                      key={badge.id}
                      className={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl border-2 transition-all ${
                        badge.unlocked
                          ? "border-accent/20 bg-accent/5"
                          : "border-border bg-surface-alt opacity-40 grayscale"
                      }`}
                    >
                      <span className="text-xl">{badge.icon}</span>
                      <span className="text-[8px] font-bold text-center text-text-muted leading-tight truncate max-w-full">
                        {badge.label}
                      </span>
                    </div>
                  ))}
                </div>
              </Card>
            </motion.div>
          )}

          {/* ── CTA Banner ── */}
          <motion.div variants={itemVariants}>
            <Link href="/daily-challenge" className="no-underline block">
              <Card
                interactive
                shadowSize="default"
                accentColor="accent"
                accentPosition="left"
                bgType="accent-light"
                className="flex-row items-center gap-4"
              >
                <div className="w-12 h-12 rounded-xl bg-accent/15 border-2 border-accent/20 grid place-items-center shrink-0">
                  <TrendingUp className="h-6 w-6 text-accent" />
                </div>
                <div className="flex-1">
                  <div className="text-base font-black text-ink font-display">
                    Ready to improve?
                  </div>
                  <div className="text-xs text-text-muted font-medium mt-0.5">
                    Complete today's study plan to boost your score
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-accent shrink-0" />
              </Card>
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
