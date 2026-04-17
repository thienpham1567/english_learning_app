"use client";

import { useState } from "react";
import { BulbOutlined, HistoryOutlined } from "@ant-design/icons";

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
      <div
        style={{
          display: "flex",
          flexShrink: 0,
          alignItems: "center",
          gap: 12,
          borderBottom: "1px solid var(--border)",
          background: "var(--surface)",
          padding: "16px 24px",
        }}
      >
        <div
          style={{
            display: "grid",
            width: 40,
            height: 40,
            placeItems: "center",
            borderRadius: "var(--radius)",
            background: "linear-gradient(135deg, #ec4899, #e11d48)",
            color: "#fff",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <BulbOutlined style={{ fontSize: 20 }} />
        </div>
        <div style={{ flex: 1 }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, color: "var(--ink)", margin: 0 }}>
            TOEIC Part 5 📝
          </h2>
          <p style={{ fontSize: 12, color: "var(--text-muted)", margin: 0 }}>
            Incomplete Sentences · Luyện tập theo độ khó
          </p>
        </div>
        {/* History icon (AC: #4) */}
        <button
          type="button"
          onClick={() => setHistoryOpen(true)}
          title="Lịch sử làm bài"
          style={{
            display: "grid",
            width: 36,
            height: 36,
            placeItems: "center",
            borderRadius: "var(--radius)",
            border: "1px solid var(--border)",
            background: "var(--surface)",
            cursor: "pointer",
            color: "var(--text-secondary)",
            transition: "all 0.15s",
          }}
        >
          <HistoryOutlined style={{ fontSize: 16 }} />
        </button>
      </div>

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
              "radial-gradient(ellipse 60% 40% at 50% 0%, rgba(236,72,153,0.06) 0%, transparent 70%)",
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
                    border: "1px solid #fecaca",
                    background: "#fef2f2",
                    padding: "10px 16px",
                    textAlign: "center",
                    fontSize: 14,
                    color: "#b91c1c",
                  }}
                >
                  {error}
                </div>
              )}
              <CEFRPath
                selected={level}
                onSelect={selectLevel}
                onStart={() => generateQuiz(undefined, examMode)}
                isLoading={state === "loading"}
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
