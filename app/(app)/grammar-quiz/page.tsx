"use client";

import { AnimatePresence, motion } from "motion/react";
import { BrainCircuit } from "lucide-react";

import { useGrammarQuiz } from "@/hooks/useGrammarQuiz";
import { LevelPicker } from "@/components/app/grammar-quiz/LevelPicker";
import { QuestionCard } from "@/components/app/grammar-quiz/QuestionCard";
import { ScoreSummary } from "@/components/app/grammar-quiz/ScoreSummary";

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
    topicBreakdown,
    error,
    selectLevel,
    generateQuiz,
    answerQuestion,
    nextQuestion,
    retryQuiz,
    newQuiz,
  } = useGrammarQuiz();

  return (
    <div className="relative flex h-full min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-(--border) bg-[linear-gradient(180deg,rgba(255,255,255,0.82),rgba(255,255,255,0.7))] shadow-(--shadow-md)">
      {/* Header */}
      <div className="flex shrink-0 items-center gap-3 border-b border-(--border) bg-white/60 px-6 py-4 backdrop-blur-sm">
        <div className="grid size-10 place-items-center rounded-xl bg-linear-to-br from-pink-500 to-rose-600 text-white shadow-(--shadow-sm)">
          <BrainCircuit size={20} strokeWidth={2} />
        </div>
        <div className="flex-1">
          <h2 className="text-[15px] font-semibold text-(--ink)">
            TOEIC Part 5 📝
          </h2>
          <p className="text-xs text-(--text-muted)">
            Incomplete Sentences · Luyện tập theo độ khó
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="relative min-h-0 flex-1 overflow-y-auto px-4 py-6 md:px-8">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 60% 40% at 50% 0%, rgba(236,72,153,0.06) 0%, transparent 70%)",
          }}
        />

        <div className="relative mx-auto flex min-h-full w-full max-w-2xl flex-col items-center justify-center">
          <AnimatePresence mode="wait">
            {(state === "idle" || state === "loading") && (
              <motion.div
                key="level-picker"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-full"
              >
                {error && (
                  <div className="mx-auto mb-4 max-w-md rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-center text-sm text-red-700">
                    {error}
                  </div>
                )}
                <LevelPicker
                  selected={level}
                  onSelect={selectLevel}
                  onStart={() => generateQuiz()}
                  isLoading={state === "loading"}
                />
              </motion.div>
            )}

            {state === "active" && currentQuestion && (
              <motion.div
                key={`q-${currentIndex}`}
                className="w-full"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.25 }}
              >
                <QuestionCard
                  question={currentQuestion}
                  questionNumber={currentIndex + 1}
                  total={questions.length}
                  selectedAnswer={selectedAnswer}
                  isRevealed={isRevealed}
                  onAnswer={answerQuestion}
                  onNext={nextQuestion}
                />
              </motion.div>
            )}

            {state === "summary" && (
              <motion.div
                key="summary"
                className="w-full"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <ScoreSummary
                  questions={questions}
                  answers={answers}
                  score={score}
                  topicBreakdown={topicBreakdown}
                  onRetry={retryQuiz}
                  onNewQuiz={newQuiz}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
