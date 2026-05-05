"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { Flex, Typography, Alert, Skeleton, Button, Result } from "antd";
import {
  ClockCircleOutlined,
  FireOutlined,
  ReloadOutlined,
  LoadingOutlined,
  ExclamationCircleOutlined,
  ThunderboltOutlined,
  ForwardOutlined,
  CheckOutlined,
} from "@ant-design/icons";
import { ModuleHeader } from "@/components/shared/ModuleHeader";

import { useDailyChallenge } from "@/hooks/useDailyChallenge";
import { ExerciseCard } from "@/app/(app)/daily-challenge/_components/ExerciseCard";
import { ChallengeResults } from "@/app/(app)/daily-challenge/_components/ChallengeResults";
import { CompletedState } from "@/app/(app)/daily-challenge/_components/CompletedState";
import { EXERCISE_TYPE_LABELS } from "@/app/(app)/daily-challenge/_components/constants";
import { StreakFire } from "@/components/shared";

const { Text } = Typography;

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

/* ── Step Indicator ── */
function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, width: "100%" }}>
      {Array.from({ length: total }, (_, i) => {
        const isDone = i < current;
        const isActive = i === current;
        return (
          <div
            key={i}
            style={{
              flex: 1,
              height: isActive ? 8 : 5,
              borderRadius: 99,
              background: isDone
                ? "var(--success)"
                : isActive
                ? "linear-gradient(90deg, var(--accent), var(--accent-hover))"
                : "var(--border)",
              transition: "all 0.35s cubic-bezier(0.4,0,0.2,1)",
              boxShadow: isActive ? "0 0 12px color-mix(in srgb, var(--accent) 40%, transparent)" : "none",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {isActive && (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)",
                  animation: "ctaShimmer 2s ease-in-out infinite",
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
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

  // Answer flash animation
  const exerciseWrapperRef = useRef<HTMLDivElement>(null);
  const handleAnswer = useCallback(
    (answer: string) => {
      // Flash the exercise wrapper
      if (exerciseWrapperRef.current) {
        exerciseWrapperRef.current.classList.remove("answer-flash");
        // Force reflow to restart animation
        void exerciseWrapperRef.current.offsetWidth;
        exerciseWrapperRef.current.classList.add("answer-flash");
      }
      answerExercise(answer);
    },
    [answerExercise],
  );

  // Personal best tracking via localStorage
  const BEST_KEY = "daily-challenge-best";
  const [personalBest, setPersonalBest] = useState<string | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(BEST_KEY);
      if (stored) setPersonalBest(stored);
    } catch { /* ignore */ }
  }, []);

  // Update personal best when results are in
  useEffect(() => {
    if (state !== "results" || !results || timeElapsedMs <= 0) return;
    const correctCount = results.answers.filter((a) => a.isCorrect).length;
    const total = results.answers.length;
    if (correctCount < total) return; // Only track perfect scores
    const timeStr = `${Math.floor(timeElapsedMs / 60000)}:${String(Math.floor((timeElapsedMs % 60000) / 1000)).padStart(2, "0")}`;
    const prevMs = personalBest ? parseInt(personalBest, 10) : Infinity;
    if (timeElapsedMs < prevMs) {
      localStorage.setItem(BEST_KEY, String(timeElapsedMs));
      setPersonalBest(String(timeElapsedMs));
    }
  }, [state, results, timeElapsedMs, personalBest]);

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
        gradient="var(--gradient-daily)"
        title="Thử thách hàng ngày"
        subtitle="Daily Challenge · 5 bài tập mỗi ngày"
        action={
          <Flex align="center" gap={12}>
            {state === "active" && (
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "4px 14px",
                  borderRadius: 999,
                  background: "rgba(255,255,255,0.12)",
                  backdropFilter: "blur(8px)",
                  fontSize: 13,
                  fontWeight: 600,
                  fontVariantNumeric: "tabular-nums",
                  color: "var(--text-on-accent)",
                }}
              >
                <ClockCircleOutlined style={{ fontSize: 12, opacity: 0.7 }} />
                {formattedTime}
              </div>
            )}
            {state !== "loading" && <StreakFire streak={streak.currentStreak} />}
          </Flex>
        }
      />

      {/* Content */}
      <div
        style={{
          flex: 1,
          minHeight: 0,
          overflow: "auto",
          padding: "24px 16px 40px",
        }}
      >
        <div style={{ width: "100%", maxWidth: 580, margin: "0 auto" }}>
          {/* Error banner */}
          {error && (
            <Alert
              className="anim-fade-in"
              type="error"
              showIcon
              message={error}
              style={{
                borderRadius: 16,
                marginBottom: 16,
              }}
            />
          )}

          {/* Loading state */}
          {state === "loading" && (
            <div
              className="anim-fade-in"
              style={{
                minHeight: 300,
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                padding: 24,
              }}
            >
              <Skeleton active paragraph={{ rows: 4 }} />
            </div>
          )}

          {/* Error retry state */}
          {state === "error" && (
            <div className="anim-fade-in" style={{ minHeight: 300, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Result
                status="error"
                title="Không thể tải thử thách"
                extra={
                  <Button
                    type="primary"
                    icon={<ReloadOutlined />}
                    onClick={() => window.location.reload()}
                    style={{
                      borderRadius: 12,
                      background: "linear-gradient(135deg, var(--accent), var(--accent-hover))",
                      border: "none",
                      fontWeight: 600,
                    }}
                  >
                    Thử lại
                  </Button>
                }
              />
            </div>
          )}

          {/* Active exercise state */}
          {state === "active" && challenge && (
            <div className="anim-fade-up" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {/* Step indicator + question counter */}
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "var(--accent)" }}>
                    Câu {currentExercise + 1} / {challenge.exercises.length}
                  </span>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      padding: "3px 12px",
                      borderRadius: 999,
                      background: "var(--accent-muted)",
                      color: "var(--accent)",
                    }}
                  >
                    {EXERCISE_TYPE_LABELS[challenge.exercises[currentExercise].type] ?? ""}
                  </span>
                </div>
                <StepIndicator current={currentExercise} total={challenge.exercises.length} />
              </div>

              {/* Exercise Card — glassmorphism wrapper */}
              <div
                key={currentExercise}
                ref={exerciseWrapperRef}
                className="anim-fade-up"
                style={{
                  borderRadius: 20,
                  border: "1px solid var(--border)",
                  background: "var(--surface)",
                  padding: "24px 20px",
                  boxShadow: "var(--shadow-md)",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                {/* Decorative top accent */}
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 3,
                    background: "linear-gradient(90deg, var(--accent), var(--accent-hover), var(--secondary))",
                  }}
                />
                <ExerciseCard
                  exercise={challenge.exercises[currentExercise]}
                  onAnswer={handleAnswer}
                  disabled={false}
                />
              </div>

              {/* Skip button */}
              <button
                type="button"
                onClick={() => answerExercise("")}
                style={{
                  alignSelf: "center",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: 500,
                  color: "var(--text-muted)",
                  padding: "8px 20px",
                  borderRadius: 999,
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "var(--error)";
                  e.currentTarget.style.background = "color-mix(in srgb, var(--error) 6%, transparent)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "var(--text-muted)";
                  e.currentTarget.style.background = "none";
                }}
              >
                <ForwardOutlined style={{ fontSize: 11 }} /> Bỏ qua câu này
              </button>
            </div>
          )}

          {/* Submitting */}
          {state === "submitting" && (
            <div
              className="anim-fade-in"
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                minHeight: 300,
                gap: 16,
              }}
            >
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 20,
                  background: "color-mix(in srgb, var(--success) 8%, transparent)",
                  display: "grid",
                  placeItems: "center",
                }}
              >
                <CheckOutlined style={{ fontSize: 28, color: "var(--success)" }} />
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  color: "var(--text-secondary)",
                  fontSize: 13,
                }}
              >
                <LoadingOutlined spin style={{ fontSize: 14 }} />
                Đang chấm điểm...
              </div>
            </div>
          )}

          {/* Results */}
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

          {/* Completed (already done today) */}
          {state === "completed" && challenge && (
            <div style={{ width: "100%" }}>
              <CompletedState challenge={challenge} streak={streak} badges={badges} />
            </div>
          )}
        </div>
      </div>

      {/* Answer flash animation */}
      <style>{`
        @keyframes answerFlash {
          0% { box-shadow: 0 0 0 0 color-mix(in srgb, var(--success) 40%, transparent); }
          50% { box-shadow: 0 0 0 12px color-mix(in srgb, var(--success) 0%, transparent); border-color: var(--success); }
          100% { box-shadow: var(--shadow-md); border-color: var(--border); }
        }
        .answer-flash {
          animation: answerFlash 0.5s ease-out;
        }
      `}</style>
    </div>
  );
}
