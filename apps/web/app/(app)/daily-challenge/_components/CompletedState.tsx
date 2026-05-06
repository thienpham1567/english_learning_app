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

export function CompletedState({ challenge, streak, badges }: {
  challenge: DailyChallenge;
  streak: StreakInfo;
  badges: Badge[];
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
          {isGood && <MiniScoreRing score={correctCount} total={answers.length} />}
          {!isGood && <MiniScoreRing score={correctCount} total={answers.length} />}
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

      {/* ── Answer review ── */}
      <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 6 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <StarFilled style={{ fontSize: 12, color: "var(--accent)" }} />
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.12em",
              color: "var(--accent)",
            }}
          >
            Kết quả từng câu
          </span>
          <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
        </div>
        {answers.map((a, i) => (
          <div
            key={i}
            className={`anim-fade-up anim-delay-${Math.min(i + 1, 8)}`}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "12px 16px",
              borderRadius: 14,
              border: `1px solid ${a.isCorrect ? "color-mix(in srgb, var(--success) 25%, transparent)" : "color-mix(in srgb, var(--error) 20%, transparent)"}`,
              background: a.isCorrect
                ? "color-mix(in srgb, var(--success) 5%, var(--surface))"
                : "color-mix(in srgb, var(--error) 5%, var(--surface))",
            }}
          >
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 9,
                display: "grid",
                placeItems: "center",
                background: a.isCorrect
                  ? "color-mix(in srgb, var(--success) 12%, transparent)"
                  : "color-mix(in srgb, var(--error) 12%, transparent)",
                flexShrink: 0,
              }}
            >
              {a.isCorrect ? (
                <CheckCircleFilled style={{ color: "var(--success)", fontSize: 13 }} />
              ) : (
                <CloseCircleFilled style={{ color: "var(--error)", fontSize: 13 }} />
              )}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>
                Câu {i + 1}
              </span>
              {!a.isCorrect && a.explanation && (
                <p style={{ margin: "4px 0 0", fontSize: 11, lineHeight: 1.5, color: "var(--text-secondary)", wordBreak: "break-word" }}>
                  {a.explanation}
                </p>
              )}
            </div>
            <span
              style={{
                fontSize: 10,
                fontWeight: 600,
                padding: "3px 10px",
                borderRadius: 999,
                background: a.isCorrect
                  ? "color-mix(in srgb, var(--success) 10%, transparent)"
                  : "color-mix(in srgb, var(--error) 10%, transparent)",
                color: a.isCorrect ? "var(--success)" : "var(--error)",
                flexShrink: 0,
              }}
            >
              {a.isCorrect ? "Đúng" : "Sai"}
            </span>
          </div>
        ))}
      </div>

      {/* ── Badges ── */}
      <div style={{ marginTop: 20 }}>
        <BadgeGallery badges={badges} />
      </div>

      {/* ── Countdown card ── */}
      <div
        style={{
          marginTop: 20,
          borderRadius: 18,
          background: "var(--bg-deep)",
          border: "1px solid var(--border)",
          padding: "16px 20px",
          textAlign: "center",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginBottom: 8 }}>
          <ClockCircleOutlined style={{ fontSize: 12, color: "var(--text-muted)" }} />
          <Text
            strong
            style={{
              fontSize: 10,
              textTransform: "uppercase",
              letterSpacing: 1.5,
              color: "var(--text-muted)",
            }}
          >
            Thử thách tiếp theo
          </Text>
        </div>
        <Title
          level={4}
          style={{
            margin: 0,
            fontFamily: "var(--font-mono)",
            color: "var(--accent)",
            fontVariantNumeric: "tabular-nums",
            letterSpacing: "0.05em",
          }}
        >
          {formatCountdown(countdown)}
        </Title>
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

      {/* ── CTA ── */}
      <div style={{ marginTop: 24, display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
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
