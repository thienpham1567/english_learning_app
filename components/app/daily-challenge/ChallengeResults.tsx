"use client";

import { useState } from "react";
import { Card, Flex, Typography, Tag } from "antd";
import { CheckCircleFilled, CloseCircleFilled } from "@ant-design/icons";

import type { ExerciseAnswer, StreakInfo, Badge } from "@/lib/daily-challenge/types";
import { CelebrationOverlay, StreakFire } from "@/components/app/shared";
import { BadgeGallery } from "./BadgeGallery";

const { Title, Text } = Typography;

// Tiered celebration config (AC: #1–#4)
const TIERS = [
  { min: 5, tier: "big" as const, emoji: "🎉", label: "Hoàn hảo!", color: "#d4a017" },
  { min: 4, tier: "medium" as const, emoji: "👏", label: "Xuất sắc!", color: "var(--accent)" },
  { min: 3, tier: "small" as const, emoji: "👍", label: "Tốt lắm!", color: "var(--success)" },
  { min: 0, tier: null, emoji: "💪", label: "Cố lên!", color: "var(--text-secondary)" },
];

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
              color: matched.tier === "big" ? "#fbbf24" : "var(--ink)",
              margin: 0,
              textShadow: "0 2px 8px rgba(0,0,0,0.15)",
            }}
          >
            {matched.emoji} {matched.label}
          </Title>
        </CelebrationOverlay>
      )}

      <Flex vertical align="center" className="anim-scale-in" style={{ maxWidth: 480, margin: "0 auto" }}>
        {/* Score header */}
        <span className="anim-bounce-emoji" style={{ fontSize: 60 }}>{matched.emoji}</span>

        <Title level={2} style={{ marginTop: 12, fontFamily: "var(--font-display)", fontStyle: "italic" }}>
          {score} / 5
        </Title>
        <Text type="secondary" style={{ fontSize: 13 }}>
          ⏱️ {minutes}:{seconds.toString().padStart(2, "0")}
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
              🎊 Huy hiệu mới!
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
                  {b.emoji} {b.label}
                </Tag>
              ))}
            </Flex>
          </Card>
        )}

        {/* Answer breakdown (AC: #6) */}
        <Flex vertical gap={8} style={{ marginTop: 20, width: "100%" }}>
          {answers.map((a, i) => (
            <Card
              key={i}
              size="small"
              className={`anim-fade-up anim-delay-${Math.min(i + 1, 8)} ${!a.isCorrect ? "anim-shake" : ""}`}
              style={{
                borderColor: a.isCorrect ? "var(--success)" : "var(--error, #ef4444)",
                background: a.isCorrect
                  ? "color-mix(in srgb, var(--success) 8%, var(--surface))"
                  : "color-mix(in srgb, var(--error, #ef4444) 8%, var(--surface))",
                borderRadius: "var(--radius)",
              }}
              styles={{ body: { padding: "8px 12px" } }}
            >
              <Flex align="center" justify="space-between">
                <Flex align="center" gap={8}>
                  {a.isCorrect ? (
                    <CheckCircleFilled style={{ color: "#10b981", fontSize: 16 }} />
                  ) : (
                    <CloseCircleFilled style={{ color: "#ef4444", fontSize: 16 }} />
                  )}
                  <Text style={{ fontSize: 13, color: a.isCorrect ? "var(--success)" : "var(--error, #ef4444)" }}>
                    Câu {i + 1}: {a.isCorrect ? "Đúng" : "Sai"}
                  </Text>
                </Flex>
                {!a.isCorrect && a.explanation && (
                  <Text style={{ fontSize: 11, color: "var(--success)", fontWeight: 500 }}>
                    {a.explanation}
                  </Text>
                )}
              </Flex>
            </Card>
          ))}
        </Flex>

        {/* All badges */}
        <div style={{ marginTop: 20, width: "100%" }}>
          <BadgeGallery badges={badges} />
        </div>

        <Text type="secondary" style={{ marginTop: 20, fontSize: 13 }}>Quay lại mai nhé! 🌙</Text>
      </Flex>
    </>
  );
}
