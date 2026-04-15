"use client";

import { useEffect, useState } from "react";
import { Button, Card, Flex, Result, Spin, Typography } from "antd";
import { ClockCircleOutlined, FireOutlined, ReloadOutlined } from "@ant-design/icons";

import { useDailyChallenge } from "@/hooks/useDailyChallenge";
import { ExerciseCard } from "@/components/app/daily-challenge/ExerciseCard";
import { ChallengeResults } from "@/components/app/daily-challenge/ChallengeResults";
import { CompletedState } from "@/components/app/daily-challenge/CompletedState";
import { ProgressSegments, StreakFire } from "@/components/app/shared";

const { Title, Text } = Typography;

// Exercise type labels with emoji (AC: #2)
const EXERCISE_TYPE_LABELS: Record<string, string> = {
  "fill-in-blank": "📝 Điền vào chỗ trống",
  "sentence-order": "🔄 Sắp xếp câu",
  "translation": "🌐 Dịch câu",
  "error-correction": "🔍 Sửa lỗi",
};

// Live elapsed timer hook (AC: #4)
function useElapsedTimer(isRunning: boolean) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!isRunning) return;

    const startedAt = Date.now();
    const interval = setInterval(() => {
      setElapsed(Date.now() - startedAt);
    }, 1000);
    return () => clearInterval(interval);
  }, [isRunning]);

  const totalSec = Math.floor(elapsed / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min}:${sec.toString().padStart(2, "0")}`;
}

export default function DailyChallengePage() {
  const {
    state,
    challenge,
    streak,
    badges,
    currentExercise,
    results,
    error,
    timeElapsedMs,
    answerExercise,
  } = useDailyChallenge();

  const formattedTime = useElapsedTimer(state === "active");

  return (
    <Card
      style={{
        height: "100%",
        minHeight: 0,
        flex: 1,
        overflow: "hidden",
        boxShadow: "var(--shadow-md)",
      }}
      styles={{ body: { display: "flex", flexDirection: "column", height: "100%", padding: 0 } }}
    >
      {/* Header */}
      <Flex
        align="center"
        gap={12}
        style={{
          flexShrink: 0,
          borderBottom: "1px solid var(--border)",
          background: "var(--surface)",
          padding: "16px 24px",
        }}
      >
        <Flex
          align="center"
          justify="center"
          style={{
            width: 40,
            height: 40,
            borderRadius: "var(--radius)",
            background: "linear-gradient(135deg, #9AB17A, #7a9660)",
            color: "#fff",
          }}
        >
          <FireOutlined style={{ fontSize: 20 }} />
        </Flex>
        <Flex vertical style={{ flex: 1 }}>
          <Title level={5} style={{ margin: 0 }}>
            Thử thách mỗi ngày 🔥
          </Title>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Daily Challenge · 5 bài tập mỗi ngày
          </Text>
        </Flex>

        {/* Live timer (AC: #4) */}
        {state === "active" && (
          <Text type="secondary" style={{ fontSize: 13, fontVariantNumeric: "tabular-nums" }}>
            <ClockCircleOutlined style={{ marginRight: 4 }} />
            {formattedTime}
          </Text>
        )}

        {/* Streak fire (AC: #3) — replaces legacy StreakDisplay */}
        {state !== "loading" && (
          <StreakFire streak={streak.currentStreak} />
        )}
      </Flex>

      {/* Content */}
      <Flex
        vertical
        align="center"
        justify="center"
        style={{ flex: 1, minHeight: 0, overflow: "auto", padding: "24px 16px" }}
      >
        <Flex
          vertical
          align="center"
          justify="center"
          style={{ width: "100%", maxWidth: 580, minHeight: "100%" }}
        >
          {error && (
            <Result
              status="error"
              subTitle={error}
              style={{ marginBottom: 16, padding: "16px 0" }}
            />
          )}

          {state === "loading" && <Spin size="large" />}

          {state === "error" && (
            <Flex vertical align="center" gap={16}>
              <Button
                type="primary"
                icon={<ReloadOutlined />}
                onClick={() => window.location.reload()}
              >
                Thử lại
              </Button>
            </Flex>
          )}

          {state === "active" && challenge && (
            <Flex vertical gap={16} style={{ width: "100%" }}>
              {/* Segmented progress bar (AC: #1) — replaces dots */}
              <ProgressSegments
                current={currentExercise}
                total={challenge.exercises.length}
              />

              {/* Exercise type label with emoji (AC: #2) */}
              <Text
                type="secondary"
                style={{ fontSize: 13, fontWeight: 500, textAlign: "center" }}
              >
                {EXERCISE_TYPE_LABELS[challenge.exercises[currentExercise].type] ?? ""}
              </Text>

              <Card>
                <ExerciseCard
                  exercise={challenge.exercises[currentExercise]}
                  onAnswer={answerExercise}
                  disabled={false}
                />
              </Card>
            </Flex>
          )}

          {state === "submitting" && <Spin size="large" />}

          {state === "results" && results && (
            <div style={{ width: "100%" }}>
              <ChallengeResults
                answers={results.answers}
                score={results.score}
                streak={streak}
                badges={badges}
                newBadges={results.newBadges}
                timeElapsedMs={timeElapsedMs}
              />
            </div>
          )}

          {state === "completed" && challenge && (
            <div style={{ width: "100%" }}>
              <CompletedState challenge={challenge} streak={streak} badges={badges} />
            </div>
          )}
        </Flex>
      </Flex>
    </Card>
  );
}
