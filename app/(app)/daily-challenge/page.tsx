"use client";

import { AnimatePresence, motion } from "motion/react";
import { Flame, RefreshCw } from "lucide-react";

import { useDailyChallenge } from "@/hooks/useDailyChallenge";
import { ExerciseCard } from "@/components/app/daily-challenge/ExerciseCard";
import { ChallengeResults } from "@/components/app/daily-challenge/ChallengeResults";
import { CompletedState } from "@/components/app/daily-challenge/CompletedState";
import { StreakDisplay } from "@/components/app/daily-challenge/StreakDisplay";

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
    <div className="relative flex h-full min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-(--border) bg-[linear-gradient(180deg,rgba(255,255,255,0.82),rgba(255,255,255,0.7))] shadow-(--shadow-md)">
      {/* Header */}
      <div className="flex shrink-0 items-center gap-3 border-b border-(--border) bg-white/60 px-6 py-4 backdrop-blur-sm">
        <div className="grid size-10 place-items-center rounded-xl bg-linear-to-br from-amber-500 to-orange-600 text-white shadow-(--shadow-sm)">
          <Flame size={20} strokeWidth={2} />
        </div>
        <div className="flex-1">
          <h2 className="text-[15px] font-semibold text-(--ink)">
            Thử thách mỗi ngày 🔥
          </h2>
          <p className="text-xs text-(--text-muted)">
            Daily Challenge · 5 bài tập mỗi ngày
          </p>
        </div>
        {state !== "loading" && (
          <StreakDisplay currentStreak={streak.currentStreak} bestStreak={streak.bestStreak} />
        )}
      </div>

      {/* Content */}
      <div className="relative min-h-0 flex-1 overflow-y-auto px-4 py-6 md:px-8">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 60% 40% at 50% 0%, rgba(251,146,60,0.06) 0%, transparent 70%)",
          }}
        />

        <div className="relative mx-auto flex min-h-full w-full max-w-xl flex-col items-center justify-center">
          {error && (
            <div className="mx-auto mb-4 max-w-md rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-center text-sm text-red-700">
              {error}
            </div>
          )}

          <AnimatePresence mode="wait">
            {state === "loading" && (
              <motion.div
                key="loading"
                className="flex flex-col items-center gap-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="flex gap-1.5">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      className="size-2.5 rounded-full bg-amber-500"
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.2 }}
                    />
                  ))}
                </div>
                <p className="text-sm text-(--text-muted)">Đang tải thử thách...</p>
              </motion.div>
            )}

            {state === "error" && (
              <motion.div
                key="error"
                className="flex flex-col items-center gap-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <button
                  onClick={() => window.location.reload()}
                  className="flex items-center gap-2 rounded-lg bg-(--accent) px-4 py-2 text-sm font-medium text-white"
                >
                  <RefreshCw size={14} />
                  Thử lại
                </button>
              </motion.div>
            )}

            {state === "active" && challenge && (
              <motion.div
                key={`ex-${currentExercise}`}
                className="w-full"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.25 }}
              >
                {/* Progress dots */}
                <div className="mb-4 flex items-center justify-center gap-2">
                  {challenge.exercises.map((_, i) => (
                    <div
                      key={i}
                      className={`size-2.5 rounded-full transition ${
                        i < currentExercise
                          ? "bg-emerald-500"
                          : i === currentExercise
                            ? "bg-(--accent) ring-2 ring-(--accent)/30"
                            : "bg-(--border)"
                      }`}
                    />
                  ))}
                </div>

                <div className="rounded-2xl border border-(--border) bg-(--surface) p-6 shadow-(--shadow-sm)">
                  <ExerciseCard
                    exercise={challenge.exercises[currentExercise]}
                    onAnswer={answerExercise}
                    disabled={false}
                  />
                </div>
              </motion.div>
            )}

            {state === "submitting" && (
              <motion.div
                key="submitting"
                className="flex flex-col items-center gap-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="flex gap-1.5">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      className="size-2.5 rounded-full bg-amber-500"
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.2 }}
                    />
                  ))}
                </div>
                <p className="text-sm text-(--text-muted)">Đang chấm bài...</p>
              </motion.div>
            )}

            {state === "results" && results && (
              <motion.div
                key="results"
                className="w-full"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <ChallengeResults
                  answers={results.answers}
                  score={results.score}
                  streak={streak}
                  badges={badges}
                  newBadges={results.newBadges}
                  timeElapsedMs={timeElapsedMs}
                />
              </motion.div>
            )}

            {state === "completed" && challenge && (
              <motion.div
                key="completed"
                className="w-full"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <CompletedState challenge={challenge} streak={streak} badges={badges} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
