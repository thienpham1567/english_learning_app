"use client";

import { useEffect, useState } from "react";
import { Button, Card, Flex, Result, Spin, Typography } from "antd";
import { ClockCircleOutlined, FireOutlined, ReloadOutlined } from "@ant-design/icons";
import { ModuleHeader } from "@/components/shared/ModuleHeader";

import { useDailyChallenge } from "@/hooks/useDailyChallenge";
import { ExerciseCard } from "@/app/(app)/daily-challenge/_components/ExerciseCard";
import { ChallengeResults } from "@/app/(app)/daily-challenge/_components/ChallengeResults";
import { CompletedState } from "@/app/(app)/daily-challenge/_components/CompletedState";
import { EXERCISE_TYPE_LABELS } from "@/app/(app)/daily-challenge/_components/constants";
import { ProgressSegments, StreakFire } from "@/components/shared";

const { Title, Text } = Typography;



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
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        minHeight: 0,
        flex: 1,
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <ModuleHeader
        icon={<FireOutlined />}
        gradient="linear-gradient(135deg, var(--accent), var(--secondary))"
        title="Thử thách mỗi ngày 🔥"
        subtitle="Daily Challenge · 5 bài tập mỗi ngày"
        action={
          <Flex align="center" gap={12}>
            {state === "active" && (
              <Text type="secondary" style={{ fontSize: 13, fontVariantNumeric: "tabular-nums" }}>
                <ClockCircleOutlined style={{ marginRight: 4 }} />
                {formattedTime}
              </Text>
            )}
            {state !== "loading" && <StreakFire streak={streak.currentStreak} />}
          </Flex>
        }
      />

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

              {/* Skip button */}
              <button
                type="button"
                onClick={() => answerExercise("")}
                style={{
                  alignSelf: "center",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: 500,
                  color: "var(--text-muted)",
                  padding: "6px 16px",
                  borderRadius: 999,
                  transition: "color 0.15s, background 0.15s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "var(--error)";
                  e.currentTarget.style.background = "var(--error-bg)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "var(--text-muted)";
                  e.currentTarget.style.background = "none";
                }}
              >
                Bỏ qua câu này →
              </button>
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
    </div>
  );
}
