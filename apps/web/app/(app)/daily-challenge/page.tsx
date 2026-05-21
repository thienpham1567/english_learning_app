"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { Alert, Skeleton, Button, Result, Flex, Typography } from "antd";
import {
  ReloadOutlined,
  LoadingOutlined,
  CheckOutlined,
  ForwardOutlined,
  FireOutlined,
  ThunderboltOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";

import { useDailyChallenge } from "@/hooks/useDailyChallenge";
import { useBonusChallenge } from "@/hooks/useBonusChallenge";
import { ExerciseCard } from "@/app/(app)/daily-challenge/_components/ExerciseCard";
import { ChallengeResults } from "@/app/(app)/daily-challenge/_components/ChallengeResults";
import { CompletedState } from "@/app/(app)/daily-challenge/_components/CompletedState";
import { EXERCISE_TYPE_LABELS } from "@/app/(app)/daily-challenge/_components/constants";
import { ModuleHeader } from "@/components/shared/ModuleHeader";
import * as m from "motion/react-client";
import { AnimatePresence } from "motion/react";

const { Text } = Typography;

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

/* ── Modern Step Indicator ── */
function StepIndicator({ current, total, isBonus }: { current: number; total: number; isBonus?: boolean }) {
  const activeColor = isBonus ? "var(--xp)" : "var(--accent)";
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {/* Progress Track */}
      <div
        style={{
          height: 6,
          background: "var(--border)",
          borderRadius: 99,
          position: "relative",
          overflow: "hidden",
        }}
      >
        <m.div
          initial={{ width: 0 }}
          animate={{ width: `${((current) / total) * 100}%` }}
          transition={{ type: "spring", stiffness: 80, damping: 15 }}
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            background: `linear-gradient(90deg, ${activeColor}, color-mix(in srgb, ${activeColor} 80%, var(--xp)))`,
            borderRadius: 99,
            boxShadow: `0 0 8px ${activeColor}`,
          }}
        />
      </div>

      {/* Dots & Labels */}
      <div style={{ display: "flex", justifySelf: "stretch", justifyContent: "space-between", alignItems: "center" }}>
        <Text style={{ fontSize: 12, fontWeight: 700, color: "var(--text-secondary)" }}>
          Tiến độ bài học
        </Text>
        <Text style={{ fontSize: 13, fontWeight: 800, color: activeColor, fontFamily: "var(--font-mono)" }}>
          {current + 1} / {total} câu
        </Text>
      </div>
    </div>
  );
}

/* ── Shared Exercise Flow — used by both daily & bonus ── */
function ExerciseFlow({
  challenge,
  currentExercise,
  onAnswer,
  onSkip,
  formattedTime,
  isBonus,
}: {
  challenge: { exercises: { type: string; data: unknown; instruction: string }[] };
  currentExercise: number;
  onAnswer: (answer: string) => void;
  onSkip: () => void;
  formattedTime: string;
  isBonus?: boolean;
}) {
  const exerciseWrapperRef = useRef<HTMLDivElement>(null);

  const handleAnswer = useCallback(
    (answer: string) => {
      if (exerciseWrapperRef.current) {
        exerciseWrapperRef.current.classList.remove("answer-flash");
        void exerciseWrapperRef.current.offsetWidth;
        exerciseWrapperRef.current.classList.add("answer-flash");
      }
      onAnswer(answer);
    },
    [onAnswer],
  );

  const exerciseTypeLabel =
    EXERCISE_TYPE_LABELS[challenge.exercises[currentExercise]?.type] ?? "";

  const activeColor = isBonus ? "var(--xp)" : "var(--accent)";

  return (
    <m.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.25 }}
      style={{ display: "flex", flexDirection: "column", gap: 20 }}
    >
      {/* Bonus label */}
      {isBonus && (
        <m.div
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "6px 14px",
            borderRadius: 99,
            background: "linear-gradient(135deg, var(--xp), #d97706)",
            border: "1px solid rgba(255,255,255,0.2)",
            alignSelf: "flex-start",
            boxShadow: "0 4px 10px rgba(217, 119, 6, 0.3)",
          }}
        >
          <ThunderboltOutlined style={{ fontSize: 12, color: "#fff" }} />
          <span
            style={{
              fontSize: 10,
              fontWeight: 800,
              color: "#fff",
              letterSpacing: ".08em",
            }}
          >
            VÒNG THỬ THÁCH BONUS
          </span>
        </m.div>
      )}

      {/* Step indicator row */}
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <StepIndicator
          current={currentExercise}
          total={challenge.exercises.length}
          isBonus={isBonus}
        />

        {/* Exercise type label */}
        {exerciseTypeLabel && (
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span
              style={{
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: ".08em",
                textTransform: "uppercase",
                color: activeColor,
                fontFamily: "var(--font-body)",
                background: isBonus ? "rgba(245,158,11,0.12)" : "var(--accent-light)",
                padding: "2px 10px",
                borderRadius: 8,
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
          </div>
        )}
      </div>

      {/* Exercise card */}
      <AnimatePresence mode="wait">
        <m.div
          key={currentExercise}
          ref={exerciseWrapperRef}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.25 }}
          style={{
            borderRadius: "var(--radius-xl)",
            border: `1px solid var(--border)`,
            background: "var(--surface)",
            padding: "28px 24px",
            boxShadow: "var(--shadow-lg)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Top glowing bar */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: 4,
              background: `linear-gradient(90deg, ${activeColor}, var(--xp))`,
            }}
          />
          <ExerciseCard
            exercise={challenge.exercises[currentExercise] as any}
            onAnswer={handleAnswer}
            disabled={false}
          />
        </m.div>
      </AnimatePresence>

      {/* Skip */}
      <m.button
        whileHover={{ scale: 1.05, y: 1 }}
        whileTap={{ scale: 0.95 }}
        type="button"
        onClick={onSkip}
        style={{
          alignSelf: "center",
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          background: "var(--surface-alt)",
          border: "1px solid var(--border)",
          cursor: "pointer",
          fontSize: 12,
          fontWeight: 600,
          color: "var(--text-secondary)",
          padding: "8px 20px",
          borderRadius: 99,
          boxShadow: "var(--shadow-sm)",
          transition: "all 0.2s",
          fontFamily: "var(--font-body)",
        }}
      >
        <ForwardOutlined style={{ fontSize: 11 }} />
        Bỏ qua câu hỏi này
      </m.button>
    </m.div>
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

  const bonus = useBonusChallenge();

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

  const isInBonusFlow = bonus.state === "active" || bonus.state === "submitting" || bonus.state === "results";
  const formattedTime = useElapsedTimer(state === "active" || bonus.state === "active");

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        minHeight: 0,
        flex: 1,
        overflow: "hidden",
        background: "var(--bg-deep)",
      }}
    >
      {/* ── Module Header ── */}
      <div style={{ padding: "20px 20px 0", flexShrink: 0 }}>
        <div style={{ maxWidth: 640, margin: "0 auto" }}>
          <ModuleHeader
            icon={<FireOutlined style={{ color: "#fff" }} />}
            gradient={isInBonusFlow ? "linear-gradient(135deg, var(--xp), #d97706)" : "linear-gradient(135deg, #ea580c, #f97316)"}
            title={isInBonusFlow ? "Bonus Round" : "Thử Thách Mỗi Ngày"}
            badge={isInBonusFlow ? "⚡ Bonus" : todayLabel}
            subtitle={isInBonusFlow ? "Nhận thêm XP · Rèn luyện phản xạ ngôn ngữ" : "Rèn luyện tiếng Anh hàng ngày để tạo thói quen học tập bền vững"}
            action={
              (streak.currentStreak > 0 || state === "active" || bonus.state === "active") ? (
                <Flex gap={8} align="center">
                  {streak.currentStreak > 0 && (
                    <span style={{
                      display: "inline-flex", alignItems: "center", gap: 6,
                      padding: "6px 14px", borderRadius: 99,
                      background: "rgba(255,255,255,0.2)",
                      border: "1px solid rgba(255,255,255,0.25)",
                      fontSize: 12, fontWeight: 800,
                      color: "#fff",
                      textShadow: "0 1px 2px rgba(0,0,0,0.15)",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                    }}>
                      🔥 {streak.currentStreak} ngày
                    </span>
                  )}
                  {(state === "active" || bonus.state === "active") && (
                    <span style={{
                      display: "inline-flex", alignItems: "center", gap: 5,
                      padding: "6px 14px", borderRadius: 99,
                      background: "rgba(0,0,0,0.25)",
                      border: "1px solid rgba(255,255,255,0.15)",
                      fontSize: 12, fontWeight: 700,
                      color: "#fff",
                      fontFamily: "var(--font-mono)",
                    }}>
                      <ClockCircleOutlined /> {formattedTime}
                    </span>
                  )}
                </Flex>
              ) : undefined
            }
          />
        </div>
      </div>

      {/* ── Content Area ── */}
      <div
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: "auto",
          padding: "24px 20px 48px",
        }}
      >
        <div style={{ width: "100%", maxWidth: 640, margin: "0 auto" }}>

          {/* Error banner */}
          {(error || bonus.error) && (
            <Alert
              className="anim-fade-in"
              type="error"
              showIcon
              message={error || bonus.error}
              style={{ borderRadius: "var(--radius-lg)", marginBottom: 20, boxShadow: "var(--shadow-sm)" }}
            />
          )}

          {/* ── BONUS FLOW ── */}
          {bonus.state === "active" && bonus.challenge && (
            <ExerciseFlow
              challenge={bonus.challenge}
              currentExercise={bonus.currentExercise}
              onAnswer={bonus.answerExercise}
              onSkip={() => bonus.answerExercise("")}
              formattedTime={formattedTime}
              isBonus
            />
          )}

          {bonus.state === "submitting" && (
            <div
              className="anim-fade-in"
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                minHeight: 320,
                gap: 16,
              }}
            >
              <m.div
                animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
                style={{ width: 64, height: 64, borderRadius: "50%", border: "2px solid var(--xp)", display: "grid", placeItems: "center", background: "var(--surface)" }}
              >
                <CheckOutlined style={{ fontSize: 24, color: "var(--xp)" }} />
              </m.div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--text-secondary)", fontSize: 14, fontWeight: 600 }}>
                <LoadingOutlined spin />
                Đang chấm điểm câu hỏi phụ...
              </div>
            </div>
          )}

          {bonus.state === "results" && bonus.results && (
            <ChallengeResults
              answers={bonus.results.answers}
              score={bonus.results.score}
              streak={streak}
              badges={badges}
              newBadges={[]}
              timeElapsedMs={bonus.timeElapsedMs}
            />
          )}

          {/* ── DAILY FLOW (only show when not in bonus) ── */}
          {!isInBonusFlow && (
            <>
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
                  <Skeleton active paragraph={{ rows: 6 }} round />
                </div>
              )}

              {/* Error retry */}
              {state === "error" && (
                <div
                  className="anim-fade-in"
                  style={{
                    minHeight: 320,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "var(--surface)",
                    borderRadius: "var(--radius-xl)",
                    border: "1px solid var(--border)",
                    boxShadow: "var(--shadow-md)",
                  }}
                >
                  <Result
                    status="error"
                    title="Không thể tải thử thách hôm nay"
                    subTitle="Vui lòng kiểm tra lại kết nối mạng hoặc thử lại sau."
                    extra={
                      <Button
                        type="primary"
                        icon={<ReloadOutlined />}
                        onClick={() => window.location.reload()}
                        style={{
                          borderRadius: 12,
                          background: "var(--accent)",
                          border: "none",
                          fontWeight: 700,
                          height: 40,
                          padding: "0 24px",
                        }}
                      >
                        Thử tải lại trang
                      </Button>
                    }
                  />
                </div>
              )}

              {/* Active exercise */}
              {state === "active" && challenge && (
                <ExerciseFlow
                  challenge={challenge}
                  currentExercise={currentExercise}
                  onAnswer={answerExercise}
                  onSkip={() => answerExercise("")}
                  formattedTime={formattedTime}
                />
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
                    minHeight: 320,
                    gap: 16,
                  }}
                >
                  <m.div
                    animate={{ scale: [1, 1.08, 1] }}
                    transition={{ repeat: Infinity, duration: 1.2 }}
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: "50%",
                      border: "2px solid var(--accent)",
                      display: "grid",
                      placeItems: "center",
                      background: "var(--surface)",
                      boxShadow: "0 4px 12px var(--accent-muted)",
                    }}
                  >
                    <CheckOutlined
                      style={{ fontSize: 24, color: "var(--accent)" }}
                    />
                  </m.div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      color: "var(--text-secondary)",
                      fontSize: 14,
                      fontWeight: 600,
                      fontFamily: "var(--font-body)",
                    }}
                  >
                    <LoadingOutlined spin />
                    Hệ thống đang kiểm tra câu trả lời...
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
                  onStartBonus={bonus.startBonus}
                  bonusState={bonus.state}
                />
              )}
            </>
          )}
        </div>
      </div>

      <style>{`
        @keyframes answerFlash {
          0%   { box-shadow: var(--shadow-lg); }
          45%  { box-shadow: 0 0 0 8px color-mix(in srgb, var(--success) 22%, transparent);
                 border-color: var(--success); }
          100% { box-shadow: var(--shadow-lg); border-color: var(--border); }
        }
        .answer-flash { animation: answerFlash 0.55s ease-out; }
      `}</style>
    </div>
  );
}
