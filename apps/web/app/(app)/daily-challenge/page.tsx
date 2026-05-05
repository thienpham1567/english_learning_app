"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { Alert, Skeleton, Button, Result } from "antd";
import {
  ReloadOutlined,
  LoadingOutlined,
  CheckOutlined,
  ForwardOutlined,
  FireOutlined,
} from "@ant-design/icons";

import { useDailyChallenge } from "@/hooks/useDailyChallenge";
import { ExerciseCard } from "@/app/(app)/daily-challenge/_components/ExerciseCard";
import { ChallengeResults } from "@/app/(app)/daily-challenge/_components/ChallengeResults";
import { CompletedState } from "@/app/(app)/daily-challenge/_components/CompletedState";
import { EXERCISE_TYPE_LABELS } from "@/app/(app)/daily-challenge/_components/constants";
import { ModuleHeader } from "@/components/shared/ModuleHeader";

// Live elapsed timer hook
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

function getTodayLabel(): string {
  return new Date().toLocaleDateString("vi-VN", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

/* ── Step Indicator — editorial numbered circles ── */
function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center" }}>
      {Array.from({ length: total }, (_, i) => {
        const isDone = i < current;
        const isActive = i === current;
        const isLast = i === total - 1;
        return (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              flex: isLast ? "none" : 1,
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: `1.5px solid ${
                  isDone
                    ? "var(--sage)"
                    : isActive
                    ? "var(--accent)"
                    : "var(--border)"
                }`,
                background: isDone
                  ? "rgba(74,124,111,.08)"
                  : isActive
                  ? "rgba(200,75,49,.06)"
                  : "transparent",
                flexShrink: 0,
                transition: "all 0.35s ease",
                boxShadow: isActive
                  ? "0 0 0 4px rgba(200,75,49,.08)"
                  : "none",
              }}
            >
              {isDone ? (
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 13 13"
                  fill="none"
                >
                  <path
                    d="M2.5 6.5l3 3 5-5"
                    stroke="var(--sage)"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              ) : (
                <span
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: 14,
                    fontWeight: isActive ? 700 : 300,
                    color: isActive ? "var(--accent)" : "var(--text-muted)",
                    lineHeight: 1,
                    letterSpacing: "-.02em",
                  }}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
              )}
            </div>

            {!isLast && (
              <div
                style={{
                  flex: 1,
                  height: 1,
                  background: isDone ? "var(--sage)" : "var(--border)",
                  transition: "background 0.35s ease",
                  opacity: isDone ? 0.6 : 1,
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

  const exerciseWrapperRef = useRef<HTMLDivElement>(null);
  const handleAnswer = useCallback(
    (answer: string) => {
      if (exerciseWrapperRef.current) {
        exerciseWrapperRef.current.classList.remove("answer-flash");
        void exerciseWrapperRef.current.offsetWidth;
        exerciseWrapperRef.current.classList.add("answer-flash");
      }
      answerExercise(answer);
    },
    [answerExercise],
  );

  const BEST_KEY = "daily-challenge-best";
  const [personalBest, setPersonalBest] = useState<string | null>(null);
  const [todayLabel, setTodayLabel] = useState("");

  useEffect(() => {
    try {
      const stored = localStorage.getItem(BEST_KEY);
      if (stored) setPersonalBest(stored);
    } catch { /* ignore */ }
    setTodayLabel(getTodayLabel());
  }, []);

  useEffect(() => {
    if (state !== "results" || !results || timeElapsedMs <= 0) return;
    const correctCount = results.answers.filter((a) => a.isCorrect).length;
    const total = results.answers.length;
    if (correctCount < total) return;
    const prevMs = personalBest ? parseInt(personalBest, 10) : Infinity;
    if (timeElapsedMs < prevMs) {
      localStorage.setItem(BEST_KEY, String(timeElapsedMs));
      setPersonalBest(String(timeElapsedMs));
    }
  }, [state, results, timeElapsedMs, personalBest]);

  const formattedTime = useElapsedTimer(state === "active");

  const exerciseTypeLabel =
    state === "active" && challenge
      ? (EXERCISE_TYPE_LABELS[challenge.exercises[currentExercise]?.type] ?? "")
      : "";

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        minHeight: 0,
        flex: 1,
        overflow: "hidden",
        background: "var(--bg)",
      }}
    >
      {/* ── Module Header ── */}
      <div style={{ padding: "16px 16px 0", flexShrink: 0 }}>
        <div style={{ maxWidth: 580, margin: "0 auto" }}>
          <ModuleHeader
            icon={<FireOutlined />}
            gradient="var(--gradient-daily)"
            title="Thử Thách Hôm Nay"
            badge={todayLabel}
            subtitle="Luyện tiếng Anh mỗi ngày · Xây dựng thói quen"
            action={
              (streak.currentStreak > 0 || state === "active") ? (
                <>
                  {streak.currentStreak > 0 && (
                    <span style={{
                      display: "inline-flex", alignItems: "center", gap: 5,
                      padding: "4px 12px", borderRadius: 999,
                      background: "rgba(255,255,255,0.15)",
                      border: "1px solid rgba(255,255,255,0.22)",
                      fontSize: 12, fontWeight: 700,
                      color: "rgba(255,255,255,0.9)",
                      fontFamily: "var(--font-body)",
                    }}>
                      🔥 {streak.currentStreak} ngày
                    </span>
                  )}
                  {state === "active" && (
                    <span style={{
                      display: "inline-flex", alignItems: "center",
                      padding: "4px 12px", borderRadius: 999,
                      background: "rgba(255,255,255,0.12)",
                      border: "1px solid rgba(255,255,255,0.18)",
                      fontSize: 12, fontWeight: 500,
                      color: "rgba(255,255,255,0.75)",
                      fontFamily: "var(--font-mono)",
                      letterSpacing: "0.04em",
                    }}>
                      ⏱ {formattedTime}
                    </span>
                  )}
                </>
              ) : undefined
            }
          />
        </div>
      </div>

      {/* ── Content ── */}
      <div
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: "auto",
          padding: "28px 16px 48px",
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
              style={{ borderRadius: 14, marginBottom: 20 }}
            />
          )}

          {/* Loading */}
          {state === "loading" && (
            <div
              className="anim-fade-in"
              style={{
                minHeight: 320,
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                padding: "24px 0",
              }}
            >
              <Skeleton active paragraph={{ rows: 5 }} />
            </div>
          )}

          {/* Error retry */}
          {state === "error" && (
            <div
              className="anim-fade-in"
              style={{
                minHeight: 300,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
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
                      background: "var(--accent)",
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

          {/* Active exercise */}
          {state === "active" && challenge && (
            <div
              className="anim-fade-up"
              style={{ display: "flex", flexDirection: "column", gap: 24 }}
            >
              {/* Step indicator row */}
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <StepIndicator
                  current={currentExercise}
                  total={challenge.exercises.length}
                />

                {/* Exercise type label */}
                {exerciseTypeLabel && (
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div
                      style={{
                        width: 4,
                        height: 4,
                        borderRadius: "50%",
                        background: "var(--accent)",
                        flexShrink: 0,
                      }}
                    />
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        letterSpacing: ".14em",
                        textTransform: "uppercase",
                        color: "var(--accent)",
                        fontFamily: "var(--font-body)",
                      }}
                    >
                      {exerciseTypeLabel}
                    </span>
                    <div
                      style={{
                        flex: 1,
                        height: 1,
                        background: "var(--border)",
                      }}
                    />
                    <span
                      style={{
                        fontSize: 11,
                        color: "var(--text-muted)",
                        fontFamily: "var(--font-mono)",
                      }}
                    >
                      {currentExercise + 1}/{challenge.exercises.length}
                    </span>
                  </div>
                )}
              </div>

              {/* Exercise card */}
              <div
                key={currentExercise}
                ref={exerciseWrapperRef}
                className="anim-fade-up"
                style={{
                  borderRadius: 20,
                  border: "1px solid var(--border)",
                  background: "var(--surface)",
                  padding: "28px 24px",
                  boxShadow: "var(--shadow-md)",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                {/* Thin editorial accent line */}
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 28,
                    width: 40,
                    height: 2,
                    background: "var(--accent)",
                    borderRadius: "0 0 2px 2px",
                  }}
                />
                <ExerciseCard
                  exercise={challenge.exercises[currentExercise]}
                  onAnswer={handleAnswer}
                  disabled={false}
                />
              </div>

              {/* Skip */}
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
                  fontSize: 12,
                  fontWeight: 500,
                  color: "var(--text-muted)",
                  padding: "6px 16px",
                  borderRadius: 999,
                  transition: "color .2s",
                  fontFamily: "var(--font-body)",
                  letterSpacing: ".02em",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "var(--error)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "var(--text-muted)";
                }}
              >
                <ForwardOutlined style={{ fontSize: 10 }} />
                Bỏ qua câu này
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
                gap: 14,
              }}
            >
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: "50%",
                  border: "1.5px solid var(--border)",
                  display: "grid",
                  placeItems: "center",
                }}
              >
                <CheckOutlined
                  style={{ fontSize: 22, color: "var(--sage, var(--success))" }}
                />
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  color: "var(--text-secondary)",
                  fontSize: 13,
                  fontFamily: "var(--font-body)",
                }}
              >
                <LoadingOutlined spin style={{ fontSize: 13 }} />
                Đang chấm điểm...
              </div>
            </div>
          )}

          {/* Results */}
          {state === "results" && results && (
            <ChallengeResults
              answers={results.answers}
              score={results.score}
              streak={streak}
              badges={badges}
              newBadges={results.newBadges}
              timeElapsedMs={timeElapsedMs}
            />
          )}

          {/* Completed (already done today) */}
          {state === "completed" && challenge && (
            <CompletedState
              challenge={challenge}
              streak={streak}
              badges={badges}
            />
          )}
        </div>
      </div>

      <style>{`
        @keyframes answerFlash {
          0%   { box-shadow: var(--shadow-md); }
          40%  { box-shadow: 0 0 0 6px color-mix(in srgb, var(--success) 20%, transparent);
                 border-color: var(--sage, var(--success)); }
          100% { box-shadow: var(--shadow-md); border-color: var(--border); }
        }
        .answer-flash { animation: answerFlash 0.55s ease-out; }
      `}</style>
    </div>
  );
}
