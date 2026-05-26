"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Clock, History } from "lucide-react";

import { useGrammarQuiz } from "@/hooks/useGrammarQuiz";
import { useExamMode } from "@/components/shared/ExamModeProvider";
import { CEFRPath } from "@/app/(app)/grammar-quiz/_components/CEFRPath";
import { QuestionCard } from "@/app/(app)/grammar-quiz/_components/QuestionCard";
import { ScoreSummary } from "@/app/(app)/grammar-quiz/_components/ScoreSummary";
import { QuizHistory } from "@/app/(app)/grammar-quiz/_components/QuizHistory";

/**
 * Embedded Part 5 quiz inside the unified TOEIC Skills page.
 * Same logic as /grammar-quiz/page.tsx but without its own page header.
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
      <div className="max-w-2xl mx-auto w-full">
        {/* Timer + History controls */}
        {state === "active" && (
          <div className="flex justify-end items-center gap-2 mb-3">
            {timedMode && (
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold tabular-nums border ${
                  timeLeft <= 30
                    ? "bg-red-950/20 border-red-900/30 text-red-400"
                    : "bg-slate-900/40 border-border text-slate-400"
                }`}
              >
                <Clock className="mr-1.5 h-3.5 w-3.5" />
                {formatTime(timeLeft)}
              </span>
            )}
            <button
              type="button"
              onClick={() => setHistoryOpen(true)}
              className="w-[34px] h-[34px] rounded-xl border-2 border-border bg-surface text-slate-450 hover:text-slate-200 transition-colors flex items-center justify-center cursor-pointer"
            >
              <History className="h-4 w-4" />
            </button>
          </div>
        )}

        {(state === "idle" || state === "loading") && (
          <div className="w-full animate-in fade-in duration-200">
            {error && (
              <div className="mx-auto mb-4 max-w-lg rounded-2xl border border-red-900/30 bg-red-950/20 p-3.5 text-center text-sm text-red-400">
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
          <div key={`q-${currentIndex}`} className="w-full animate-in fade-in slide-in-from-left-4 duration-200">
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
          <div className="w-full animate-in fade-in duration-200">
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
