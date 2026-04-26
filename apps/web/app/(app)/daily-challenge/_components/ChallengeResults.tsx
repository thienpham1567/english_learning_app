"use client";

import { useState } from "react";
import { Card, Flex, Typography, Tag } from "antd";
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
} from "@ant-design/icons";

import type { ExerciseAnswer, StreakInfo, Badge } from "@/lib/daily-challenge/types";
import { CelebrationOverlay, StreakFire } from "@/components/shared";
import { BadgeGallery } from "./BadgeGallery";
import { EXERCISE_TYPE_LABELS } from "./constants";

const { Title, Text } = Typography;

// Tiered celebration config (AC: #1–#4)
const TIERS = [
  { min: 5, tier: "big" as const, icon: <TrophyOutlined />, label: "Hoàn hảo!", color: "var(--xp)" },
  { min: 4, tier: "medium" as const, icon: <LikeOutlined />, label: "Xuất sắc!", color: "var(--accent)" },
  { min: 3, tier: "small" as const, icon: <SmileOutlined />, label: "Tốt lắm!", color: "var(--success)" },
  { min: 0, tier: null, icon: <FireOutlined />, label: "Cố lên!", color: "var(--text-secondary)" },
];



type Props = {
  answers: ExerciseAnswer[];
  score: number;
  streak: StreakInfo;
  badges: Badge[];
  newBadges: Badge[];
  timeElapsedMs: number;
};

/** Expandable answer detail card */
function AnswerDetailCard({ answer, index }: { answer: ExerciseAnswer; index: number }) {
  const [isExpanded, setIsExpanded] = useState(!answer.isCorrect); // auto-expand wrong answers

  const borderColor = answer.isCorrect ? "var(--success)" : "var(--error)";
  const bgColor = answer.isCorrect
    ? "color-mix(in srgb, var(--success) 6%, var(--surface))"
    : "color-mix(in srgb, var(--error) 6%, var(--surface))";

  return (
    <div
      className={`anim-fade-up anim-delay-${Math.min(index + 1, 8)} ${!answer.isCorrect ? "anim-shake" : ""}`}
      style={{
        borderRadius: "var(--radius)",
        border: `1.5px solid ${borderColor}`,
        background: bgColor,
        overflow: "hidden",
        transition: "all 0.2s ease",
      }}
    >
      {/* Header row — always visible */}
      <button
        type="button"
        onClick={() => setIsExpanded((v) => !v)}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%",
          padding: "10px 14px",
          background: "transparent",
          border: "none",
          cursor: "pointer",
          gap: 8,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
          {answer.isCorrect ? (
            <CheckCircleFilled style={{ color: "var(--success)", fontSize: 18, flexShrink: 0 }} />
          ) : (
            <CloseCircleFilled style={{ color: "var(--error)", fontSize: 18, flexShrink: 0 }} />
          )}
          <span
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: answer.isCorrect ? "var(--success)" : "var(--error)",
            }}
          >
            Câu {index + 1}: {answer.isCorrect ? "Đúng ✓" : "Sai ✗"}
          </span>
          {answer.exerciseType && (
            <span
              style={{
                fontSize: 11,
                color: "var(--text-muted)",
                fontWeight: 400,
                flexShrink: 0,
              }}
            >
              {EXERCISE_TYPE_LABELS[answer.exerciseType] ?? ""}
            </span>
          )}
        </div>
        <span style={{ color: "var(--text-muted)", fontSize: 12, flexShrink: 0 }}>
          {isExpanded ? <UpOutlined /> : <DownOutlined />}
        </span>
      </button>

      {/* Expanded detail section */}
      {isExpanded && (
        <div
          className="anim-fade-in"
          style={{
            padding: "0 14px 14px",
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          {/* Question stem */}
          {answer.questionStem && (
            <div
              style={{
                borderRadius: 8,
                background: "var(--bg-deep)",
                padding: "8px 12px",
              }}
            >
              <span
                style={{
                  display: "block",
                  fontSize: 10,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.12em",
                  color: "var(--text-muted)",
                  marginBottom: 4,
                }}
              >
                Câu hỏi
              </span>
              <span style={{ fontSize: 13, color: "var(--ink)", lineHeight: 1.6 }}>
                {answer.questionStem}
              </span>
            </div>
          )}

          {/* User answer vs Correct answer — side-by-side on desktop, stacked on mobile */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: answer.isCorrect ? "1fr" : "1fr 1fr",
              gap: 8,
            }}
            className="answer-compare-grid"
          >
            {/* User's answer */}
            <div
              style={{
                borderRadius: 8,
                border: `1px solid ${answer.isCorrect ? "var(--success)" : "var(--error)"}`,
                padding: "8px 12px",
                background: answer.isCorrect
                  ? "color-mix(in srgb, var(--success) 5%, transparent)"
                  : "color-mix(in srgb, var(--error) 5%, transparent)",
              }}
            >
              <span
                style={{
                  display: "block",
                  fontSize: 10,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.12em",
                  color: answer.isCorrect ? "var(--success)" : "var(--error)",
                  marginBottom: 4,
                }}
              >
                Câu trả lời của bạn
              </span>
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 500,
                  color: "var(--ink)",
                  wordBreak: "break-word",
                }}
              >
                {answer.answer || "(bỏ trống)"}
              </span>
            </div>

            {/* Correct answer — only for wrong answers */}
            {!answer.isCorrect && answer.correctAnswer && (
              <div
                style={{
                  borderRadius: 8,
                  border: "1px solid var(--success)",
                  padding: "8px 12px",
                  background: "color-mix(in srgb, var(--success) 5%, transparent)",
                }}
              >
                <span
                  style={{
                    display: "block",
                    fontSize: 10,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.12em",
                    color: "var(--success)",
                    marginBottom: 4,
                  }}
                >
                  ✓ Đáp án đúng
                </span>
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: "var(--success)",
                    wordBreak: "break-word",
                  }}
                >
                  {answer.correctAnswer}
                </span>
              </div>
            )}
          </div>

          {/* Grammar explanation — only for wrong answers */}
          {!answer.isCorrect && answer.explanation && (
            <div
              style={{
                borderRadius: 8,
                borderLeft: "3px solid var(--accent)",
                background: "color-mix(in srgb, var(--accent) 6%, var(--bg-deep))",
                padding: "10px 14px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  marginBottom: 6,
                }}
              >
                <BookOutlined style={{ fontSize: 12, color: "var(--accent)" }} />
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.12em",
                    color: "var(--accent)",
                  }}
                >
                  Giải thích ngữ pháp
                </span>
              </div>
              <p
                style={{
                  fontSize: 13,
                  lineHeight: 1.7,
                  color: "var(--text-primary)",
                  margin: 0,
                }}
              >
                {answer.explanation}
              </p>
            </div>
          )}

          {/* Correct answer confirmation */}
          {answer.isCorrect && answer.explanation && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "4px 0",
              }}
            >
              <CheckCircleFilled style={{ color: "var(--success)", fontSize: 12 }} />
              <span style={{ fontSize: 12, color: "var(--success)", fontWeight: 500 }}>
                {answer.explanation}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

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

  return (
    <>
      {/* Tiered celebration overlay (AC: #1–#3) */}
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

      <Flex vertical align="center" className="anim-scale-in" style={{ maxWidth: 520, margin: "0 auto" }}>
        {/* Score header */}
        <span className="anim-bounce-emoji" style={{ fontSize: 60 }}>{matched.icon}</span>

        <Title level={2} style={{ marginTop: 12, fontFamily: "var(--font-display)", fontStyle: "italic" }}>
          {score} / {answers.length}
        </Title>

        {/* Score summary tags */}
        <Flex gap={8} align="center" style={{ marginTop: 4 }}>
          <Tag
            style={{
              borderRadius: 999,
              padding: "2px 10px",
              border: "1px solid var(--success)",
              background: "color-mix(in srgb, var(--success) 10%, transparent)",
              color: "var(--success)",
              fontWeight: 600,
              fontSize: 12,
            }}
          >
            ✓ {correctCount} đúng
          </Tag>
          {wrongCount > 0 && (
            <Tag
              style={{
                borderRadius: 999,
                padding: "2px 10px",
                border: "1px solid var(--error)",
                background: "color-mix(in srgb, var(--error) 10%, transparent)",
                color: "var(--error)",
                fontWeight: 600,
                fontSize: 12,
              }}
            >
              ✗ {wrongCount} sai
            </Tag>
          )}
        </Flex>

        <Text type="secondary" style={{ fontSize: 13, marginTop: 8 }}>
          <ClockCircleOutlined style={{ marginRight: 4 }} /> {minutes}:{seconds.toString().padStart(2, "0")}
        </Text>

        {/* Streak (AC: #3 — uses StreakFire instead of legacy StreakDisplay) */}
        <div style={{ marginTop: 16 }}>
          <StreakFire streak={streak.currentStreak} />
        </div>

        {/* New badges with bounce-in (AC: #5) */}
        {newBadges.length > 0 && (
          <Card
            className="anim-fade-up anim-delay-2"
            style={{
              marginTop: 16,
              width: "100%",
              borderRadius: "var(--radius-xl)",
              borderColor: "var(--xp)",
              background: "color-mix(in srgb, var(--xp) 8%, var(--surface))",
            }}
            styles={{ body: { padding: "12px 16px" } }}
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
                    padding: "4px 12px",
                    borderRadius: 999,
                    border: "1px solid var(--xp)",
                    background: "color-mix(in srgb, var(--xp) 10%, var(--surface))",
                  }}
                >
                  {b.icon === "TrophyOutlined" ? <TrophyOutlined /> : <FireOutlined />} {b.label}
                </Tag>
              ))}
            </Flex>
          </Card>
        )}

        {/* Section header for detailed breakdown */}
        <div
          style={{
            marginTop: 24,
            width: "100%",
            display: "flex",
            alignItems: "center",
            gap: 8,
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

        {/* Answer breakdown — detailed expandable cards */}
        <Flex vertical gap={10} style={{ marginTop: 12, width: "100%" }}>
          {answers.map((a, i) => (
            <AnswerDetailCard key={i} answer={a} index={i} />
          ))}
        </Flex>

        {/* All badges */}
        <div style={{ marginTop: 20, width: "100%" }}>
          <BadgeGallery badges={badges} />
        </div>

        <Text type="secondary" style={{ marginTop: 20, fontSize: 13 }}>Quay lại mai nhé!</Text>
      </Flex>
    </>
  );
}
