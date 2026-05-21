"use client";

import { useState, useEffect } from "react";
import { Typography } from "antd";
import {
  CloseCircleFilled,
  TrophyOutlined,
  ClockCircleOutlined,
  StarFilled,
  RightOutlined,
  ThunderboltOutlined,
  BarChartOutlined,
  LoadingOutlined,
} from "@ant-design/icons";
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
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: "block" }}>
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
    <div
      style={{
        borderRadius: "var(--radius-xl)",
        border: "1px solid var(--border)",
        background: "var(--surface)",
        padding: "16px 20px",
        boxShadow: "var(--shadow-sm)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 16 }}>
        <BarChartOutlined style={{ fontSize: 13, color: "var(--accent)" }} />
        <span
          style={{
            fontSize: 11,
            fontWeight: 800,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            color: "var(--accent)",
          }}
        >
          Lịch sử 7 ngày gần nhất
        </span>
      </div>

      <svg
        width="100%"
        viewBox={`0 0 ${chartWidth} ${chartHeight + 22}`}
        style={{ display: "block" }}
      >
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
                textAnchor="middle"
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  fill: s.score > 0 ? "var(--text-primary)" : "var(--text-muted)",
                  fontFamily: "var(--font-mono)",
                }}
              >
                {s.score > 0 ? s.score : "0"}
              </text>
              {/* Day label */}
              <text
                x={x + barWidth / 2}
                y={chartHeight + 16}
                textAnchor="middle"
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  fill: "var(--text-muted)",
                  fontFamily: "var(--font-body)",
                }}
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
    <div style={{ maxWidth: 540, margin: "0 auto", display: "flex", flexDirection: "column", gap: 16 }}>
      {/* ── Hero Card ── */}
      <m.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        style={{
          width: "100%",
          borderRadius: "var(--radius-xl)",
          padding: "36px 24px 32px",
          background: isGood
            ? "linear-gradient(135deg, #4c1d95, #6d28d9 60%, #7c3aed)"
            : "linear-gradient(135deg, var(--surface) 0%, var(--surface-alt) 100%)",
          boxShadow: isGood
            ? "0 12px 30px rgba(109, 40, 217, 0.35)"
            : "var(--shadow-md)",
          border: isGood ? "none" : "1px solid var(--border)",
          position: "relative",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
        }}
      >
        {isGood && (
          <>
            <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 80% 60% at 80% 0%, rgba(255,255,255,0.15) 0%, transparent 70%)", pointerEvents: "none" }} />
            <div className="grain-overlay" style={{ opacity: 0.04 }} />
          </>
        )}

        {/* Score ring */}
        <div style={{ position: "relative", width: 100, height: 100, marginBottom: 12 }}>
          <MiniScoreRing score={correctCount} total={answers.length} isGood={isGood} />
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span
              style={{
                fontSize: 32,
                fontWeight: 900,
                lineHeight: 1,
                fontVariantNumeric: "tabular-nums",
                color: isGood ? "var(--text-on-accent)" : "var(--accent)",
              }}
            >
              {score}
            </span>
            <span style={{ fontSize: 11, fontWeight: 700, opacity: 0.6, color: isGood ? "var(--text-on-accent)" : "var(--text-secondary)", marginTop: 2 }}>
              / {answers.length} đúng
            </span>
          </div>
        </div>

        {/* Title */}
        <Title
          level={3}
          style={{
            margin: "8px 0 4px",
            fontFamily: "var(--font-display)",
            color: isGood ? "var(--text-on-accent)" : "var(--text-primary)",
            fontWeight: 800,
          }}
        >
          {isGood ? "Độc cô cầu bại! 🏆" : "Hoàn thành xuất sắc! 🎉"}
        </Title>
        <Text style={{ fontSize: 13, color: isGood ? "rgba(255,255,255,0.8)" : "var(--text-secondary)", maxWidth: 360, display: "block", marginBottom: 16 }}>
          {isGood
            ? "Bạn đã xuất sắc vượt qua các câu hỏi khó của hôm nay. Hãy duy trì phong độ nhé!"
            : "Chúc mừng bạn đã hoàn thành bài học hôm nay. Kiên trì là chìa khóa thành công."}
        </Text>

        {/* Streak */}
        <div style={{ display: "flex", justifyContent: "center" }}>
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
          onClick={onStartBonus}
          style={{
            width: "100%",
            borderRadius: "var(--radius-xl)",
            padding: "16px 20px",
            background: "linear-gradient(135deg, var(--surface), var(--surface-alt))",
            border: "2px dashed var(--xp)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 14,
            boxShadow: "0 6px 15px rgba(245, 158, 11, 0.08)",
            transition: "border-color 0.2s",
          }}
        >
          <div
            style={{
              width: 46,
              height: 46,
              borderRadius: "var(--radius-lg)",
              background: "linear-gradient(135deg, var(--xp), var(--xp))",
              display: "grid",
              placeItems: "center",
              flexShrink: 0,
              boxShadow: "0 4px 10px rgba(245, 158, 11, 0.25)",
            }}
          >
            <ThunderboltOutlined style={{ fontSize: 20, color: "#fff" }} />
          </div>
          <div style={{ flex: 1, textAlign: "left" }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: "var(--text-primary)", fontFamily: "var(--font-display)" }}>
              ⚡ Thử thách Bonus Round
            </div>
            <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 2 }}>
              Thêm 3 câu hỏi nhanh · Nhận thêm XP · Không phạt khi trả lời sai
            </div>
          </div>
          <RightOutlined style={{ fontSize: 13, color: "var(--text-muted)" }} />
        </m.button>
      )}

      {bonusLoading && (
        <div
          style={{
            width: "100%",
            borderRadius: "var(--radius-xl)",
            padding: "16px 20px",
            background: "var(--surface)",
            border: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            color: "var(--text-secondary)",
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          <LoadingOutlined spin style={{ color: "var(--xp)" }} />
          Đang khởi tạo thử thách Bonus...
        </div>
      )}

      {bonusCompleted && (
        <m.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{
            width: "100%",
            borderRadius: "var(--radius-xl)",
            padding: "16px 20px",
            background: "rgba(245, 158, 11, 0.08)",
            border: "1px solid rgba(245, 158, 11, 0.25)",
            display: "flex",
            alignItems: "center",
            gap: 10,
            fontSize: 13,
            fontWeight: 700,
            color: "var(--xp)",
          }}
        >
          <ThunderboltOutlined style={{ fontSize: 15 }} />
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
        transition={{ delay: 0.15 }}
        style={{
          borderRadius: "var(--radius-xl)",
          border: "1px solid var(--border)",
          background: "var(--surface)",
          padding: "16px 20px",
          boxShadow: "var(--shadow-sm)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
          <TrophyOutlined style={{ fontSize: 13, color: "var(--accent)" }} />
          <span style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--accent)" }}>
            Bảng thành tích cá nhân
          </span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, textAlign: "center" }}>
          <div style={{ padding: "10px 4px", borderRadius: "var(--radius-lg)", background: "var(--surface-alt)", border: "1px solid var(--border)" }}>
            <div style={{ fontSize: 22, fontWeight: 900, color: "var(--accent)", fontVariantNumeric: "tabular-nums" }}>
              {streak.currentStreak}
            </div>
            <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)", marginTop: 2 }}>
              Chuỗi ngày
            </div>
          </div>
          <div style={{ padding: "10px 4px", borderRadius: "var(--radius-lg)", background: "var(--surface-alt)", border: "1px solid var(--border)" }}>
            <div style={{ fontSize: 22, fontWeight: 900, color: "var(--success)", fontVariantNumeric: "tabular-nums" }}>
              {score}/5
            </div>
            <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)", marginTop: 2 }}>
              Điểm hôm nay
            </div>
          </div>
          <div style={{ padding: "10px 4px", borderRadius: "var(--radius-lg)", background: "var(--surface-alt)", border: "1px solid var(--border)" }}>
            <div style={{ fontSize: 22, fontWeight: 900, color: "var(--xp)", fontVariantNumeric: "tabular-nums" }}>
              {(() => {
                try {
                  const best = localStorage.getItem("daily-challenge-best");
                  if (!best) return "—";
                  const ms = parseInt(best, 10);
                  return `${Math.floor(ms / 60000)}:${String(Math.floor((ms % 60000) / 1000)).padStart(2, "0")}`;
                } catch { return "—"; }
              })()}
            </div>
            <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)", marginTop: 2 }}>
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
          transition={{ delay: 0.2 }}
          style={{ display: "flex", flexDirection: "column", gap: 8 }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "8px 0 4px" }}>
            <StarFilled style={{ fontSize: 12, color: "var(--error)" }} />
            <span
              style={{
                fontSize: 11,
                fontWeight: 800,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: "var(--error)",
              }}
            >
              Xem lại các câu trả lời sai ({wrongAnswers.length})
            </span>
            <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
          </div>
          {wrongAnswers.map((a, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 10,
                padding: "12px 16px",
                borderRadius: "var(--radius-lg)",
                border: "1px solid rgba(239, 68, 68, 0.15)",
                background: "var(--surface)",
                boxShadow: "var(--shadow-sm)",
              }}
            >
              <CloseCircleFilled style={{ color: "var(--error)", fontSize: 14, marginTop: 2, flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                {a.questionStem && (
                  <p style={{ margin: "0 0 6px", fontSize: 13, fontWeight: 700, color: "var(--text-primary)", lineHeight: 1.5 }}>
                    {a.questionStem}
                  </p>
                )}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 6 }}>
                  <span style={{ fontSize: 11, background: "var(--error-bg)", color: "var(--error)", padding: "2px 8px", borderRadius: 6, fontWeight: 700 }}>
                    Bạn ghi: {a.answer || "(trống)"}
                  </span>
                  {a.correctAnswer && (
                    <span style={{ fontSize: 11, background: "rgba(16, 185, 129, 0.12)", color: "var(--success)", padding: "2px 8px", borderRadius: 6, fontWeight: 700 }}>
                      Đáp án đúng: {a.correctAnswer}
                    </span>
                  )}
                </div>
                {a.explanation && a.explanation !== "Chính xác!" && (
                  <p style={{ margin: 0, fontSize: 12, color: "var(--text-muted)", lineHeight: 1.6 }}>
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
        transition={{ delay: 0.3 }}
        style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 10 }}
      >
        {/* Next challenge countdown */}
        <div
          style={{
            borderRadius: "var(--radius-xl)",
            background: "var(--surface-alt)",
            border: "1px solid var(--border)",
            padding: "12px 16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          }}
        >
          <ClockCircleOutlined style={{ fontSize: 12, color: "var(--text-muted)" }} />
          <Text style={{ fontSize: 12, color: "var(--text-secondary)", fontWeight: 500 }}>
            Thử thách tiếp theo sẽ mở sau
          </Text>
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 14,
              fontWeight: 800,
              color: "var(--accent)",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {formatCountdown(countdown)}
          </span>
        </div>

        {/* Keep learning CTA link */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
          <Link
            href="/dictionary"
            prefetch={false}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              width: "100%",
              padding: "14px 28px",
              borderRadius: "var(--radius-lg)",
              background: "linear-gradient(135deg, var(--accent), var(--accent-hover))",
              color: "var(--text-on-accent)",
              fontWeight: 800,
              fontSize: 15,
              textDecoration: "none",
              boxShadow: "0 6px 18px var(--accent-muted)",
              transition: "all 0.2s",
            }}
            className="btn-shimmer"
          >
            <ThunderboltOutlined /> Tra cứu từ điển & Luyện từ vựng
            <RightOutlined style={{ fontSize: 12 }} />
          </Link>
        </div>
      </m.div>
    </div>
  );
}
