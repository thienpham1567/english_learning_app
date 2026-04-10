"use client";

import { Button, Card, Flex, Result, Spin, Typography } from "antd";
import { FireOutlined, ReloadOutlined } from "@ant-design/icons";

import { useDailyChallenge } from "@/hooks/useDailyChallenge";
import { ExerciseCard } from "@/components/app/daily-challenge/ExerciseCard";
import { ChallengeResults } from "@/components/app/daily-challenge/ChallengeResults";
import { CompletedState } from "@/components/app/daily-challenge/CompletedState";
import { StreakDisplay } from "@/components/app/daily-challenge/StreakDisplay";

const { Title, Text } = Typography;

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
        {state !== "loading" && (
          <StreakDisplay currentStreak={streak.currentStreak} bestStreak={streak.bestStreak} />
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

          {state === "loading" && <Spin size="large" tip="Đang tải thử thách..." />}

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
              {/* Progress dots */}
              <Flex justify="center" gap={8}>
                {challenge.exercises.map((_, i) => (
                  <div
                    key={i}
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      transition: "all 0.2s",
                      background:
                        i < currentExercise
                          ? "#10b981"
                          : i === currentExercise
                            ? "var(--accent)"
                            : "var(--border)",
                      boxShadow: i === currentExercise ? "0 0 0 3px var(--accent-muted)" : "none",
                    }}
                  />
                ))}
              </Flex>

              <Card>
                <ExerciseCard
                  exercise={challenge.exercises[currentExercise]}
                  onAnswer={answerExercise}
                  disabled={false}
                />
              </Card>
            </Flex>
          )}

          {state === "submitting" && <Spin size="large" tip="Đang chấm bài..." />}

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
