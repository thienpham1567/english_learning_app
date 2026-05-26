"use client";

import { useCallback } from "react";
import {
  X,
  CheckCircle,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import * as m from "motion/react-client";
import { AnimatePresence } from "motion/react";
import type { ErrorEntry } from "../_types/types";
import { MODULE_LABELS, MODULE_ICONS } from "../_types/types";
import { DeepExplanation } from "./DeepExplanation";
import { InlinePractice } from "./InlinePractice";

interface ErrorDetailPanelProps {
  error: ErrorEntry | null;
  onClose: () => void;
  onResolve: (id: string) => void;
}

export function ErrorDetailPanel({ error, onClose, onResolve }: ErrorDetailPanelProps) {
  const handleResolve = useCallback(() => {
    if (error) onResolve(error.id);
  }, [error, onResolve]);

  return (
    <>
      {/* Backdrop */}
      <AnimatePresence>
        {error && (
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[900] bg-black/30 backdrop-blur-xs"
          />
        )}
      </AnimatePresence>

      {/* Panel */}
      <AnimatePresence>
        {error && (
          <m.div
            key={error.id}
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed top-0 right-0 bottom-0 w-[min(520px,90vw)] z-[901] bg-(--bg) border-l-2 border-border shadow-[-8px_0_30px_rgba(0,0,0,0.1)] flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b-2 border-border bg-surface shrink-0">
              <div className="flex items-center gap-2">
                {error.isResolved ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-md bg-(--success-bg) text-(--success)">
                    <CheckCircle className="h-2.5 w-2.5" /> Đã hiểu
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-md bg-(--error-bg) text-(--error)">
                    <AlertTriangle className="h-2.5 w-2.5" /> Chưa nắm
                  </span>
                )}
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-text-secondary">
                  {MODULE_ICONS[error.sourceModule] ?? "📄"} {MODULE_LABELS[error.sourceModule] ?? error.sourceModule}
                </span>
              </div>
              <button
                onClick={onClose}
                className="grid place-items-center w-8 h-8 rounded-lg border-2 border-border bg-transparent text-text-muted cursor-pointer text-sm transition-all duration-150 hover:bg-surface-alt"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-auto p-5">
              {/* Question */}
              <span className="text-[17px] font-semibold leading-relaxed text-text-primary block mb-4">
                {error.questionStem}
              </span>

              {/* Options */}
              {error.options && error.options.length > 0 && (
                <div className="flex flex-col gap-1.5 mb-5">
                  {error.options.map((opt, i) => {
                    const isCorrect = opt === error.correctAnswer;
                    const isWrong = opt === error.userAnswer && opt !== error.correctAnswer;
                    return (
                      <div
                        key={i}
                        className={`px-3.5 py-2.5 rounded-[10px] text-sm ${
                          isCorrect
                            ? "bg-[color-mix(in_srgb,var(--success)_8%,var(--surface))] border-[1.5px] border-(--success) text-(--success) font-bold"
                            : isWrong
                              ? "bg-[color-mix(in_srgb,var(--error)_8%,var(--surface))] border-[1.5px] border-(--error) text-(--error) font-bold"
                              : "bg-surface-alt border-2 border-border text-text-primary font-medium"
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

              {/* Answer comparison (when no options) */}
              {(!error.options || error.options.length === 0) && (
                <div className="flex gap-2 mb-5">
                  <div className="flex-1 px-3.5 py-3 rounded-[10px] bg-[color-mix(in_srgb,var(--error)_6%,var(--surface))] border border-[color-mix(in_srgb,var(--error)_18%,transparent)]">
                    <div className="text-[10px] font-bold text-(--error) uppercase mb-1">
                      <XCircle className="h-2.5 w-2.5 inline mr-1" /> Bạn chọn
                    </div>
                    <div className="text-sm font-bold text-(--error)">
                      {error.userAnswer || "(Trống)"}
                    </div>
                  </div>
                  <div className="flex-1 px-3.5 py-3 rounded-[10px] bg-[color-mix(in_srgb,var(--success)_6%,var(--surface))] border border-[color-mix(in_srgb,var(--success)_18%,transparent)]">
                    <div className="text-[10px] font-bold text-(--success) uppercase mb-1">
                      <CheckCircle className="h-2.5 w-2.5 inline mr-1" /> Đáp án đúng
                    </div>
                    <div className="text-sm font-bold text-(--success)">
                      {error.correctAnswer}
                    </div>
                  </div>
                </div>
              )}

              {/* Deep Explanation */}
              <div className="mb-5">
                <DeepExplanation
                  errorId={error.id}
                  cached={error.deepExplanation}
                  fallbackEn={error.explanationEn}
                  fallbackVi={error.explanationVi}
                />
              </div>

              {/* Inline Practice */}
              <div className="mb-5">
                <InlinePractice
                  errorId={error.id}
                  onResolved={() => onResolve(error.id)}
                />
              </div>

              {/* Meta info */}
              <div className="px-3.5 py-3 rounded-[10px] bg-surface-alt border-2 border-border text-xs text-text-muted flex flex-col gap-1">
                <div>📅 Ngày tạo: {new Date(error.createdAt).toLocaleDateString("vi-VN", { day: "numeric", month: "long", year: "numeric" })}</div>
                {error.reviewCount > 0 && <div>🧠 Đã ôn: {error.reviewCount} lần</div>}
                {error.lastReviewedAt && <div>📖 Ôn gần nhất: {new Date(error.lastReviewedAt).toLocaleDateString("vi-VN")}</div>}
                {error.nextReviewAt && <div>⏰ Ôn lại: {new Date(error.nextReviewAt).toLocaleDateString("vi-VN")}</div>}
              </div>
            </div>

            {/* Footer */}
            {!error.isResolved && (
              <div className="px-5 py-3 border-t-2 border-border bg-surface shrink-0">
                <m.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleResolve}
                  className="w-full flex items-center justify-center gap-2 py-3 px-5 rounded-xl border-none bg-gradient-to-br from-(--success) to-[color-mix(in_srgb,var(--success)_80%,var(--accent))] text-white text-sm font-extrabold cursor-pointer font-body shadow-[0_4px_14px_rgba(16,185,129,0.3)]"
                >
                  <CheckCircle className="h-4 w-4" /> Đánh dấu đã hiểu
                </m.button>
              </div>
            )}
          </m.div>
        )}
      </AnimatePresence>
    </>
  );
}
