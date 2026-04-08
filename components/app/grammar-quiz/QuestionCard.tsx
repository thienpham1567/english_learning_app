"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { Check, X } from "lucide-react";
import type { GrammarQuestion } from "@/lib/grammar-quiz/types";

const OPTION_LABELS = ["A", "B", "C", "D"] as const;

type Props = {
  question: GrammarQuestion;
  questionNumber: number;
  total: number;
  selectedAnswer: number | null;
  isRevealed: boolean;
  onAnswer: (index: number) => void;
  onNext: () => void;
};

export function QuestionCard({
  question,
  questionNumber,
  total,
  selectedAnswer,
  isRevealed,
  onAnswer,
  onNext,
}: Props) {
  const isLastQuestion = questionNumber === total;
  const [lang, setLang] = useState<"en" | "vi">("vi");

  return (
    <div className="mx-auto w-full max-w-xl">
      {/* Progress */}
      <div className="mb-4 flex items-center justify-between">
        <span className="text-xs font-medium text-(--text-muted)">
          Câu {questionNumber} / {total}
        </span>
        <span className="rounded-full bg-(--bg-deep) px-2.5 py-0.5 text-[11px] font-medium text-(--text-secondary)">
          {question.grammarTopic}
        </span>
      </div>

      {/* Stem */}
      <div className="rounded-2xl border border-(--border) bg-(--surface) p-6 shadow-(--shadow-sm)">
        <p className="text-base leading-relaxed text-(--ink)">
          {renderStem(question.stem)}
        </p>

        {/* Options */}
        <div className="mt-6 space-y-2.5">
          {question.options.map((option, i) => {
            const isSelected = selectedAnswer === i;
            const isCorrect = i === question.correctIndex;

            let optionStyle = "border-(--border) bg-(--surface) hover:border-(--accent)/40";
            if (isRevealed) {
              if (isCorrect) {
                optionStyle =
                  "border-emerald-400 bg-emerald-50 text-emerald-800";
              } else if (isSelected && !isCorrect) {
                optionStyle = "border-red-400 bg-red-50 text-red-800";
              } else {
                optionStyle = "border-(--border) bg-(--bg-deep) opacity-50";
              }
            } else if (isSelected) {
              optionStyle = "border-(--accent) bg-(--accent)/5";
            }

            return (
              <motion.button
                key={i}
                className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm transition ${optionStyle}`}
                onClick={() => onAnswer(i)}
                disabled={isRevealed}
                whileTap={isRevealed ? undefined : { scale: 0.98 }}
              >
                <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-(--bg-deep) text-xs font-bold text-(--text-secondary)">
                  {isRevealed && isCorrect ? (
                    <Check size={14} className="text-emerald-600" />
                  ) : isRevealed && isSelected && !isCorrect ? (
                    <X size={14} className="text-red-600" />
                  ) : (
                    OPTION_LABELS[i]
                  )}
                </span>
                <span className="flex-1">{option}</span>
              </motion.button>
            );
          })}
        </div>

        {/* Explanation with EN/VN toggle */}
        {isRevealed && (
          <motion.div
            className="mt-5 rounded-xl border border-amber-200 bg-amber-50/60 p-4"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-widest text-amber-700">
                Giải thích
              </p>
              {/* Lang toggle */}
              <div className="flex overflow-hidden rounded-md border border-amber-300">
                <button
                  className={`px-2.5 py-0.5 text-[11px] font-semibold transition-colors ${
                    lang === "vi"
                      ? "bg-amber-600 text-white"
                      : "bg-amber-50 text-amber-700 hover:bg-amber-100"
                  }`}
                  onClick={() => setLang("vi")}
                >
                  VN
                </button>
                <button
                  className={`px-2.5 py-0.5 text-[11px] font-semibold transition-colors ${
                    lang === "en"
                      ? "bg-amber-600 text-white"
                      : "bg-amber-50 text-amber-700 hover:bg-amber-100"
                  }`}
                  onClick={() => setLang("en")}
                >
                  EN
                </button>
              </div>
            </div>

            <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-amber-900">
              {lang === "en" ? question.explanationEn : question.explanationVi}
            </p>

            {/* Examples */}
            <div className="mt-3 space-y-1">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-amber-600">
                Ví dụ
              </p>
              {question.examples.map((ex, i) => (
                <p key={i} className="text-sm italic text-amber-800">
                  {i + 1}. {ex}
                </p>
              ))}
            </div>
          </motion.div>
        )}

        {/* Next button */}
        {isRevealed && (
          <motion.button
            className="mt-4 w-full rounded-xl bg-linear-to-br from-(--accent) to-amber-600 py-3 text-sm font-semibold text-white shadow-(--shadow-sm) transition hover:opacity-90"
            onClick={onNext}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            {isLastQuestion ? "Xem kết quả" : "Tiếp theo →"}
          </motion.button>
        )}
      </div>
    </div>
  );
}

/** Renders stem with blank highlighted */
function renderStem(stem: string) {
  const parts = stem.split("_____");
  if (parts.length < 2) return stem;

  return (
    <>
      {parts[0]}
      <span className="inline-block rounded bg-(--accent)/10 px-2 py-0.5 font-semibold text-(--accent)">
        _____
      </span>
      {parts[1]}
    </>
  );
}
