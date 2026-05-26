"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Loader2,
  Lightbulb,
  CheckCircle,
  XCircle,
  Trophy,
  RefreshCw,
} from "lucide-react";
import * as m from "motion/react-client";
import { AnimatePresence } from "motion/react";
import { useErrorSRS } from "../_hooks/useErrorSRS";
import { SRS_GRADE_OPTIONS, MODULE_LABELS, MODULE_ICONS } from "../_types/types";
import type { SRSGrade } from "../_types/types";
import { DeepExplanation } from "./DeepExplanation";

export function ReviewTab() {
  const srs = useErrorSRS();
  const [showAnswer, setShowAnswer] = useState(false);
  const [flipped, setFlipped] = useState(false);

  useEffect(() => {
    srs.fetchQueue();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reset flip on new card
  useEffect(() => {
    setShowAnswer(false);
    setFlipped(false);
  }, [srs.currentIndex]);

  const handleReveal = useCallback(() => {
    setShowAnswer(true);
    setFlipped(true);
  }, []);

  const handleGrade = useCallback(async (grade: SRSGrade) => {
    await srs.gradeAndNext(grade);
  }, [srs]);

  /* ── Loading ── */
  if (srs.loading) {
    return (
      <div className="py-16 text-center">
        <Loader2 className="h-7 w-7 text-accent animate-mx-auto mb-3" />
        <div className="text-sm font-semibold text-text-primary">
          Đang tải hàng đợi ôn tập...
        </div>
      </div>
    );
  }

  /* ── Empty queue ── */
  if (srs.queue.length === 0 && !srs.loading) {
    return (
      <m.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="py-16 px-6 text-center bg-surface rounded-xl border border-border"
      >
        <div className="text-5xl mb-4">🎉</div>
        <h4 className="text-lg font-extrabold text-text-primary m-0 mb-2">
          Không có lỗi cần ôn tập!
        </h4>
        <span className="text-text-muted block max-w-[360px] mx-auto text-sm">
          Bạn đã ôn hết tất cả. Hãy tiếp tục làm bài tập để có thêm lỗi sai cần ghi nhớ.
        </span>
        <m.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={srs.fetchQueue}
          className="mt-5 inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl border border-border bg-surface-alt text-text-secondary text-[13px] font-bold cursor-pointer font-body"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Kiểm tra lại
        </m.button>
      </m.div>
    );
  }

  /* ── Session complete ── */
  if (srs.isComplete) {
    const pct = srs.reviewed > 0 ? Math.round((srs.correct / srs.reviewed) * 100) : 0;
    return (
      <m.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="py-10 px-6 text-center bg-surface rounded-xl border border-border"
      >
        <Trophy className={`h-10 w-10 mx-auto mb-3 ${pct >= 80 ? "text-(--success)" : "text-accent"}`} />
        <h3 className="text-xl font-black text-text-primary m-0 mb-1">
          Hoàn thành ôn tập!
        </h3>
        <div className="text-4xl font-black text-accent font-display">
          {srs.correct}/{srs.reviewed}
        </div>
        <span className="text-sm text-text-secondary block mt-2 mb-1">
          {pct >= 80 ? "Xuất sắc! Bạn nhớ rất tốt! 🎉" : pct >= 50 ? "Khá tốt! Hãy tiếp tục ôn nhé." : "Cần ôn thêm. Đừng bỏ cuộc!"}
        </span>
        <span className="text-xs text-text-muted">
          Chính xác {pct}%
        </span>

        <div className="flex gap-2 justify-center mt-5">
          <m.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => { srs.resetSession(); srs.fetchQueue(); }}
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl border-none bg-gradient-to-br from-accent to-accent-hover text-(--text-on-accent) text-sm font-extrabold cursor-pointer font-body shadow-[0_4px_14px_var(--accent-muted)]"
          >
            <RefreshCw className="h-4 w-4" /> Ôn tiếp
          </m.button>
        </div>
      </m.div>
    );
  }

  /* ── Active card ── */
  const error = srs.currentError!;

  return (
    <div className="flex flex-col gap-4">
      {/* Progress */}
      <div className="bg-surface rounded-xl border border-border px-5 py-3.5 flex items-center justify-between">
        <span className="text-sm font-bold text-text-primary">
          🧠 Ôn tập: {srs.currentIndex + 1} / {srs.queue.length}
        </span>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-(--success)">
            ✓ {srs.correct}
          </span>
          <span className="text-xs font-bold text-text-muted">
            / {srs.reviewed}
          </span>
        </div>
      </div>

      {/* Flash Card */}
      <AnimatePresence mode="wait">
        <m.div
          key={error.id}
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -40 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className={`bg-surface rounded-xl overflow-hidden transition-colors duration-200 ${
            flipped ? "border-2 border-accent" : "border border-border"
          }`}
        >
          {/* Card header */}
          <div className="flex items-center gap-2 px-5 py-3 bg-surface-alt border-b border-border">
            <span className="text-base">{MODULE_ICONS[error.sourceModule] ?? "📄"}</span>
            <span className="text-xs font-bold text-text-secondary">
              {MODULE_LABELS[error.sourceModule] ?? error.sourceModule}
            </span>
            {error.grammarTopic && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-accent-light text-accent border border-accent/15">
                {error.grammarTopic}
              </span>
            )}
            <span className="ml-auto text-[11px] text-text-muted">
              Ôn lần {error.reviewCount + 1}
            </span>
          </div>

          {/* Question */}
          <div className="p-5 px-5">
            <span className="text-[17px] font-semibold leading-relaxed text-text-primary block">
              {error.questionStem}
            </span>

            {/* Options (if exists) */}
            {error.options && error.options.length > 0 && (
              <div className="mt-4 flex flex-col gap-1.5">
                {error.options.map((opt, i) => {
                  const isCorrect = showAnswer && opt === error.correctAnswer;
                  const isWrong = showAnswer && opt === error.userAnswer && opt !== error.correctAnswer;
                  return (
                    <div
                      key={i}
                      className={`px-3.5 py-2 rounded-[10px] text-sm ${
                        isCorrect
                          ? "bg-[color-mix(in_srgb,var(--success)_8%,var(--surface))] border-[1.5px] border-(--success) text-(--success) font-bold"
                          : isWrong
                            ? "bg-[color-mix(in_srgb,var(--error)_8%,var(--surface))] border-[1.5px] border-(--error) text-(--error) font-bold"
                            : "bg-surface-alt border border-border text-text-primary font-medium"
                      }`}
                    >
                      {isCorrect && <CheckCircle className="h-3 w-3 inline mr-1.5" />}
                      {isWrong && <XCircle className="h-3 w-3 inline mr-1.5" />}
                      {String.fromCharCode(65 + i)}. {opt}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Reveal / Answer section */}
          {!showAnswer ? (
            <div className="px-5 pb-6">
              {/* Answer comparison (hidden) */}
              <div className="px-4 py-3 rounded-xl bg-surface-alt border border-dashed border-border text-center">
                <span className="text-[13px] text-text-muted font-semibold">
                  🤔 Bạn có nhớ đáp án không?
                </span>
              </div>

              <m.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={handleReveal}
                className="w-full mt-3 flex items-center justify-center gap-2 py-3.5 px-5 rounded-lg border-none bg-gradient-to-br from-accent to-accent-hover text-(--text-on-accent) text-[15px] font-extrabold cursor-pointer font-body shadow-[0_4px_14px_var(--accent-muted)]"
              >
                <Lightbulb className="h-4 w-4" /> Xem đáp án
              </m.button>
            </div>
          ) : (
            <m.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="px-5 pb-6"
            >
              {/* Answer comparison */}
              <div className="flex gap-2 mb-4">
                <div className="flex-1 px-3.5 py-2.5 rounded-[10px] bg-[color-mix(in_srgb,var(--error)_6%,var(--surface))] border border-[color-mix(in_srgb,var(--error)_18%,transparent)]">
                  <div className="text-[10px] font-bold text-(--error) uppercase mb-1">
                    <XCircle className="h-2.5 w-2.5 inline mr-1" /> Bạn chọn
                  </div>
                  <div className="text-sm font-bold text-(--error)">
                    {error.userAnswer || "(Trống)"}
                  </div>
                </div>
                <div className="flex-1 px-3.5 py-2.5 rounded-[10px] bg-[color-mix(in_srgb,var(--success)_6%,var(--surface))] border border-[color-mix(in_srgb,var(--success)_18%,transparent)]">
                  <div className="text-[10px] font-bold text-(--success) uppercase mb-1">
                    <CheckCircle className="h-2.5 w-2.5 inline mr-1" /> Đáp án đúng
                  </div>
                  <div className="text-sm font-bold text-(--success)">
                    {error.correctAnswer}
                  </div>
                </div>
              </div>

              {/* Deep explanation */}
              <DeepExplanation
                errorId={error.id}
                cached={error.deepExplanation}
                fallbackEn={error.explanationEn}
                fallbackVi={error.explanationVi}
              />

              {/* Grade buttons */}
              <div className="mt-4">
                <span className="text-[11px] font-bold text-text-muted uppercase tracking-wide block mb-2">
                  Bạn nhớ thế nào?
                </span>
                <div className="grid grid-cols-4 gap-2">
                  {SRS_GRADE_OPTIONS.map((opt) => (
                    <m.button
                      key={opt.grade}
                      whileHover={{ scale: 1.03, y: -2 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => handleGrade(opt.grade)}
                      disabled={srs.grading}
                      className="flex flex-col items-center gap-1 py-3 px-2 rounded-xl font-body transition-all duration-150 disabled:opacity-50 disabled:cursor-wait cursor-pointer"
                      style={{
                        border: `1.5px solid color-mix(in srgb, ${opt.color} 25%, var(--border))`,
                        background: `color-mix(in srgb, ${opt.color} 5%, var(--surface))`,
                      }}
                    >
                      <span className="text-[22px]">{opt.emoji}</span>
                      <span className="text-xs font-extrabold" style={{ color: opt.color }}>{opt.label}</span>
                      <span className="text-[10px] text-text-muted">{opt.desc}</span>
                    </m.button>
                  ))}
                </div>
              </div>
            </m.div>
          )}
        </m.div>
      </AnimatePresence>

      {/* Remaining queue */}
      <span className="text-[11px] text-text-muted text-center block">
        Còn {srs.queue.length - srs.currentIndex - 1} lỗi nữa trong phiên ôn tập này
      </span>
    </div>
  );
}
