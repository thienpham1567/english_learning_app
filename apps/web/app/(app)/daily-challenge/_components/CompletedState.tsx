"use client";

import { BarChart3, ChevronRight, Clock, Loader2, Star, Trophy, XCircle, Zap } from "lucide-react";
import * as m from "motion/react-client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { StreakFire } from "@/components/shared";
import type {
  Badge,
  DailyChallenge,
  ExerciseAnswer,
  StreakInfo,
} from "@/lib/daily-challenge/types";
import { BadgeGallery } from "./BadgeGallery";

/** Milliseconds until midnight VN time (UTC+7). */
function msUntilVnMidnight(): number {
  const now = new Date();
  const vnToday = now.toLocaleDateString("en-CA", { timeZone: "Asia/Ho_Chi_Minh" });
  const tomorrow = new Date(vnToday + "T00:00:00+07:00");
  tomorrow.setDate(tomorrow.getDate() + 1);
  return Math.max(0, tomorrow.getTime() - now.getTime());
}

function formatCountdown(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

/* ── Score Ring ── */
function MiniScoreRing({
  score,
  total,
  isGood,
}: {
  score: number;
  total: number;
  isGood: boolean;
}) {
  const radius = 42;
  const stroke = 6;
  const circumference = 2 * Math.PI * radius;
  const pct = total > 0 ? score / total : 0;
  const offset = circumference * (1 - pct);
  const size = 100;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="block transform -rotate-90">
      <defs>
        <linearGradient id="scoreRingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="var(--accent)" />
          <stop offset="100%" stopColor="var(--secondary)" />
        </linearGradient>
      </defs>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="rgba(255,255,255,0.12)"
        strokeWidth={stroke}
      />
      <m.circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={isGood ? "url(#scoreRingGrad)" : "var(--accent)"}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={circumference}
        initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 1.0, ease: "easeOut", delay: 0.2 }}
      />
    </svg>
  );
}

/* ── Weekly Mini Bar Chart ── */
function WeeklyChart({ scores }: { scores: { day: string; score: number }[] }) {
  const maxScore = 5;
  const barWidth = 28;
  const barGap = 10;
  const chartHeight = 70;
  const chartWidth = scores.length * (barWidth + barGap) - barGap;

  return (
    <div className="rounded-2xl border-2 border-border bg-surface py-4 px-5 shadow-sm">
      <div className="flex items-center gap-1.5 mb-4">
        <BarChart3 size={13} className="text-accent" />
        <span className="text-[10px] font-extrabold uppercase tracking-widest text-accent font-display">
          Last 7 Days History
        </span>
      </div>

      <svg width="100%" viewBox={`0 0 ${chartWidth} ${chartHeight + 22}`} className="block overflow-visible">
        {scores.map((s, i) => {
          const barHeight = (s.score / maxScore) * chartHeight;
          const x = i * (barWidth + barGap);
          const y = chartHeight - barHeight;
          const pct = s.score / maxScore;
          const fill =
            pct >= 0.8
              ? "var(--success)"
              : pct >= 0.5
                ? "var(--accent)"
                : "var(--error)";

          return (
            <g key={i} className="group/bar">
              {/* Background bar */}
              <rect
                x={x}
                y={0}
                width={barWidth}
                height={chartHeight}
                rx={6}
                fill="var(--surface-alt)"
                className="stroke-1 stroke-border/5"
              />
              {/* Score bar */}
              {s.score > 0 && (
                <m.rect
                  x={x}
                  width={barWidth}
                  rx={6}
                  fill={fill}
                  initial={{ y: chartHeight, height: 0 }}
                  animate={{ y, height: barHeight }}
                  transition={{ type: "spring", stiffness: 60, damping: 10, delay: i * 0.08 }}
                />
              )}
              {/* Score label */}
              <text
                x={x + barWidth / 2}
                y={s.score > 0 ? y - 6 : chartHeight - 6}
                textAnchor="middle"
                className="text-[10px] font-black font-mono"
                style={{ fill: s.score > 0 ? "var(--text-primary)" : "var(--text-muted)" }}
              >
                {s.score > 0 ? s.score : "0"}
              </text>
              {/* Day label */}
              <text
                x={x + barWidth / 2}
                y={chartHeight + 16}
                textAnchor="middle"
                className="text-[9px] font-bold font-body"
                style={{ fill: "var(--text-muted)" }}
              >
                {s.day}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

type BonusState = "idle" | "loading" | "active" | "submitting" | "results" | "completed" | "error";

export function CompletedState({
  challenge,
  streak,
  badges,
  onStartBonus,
  bonusState,
}: {
  challenge: DailyChallenge;
  streak: StreakInfo;
  badges: Badge[];
  onStartBonus?: () => void;
  bonusState?: BonusState;
}) {
  const answers = (challenge.answers ?? []) as ExerciseAnswer[];
  const score = challenge.score ?? 0;
  const correctCount = answers.filter((a) => a.isCorrect).length;
  const isGood = score >= 4;

  const [countdown, setCountdown] = useState(() => msUntilVnMidnight());

  useEffect(() => {
    const id = setInterval(() => setCountdown(msUntilVnMidnight()), 1000);
    return () => clearInterval(id);
  }, []);

  const [weeklyScores, setWeeklyScores] = useState<{ day: string; score: number }[]>([]);
  useEffect(() => {
    try {
      const WEEK_KEY = "daily-challenge-weekly";
      const stored = localStorage.getItem(WEEK_KEY);
      let weekData: Record<string, number> = {};
      if (stored) {
        weekData = JSON.parse(stored);
      }
      const today = new Date().toISOString().slice(0, 10);
      weekData[today] = score;
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 14);
      for (const key of Object.keys(weekData)) {
        if (key < cutoff.toISOString().slice(0, 10)) {
          delete weekData[key];
        }
      }
      localStorage.setItem(WEEK_KEY, JSON.stringify(weekData));

      const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const result: { day: string; score: number }[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const key = d.toISOString().slice(0, 10);
        result.push({
          day: days[d.getDay()],
          score: weekData[key] ?? 0,
        });
      }
      setWeeklyScores(result);
    } catch {
      /* ignore */
    }
  }, [score]);

  const wrongAnswers = answers.filter((a) => !a.isCorrect);
  const bonusAvailable = bonusState === "idle" || bonusState === "error";
  const bonusCompleted = bonusState === "completed";
  const bonusLoading = bonusState === "loading";

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col gap-5">
      {/* ── Hero Card ── */}
      <m.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        style={{
          background: isGood
            ? "linear-gradient(135deg, #4c1d95, #6d28d9 60%, #7c3aed)"
            : "var(--surface)",
        }}
        className={`w-full rounded-2xl border-2 border-border p-8 shadow relative overflow-hidden flex flex-col items-center text-center ${
          isGood ? "text-white border-none" : "text-text-primary"
        }`}
      >
        {isGood && (
          <div
            className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_80%_60%_at_80%_0%,rgba(255,255,255,0.15)_0%,transparent_70%)]"
          />
        )}

        {/* Score ring */}
        <div className="relative w-[100px] h-[100px] mb-3.5 flex items-center justify-center">
          <MiniScoreRing score={correctCount} total={answers.length} isGood={isGood} />
          <div className="absolute flex flex-col items-center justify-center">
            <span
              className="text-4xl font-black font-mono leading-none tracking-tight"
              style={{
                color: isGood ? "#ffffff" : "var(--accent)",
              }}
            >
              {score}
            </span>
            <span
              className={`text-[9px] font-extrabold uppercase tracking-wider mt-1 ${
                isGood ? "text-white/70" : "text-text-muted"
              }`}
            >
              / {answers.length} correct
            </span>
          </div>
        </div>

        {/* Title */}
        <h2 className="text-xl md:text-2xl font-black font-display tracking-tight leading-tight flex items-center gap-2 mt-2 mb-1.5">
          {isGood ? (
            <>
              <Trophy className="h-5.5 w-5.5 text-accent animate-bounce shrink-0" />
              <span>Incredible Work!</span>
            </>
          ) : (
            <>
              <Star className="h-5.5 w-5.5 text-accent fill-current shrink-0" />
              <span>Well Done!</span>
            </>
          )}
        </h2>
        
        <p className={`text-xs md:text-sm font-semibold max-w-sm mb-4.5 leading-relaxed ${
          isGood ? "text-white/80" : "text-text-secondary"
        }`}>
          {isGood
            ? "You have successfully completed today's tough questions. Keep it up!"
            : "Congratulations on completing today's exercises. Consistency is key to success!"}
        </p>

        {/* Streak Indicator */}
        <div className="flex justify-center mt-1">
          <StreakFire streak={streak.currentStreak} />
        </div>
      </m.div>

      {/* ── Bonus Round CTA ── */}
      {onStartBonus && bonusAvailable && (
        <m.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ scale: 1.02, y: -2, boxShadow: "var(--shadow)" }}
          whileTap={{ scale: 0.98 }}
          onClick={onStartBonus}
          className="w-full rounded-2xl py-4.5 px-5 cursor-pointer flex flex-col sm:flex-row items-center gap-4 bg-surface border-2 border-dashed border-accent shadow-sm text-left group"
        >
          <div
            className="w-12 h-12 rounded-xl grid shrink-0 bg-amber-500 place-items-center shadow-sm text-white"
          >
            <Zap size={20} className="fill-current group-hover:animate-bounce" />
          </div>
          <div className="flex-1">
            <div className="text-sm font-black text-text-primary font-display flex items-center gap-1.5">
              <Zap size={14} className="text-accent fill-current shrink-0" />
              <span>Bonus Round Challenge</span>
            </div>
            <p className="text-xs text-text-secondary font-bold mt-1 leading-none">
              3 quick questions · Earn extra XP · No penalty for incorrect answers
            </p>
          </div>
          <ChevronRight size={15} className="text-text-muted shrink-0 ml-auto" />
        </m.button>
      )}

      {bonusLoading && (
        <div className="w-full rounded-2xl py-4.5 px-5 bg-surface border-2 border-border flex items-center justify-center gap-2.5 text-text-secondary text-xs font-black shadow-sm">
          <Loader2 className="animate-spin text-accent h-4 w-4" />
          <span>Initializing Bonus Challenge...</span>
        </div>
      )}

      {bonusCompleted && (
        <m.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full rounded-2xl py-4 px-5 flex items-center gap-2.5 text-xs font-black text-amber-600 bg-amber-500/10 border-2 border-amber-500/30 shadow-sm"
        >
          <Zap size={15} className="fill-current animate-pulse" />
          <span>You have completed all bonus questions today!</span>
          <Star size={12} className="text-amber-500 fill-current ml-1" />
        </m.div>
      )}

      {/* ── Weekly Performance Chart ── */}
      {weeklyScores.length > 0 && (
        <m.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <WeeklyChart scores={weeklyScores} />
        </m.div>
      )}

      {/* ── Personal Stats ── */}
      <m.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="rounded-2xl border-2 border-border bg-surface py-4.5 px-5 shadow-sm"
      >
        <div className="flex items-center gap-1.5 mb-3.5">
          <Trophy size={14} className="text-accent" />
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-accent font-display">
            Personal Performance
          </span>
        </div>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="rounded-xl bg-surface-alt border-2 border-border p-3 shadow-sm">
            <div className="text-xl md:text-2xl font-black text-accent font-mono leading-none">
              {streak.currentStreak}
            </div>
            <div className="text-[9px] font-extrabold uppercase tracking-wider text-text-muted mt-2 font-display">
              Streak
            </div>
          </div>
          <div className="rounded-xl bg-surface-alt border-2 border-border p-3 shadow-sm">
            <div className="text-xl md:text-2xl font-black text-emerald-500 font-mono leading-none">
              {score}/5
            </div>
            <div className="text-[9px] font-extrabold uppercase tracking-wider text-text-muted mt-2 font-display">
              Today's Score
            </div>
          </div>
          <div className="rounded-xl bg-surface-alt border-2 border-border p-3 shadow-sm">
            <div className="text-xl md:text-2xl font-black text-secondary font-mono leading-none">
              {(() => {
                try {
                  const best = localStorage.getItem("daily-challenge-best");
                  if (!best) return "—";
                  const ms = parseInt(best, 10);
                  return `${Math.floor(ms / 60000)}:${String(Math.floor((ms % 60000) / 1000)).padStart(2, "0")}`;
                } catch {
                  return "—";
                }
              })()}
            </div>
            <div className="text-[9px] font-extrabold uppercase tracking-wider text-text-muted mt-2 font-display">
              Best Time
            </div>
          </div>
        </div>
      </m.div>

      {/* ── Wrong Answer Review ── */}
      {wrongAnswers.length > 0 && (
        <m.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-col gap-2.5"
        >
          <div className="flex items-center gap-2 mt-2 mb-1">
            <Star size={12} className="text-error fill-current animate-pulse" />
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-error font-display">
              Review Wrong Answers ({wrongAnswers.length})
            </span>
            <div className="flex-1 h-[1px] bg-border" />
          </div>
          {wrongAnswers.map((a, i) => (
            <div
              key={i}
              className="flex items-start gap-3 py-3.5 px-4 rounded-xl bg-surface border-2 border-error/20 border-l-4 border-l-error shadow-sm"
            >
              <XCircle className="text-error text-base shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                {a.questionStem && (
                  <p className="text-[13px] font-extrabold text-text-primary leading-normal mb-2.5">
                    {a.questionStem}
                  </p>
                )}
                <div className="flex flex-wrap gap-2 mb-2.5">
                  <span className="text-[10px] text-error bg-error/10 border border-error/20 rounded-lg font-black px-2.5 py-0.5 font-mono">
                    Your answer: {a.answer || "(blank)"}
                  </span>
                  {a.correctAnswer && (
                    <span className="text-[10px] text-success bg-success-bg border border-success/20 rounded-lg font-black px-2.5 py-0.5 font-mono">
                      Correct answer: {a.correctAnswer}
                    </span>
                  )}
                </div>
                {a.explanation && a.explanation !== "Correct!" && (
                  <div className="m-0 text-xs text-text-secondary leading-relaxed bg-surface-alt p-2.5 rounded-lg border border-border/40 flex items-start gap-1.5">
                    <span className="shrink-0 text-accent font-bold">💡</span>
                    <span>{a.explanation}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </m.div>
      )}

      {/* ── Badges Gallery ── */}
      <m.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
      >
        <BadgeGallery badges={badges} />
      </m.div>

      {/* ── Countdown & Keep Learning ── */}
      <m.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="flex flex-col gap-3.5 mt-2.5"
      >
        {/* Next challenge countdown */}
        <div className="rounded-2xl bg-surface border-2 border-border py-4 px-5 flex items-center justify-center gap-3.5 shadow-sm">
          <Clock size={15} className="text-text-muted shrink-0 animate-pulse" />
          <div className="text-xs text-text-secondary font-extrabold uppercase tracking-wider font-display">
            Next challenge in
          </div>
          <span className="font-mono text-base font-black text-accent tracking-wider bg-bg-deep border border-border/20 px-3 py-1 rounded-xl shadow-sm">
            {formatCountdown(countdown)}
          </span>
        </div>

        {/* Keep learning CTA link */}
        <div className="flex flex-col items-center gap-2">
          <Link
            href="/dictionary"
            prefetch={false}
            className="flex items-center justify-center gap-2.5 w-full rounded-2xl font-black text-[15px] px-6 py-4.5 bg-accent border-2 border-border text-ink shadow-sm hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all duration-100 cursor-pointer"
          >
            <Zap className="h-4.5 w-4.5 fill-current" />
            <span>Lookup Dictionary & Practice Vocabulary</span>
            <ChevronRight size={15} className="shrink-0" />
          </Link>
        </div>
      </m.div>
    </div>
  );
}
