"use client";

import { useState, useEffect } from "react";
import { Typography } from "antd";
import {
  CheckCircleFilled,
  CloseCircleFilled,
  TrophyOutlined,
  LikeOutlined,
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

const { Title, Text } = Typography;

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
function MiniScoreRing({ score, total }: { score: number; total: number }) {
  const radius = 44;
  const stroke = 5;
  const circumference = 2 * Math.PI * radius;
  const pct = total > 0 ? score / total : 0;
  const offset = circumference * (1 - pct);
  const size = 100;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: "block" }}>
      <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth={stroke} />
      <circle
        cx={size/2} cy={size/2} r={radius}
        fill="none"
        stroke="var(--text-on-accent)"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        style={{ transform: "rotate(-90deg)", transformOrigin: "50% 50%", transition: "stroke-dashoffset 0.8s ease" }}
      />
    </svg>
  );
}

/* ── Weekly Mini Bar Chart (pure SVG) ── */
function WeeklyChart({ scores }: { scores: { day: string; score: number }[] }) {
  const maxScore = 5;
  const barWidth = 28;
  const barGap = 8;
  const chartHeight = 60;
  const chartWidth = scores.length * (barWidth + barGap) - barGap;

  return (
    <div
      style={{
        borderRadius: 14,
        border: "1px solid var(--border)",
        background: "var(--surface)",
        padding: "14px 18px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
        <BarChartOutlined style={{ fontSize: 12, color: "var(--accent)" }} />
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.12em",
            color: "var(--accent)",
          }}
        >
          7 ngày gần nhất
        </span>
      </div>

      <svg
        width="100%"
        viewBox={`0 0 ${chartWidth} ${chartHeight + 18}`}
        style={{ display: "block" }}
      >
        {scores.map((s, i) => {
          const barHeight = (s.score / maxScore) * chartHeight;
          const x = i * (barWidth + barGap);
          const y = chartHeight - barHeight;
          const pct = s.score / maxScore;
          const fill =
            pct >= 0.8
              ? "var(--sage, var(--success))"
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
                fill="var(--bg-deep)"
              />
              {/* Score bar */}
              {s.score > 0 && (
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={barHeight}
                  rx={6}
                  fill={fill}
                  style={{
                    transition: "height 0.5s ease, y 0.5s ease",
                  }}
                />
              )}
              {/* Score label */}
              <text
                x={x + barWidth / 2}
                y={y - 4}
                textAnchor="middle"
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  fill: "var(--text-muted)",
                  fontFamily: "var(--font-mono)",
                }}
              >
                {s.score > 0 ? s.score : ""}
              </text>
              {/* Day label */}
              <text
                x={x + barWidth / 2}
                y={chartHeight + 14}
                textAnchor="middle"
                style={{
                  fontSize: 8,
                  fontWeight: 500,
                  fill: "var(--text-muted)",
                  fontFamily: "var(--font-body)",
                  textTransform: "uppercase",
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
    <div className="anim-fade-in" style={{ maxWidth: 520, margin: "0 auto" }}>
      {/* ── Hero Card ── */}
      <div
        style={{
          width: "100%",
          borderRadius: 24,
          padding: "32px 24px 28px",
          background: isGood
            ? "linear-gradient(145deg, color-mix(in srgb, var(--accent) 85%, #000) 0%, var(--accent) 50%, color-mix(in srgb, var(--secondary) 90%, var(--accent)) 100%)"
            : "linear-gradient(145deg, var(--surface) 0%, color-mix(in srgb, var(--accent) 12%, var(--surface)) 100%)",
          boxShadow: isGood
            ? "0 8px 32px color-mix(in srgb, var(--accent) 25%, transparent)"
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
        {/* Decorative */}
        {isGood && (
          <>
            <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 80% 60% at 80% 0%, rgba(255,255,255,0.12) 0%, transparent 70%)", pointerEvents: "none" }} />
            <div className="grain-overlay" style={{ opacity: 0.03 }} />
          </>
        )}

        {/* Score ring */}
        <div style={{ position: "relative", width: 100, height: 100 }}>
          <MiniScoreRing score={correctCount} total={answers.length} />
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
                fontSize: 30,
                fontWeight: 800,
                lineHeight: 1,
                fontVariantNumeric: "tabular-nums",
                color: isGood ? "var(--text-on-accent)" : "var(--accent)",
              }}
            >
              {score}
            </span>
            <span style={{ fontSize: 11, fontWeight: 500, opacity: 0.5, color: isGood ? "var(--text-on-accent)" : "var(--text-secondary)" }}>
              / 5
            </span>
          </div>
        </div>

        {/* Icon + label */}
        <span style={{ fontSize: 28, marginTop: 8, color: isGood ? "var(--text-on-accent)" : "var(--accent)" }}>
          {isGood ? <TrophyOutlined /> : <LikeOutlined />}
        </span>
        <Title
          level={4}
          style={{
            margin: "4px 0 0",
            fontFamily: "var(--font-display)",
            color: isGood ? "var(--text-on-accent)" : "var(--ink)",
          }}
        >
          Đã hoàn thành hôm nay!
        </Title>

        {/* Streak */}
        <div style={{ marginTop: 12 }}>
          <StreakFire streak={streak.currentStreak} />
        </div>
      </div>

      {/* ── Bonus Round CTA ── */}
      {onStartBonus && bonusAvailable && (
        <button
          onClick={onStartBonus}
          className="anim-fade-up anim-delay-1"
          style={{
            marginTop: 16,
            width: "100%",
            borderRadius: 16,
            padding: "18px 20px",
            background: "linear-gradient(135deg, color-mix(in srgb, var(--xp) 15%, var(--surface)), color-mix(in srgb, var(--xp) 8%, var(--surface)))",
            border: "1.5px solid color-mix(in srgb, var(--xp) 30%, transparent)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 14,
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow = "0 6px 24px color-mix(in srgb, var(--xp) 20%, transparent)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "none";
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: "linear-gradient(135deg, var(--xp), color-mix(in srgb, var(--xp) 70%, var(--accent)))",
              display: "grid",
              placeItems: "center",
              flexShrink: 0,
            }}
          >
            <ThunderboltOutlined style={{ fontSize: 20, color: "#fff" }} />
          </div>
          <div style={{ flex: 1, textAlign: "left" }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: "var(--ink)", fontFamily: "var(--font-display)" }}>
              Bonus Round
            </div>
            <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 2 }}>
              3 câu thêm · Không ảnh hưởng streak · Nhận thêm XP
            </div>
          </div>
          <RightOutlined style={{ fontSize: 12, color: "var(--text-muted)" }} />
        </button>
      )}

      {bonusLoading && (
        <div
          className="anim-fade-in"
          style={{
            marginTop: 16,
            width: "100%",
            borderRadius: 16,
            padding: "18px 20px",
            background: "var(--surface)",
            border: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            color: "var(--text-secondary)",
            fontSize: 13,
          }}
        >
          <LoadingOutlined spin style={{ fontSize: 13 }} />
          Đang tải bonus round...
        </div>
      )}

      {bonusCompleted && (
        <div
          className="anim-fade-in"
          style={{
            marginTop: 16,
            width: "100%",
            borderRadius: 16,
            padding: "14px 20px",
            background: "color-mix(in srgb, var(--xp) 8%, var(--surface))",
            border: "1px solid color-mix(in srgb, var(--xp) 20%, transparent)",
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontSize: 13,
            fontWeight: 600,
            color: "var(--xp)",
          }}
        >
          <ThunderboltOutlined style={{ fontSize: 13 }} />
          Bonus đã hoàn thành hôm nay! ✨
        </div>
      )}

      {/* ── Weekly Performance Chart ── */}
      {weeklyScores.length > 0 && (
        <div className="anim-fade-up anim-delay-2" style={{ marginTop: 16 }}>
          <WeeklyChart scores={weeklyScores} />
        </div>
      )}

      {/* ── Wrong Answer Review ── */}
      {wrongAnswers.length > 0 && (
        <div className="anim-fade-up anim-delay-3" style={{ marginTop: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <StarFilled style={{ fontSize: 12, color: "var(--error)" }} />
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.12em",
                color: "var(--error)",
              }}
            >
              Câu cần ôn lại ({wrongAnswers.length})
            </span>
            <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
          </div>
          {wrongAnswers.map((a, i) => (
            <div
              key={i}
              style={{
                marginBottom: 6,
                display: "flex",
                alignItems: "flex-start",
                gap: 10,
                padding: "10px 14px",
                borderRadius: 12,
                border: "1px solid color-mix(in srgb, var(--error) 18%, transparent)",
                background: "color-mix(in srgb, var(--error) 4%, var(--surface))",
              }}
            >
              <CloseCircleFilled style={{ color: "var(--error)", fontSize: 13, marginTop: 2, flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                {a.questionStem && (
                  <p style={{ margin: "0 0 4px", fontSize: 12, fontWeight: 500, color: "var(--ink)", lineHeight: 1.5, wordBreak: "break-word" }}>
                    {a.questionStem}
                  </p>
                )}
                {a.correctAnswer && (
                  <p style={{ margin: 0, fontSize: 11, color: "var(--success)", fontWeight: 600 }}>
                    ✓ {a.correctAnswer}
                  </p>
                )}
                {a.explanation && a.explanation !== "Chính xác!" && (
                  <p style={{ margin: "4px 0 0", fontSize: 11, color: "var(--text-secondary)", lineHeight: 1.5, wordBreak: "break-word" }}>
                    {a.explanation}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Badges ── */}
      <div style={{ marginTop: 16 }}>
        <BadgeGallery badges={badges} />
      </div>

      {/* ── Personal Stats ── */}
      <div
        style={{
          marginTop: 14,
          borderRadius: 16,
          border: "1px solid var(--border)",
          background: "var(--surface)",
          padding: "14px 18px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
          <TrophyOutlined style={{ fontSize: 12, color: "var(--accent)" }} />
          <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--accent)" }}>
            Thành tích cá nhân
          </span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, textAlign: "center" }}>
          <div style={{ padding: "8px 4px", borderRadius: 10, background: "var(--bg-deep)" }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: "var(--accent)", fontVariantNumeric: "tabular-nums" }}>
              {streak.currentStreak}
            </div>
            <div style={{ fontSize: 9, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-muted)", marginTop: 2 }}>
              Streak
            </div>
          </div>
          <div style={{ padding: "8px 4px", borderRadius: 10, background: "var(--bg-deep)" }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: "var(--success)", fontVariantNumeric: "tabular-nums" }}>
              {score}/5
            </div>
            <div style={{ fontSize: 9, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-muted)", marginTop: 2 }}>
              Hôm nay
            </div>
          </div>
          <div style={{ padding: "8px 4px", borderRadius: 10, background: "var(--bg-deep)" }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: "var(--xp)", fontVariantNumeric: "tabular-nums" }}>
              {(() => {
                try {
                  const best = localStorage.getItem("daily-challenge-best");
                  if (!best) return "—";
                  const ms = parseInt(best, 10);
                  return `${Math.floor(ms / 60000)}:${String(Math.floor((ms % 60000) / 1000)).padStart(2, "0")}`;
                } catch { return "—"; }
              })()}
            </div>
            <div style={{ fontSize: 9, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-muted)", marginTop: 2 }}>
              Best time
            </div>
          </div>
        </div>
      </div>

      {/* ── Countdown (de-emphasized) ── */}
      <div
        style={{
          marginTop: 14,
          borderRadius: 14,
          background: "var(--bg-deep)",
          border: "1px solid var(--border)",
          padding: "12px 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
        }}
      >
        <ClockCircleOutlined style={{ fontSize: 11, color: "var(--text-muted)" }} />
        <Text
          style={{
            fontSize: 11,
            color: "var(--text-muted)",
          }}
        >
          Thử thách tiếp theo sau
        </Text>
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 13,
            fontWeight: 600,
            color: "var(--accent)",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {formatCountdown(countdown)}
        </span>
      </div>

      {/* ── CTA ── */}
      <div style={{ marginTop: 20, display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
        <Link
          href="/daily-challenge"
          prefetch={false}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "12px 28px",
            borderRadius: 999,
            background: "linear-gradient(135deg, var(--accent), var(--accent-hover))",
            color: "var(--text-on-accent)",
            fontWeight: 600,
            fontSize: 14,
            textDecoration: "none",
            transition: "transform 0.15s, box-shadow 0.15s",
            boxShadow: "0 4px 16px color-mix(in srgb, var(--accent) 30%, transparent)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow = "0 6px 24px color-mix(in srgb, var(--accent) 40%, transparent)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "0 4px 16px color-mix(in srgb, var(--accent) 30%, transparent)";
          }}
        >
          <ThunderboltOutlined /> Tiếp tục học
          <RightOutlined style={{ fontSize: 11 }} />
        </Link>
        <Text type="secondary" style={{ fontSize: 12 }}>
          Quay lại mai nhé!
        </Text>
      </div>
    </div>
  );
}
