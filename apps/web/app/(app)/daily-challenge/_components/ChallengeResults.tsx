"use client";

import { useState } from "react";
import {
  CheckCircleFilled,
  CloseCircleFilled,
  DownOutlined,
  BookOutlined,
  TrophyOutlined,
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
  LikeOutlined,
  RightOutlined,
} from "@ant-design/icons";
import Link from "next/link";

import type { ExerciseAnswer, StreakInfo, Badge } from "@/lib/daily-challenge/types";
import { CelebrationOverlay } from "@/components/shared";
import { BadgeGallery } from "./BadgeGallery";

/* ── Tier config ── */
const TIERS = [
  { min: 5, tier: "big" as const, label: "Hoàn hảo!", sub: "Tất cả đều đúng" },
  { min: 4, tier: "medium" as const, label: "Xuất sắc!", sub: "Gần như hoàn hảo" },
  { min: 3, tier: "small" as const, label: "Tốt lắm!", sub: "Đang tiến bộ" },
  { min: 0, tier: null, label: "Cố lên!", sub: "Lần sau sẽ tốt hơn" },
];

/* ── Exercise type maps ── */
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
        borderRadius: 14,
        border: `1px solid ${ok ? "rgba(74,124,111,.22)" : "rgba(239,68,68,.16)"}`,
        background: "var(--surface)",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <button
        type="button"
        onClick={() => setIsExpanded((v) => !v)}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%",
          padding: "13px 16px",
          background: "transparent",
          border: "none",
          cursor: "pointer",
          gap: 10,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
          <div
            style={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              background: ok ? "var(--sage, var(--success))" : "var(--error)",
              flexShrink: 0,
            }}
          />
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 1, minWidth: 0 }}>
            <span
              style={{
                fontFamily: "var(--font-display)",
                fontSize: 14,
                fontWeight: 600,
                color: "var(--text-primary)",
              }}
            >
              Câu {index + 1}
            </span>
            {exerciseLabel && (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  fontSize: 10,
                  color: "var(--text-muted)",
                  fontWeight: 400,
                  letterSpacing: ".06em",
                  fontFamily: "var(--font-body)",
                }}
              >
                {exerciseIcon} {exerciseLabel}
              </span>
            )}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: ".1em",
              textTransform: "uppercase",
              padding: "3px 10px",
              borderRadius: 99,
              background: ok ? "rgba(74,124,111,.1)" : "rgba(239,68,68,.09)",
              color: ok ? "var(--sage, var(--success))" : "var(--error)",
              fontFamily: "var(--font-body)",
            }}
          >
            {ok ? "Đúng" : "Sai"}
          </span>
          <DownOutlined
            style={{
              fontSize: 9,
              color: "var(--text-muted)",
              transition: "transform .25s",
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
          transition: "max-height .35s cubic-bezier(.4,0,.2,1)",
        }}
      >
        <div
          style={{
            padding: "0 16px 16px",
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          {/* Question stem */}
          {answer.questionStem && (
            <div
              style={{
                borderRadius: 10,
                background: "var(--bg-deep)",
                padding: "11px 14px",
              }}
            >
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: ".12em",
                  color: "var(--text-muted)",
                  display: "block",
                  marginBottom: 5,
                  fontFamily: "var(--font-body)",
                }}
              >
                Câu hỏi
              </span>
              <span
                style={{
                  fontSize: 13,
                  color: "var(--text-primary)",
                  lineHeight: 1.65,
                  fontFamily: "var(--font-body)",
                  wordBreak: "break-word",
                }}
              >
                {answer.questionStem}
              </span>
            </div>
          )}

          {/* User answer */}
          <div
            style={{
              borderRadius: 10,
              borderLeft: `3px solid ${ok ? "var(--sage, var(--success))" : "var(--error)"}`,
              padding: "10px 14px",
              background: ok
                ? "rgba(74,124,111,.05)"
                : "rgba(239,68,68,.04)",
            }}
          >
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: ".12em",
                color: ok ? "var(--sage, var(--success))" : "var(--error)",
                display: "block",
                marginBottom: 4,
                fontFamily: "var(--font-body)",
              }}
            >
              {ok ? "Câu trả lời của bạn" : "Bạn đã chọn"}
            </span>
            <span
              style={{
                fontSize: 13,
                fontWeight: 500,
                color: "var(--text-primary)",
                wordBreak: "break-word",
                lineHeight: 1.6,
                fontFamily: "var(--font-body)",
              }}
            >
              {answer.answer || "(bỏ trống)"}
            </span>
          </div>

          {/* Correct answer (wrong only) */}
          {!ok && answer.correctAnswer && (
            <div
              style={{
                borderRadius: 10,
                borderLeft: "3px solid var(--sage, var(--success))",
                padding: "10px 14px",
                background: "rgba(74,124,111,.05)",
              }}
            >
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: ".12em",
                  color: "var(--sage, var(--success))",
                  display: "block",
                  marginBottom: 4,
                  fontFamily: "var(--font-body)",
                }}
              >
                Đáp án đúng
              </span>
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: "var(--sage, var(--success))",
                  wordBreak: "break-word",
                  lineHeight: 1.6,
                  fontFamily: "var(--font-body)",
                }}
              >
                {answer.correctAnswer}
              </span>
            </div>
          )}

          {/* Explanation */}
          {answer.explanation && (
            <div
              style={{
                display: "flex",
                gap: 8,
                padding: "4px 2px",
                alignItems: "flex-start",
              }}
            >
              <BulbOutlined
                style={{
                  color: "var(--accent)",
                  fontSize: 12,
                  marginTop: 3,
                  flexShrink: 0,
                }}
              />
              <p
                style={{
                  fontSize: 12,
                  lineHeight: 1.7,
                  color: "var(--text-secondary)",
                  margin: 0,
                  wordBreak: "break-word",
                  fontFamily: "var(--font-body)",
                }}
              >
                {answer.explanation}
              </p>
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

export function ChallengeResults({
  answers,
  score,
  streak,
  badges,
  newBadges,
  timeElapsedMs,
}: Props) {
  const matched = TIERS.find((t) => score >= t.min)!;
  const [showCelebration, setShowCelebration] = useState(matched.tier !== null);

  const minutes = Math.floor(timeElapsedMs / 60000);
  const seconds = Math.floor((timeElapsedMs % 60000) / 1000);
  const correctCount = answers.filter((a) => a.isCorrect).length;
  const wrongCount = answers.length - correctCount;
  const pct = answers.length > 0 ? Math.round((correctCount / answers.length) * 100) : 0;

  return (
    <>
      {matched.tier && (
        <CelebrationOverlay
          tier={matched.tier}
          visible={showCelebration}
          onComplete={() => setShowCelebration(false)}
        >
          <span
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 22,
              fontWeight: 700,
              fontStyle: "italic",
              color: matched.tier === "big" ? "var(--xp)" : "var(--ink)",
            }}
          >
            {matched.label}
          </span>
        </CelebrationOverlay>
      )}

      <div
        className="anim-scale-in"
        style={{
          maxWidth: 520,
          margin: "0 auto",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          gap: 0,
        }}
      >
        {/* ── Score Hero — editorial typographic style ── */}
        <div
          style={{
            borderRadius: 20,
            border: "1px solid var(--border)",
            background: "var(--surface)",
            padding: "36px 28px 28px",
            textAlign: "center",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Top accent line */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: "50%",
              transform: "translateX(-50%)",
              width: 56,
              height: 2,
              background: "var(--accent)",
              borderRadius: "0 0 2px 2px",
            }}
          />

          {/* Big score number */}
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              justifyContent: "center",
              gap: 6,
              marginBottom: 10,
            }}
          >
            <span
              style={{
                fontFamily: "var(--font-display)",
                fontSize: 96,
                fontWeight: 900,
                lineHeight: 1,
                color: correctCount === answers.length
                  ? "var(--sage, var(--success))"
                  : correctCount >= answers.length * 0.6
                  ? "var(--ink, var(--text-primary))"
                  : "var(--accent)",
                letterSpacing: "-.04em",
              }}
            >
              {correctCount}
            </span>
            <span
              style={{
                fontFamily: "var(--font-display)",
                fontSize: 32,
                fontWeight: 300,
                color: "var(--text-muted)",
                letterSpacing: "-.02em",
                marginBottom: 8,
              }}
            >
              /{answers.length}
            </span>
          </div>

          {/* Title */}
          <p
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 22,
              fontWeight: 700,
              fontStyle: "italic",
              color: "var(--text-primary)",
              margin: "0 0 4px",
              letterSpacing: "-.02em",
            }}
          >
            {matched.label}
          </p>
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontSize: 13,
              color: "var(--text-muted)",
              margin: 0,
            }}
          >
            {matched.sub} · Chính xác {pct}%
          </p>

          {/* Thin divider */}
          <div
            style={{
              margin: "20px auto",
              width: 40,
              height: 1,
              background: "var(--border)",
            }}
          />

          {/* Stats row */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: 0,
            }}
          >
            {[
              { icon: <CheckCircleFilled style={{ color: "var(--sage, var(--success))" }} />, label: "Đúng", value: correctCount },
              { icon: <CloseCircleFilled style={{ color: "var(--error)" }} />, label: "Sai", value: wrongCount },
              { icon: <ClockCircleOutlined />, label: "Thời gian", value: `${minutes}:${seconds.toString().padStart(2, "0")}` },
              { icon: <FireOutlined style={{ color: "var(--fire, var(--warning))" }} />, label: "Streak", value: streak.currentStreak },
            ].map((s, i, arr) => (
              <div
                key={s.label}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 4,
                  padding: "12px 8px",
                  borderRight: i < arr.length - 1 ? "1px solid var(--border)" : "none",
                }}
              >
                <span style={{ fontSize: 14, color: "var(--text-muted)" }}>{s.icon}</span>
                <span
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: 20,
                    fontWeight: 700,
                    color: "var(--text-primary)",
                    lineHeight: 1,
                  }}
                >
                  {s.value}
                </span>
                <span
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: 9,
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: ".1em",
                    color: "var(--text-muted)",
                  }}
                >
                  {s.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ── New Badges ── */}
        {newBadges.length > 0 && (
          <div
            className="anim-fade-up anim-delay-2"
            style={{
              marginTop: 12,
              borderRadius: 14,
              border: "1.5px solid rgba(196,163,90,.35)",
              background: "rgba(196,163,90,.05)",
              padding: "14px 18px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
              <StarOutlined style={{ fontSize: 11, color: "var(--xp, var(--warning))" }} />
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: ".14em",
                  color: "var(--xp, var(--warning))",
                  fontFamily: "var(--font-body)",
                }}
              >
                Huy hiệu mới!
              </span>
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
                    fontSize: 12,
                    padding: "5px 14px",
                    borderRadius: 99,
                    border: "1px solid rgba(196,163,90,.4)",
                    background: "rgba(196,163,90,.08)",
                    fontWeight: 600,
                    color: "var(--ink, var(--text-primary))",
                    fontFamily: "var(--font-body)",
                  }}
                >
                  {b.icon === "TrophyOutlined" ? (
                    <TrophyOutlined style={{ color: "var(--xp, var(--warning))" }} />
                  ) : (
                    <FireOutlined style={{ color: "var(--xp, var(--warning))" }} />
                  )}
                  {b.label}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* ── Answer Breakdown header ── */}
        <div
          style={{
            marginTop: 28,
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 12,
          }}
        >
          <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: ".16em",
              color: "var(--text-muted)",
              whiteSpace: "nowrap",
              fontFamily: "var(--font-body)",
            }}
          >
            Chi tiết kết quả
          </span>
          <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
        </div>

        {/* Answer Cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {answers.map((a, i) => (
            <AnswerDetailCard key={i} answer={a} index={i} />
          ))}
        </div>

        {/* Badges */}
        <div style={{ marginTop: 24 }}>
          <BadgeGallery badges={badges} />
        </div>

        {/* CTA */}
        <div
          style={{
            marginTop: 28,
            marginBottom: 8,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 10,
          }}
        >
          <Link
            href="/home"
            prefetch={false}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 10,
              padding: "14px 32px",
              borderRadius: 12,
              background: "var(--ink, var(--text-primary))",
              color: "#fff",
              fontWeight: 600,
              fontSize: 14,
              textDecoration: "none",
              fontFamily: "var(--font-body)",
              transition: "opacity .2s, transform .2s",
              letterSpacing: "-.01em",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = ".85";
              e.currentTarget.style.transform = "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = "1";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            Tiếp tục học
            <RightOutlined style={{ fontSize: 11 }} />
          </Link>
          <span
            style={{
              fontSize: 11,
              color: "var(--text-muted)",
              fontFamily: "var(--font-body)",
            }}
          >
            Quay lại mai nhé!
          </span>
        </div>
      </div>
    </>
  );
}
