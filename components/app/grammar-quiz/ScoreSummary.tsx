"use client";

import { motion } from "motion/react";
import { Trophy, RotateCcw, Sparkles, AlertTriangle } from "lucide-react";
import type { GrammarQuestion } from "@/lib/grammar-quiz/types";

type Props = {
  questions: GrammarQuestion[];
  answers: (number | null)[];
  score: number;
  topicBreakdown: Record<string, { correct: number; total: number }>;
  onRetry: () => void;
  onNewQuiz: () => void;
};

export function ScoreSummary({
  questions,
  answers,
  score,
  topicBreakdown,
  onRetry,
  onNewQuiz,
}: Props) {
  const total = questions.length;
  const pct = total > 0 ? Math.round((score / total) * 100) : 0;

  const emoji = pct >= 90 ? "🎉" : pct >= 70 ? "👏" : pct >= 50 ? "👍" : "💪";

  const weakTopics = Object.entries(topicBreakdown)
    .filter(([, v]) => v.correct / v.total < 0.5)
    .map(([topic]) => topic);

  return (
    <motion.div
      className="mx-auto flex max-w-lg flex-col items-center text-center"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
    >
      <motion.span
        className="text-6xl"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.1, type: "spring", stiffness: 200, damping: 12 }}
      >
        {emoji}
      </motion.span>

      <h2 className="mt-4 [font-family:var(--font-display)] text-3xl italic text-(--ink)">
        Kết quả
      </h2>

      {/* Score circle */}
      <motion.div
        className="mt-6 flex items-center justify-center gap-3"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <div className="grid size-20 place-items-center rounded-2xl bg-linear-to-br from-(--accent) to-amber-600 text-white shadow-lg">
          <div className="text-center">
            <div className="text-2xl font-bold">{score}/{total}</div>
            <div className="text-[10px] opacity-80">{pct}%</div>
          </div>
        </div>
      </motion.div>

      {/* Topic breakdown */}
      <motion.div
        className="mt-8 w-full space-y-2"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <p className="text-xs font-semibold uppercase tracking-widest text-(--text-muted)">
          Theo chủ đề ngữ pháp
        </p>
        {Object.entries(topicBreakdown).map(([topic, { correct, total: t }]) => {
          const isWeak = correct / t < 0.5;
          return (
            <div
              key={topic}
              className={`flex items-center justify-between rounded-lg border px-3 py-2 text-sm ${
                isWeak
                  ? "border-red-200 bg-red-50"
                  : "border-(--border) bg-(--surface)"
              }`}
            >
              <span className="flex items-center gap-2">
                {isWeak && <AlertTriangle size={12} className="text-red-500" />}
                <span className={isWeak ? "font-medium text-red-700" : "text-(--ink)"}>
                  {topic}
                </span>
              </span>
              <span className={`text-xs font-semibold ${isWeak ? "text-red-600" : "text-(--text-secondary)"}`}>
                {correct}/{t}
              </span>
            </div>
          );
        })}
      </motion.div>

      {/* Weak topics callout */}
      {weakTopics.length > 0 && (
        <motion.p
          className="mt-4 text-xs text-red-600"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          ⚠️ Chủ đề cần ôn lại: {weakTopics.join(", ")}
        </motion.p>
      )}

      {/* Buttons */}
      <motion.div
        className="mt-8 flex gap-3"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <button
          className="flex items-center gap-2 rounded-xl border border-(--border) bg-(--surface) px-5 py-2.5 text-sm font-medium text-(--text-secondary) shadow-(--shadow-sm) transition hover:border-(--accent)/40 hover:text-(--accent)"
          onClick={onRetry}
        >
          <RotateCcw size={14} />
          Làm lại
        </button>
        <button
          className="flex items-center gap-2 rounded-xl bg-linear-to-br from-(--accent) to-amber-600 px-5 py-2.5 text-sm font-semibold text-white shadow-(--shadow-sm) transition hover:opacity-90"
          onClick={onNewQuiz}
        >
          <Sparkles size={14} />
          Đề mới
        </button>
      </motion.div>
    </motion.div>
  );
}
