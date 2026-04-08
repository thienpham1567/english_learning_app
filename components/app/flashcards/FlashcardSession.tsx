"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Layers, RefreshCw, WifiOff } from "lucide-react";

import { useFlashcardSession } from "@/hooks/useFlashcardSession";
import { FlashcardCard } from "@/components/app/flashcards/FlashcardCard";
import { SessionProgress } from "@/components/app/flashcards/SessionProgress";
import { SessionSummary } from "@/components/app/flashcards/SessionSummary";
import { EmptyState } from "@/components/app/flashcards/EmptyState";

export function FlashcardSession() {
  const {
    state,
    currentCard,
    currentIndex,
    totalDue,
    stats,
    isSubmitting,
    nextReviewAt,
    fetchDueCards,
    submitReview,
    restart,
  } = useFlashcardSession();

  useEffect(() => {
    fetchDueCards();
  }, [fetchDueCards]);

  return (
    <div className="relative flex h-full min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-(--border) bg-[linear-gradient(180deg,rgba(255,255,255,0.82),rgba(255,255,255,0.7))] shadow-(--shadow-md)">
      {/* Header */}
      <div className="flex shrink-0 items-center gap-3 border-b border-(--border) bg-white/60 px-6 py-4 backdrop-blur-sm">
        <div className="grid size-10 place-items-center rounded-xl bg-linear-to-br from-violet-500 to-indigo-600 text-white shadow-(--shadow-sm)">
          <Layers size={20} strokeWidth={2} />
        </div>
        <div className="flex-1">
          <h2 className="text-[15px] font-semibold text-(--ink)">
            Ôn tập từ vựng 🧠
          </h2>
          <p className="text-xs text-(--text-muted)">
            Spaced Repetition · Ghi nhớ lâu dài
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="relative min-h-0 flex-1 overflow-y-auto px-4 py-6 md:px-8">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 60% 40% at 50% 0%, rgba(139,92,246,0.06) 0%, transparent 70%)",
          }}
        />

        <div className="relative mx-auto flex min-h-full w-full max-w-2xl flex-col items-center justify-center">
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
                      className="size-2.5 rounded-full bg-(--accent)"
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{
                        duration: 1.4,
                        repeat: Infinity,
                        delay: i * 0.2,
                      }}
                    />
                  ))}
                </div>
                <p className="text-sm text-(--text-muted)">
                  Đang tải thẻ ôn tập...
                </p>
              </motion.div>
            )}

            {state === "error" && (
              <motion.div
                key="error"
                className="flex flex-col items-center gap-4 text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="grid size-16 place-items-center rounded-2xl bg-red-50 text-red-500">
                  <WifiOff size={28} strokeWidth={1.8} />
                </div>
                <h3 className="text-lg font-semibold text-(--ink)">
                  Không thể tải thẻ ôn tập
                </h3>
                <p className="text-sm text-(--text-muted)">
                  Kiểm tra kết nối mạng và thử lại.
                </p>
                <button
                  onClick={restart}
                  className="mt-2 flex items-center gap-2 rounded-lg bg-(--accent) px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
                >
                  <RefreshCw size={14} />
                  Thử lại
                </button>
              </motion.div>
            )}

            {state === "empty" && (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <EmptyState nextReviewAt={nextReviewAt} />
              </motion.div>
            )}

            {state === "active" && currentCard && (
              <motion.div
                key={`card-${currentIndex}`}
                className="w-full"
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -40 }}
                transition={{ duration: 0.3 }}
              >
                <SessionProgress
                  current={currentIndex + 1}
                  total={totalDue}
                />
                <FlashcardCard
                  card={currentCard}
                  onRate={submitReview}
                  isSubmitting={isSubmitting}
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
                <SessionSummary
                  totalReviewed={stats.totalReviewed}
                  averageQuality={
                    stats.totalReviewed > 0
                      ? stats.totalQuality / stats.totalReviewed
                      : 0
                  }
                  forgottenCount={stats.forgottenCount}
                  onRestart={restart}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
