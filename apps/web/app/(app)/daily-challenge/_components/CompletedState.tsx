"use client";

import { useState, useEffect } from "react";
import { Card, Flex, Typography } from "antd";
import { CheckCircleFilled, CloseCircleFilled } from "@ant-design/icons";

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

export function CompletedState({ challenge, streak, badges }: {
  challenge: DailyChallenge;
  streak: StreakInfo;
  badges: Badge[];
}) {
  const answers = (challenge.answers ?? []) as ExerciseAnswer[];
  const emoji = (challenge.score ?? 0) >= 4 ? "🎉" : "👍";

  const [countdown, setCountdown] = useState(() => msUntilVnMidnight());

  useEffect(() => {
    const id = setInterval(() => setCountdown(msUntilVnMidnight()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <Flex vertical align="center" className="anim-fade-in" style={{ maxWidth: 480, margin: "0 auto", textAlign: "center" }}>
      <span style={{ fontSize: 48 }}>{emoji}</span>
      <Title level={3} style={{ marginTop: 8, fontFamily: "var(--font-display)", fontStyle: "italic" }}>
        Đã hoàn thành hôm nay!
      </Title>
      <Text type="secondary" style={{ fontSize: 13 }}>Điểm: {challenge.score} / 5</Text>

      {/* Streak */}
      <div style={{ marginTop: 16 }}>
        <StreakFire streak={streak.currentStreak} />
      </div>

      {/* Answer review */}
      <Flex vertical gap={6} style={{ marginTop: 20, width: "100%" }}>
        {answers.map((a, i) => (
          <Card
            key={i}
            size="small"
            style={{
              borderColor: a.isCorrect ? "var(--success)" : "var(--error, #ef4444)",
              background: a.isCorrect
                ? "color-mix(in srgb, var(--success) 8%, var(--surface))"
                : "color-mix(in srgb, var(--error, #ef4444) 8%, var(--surface))",
              borderRadius: "var(--radius)",
            }}
            styles={{ body: { padding: "6px 12px" } }}
          >
            <Flex align="center" justify="space-between">
              <Flex align="center" gap={8}>
                {a.isCorrect ? (
                  <CheckCircleFilled style={{ color: "#10b981", fontSize: 14 }} />
                ) : (
                  <CloseCircleFilled style={{ color: "#ef4444", fontSize: 14 }} />
                )}
                <Text style={{ fontSize: 13, color: a.isCorrect ? "var(--success)" : "var(--error, #ef4444)" }}>
                  Câu {i + 1}: {a.isCorrect ? "Đúng" : "Sai"}
                </Text>
              </Flex>
              {!a.isCorrect && a.explanation && (
                <Text style={{ fontSize: 11, color: "var(--success)" }}>{a.explanation}</Text>
              )}
            </Flex>
          </Card>
        ))}
      </Flex>

      {/* Badges */}
      <div style={{ marginTop: 20, width: "100%" }}>
        <BadgeGallery badges={badges} />
      </div>

      {/* Countdown to next challenge */}
      <Card
        style={{
          marginTop: 20,
          width: "100%",
          borderRadius: "var(--radius-xl)",
          background: "var(--bg-deep)",
          textAlign: "center",
        }}
        styles={{ body: { padding: "12px 16px" } }}
      >
        <Text strong style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 1.5, color: "var(--text-muted)" }}>
          Thử thách tiếp theo
        </Text>
        <Title
          level={4}
          style={{
            margin: "4px 0 0",
            fontFamily: "var(--font-mono)",
            color: "var(--accent)",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {formatCountdown(countdown)}
        </Title>
      </Card>

      <Text type="secondary" style={{ marginTop: 16, fontSize: 13 }}>Quay lại mai nhé! 🌙</Text>
    </Flex>
  );
}
