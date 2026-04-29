"use client";

import { useState, useMemo } from "react";
import { Flex, Typography, Tag } from "antd";
import {
  CheckCircleFilled,
  CloseCircleFilled,
  DownOutlined,
  UpOutlined,
  BookOutlined,
  TrophyOutlined,
  LikeOutlined,
  FireOutlined,
  ClockCircleOutlined,
  StarOutlined,
  SmileOutlined,
  ThunderboltOutlined,
  ArrowRightOutlined,
} from "@ant-design/icons";
import Link from "next/link";

import type { ExerciseAnswer, StreakInfo, Badge } from "@/lib/daily-challenge/types";
import { CelebrationOverlay, StreakFire } from "@/components/shared";
import { BadgeGallery } from "./BadgeGallery";
import { EXERCISE_TYPE_LABELS } from "./constants";

const { Title, Text } = Typography;

/* ── Tier config ── */
const TIERS = [
  { min: 5, tier: "big" as const, icon: <TrophyOutlined />, label: "Hoàn hảo!", color: "var(--xp)" },
  { min: 4, tier: "medium" as const, icon: <LikeOutlined />, label: "Xuất sắc!", color: "var(--accent)" },
  { min: 3, tier: "small" as const, icon: <SmileOutlined />, label: "Tốt lắm!", color: "var(--success)" },
  { min: 0, tier: null, icon: <FireOutlined />, label: "Cố lên!", color: "var(--text-secondary)" },
];

/* ── Score Ring SVG ── */
function ScoreRing({ score, total, color }: { score: number; total: number; color: string }) {
  const radius = 54;
  const stroke = 7;
  const circumference = 2 * Math.PI * radius;
  const pct = total > 0 ? score / total : 0;
  const offset = circumference * (1 - pct);

  return (
    <svg width={130} height={130} viewBox="0 0 130 130" style={{ display: "block" }}>
      {/* Track */}
      <circle
        cx="65" cy="65" r={radius}
        fill="none"
        stroke="var(--border)"
        strokeWidth={stroke}
        opacity={0.5}
      />
      {/* Progress */}
      <circle
        cx="65" cy="65" r={radius}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform="rotate(-90 65 65)"
        style={{ transition: "stroke-dashoffset 1s cubic-bezier(0.4,0,0.2,1)" }}
      />
      {/* Inner glow */}
      <circle
        cx="65" cy="65" r={radius - 12}
        fill="none"
        stroke={color}
        strokeWidth={1}
        opacity={0.15}
      />
    </svg>
  );
}

/* ── Stat Pill ── */
function StatPill({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color?: string }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 4,
        padding: "10px 6px",
        borderRadius: 14,
        background: "var(--bg-deep)",
        flex: 1,
        minWidth: 0,
      }}
    >
      <span style={{ fontSize: 18, color: color ?? "var(--accent)" }}>{icon}</span>
      <span style={{ fontSize: 18, fontWeight: 700, color: color ?? "var(--ink)", fontVariantNumeric: "tabular-nums" }}>{value}</span>
      <span style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)" }}>{label}</span>
    </div>
  );
}

/* ── Answer Detail Card ── */
function AnswerDetailCard({ answer, index }: { answer: ExerciseAnswer; index: number }) {
  const [isExpanded, setIsExpanded] = useState(!answer.isCorrect);

  const ok = answer.isCorrect;
  const accentColor = ok ? "var(--success)" : "var(--error)";

  return (
    <div
      className={`anim-fade-up anim-delay-${Math.min(index + 1, 8)}`}
      style={{
        borderRadius: 14,
        border: `1.5px solid color-mix(in srgb, ${accentColor} 40%, transparent)`,
        background: `color-mix(in srgb, ${accentColor} 4%, var(--surface))`,
        overflow: "hidden",
        transition: "border-color 0.2s, box-shadow 0.2s",
      }}
    >
      {/* Header row */}
      <button
        type="button"
        onClick={() => setIsExpanded((v) => !v)}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%",
          padding: "12px 16px",
          background: "transparent",
          border: "none",
          cursor: "pointer",
          gap: 8,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: "50%",
              display: "grid",
              placeItems: "center",
              background: `color-mix(in srgb, ${accentColor} 15%, transparent)`,
              flexShrink: 0,
            }}
          >
            {ok ? (
              <CheckCircleFilled style={{ color: accentColor, fontSize: 16 }} />
            ) : (
              <CloseCircleFilled style={{ color: accentColor, fontSize: 16 }} />
            )}
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 1 }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)" }}>
              Câu {index + 1}
            </span>
            {answer.exerciseType && (
              <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 400 }}>
                {EXERCISE_TYPE_LABELS[answer.exerciseType] ?? ""}
              </span>
            )}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              padding: "2px 10px",
              borderRadius: 999,
              background: `color-mix(in srgb, ${accentColor} 12%, transparent)`,
              color: accentColor,
            }}
          >
            {ok ? "Đúng" : "Sai"}
          </span>
          <span style={{ color: "var(--text-muted)", fontSize: 12, flexShrink: 0, transition: "transform 0.2s", transform: isExpanded ? "rotate(180deg)" : "rotate(0)" }}>
            <DownOutlined />
          </span>
        </div>
      </button>

      {/* Expandable detail */}
      <div
        style={{
          maxHeight: isExpanded ? 600 : 0,
          overflow: "hidden",
          transition: "max-height 0.35s cubic-bezier(0.4,0,0.2,1)",
        }}
      >
        <div style={{ padding: "0 16px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
          {/* Question stem */}
          {answer.questionStem && (
            <div
              style={{
                borderRadius: 10,
                background: "var(--bg-deep)",
                padding: "10px 14px",
              }}
            >
              <span style={{ display: "block", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--text-muted)", marginBottom: 4 }}>
                Câu hỏi
              </span>
              <span style={{ fontSize: 13, color: "var(--ink)", lineHeight: 1.6 }}>
                {answer.questionStem}
              </span>
            </div>
          )}

          {/* User answer vs Correct answer */}
          <div
            style={{ display: "flex", flexDirection: "column", gap: 8 }}
            className="answer-compare-grid"
          >
            <div
              style={{
                borderRadius: 10,
                border: `1px solid color-mix(in srgb, ${accentColor} 30%, transparent)`,
                padding: "10px 14px",
                background: `color-mix(in srgb, ${accentColor} 5%, transparent)`,
              }}
            >
              <span style={{ display: "block", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: accentColor, marginBottom: 4 }}>
                Câu trả lời của bạn
              </span>
              <span style={{ fontSize: 13, fontWeight: 500, color: "var(--ink)", wordBreak: "break-word" }}>
                {answer.answer || "(bỏ trống)"}
              </span>
            </div>

            {!ok && answer.correctAnswer && (
              <div
                style={{
                  borderRadius: 10,
                  border: "1px solid color-mix(in srgb, var(--success) 30%, transparent)",
                  padding: "10px 14px",
                  background: "color-mix(in srgb, var(--success) 5%, transparent)",
                }}
              >
                <span style={{ display: "block", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--success)", marginBottom: 4 }}>
                  ✓ Đáp án đúng
                </span>
                <span style={{ fontSize: 13, fontWeight: 600, color: "var(--success)", wordBreak: "break-word" }}>
                  {answer.correctAnswer}
                </span>
              </div>
            )}
          </div>

          {/* Explanation for wrong answers */}
          {!ok && answer.explanation && (
            <div
              style={{
                borderRadius: 10,
                borderLeft: "3px solid var(--accent)",
                background: "color-mix(in srgb, var(--accent) 6%, var(--bg-deep))",
                padding: "12px 14px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                <BookOutlined style={{ fontSize: 12, color: "var(--accent)" }} />
                <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--accent)" }}>
                  Giải thích
                </span>
              </div>
              <p style={{ fontSize: 13, lineHeight: 1.7, color: "var(--text-primary)", margin: 0 }}>
                {answer.explanation}
              </p>
            </div>
          )}

          {/* Correct answer confirmation */}
          {ok && answer.explanation && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "2px 0" }}>
              <CheckCircleFilled style={{ color: "var(--success)", fontSize: 12 }} />
              <span style={{ fontSize: 12, color: "var(--success)", fontWeight: 500 }}>
                {answer.explanation}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Main Results Component ── */
type Props = {
  answers: ExerciseAnswer[];
  score: number;
  streak: StreakInfo;
  badges: Badge[];
  newBadges: Badge[];
  timeElapsedMs: number;
};

export function ChallengeResults({ answers, score, streak, badges, newBadges, timeElapsedMs }: Props) {
  const matched = TIERS.find((t) => score >= t.min)!;
  const [showCelebration, setShowCelebration] = useState(matched.tier !== null);

  const minutes = Math.floor(timeElapsedMs / 60000);
  const seconds = Math.floor((timeElapsedMs % 60000) / 1000);
  const correctCount = answers.filter((a) => a.isCorrect).length;
  const wrongCount = answers.length - correctCount;
  const pct = answers.length > 0 ? Math.round((correctCount / answers.length) * 100) : 0;

  return (
    <>
      {/* Celebration overlay */}
      {matched.tier && (
        <CelebrationOverlay
          tier={matched.tier}
          visible={showCelebration}
          onComplete={() => setShowCelebration(false)}
        >
          <Title
            level={3}
            style={{
              color: matched.tier === "big" ? "var(--xp)" : "var(--ink)",
              margin: 0,
              textShadow: "0 2px 8px rgba(0,0,0,0.15)",
            }}
          >
            {matched.icon} {matched.label}
          </Title>
        </CelebrationOverlay>
      )}

      <Flex vertical align="center" className="anim-scale-in" style={{ maxWidth: 520, margin: "0 auto", width: "100%" }}>
        {/* ── Hero Score Card ── */}
        <div
          style={{
            width: "100%",
            borderRadius: 20,
            padding: "32px 24px 28px",
            background: "linear-gradient(135deg, var(--surface) 0%, color-mix(in srgb, var(--accent) 8%, var(--surface)) 100%)",
            border: "1px solid var(--border)",
            boxShadow: "0 4px 24px rgba(0,0,0,0.06), 0 1px 4px rgba(0,0,0,0.04)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 4,
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Decorative grain */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "radial-gradient(ellipse at 70% 20%, color-mix(in srgb, var(--accent) 6%, transparent) 0%, transparent 70%)",
              pointerEvents: "none",
            }}
          />

          {/* Score ring + number */}
          <div style={{ position: "relative", width: 130, height: 130 }}>
            <ScoreRing score={correctCount} total={answers.length} color={matched.color} />
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
              <span style={{ fontSize: 36, fontWeight: 800, color: "var(--ink)", lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>
                {correctCount}
              </span>
              <span style={{ fontSize: 13, color: "var(--text-muted)", fontWeight: 500, marginTop: 2 }}>
                / {answers.length}
              </span>
            </div>
          </div>

          {/* Tier label */}
          <span style={{ fontSize: 28, marginTop: 4, color: matched.color }}>{matched.icon}</span>
          <span
            style={{
              fontSize: 20,
              fontWeight: 700,
              color: matched.color,
              fontFamily: "var(--font-display)",
            }}
          >
            {matched.label}
          </span>
          <span style={{ fontSize: 13, color: "var(--text-muted)", fontWeight: 500 }}>
            Chính xác {pct}%
          </span>

          {/* Stat pills row */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))",
              gap: 8,
              width: "100%",
              marginTop: 20,
            }}
          >
            <StatPill
              icon={<CheckCircleFilled />}
              label="Đúng"
              value={String(correctCount)}
              color="var(--success)"
            />
            <StatPill
              icon={<CloseCircleFilled />}
              label="Sai"
              value={String(wrongCount)}
              color={wrongCount > 0 ? "var(--error)" : "var(--text-muted)"}
            />
            <StatPill
              icon={<ClockCircleOutlined />}
              label="Thời gian"
              value={`${minutes}:${seconds.toString().padStart(2, "0")}`}
            />
            <StatPill
              icon={<FireOutlined />}
              label="Streak"
              value={String(streak.currentStreak)}
              color="var(--xp)"
            />
          </div>
        </div>

        {/* ── New Badges ── */}
        {newBadges.length > 0 && (
          <div
            className="anim-fade-up anim-delay-2"
            style={{
              marginTop: 16,
              width: "100%",
              borderRadius: 16,
              border: "1.5px solid color-mix(in srgb, var(--xp) 40%, transparent)",
              background: "color-mix(in srgb, var(--xp) 6%, var(--surface))",
              padding: "14px 18px",
            }}
          >
            <Text strong style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 1.5, color: "var(--xp)" }}>
              <StarOutlined style={{ marginRight: 4 }} /> Huy hiệu mới!
            </Text>
            <Flex gap={8} wrap style={{ marginTop: 8 }}>
              {newBadges.map((b, i) => (
                <Tag
                  key={b.id}
                  className={`anim-pop-in anim-delay-${Math.min(i + 3, 8)}`}
                  style={{
                    fontSize: 13,
                    padding: "4px 14px",
                    borderRadius: 999,
                    border: "1px solid var(--xp)",
                    background: "color-mix(in srgb, var(--xp) 10%, var(--surface))",
                  }}
                >
                  {b.icon === "TrophyOutlined" ? <TrophyOutlined /> : <FireOutlined />} {b.label}
                </Tag>
              ))}
            </Flex>
          </div>
        )}

        {/* ── Section Header: Detail breakdown ── */}
        <div
          style={{
            marginTop: 28,
            width: "100%",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <BookOutlined style={{ fontSize: 14, color: "var(--accent)" }} />
          <span
            style={{
              fontSize: 12,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.14em",
              color: "var(--accent)",
            }}
          >
            Chi tiết kết quả
          </span>
          <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
        </div>

        {/* ── Answer Breakdown ── */}
        <Flex vertical gap={10} style={{ marginTop: 12, width: "100%" }}>
          {answers.map((a, i) => (
            <AnswerDetailCard key={i} answer={a} index={i} />
          ))}
        </Flex>

        {/* ── All Badges ── */}
        <div style={{ marginTop: 24, width: "100%" }}>
          <BadgeGallery badges={badges} />
        </div>

        {/* ── CTA Footer ── */}
        <div
          style={{
            marginTop: 24,
            marginBottom: 8,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 12,
            width: "100%",
          }}
        >
          <Link
            href="/home"
            prefetch={false}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "12px 28px",
              borderRadius: 999,
              background: "var(--accent)",
              color: "#fff",
              fontWeight: 600,
              fontSize: 14,
              textDecoration: "none",
              transition: "transform 0.15s, box-shadow 0.15s",
              boxShadow: "0 2px 12px color-mix(in srgb, var(--accent) 30%, transparent)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-1px)";
              e.currentTarget.style.boxShadow = "0 4px 20px color-mix(in srgb, var(--accent) 40%, transparent)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 2px 12px color-mix(in srgb, var(--accent) 30%, transparent)";
            }}
          >
            <ThunderboltOutlined /> Tiếp tục học
            <ArrowRightOutlined style={{ fontSize: 12 }} />
          </Link>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Quay lại mai nhé! 🌟
          </Text>
        </div>
      </Flex>
    </>
  );
}
