"use client";

import { useState } from "react";
import { Typography } from "antd";
import {
  CheckCircleFilled,
  CloseCircleFilled,
  DownOutlined,
  BookOutlined,
  TrophyOutlined,
  LikeOutlined,
  FireOutlined,
  ClockCircleOutlined,
  StarOutlined,
  SmileOutlined,
  ThunderboltOutlined,
  ArrowRightOutlined,
  EditOutlined,
  SwapOutlined,
  TranslationOutlined,
  SearchOutlined,
  QuestionCircleOutlined,
  BulbOutlined,
  RightOutlined,
} from "@ant-design/icons";
import Link from "next/link";

import type { ExerciseAnswer, StreakInfo, Badge } from "@/lib/daily-challenge/types";
import { CelebrationOverlay, StreakFire } from "@/components/shared";
import { BadgeGallery } from "./BadgeGallery";

const { Title, Text } = Typography;

/* ── Tier config ── */
const TIERS = [
  { min: 5, tier: "big" as const, icon: <TrophyOutlined />, label: "Hoàn hảo!", color: "var(--xp)" },
  { min: 4, tier: "medium" as const, icon: <LikeOutlined />, label: "Xuất sắc!", color: "var(--accent)" },
  { min: 3, tier: "small" as const, icon: <SmileOutlined />, label: "Tốt lắm!", color: "var(--success)" },
  { min: 0, tier: null, icon: <FireOutlined />, label: "Cố lên!", color: "var(--text-secondary)" },
];

/* ── Exercise type icon map ── */
const EXERCISE_ICONS: Record<string, React.ReactNode> = {
  "fill-in-blank": <EditOutlined />,
  "sentence-order": <SwapOutlined />,
  "translation": <TranslationOutlined />,
  "error-correction": <SearchOutlined />,
};

const EXERCISE_LABELS: Record<string, string> = {
  "fill-in-blank": "Điền từ",
  "sentence-order": "Sắp xếp câu",
  "translation": "Dịch câu",
  "error-correction": "Sửa lỗi",
};

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
        stroke="rgba(255,255,255,0.15)"
        strokeWidth={stroke}
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
        style={{
          transform: "rotate(-90deg)",
          transformOrigin: "50% 50%",
          transition: "stroke-dashoffset 1s cubic-bezier(0.4,0,0.2,1)",
        }}
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
        gap: 3,
        padding: "12px 8px",
        borderRadius: 14,
        background: "rgba(255,255,255,0.08)",
        backdropFilter: "blur(4px)",
        border: "1px solid rgba(255,255,255,0.08)",
        flex: 1,
        minWidth: 0,
      }}
    >
      <span style={{ fontSize: 16, color: color ?? "rgba(255,255,255,0.5)" }}>{icon}</span>
      <span style={{ fontSize: 18, fontWeight: 700, color: "#fff", fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>{value}</span>
      <span style={{ fontSize: 9, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(255,255,255,0.45)" }}>{label}</span>
    </div>
  );
}

/* ── Answer Detail Card ── */
function AnswerDetailCard({ answer, index }: { answer: ExerciseAnswer; index: number }) {
  const [isExpanded, setIsExpanded] = useState(!answer.isCorrect);

  const ok = answer.isCorrect;
  const exerciseIcon = answer.exerciseType ? EXERCISE_ICONS[answer.exerciseType] : <QuestionCircleOutlined />;
  const exerciseLabel = answer.exerciseType ? EXERCISE_LABELS[answer.exerciseType] : "";

  return (
    <div
      className={`anim-fade-up anim-delay-${Math.min(index + 1, 8)}`}
      style={{
        borderRadius: 16,
        border: `1px solid ${ok ? "color-mix(in srgb, var(--success) 25%, transparent)" : "color-mix(in srgb, var(--error) 20%, transparent)"}`,
        background: "var(--surface)",
        overflow: "hidden",
        boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
        transition: "box-shadow 0.2s",
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
          padding: "14px 16px",
          background: "transparent",
          border: "none",
          cursor: "pointer",
          gap: 10,
        }}
      >
        {/* Left: status + label */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
          <div
            style={{
              width: 30,
              height: 30,
              borderRadius: 10,
              display: "grid",
              placeItems: "center",
              background: ok
                ? "color-mix(in srgb, var(--success) 12%, transparent)"
                : "color-mix(in srgb, var(--error) 12%, transparent)",
              flexShrink: 0,
              fontSize: 14,
              color: ok ? "var(--success)" : "var(--error)",
            }}
          >
            {ok ? <CheckCircleFilled /> : <CloseCircleFilled />}
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 1, minWidth: 0 }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)", whiteSpace: "nowrap" }}>
              Câu {index + 1}
            </span>
            {exerciseLabel && (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, color: "var(--text-muted)", fontWeight: 400, whiteSpace: "nowrap" }}>
                {exerciseIcon} {exerciseLabel}
              </span>
            )}
          </div>
        </div>

        {/* Right: result badge + chevron */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              padding: "3px 12px",
              borderRadius: 999,
              background: ok
                ? "color-mix(in srgb, var(--success) 12%, transparent)"
                : "color-mix(in srgb, var(--error) 12%, transparent)",
              color: ok ? "var(--success)" : "var(--error)",
            }}
          >
            {ok ? "Đúng" : "Sai"}
          </span>
          <DownOutlined
            style={{
              fontSize: 10,
              color: "var(--text-muted)",
              transition: "transform 0.25s",
              transform: isExpanded ? "rotate(180deg)" : "rotate(0)",
            }}
          />
        </div>
      </button>

      {/* Expandable detail */}
      <div
        style={{
          maxHeight: isExpanded ? 800 : 0,
          overflow: "hidden",
          transition: "max-height 0.35s cubic-bezier(0.4,0,0.2,1)",
        }}
      >
        <div style={{ padding: "0 16px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
          {/* Question stem */}
          {answer.questionStem && (
            <div
              style={{
                borderRadius: 12,
                background: "var(--bg-deep)",
                padding: "12px 14px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                <QuestionCircleOutlined style={{ fontSize: 11, color: "var(--text-muted)" }} />
                <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--text-muted)" }}>
                  Câu hỏi
                </span>
              </div>
              <span style={{ fontSize: 13, color: "var(--ink)", lineHeight: 1.7, wordBreak: "break-word" }}>
                {answer.questionStem}
              </span>
            </div>
          )}

          {/* User answer */}
          <div
            style={{
              borderRadius: 12,
              border: `1px solid ${ok ? "color-mix(in srgb, var(--success) 25%, transparent)" : "color-mix(in srgb, var(--error) 25%, transparent)"}`,
              padding: "12px 14px",
              background: ok
                ? "color-mix(in srgb, var(--success) 4%, var(--surface))"
                : "color-mix(in srgb, var(--error) 4%, var(--surface))",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
              {ok ? (
                <CheckCircleFilled style={{ fontSize: 11, color: "var(--success)" }} />
              ) : (
                <CloseCircleFilled style={{ fontSize: 11, color: "var(--error)" }} />
              )}
              <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: ok ? "var(--success)" : "var(--error)" }}>
                Câu trả lời của bạn
              </span>
            </div>
            <span style={{ fontSize: 13, fontWeight: 500, color: "var(--ink)", wordBreak: "break-word", lineHeight: 1.6 }}>
              {answer.answer || "(bỏ trống)"}
            </span>
          </div>

          {/* Correct answer (only for wrong) */}
          {!ok && answer.correctAnswer && (
            <div
              style={{
                borderRadius: 12,
                border: "1px solid color-mix(in srgb, var(--success) 25%, transparent)",
                padding: "12px 14px",
                background: "color-mix(in srgb, var(--success) 4%, var(--surface))",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                <CheckCircleFilled style={{ fontSize: 11, color: "var(--success)" }} />
                <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--success)" }}>
                  Đáp án đúng
                </span>
              </div>
              <span style={{ fontSize: 13, fontWeight: 600, color: "var(--success)", wordBreak: "break-word", lineHeight: 1.6 }}>
                {answer.correctAnswer}
              </span>
            </div>
          )}

          {/* Explanation for wrong answers */}
          {!ok && answer.explanation && (
            <div
              style={{
                borderRadius: 12,
                borderLeft: "3px solid var(--accent)",
                background: "color-mix(in srgb, var(--accent) 5%, var(--surface))",
                padding: "12px 14px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                <BulbOutlined style={{ fontSize: 12, color: "var(--accent)" }} />
                <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--accent)" }}>
                  Giải thích
                </span>
              </div>
              <p style={{ fontSize: 13, lineHeight: 1.7, color: "var(--text-primary)", margin: 0, wordBreak: "break-word" }}>
                {answer.explanation}
              </p>
            </div>
          )}

          {/* Correct answer confirmation */}
          {ok && answer.explanation && (
            <div style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "4px 2px" }}>
              <BulbOutlined style={{ color: "var(--success)", fontSize: 13, marginTop: 2, flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: "var(--success)", fontWeight: 500, lineHeight: 1.6 }}>
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

      <div className="anim-scale-in" style={{ maxWidth: 520, margin: "0 auto", width: "100%", display: "flex", flexDirection: "column", alignItems: "center" }}>
        {/* ── Hero Score Card ── */}
        <div
          style={{
            width: "100%",
            borderRadius: 24,
            padding: "32px 20px 24px",
            background: "linear-gradient(145deg, color-mix(in srgb, var(--accent) 85%, #000) 0%, var(--accent) 50%, color-mix(in srgb, var(--secondary) 90%, var(--accent)) 100%)",
            boxShadow: "0 8px 32px color-mix(in srgb, var(--accent) 25%, transparent), 0 2px 8px rgba(0,0,0,0.1)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 4,
            position: "relative",
            overflow: "hidden",
            color: "#fff",
          }}
        >
          {/* Decorative elements */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "radial-gradient(ellipse 80% 60% at 80% 0%, rgba(255,255,255,0.12) 0%, transparent 70%)",
              pointerEvents: "none",
            }}
          />
          <div className="grain-overlay" style={{ opacity: 0.03 }} />

          {/* Score ring + number */}
          <div style={{ position: "relative", width: 130, height: 130 }}>
            <ScoreRing score={correctCount} total={answers.length} color="#fff" />
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
              <span style={{ fontSize: 38, fontWeight: 800, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>
                {correctCount}
              </span>
              <span style={{ fontSize: 13, fontWeight: 500, opacity: 0.6, marginTop: 2 }}>
                / {answers.length}
              </span>
            </div>
          </div>

          {/* Tier label */}
          <span style={{ fontSize: 28, marginTop: 4, filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.2))" }}>{matched.icon}</span>
          <span
            style={{
              fontSize: 20,
              fontWeight: 700,
              fontFamily: "var(--font-display)",
              textShadow: "0 1px 4px rgba(0,0,0,0.15)",
            }}
          >
            {matched.label}
          </span>
          <span style={{ fontSize: 13, fontWeight: 500, opacity: 0.7 }}>
            Chính xác {pct}%
          </span>

          {/* Stat pills row */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(70px, 1fr))",
              gap: 8,
              width: "100%",
              marginTop: 20,
            }}
          >
            <StatPill
              icon={<CheckCircleFilled />}
              label="Đúng"
              value={String(correctCount)}
              color="color-mix(in srgb, var(--success) 80%, white)"
            />
            <StatPill
              icon={<CloseCircleFilled />}
              label="Sai"
              value={String(wrongCount)}
              color={wrongCount > 0 ? "color-mix(in srgb, var(--error) 80%, white)" : "rgba(255,255,255,0.3)"}
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
              color="color-mix(in srgb, var(--warning) 80%, white)"
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
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
              <StarOutlined style={{ fontSize: 13, color: "var(--xp)" }} />
              <Text strong style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 1.5, color: "var(--xp)" }}>
                Huy hiệu mới!
              </Text>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {newBadges.map((b, i) => (
                <span
                  key={b.id}
                  className={`anim-pop-in anim-delay-${Math.min(i + 3, 8)}`}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: 13,
                    padding: "5px 14px",
                    borderRadius: 999,
                    border: "1px solid var(--xp)",
                    background: "color-mix(in srgb, var(--xp) 10%, var(--surface))",
                    fontWeight: 600,
                    color: "var(--ink)",
                  }}
                >
                  {b.icon === "TrophyOutlined" ? <TrophyOutlined style={{ color: "var(--xp)" }} /> : <FireOutlined style={{ color: "var(--xp)" }} />} {b.label}
                </span>
              ))}
            </div>
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
          <BookOutlined style={{ fontSize: 13, color: "var(--accent)" }} />
          <span
            style={{
              fontSize: 11,
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
        <div style={{ marginTop: 12, width: "100%", display: "flex", flexDirection: "column", gap: 10 }}>
          {answers.map((a, i) => (
            <AnswerDetailCard key={i} answer={a} index={i} />
          ))}
        </div>

        {/* ── All Badges ── */}
        <div style={{ marginTop: 24, width: "100%" }}>
          <BadgeGallery badges={badges} />
        </div>

        {/* ── CTA Footer ── */}
        <div
          style={{
            marginTop: 28,
            marginBottom: 12,
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
              padding: "13px 32px",
              borderRadius: 999,
              background: "var(--accent)",
              color: "#fff",
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
    </>
  );
}
