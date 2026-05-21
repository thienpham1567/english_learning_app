"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Tag } from "antd";
import { ClockCircleOutlined, HistoryOutlined } from "@ant-design/icons";

import { useGrammarQuiz } from "@/hooks/useGrammarQuiz";
import { useExamMode } from "@/components/shared/ExamModeProvider";
import { CEFRPath } from "@/app/(app)/grammar-quiz/_components/CEFRPath";
import { QuestionCard } from "@/app/(app)/grammar-quiz/_components/QuestionCard";
import { ScoreSummary } from "@/app/(app)/grammar-quiz/_components/ScoreSummary";
import { QuizHistory } from "@/app/(app)/grammar-quiz/_components/QuizHistory";

/**
 * Embedded Part 5 quiz inside the unified TOEIC Skills page.
 * Same logic as /grammar-quiz/page.tsx but without its own ModuleHeader.
 */
export function Part5Tab() {
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

  useEffect(() => {
    if (state === "active" && timedMode && questions.length > 0) {
      const total = questions.length * 30;
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

  useEffect(() => {
    if (timedMode && state === "active" && timeLeft === 0 && questions.length > 0) {
      nextQuestion();
    }
  }, [timeLeft, timedMode, state, questions.length, nextQuestion]);

  const formatTime = useCallback((s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`, []);

  return (
    <>
      <div style={{ maxWidth: 700, margin: "0 auto", width: "100%" }}>
        {/* Timer + History controls */}
        {state === "active" && (
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginBottom: 12 }}>
            {timedMode && (
              <Tag
                color={timeLeft <= 30 ? "error" : "default"}
                style={{
                  borderRadius: 99, margin: 0, fontSize: 12, fontWeight: 600,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                <ClockCircleOutlined style={{ marginRight: 4 }} />
                {formatTime(timeLeft)}
              </Tag>
            )}
            <button
              type="button"
              onClick={() => setHistoryOpen(true)}
              style={{
                width: 34, height: 34, borderRadius: 10,
                border: "1px solid var(--border)", background: "var(--surface)",
                color: "var(--text-secondary)", cursor: "pointer",
                display: "grid", placeItems: "center", fontSize: 15,
              }}
            >
              <HistoryOutlined />
            </button>
          </div>
        )}

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

      <QuizHistory open={historyOpen} onClose={() => setHistoryOpen(false)} />
    </>
  );
}
