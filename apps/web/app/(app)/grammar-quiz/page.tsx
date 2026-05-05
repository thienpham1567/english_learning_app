"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { BulbOutlined, HistoryOutlined, ClockCircleOutlined } from "@ant-design/icons";
import { Button, Tag } from "antd";
import { ModuleHeader } from "@/components/shared/ModuleHeader";

import { useGrammarQuiz } from "@/hooks/useGrammarQuiz";
import { useExamMode } from "@/components/shared/ExamModeProvider";
import { CEFRPath } from "@/app/(app)/grammar-quiz/_components/CEFRPath";
import { QuestionCard } from "@/app/(app)/grammar-quiz/_components/QuestionCard";
import { ScoreSummary } from "@/app/(app)/grammar-quiz/_components/ScoreSummary";
import { QuizHistory } from "@/app/(app)/grammar-quiz/_components/QuizHistory";

export default function GrammarQuizPage() {
  const {
    state,
    level,
    questions,
    currentIndex,
    currentQuestion,
    answers,
    selectedAnswer,
    isRevealed,
    score,
    combo,
    maxCombo,
    topicBreakdown,
    error,
    selectLevel,
    generateQuiz,
    answerQuestion,
    nextQuestion,
    retryQuiz,
    newQuiz,
  } = useGrammarQuiz();
  const { examMode } = useExamMode();
  const [historyOpen, setHistoryOpen] = useState(false);
  const [timedMode, setTimedMode] = useState(false);
  const [sourceMode, setSourceMode] = useState<"ai" | "ets">("ai");
  const [timeLeft, setTimeLeft] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Start timer when quiz becomes active
  useEffect(() => {
    if (state === "active" && timedMode && questions.length > 0) {
      const total = questions.length * 30; // 30s per question
      setTimeLeft(total);
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [state, timedMode, questions.length]);

  // Auto-submit when time runs out
  useEffect(() => {
    if (timedMode && state === "active" && timeLeft === 0 && questions.length > 0) {
      // Force navigation to end
      nextQuestion();
    }
  }, [timeLeft, timedMode, state, questions.length, nextQuestion]);

  const formatTime = useCallback((s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`, []);

  return (
    <>
    <div
      style={{
        position: "relative",
        display: "flex",
        height: "100%",
        minHeight: 0,
        flex: 1,
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <ModuleHeader
        icon={<BulbOutlined />}
        gradient="var(--gradient-grammar-quiz)"
        title="TOEIC Part 5"
        subtitle="Incomplete Sentences · Luyện tập theo độ khó"
        action={
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {state === "active" && timedMode && (
              <Tag
                color={timeLeft <= 30 ? "error" : "default"}
                style={{
                  borderRadius: 99, margin: 0, fontSize: 12, fontWeight: 600,
                  fontVariantNumeric: "tabular-nums",
                  background: "rgba(255,255,255,0.12)",
                  border: "1px solid rgba(255,255,255,0.2)",
                  color: timeLeft <= 30 ? "#ff4d4f" : "rgba(255,255,255,0.8)",
                }}
              >
                <ClockCircleOutlined style={{ marginRight: 4 }} />
                {formatTime(timeLeft)}
              </Tag>
            )}
            <Button
              type="text"
              icon={<HistoryOutlined style={{ fontSize: 16 }} />}
              onClick={() => setHistoryOpen(true)}
              title="Lịch sử làm bài"
              style={{
                width: 36, height: 36, borderRadius: 10,
                border: "1px solid rgba(255,255,255,0.2)",
                color: "rgba(255,255,255,0.8)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            />
          </div>
        }
      />

      {/* Content */}
      <div
        style={{
          position: "relative",
          minHeight: 0,
          flex: 1,
          overflowY: "auto",
          padding: "24px 16px",
        }}
      >
        <div
          style={{
            pointerEvents: "none",
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(ellipse 60% 40% at 50% 0%, color-mix(in srgb, var(--accent) 6%, transparent) 0%, transparent 70%)",
          }}
        />

        <div
          style={{
            position: "relative",
            margin: "0 auto",
            display: "flex",
            minHeight: "100%",
            width: "100%",
            maxWidth: 700,
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {(state === "idle" || state === "loading") && (
            <div className="anim-fade-in" style={{ width: "100%" }}>
              {error && (
                <div
                  style={{
                    margin: "0 auto 16px",
                    maxWidth: 480,
                    borderRadius: "var(--radius)",
                    border: "1px solid color-mix(in srgb, var(--error) 30%, transparent)",
                    background: "var(--error-bg)",
                    padding: "10px 16px",
                    textAlign: "center",
                    fontSize: 14,
                    color: "var(--error)",
                  }}
                >
                  {error}
                </div>
              )}
              <CEFRPath
                selected={level}
                onSelect={selectLevel}
                onStart={() => generateQuiz(undefined, examMode, sourceMode)}
                isLoading={state === "loading"}
                timedMode={timedMode}
                onTimedModeChange={setTimedMode}
                sourceMode={sourceMode}
                onSourceModeChange={setSourceMode}
              />
            </div>
          )}

          {state === "active" && currentQuestion && (
            <div key={`q-${currentIndex}`} className="anim-slide-in-left" style={{ width: "100%" }}>
              <QuestionCard
                question={currentQuestion}
                questionNumber={currentIndex + 1}
                total={questions.length}
                selectedAnswer={selectedAnswer}
                isRevealed={isRevealed}
                combo={combo}
                onAnswer={answerQuestion}
                onNext={nextQuestion}
              />
            </div>
          )}

          {state === "summary" && (
            <div className="anim-fade-in" style={{ width: "100%" }}>
              <ScoreSummary
                questions={questions}
                answers={answers}
                score={score}
                maxCombo={maxCombo}
                topicBreakdown={topicBreakdown}
                onRetry={retryQuiz}
                onNewQuiz={newQuiz}
              />
            </div>
          )}
        </div>
      </div>
    </div>

    {/* History drawer (AC: #4) */}
    <QuizHistory open={historyOpen} onClose={() => setHistoryOpen(false)} />
    </>
  );
}
