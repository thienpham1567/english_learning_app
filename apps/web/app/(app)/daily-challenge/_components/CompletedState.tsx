"use client";

import { useState, useEffect } from "react";
import { Typography } from "antd";

import Link from "next/link";

import type {
  DailyChallenge,
  StreakInfo,
  Badge,
  ExerciseAnswer,
} from "@/lib/daily-challenge/types";
import { StreakFire } from "@/components/shared";
import { BadgeGallery } from "./BadgeGallery";
import * as m from "motion/react-client";
import {
  BarChart3,
  ChevronRight,
  Clock,
  Loader2,
  Star,
  Trophy,
  XCircle,
  Zap,
} from "lucide-react";

const { Title, Text, Paragraph } = Typography;

/** Milliseconds until midnight VN time (UTC+7). */
function msUntilVnMidnight(): number {
  const now = new Date();
  // Get current VN date string, build tomorrow midnight in VN
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
function MiniScoreRing({ score, total, isGood }: { score: number; total: number; isGood: boolean }) {
  const radius = 42;
  const stroke = 6;
  const circumference = 2 * Math.PI * radius;
  const pct = total > 0 ? score / total : 0;
  const offset = circumference * (1 - pct);
  const size = 100;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="block" >
      <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth={stroke} />
      <m.circle
        cx={size/2} cy={size/2} r={radius}
        fill="none"
        stroke={isGood ? "var(--text-on-accent)" : "var(--accent)"}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={circumference}
        initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 1.0, ease: "easeOut", delay: 0.2 }}
        style={{ transform: "rotate(-90deg)", transformOrigin: "50% 50%" }}
      />
    </svg>
  );
}

/* ── Weekly Mini Bar Chart (pure SVG) ── */
function WeeklyChart({ scores }: { scores: { day: string; score: number }[] }) {
  const maxScore = 5;
  const barWidth = 28;
  const barGap = 10;
  const chartHeight = 70;
  const chartWidth = scores.length * (barWidth + barGap) - barGap;

  return (
    <div className="rounded-(--radius-xl) border-2 border-border bg-(--surface) py-4 px-5" style={{boxShadow: "var(--shadow-sm)"}} >
      <div className="flex items-center gap-1.5 mb-4" >
        <BarChart3 size={13} className="text-accent" />
        <span className="text-[11px] font-extrabold uppercase tracking-widest text-accent" >
          Lịch sử 7 ngày gần nhất
        </span>
      </div>

      <svg
        width="100%"
        viewBox={`0 0 ${chartWidth} ${chartHeight + 22}`} className="block" >
        {scores.map((s, i) => {
          const barHeight = (s.score / maxScore) * chartHeight;
          const x = i * (barWidth + barGap);
          const y = chartHeight - barHeight;
          const pct = s.score / maxScore;
          const fill =
            pct >= 0.8
              ? "var(--success)" // emerald green
              : pct >= 0.5
              ? "var(--accent)"
              : "var(--error)";

          return (
            <g key={i}>
              {/* Background bar */}
              <rect
                x={x}
                y={0}
                width={barWidth}
                height={chartHeight}
                rx={6}
                fill="var(--surface-alt)"
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
                textAnchor="middle" className="text-[10px] font-extrabold font-mono" style={{fill: s.score > 0 ? "var(--text-primary)" : "var(--text-muted)"}} >
                {s.score > 0 ? s.score : "0"}
              </text>
              {/* Day label */}
              <text
                x={x + barWidth / 2}
                y={chartHeight + 16}
                textAnchor="middle" className="text-[9px] font-bold font-body" style={{fill: "var(--text-muted)"}} >
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

export function CompletedState({ challenge, streak, badges, onStartBonus, bonusState }: {
  challenge: DailyChallenge;
  streak: StreakInfo;
  badges: Badge[];
  onStartBonus?: () => void;
  bonusState?: BonusState;
}) {
  const answers = (challenge.answers ?? []) as ExerciseAnswer[];
  const score = challenge.score ?? 0;
  const correctCount = answers.filter(a => a.isCorrect).length;
  const isGood = score >= 4;

  const [countdown, setCountdown] = useState(() => msUntilVnMidnight());

  useEffect(() => {
    const id = setInterval(() => setCountdown(msUntilVnMidnight()), 1000);
    return () => clearInterval(id);
  }, []);

  // Build weekly scores from localStorage (simple client-side only)
  const [weeklyScores, setWeeklyScores] = useState<{ day: string; score: number }[]>([]);
  useEffect(() => {
    try {
      const WEEK_KEY = "daily-challenge-weekly";
      const stored = localStorage.getItem(WEEK_KEY);
      let weekData: Record<string, number> = {};
      if (stored) {
        weekData = JSON.parse(stored);
      }
      // Save today's score
      const today = new Date().toISOString().slice(0, 10);
      weekData[today] = score;
      // Clean old entries (keep last 14 days)
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 14);
      for (const key of Object.keys(weekData)) {
        if (key < cutoff.toISOString().slice(0, 10)) {
          delete weekData[key];
        }
      }
      localStorage.setItem(WEEK_KEY, JSON.stringify(weekData));

      // Build last 7 days
      const days = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
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
    } catch { /* ignore */ }
  }, [score]);

  const wrongAnswers = answers.filter(a => !a.isCorrect);
  const bonusAvailable = bonusState === "idle" || bonusState === "error";
  const bonusCompleted = bonusState === "completed";
  const bonusLoading = bonusState === "loading";

  return (
    <div className="w-[540px] mx-auto flex flex-col gap-4" >
      {/* ── Hero Card ── */}
      <m.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }} className="w-full rounded-(--radius-xl) relative overflow-hidden flex flex-col items-center text-center" style={{padding: "36px 24px 32px", background: isGood
            ? "linear-gradient(135deg, #4c1d95, #6d28d9 60%, #7c3aed)"
            : "linear-gradient(135deg, var(--surface) 0%, var(--surface-alt) 100%)", boxShadow: isGood
            ? "0 12px 30px rgba(109, 40, 217, 0.35)"
            : "var(--shadow-md)", border: isGood ? "none" : "1px solid var(--border)"}} >
        {isGood && (
          <>
            <div className="absolute" style={{inset: 0, background: "radial-gradient(ellipse 80% 60% at 80% 0%, rgba(255,255,255,0.15) 0%, transparent 70%)", pointerEvents: "none"}} />
            <div className="grain-overlay" style={{ opacity: 0.04 }} />
          </>
        )}

        {/* Score ring */}
        <div className="relative w-[100px] h-[100px] mb-3" >
          <MiniScoreRing score={correctCount} total={answers.length} isGood={isGood} />
          <div className="absolute flex flex-col items-center justify-center" style={{inset: 0}} >
            <span className="text-4xl font-black leading-none" style={{fontVariantNumeric: "tabular-nums", color: isGood ? "var(--text-on-accent)" : "var(--accent)"}} >
              {score}
            </span>
            <span className="text-[11px] font-bold" style={{opacity: 0.6, color: isGood ? "var(--text-on-accent)" : "var(--text-secondary)", marginTop: 2}} >
              / {answers.length} đúng
            </span>
          </div>
        </div>

        {/* Title */}
        <Title
          level={3} className="mt-2 mb-1 font-display font-extrabold" style={{color: isGood ? "var(--text-on-accent)" : "var(--text-primary)"}} >
          {isGood ? "Độc cô cầu bại! 🏆" : "Hoàn thành xuất sắc! 🎉"}
        </Title>
        <Text className="text-[13px] w-[360px] block mb-4" style={{color: isGood ? "rgba(255,255,255,0.8)" : "var(--text-secondary)"}} >
          {isGood
            ? "Bạn đã xuất sắc vượt qua các câu hỏi khó của hôm nay. Hãy duy trì phong độ nhé!"
            : "Chúc mừng bạn đã hoàn thành bài học hôm nay. Kiên trì là chìa khóa thành công."}
        </Text>

        {/* Streak */}
        <div className="flex justify-center" >
          <StreakFire streak={streak.currentStreak} />
        </div>
      </m.div>

      {/* ── Bonus Round CTA ── */}
      {onStartBonus && bonusAvailable && (
        <m.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
          onClick={onStartBonus} className="w-full rounded-(--radius-xl) py-4 px-5 cursor-pointer flex items-center gap-3.5" style={{background: "linear-gradient(135deg, var(--surface), var(--surface-alt))", border: "2px dashed var(--xp)", boxShadow: "0 6px 15px rgba(245, 158, 11, 0.08)", transition: "border-color 0.2s"}} >
          <div className="w-[46px] h-[46px] rounded-(--radius-lg) grid shrink-0" style={{background: "linear-gradient(135deg, var(--xp), var(--xp))", placeItems: "center", boxShadow: "0 4px 10px rgba(245, 158, 11, 0.25)"}} >
            <Zap size={20} className="text-[#fff]" />
          </div>
          <div className="flex-1 text-left" >
            <div className="text-[15px] font-extrabold text-text-primary font-display" >
              ⚡ Thử thách Bonus Round
            </div>
            <div className="text-xs text-text-secondary" style={{marginTop: 2}} >
              Thêm 3 câu hỏi nhanh · Nhận thêm XP · Không phạt khi trả lời sai
            </div>
          </div>
          <ChevronRight size={13} className="text-text-muted" />
        </m.button>
      )}

      {bonusLoading && (
        <div className="w-full rounded-(--radius-xl) py-4 px-5 bg-(--surface) border-2 border-border flex items-center justify-center gap-2.5 text-text-secondary text-[13px] font-semibold" >
          <Loader2 className="animate-spin text-(--xp)" />
          Đang khởi tạo thử thách Bonus...
        </div>
      )}

      {bonusCompleted && (
        <m.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }} className="w-full rounded-(--radius-xl) py-4 px-5 flex items-center gap-2.5 text-[13px] font-bold text-(--xp)" style={{background: "rgba(245, 158, 11, 0.08)", border: "1px solid rgba(245, 158, 11, 0.25)"}} >
          <Zap size={15} />
          Bạn đã hoàn thành xuất sắc tất cả câu hỏi phụ hôm nay! ✨
        </m.div>
      )}

      {/* ── Weekly Performance Chart ── */}
      {weeklyScores.length > 0 && (
        <m.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <WeeklyChart scores={weeklyScores} />
        </m.div>
      )}

      {/* ── Personal Stats ── */}
      <m.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }} className="rounded-(--radius-xl) border-2 border-border bg-(--surface) py-4 px-5" style={{boxShadow: "var(--shadow-sm)"}} >
        <div className="flex items-center gap-1.5 mb-3" >
          <Trophy size={13} className="text-accent" />
          <span className="text-[11px] font-extrabold uppercase tracking-widest text-accent" >
            Bảng thành tích cá nhân
          </span>
        </div>
        <div className="grid gap-2.5 text-center" style={{gridTemplateColumns: "repeat(3, 1fr)"}} >
          <div className="rounded-(--radius-lg) bg-surface-alt border-2 border-border" style={{padding: "10px 4px"}} >
            <div className="text-2xl font-black text-accent" style={{fontVariantNumeric: "tabular-nums"}} >
              {streak.currentStreak}
            </div>
            <div className="text-[9px] font-bold uppercase tracking-wider text-text-muted" style={{marginTop: 2}} >
              Chuỗi ngày
            </div>
          </div>
          <div className="rounded-(--radius-lg) bg-surface-alt border-2 border-border" style={{padding: "10px 4px"}} >
            <div className="text-2xl font-black text-emerald-500" style={{fontVariantNumeric: "tabular-nums"}} >
              {score}/5
            </div>
            <div className="text-[9px] font-bold uppercase tracking-wider text-text-muted" style={{marginTop: 2}} >
              Điểm hôm nay
            </div>
          </div>
          <div className="rounded-(--radius-lg) bg-surface-alt border-2 border-border" style={{padding: "10px 4px"}} >
            <div className="text-2xl font-black text-(--xp)" style={{fontVariantNumeric: "tabular-nums"}} >
              {(() => {
                try {
                  const best = localStorage.getItem("daily-challenge-best");
                  if (!best) return "—";
                  const ms = parseInt(best, 10);
                  return `${Math.floor(ms / 60000)}:${String(Math.floor((ms % 60000) / 1000)).padStart(2, "0")}`;
                } catch { return "—"; }
              })()}
            </div>
            <div className="text-[9px] font-bold uppercase tracking-wider text-text-muted" style={{marginTop: 2}} >
              Kỷ lục thời gian
            </div>
          </div>
        </div>
      </m.div>

      {/* ── Wrong Answer Review ── */}
      {wrongAnswers.length > 0 && (
        <m.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }} className="flex flex-col gap-2" >
          <div className="flex items-center gap-2 mt-2 mb-1" >
            <Star size={12} className="text-(--error)" />
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-destructive" >
              Xem lại các câu trả lời sai ({wrongAnswers.length})
            </span>
            <div className="flex-1 h-[1px]" style={{background: "var(--border)"}} />
          </div>
          {wrongAnswers.map((a, i) => (
            <div
              key={i} className="flex items-start gap-2.5 py-3 px-4 rounded-(--radius-lg) bg-(--surface)" style={{border: "1px solid rgba(239, 68, 68, 0.15)", boxShadow: "var(--shadow-sm)"}} >
              <XCircle className="text-destructive text-sm shrink-0" style={{marginTop: 2}} />
              <div className="flex-1 w-[0px]" >
                {a.questionStem && (
                  <p className="text-[13px] font-bold text-text-primary leading-normal" style={{margin: "0 0 6px"}} >
                    {a.questionStem}
                  </p>
                )}
                <div className="flex flex-wrap gap-1.5 mb-1.5" >
                  <span className="text-[11px] text-destructive rounded-md font-bold" style={{background: "var(--error-bg)", padding: "2px 8px"}} >
                    Bạn ghi: {a.answer || "(trống)"}
                  </span>
                  {a.correctAnswer && (
                    <span className="text-[11px] text-emerald-500 rounded-md font-bold" style={{background: "rgba(16, 185, 129, 0.12)", padding: "2px 8px"}} >
                      Đáp án đúng: {a.correctAnswer}
                    </span>
                  )}
                </div>
                {a.explanation && a.explanation !== "Chính xác!" && (
                  <p className="m-0 text-xs text-text-muted leading-relaxed" >
                    💡 {a.explanation}
                  </p>
                )}
              </div>
            </div>
          ))}
        </m.div>
      )}

      {/* ── Badges Gallery ── */}
      <m.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
        <BadgeGallery badges={badges} />
      </m.div>

      {/* ── Countdown & Keep Learning ── */}
      <m.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }} className="flex flex-col gap-3.5 mt-2.5" >
        {/* Next challenge countdown */}
        <div className="rounded-(--radius-xl) bg-surface-alt border-2 border-border py-3 px-4 flex items-center justify-center gap-2" >
          <Clock size={12} className="text-text-muted" />
          <Text className="text-xs text-text-secondary font-medium" >
            Thử thách tiếp theo sẽ mở sau
          </Text>
          <span className="font-mono text-sm font-extrabold text-accent" style={{fontVariantNumeric: "tabular-nums"}} >
            {formatCountdown(countdown)}
          </span>
        </div>

        {/* Keep learning CTA link */}
        <div className="flex flex-col items-center gap-2" >
          <Link href="/dictionary" prefetch={false} className="btn-shimmer items-center justify-center gap-2 w-full rounded-(--radius-lg) font-extrabold text-[15px]" style={{display: "inline-flex", padding: "14px 28px", background: "linear-gradient(135deg, var(--accent), var(--accent-hover))", color: "var(--text-on-accent)", textDecoration: "none", boxShadow: "0 6px 18px var(--accent-muted)", transition: "all 0.2s"}} >
            <Zap /> Tra cứu từ điển & Luyện từ vựng
            <ChevronRight size={12} />
          </Link>
        </div>
      </m.div>
    </div>
  );
}
