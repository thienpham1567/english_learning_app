"use client";

import { CircleCheckBig, RefreshCw } from "lucide-react";
import * as m from "motion/react-client";
import type { EvalResult } from "./ShadowResult";

interface ShadowingProgressProps {
  sentences: string[];
  currentIdx: number;
  progress: number;
  sentenceResults: (EvalResult | null)[];
  onSelect: (i: number) => void;
  onChangePassage: () => void;
}

/** Header showing overall completion and clickable per-sentence pills. */
export function ShadowingProgress({
  sentences,
  currentIdx,
  progress,
  sentenceResults,
  onSelect,
  onChangePassage,
}: ShadowingProgressProps) {
  return (
    <div className="bg-surface border border-border shadow-md py-4 px-5">
      <div className="mb-2.5 flex items-center justify-between gap-3 flex-wrap">
        <span className="text-[12px] font-semibold uppercase tracking-wide text-text-primary">
          Câu {currentIdx + 1}
          <span className="text-text-muted font-semibold"> / {sentences.length}</span>
        </span>
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs font-bold text-accent-active tabular-nums">
            {progress}%
          </span>
          <button
            type="button"
            onClick={onChangePassage}
            className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-text-muted hover:text-ink transition-colors cursor-pointer"
          >
            <RefreshCw size={11} /> Đổi đoạn
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-2 overflow-hidden border border-border bg-surface">
        <m.div
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3 }}
          className="h-full bg-accent"
        />
      </div>

      {/* Sentence pills */}
      <div className="mt-3 flex flex-wrap gap-1.5">
        {sentences.map((_, i) => {
          const done = Boolean(sentenceResults[i]);
          const active = i === currentIdx;
          return (
            <button
              key={i}
              type="button"
              onClick={() => onSelect(i)}
              aria-label={`Go to sentence ${i + 1}`}
              className={`w-7 h-7 text-[10px] font-bold font-mono cursor-pointer grid place-items-center transition-all duration-150 border ${
                done
                  ? "border-border bg-success text-white"
                  : active
                    ? "border-border bg-accent text-text-on-accent shadow-sm"
                    : "border-border bg-surface-alt text-text-muted hover:text-ink"
              }`}
            >
              {done ? <CircleCheckBig size={12} /> : i + 1}
            </button>
          );
        })}
      </div>
    </div>
  );
}
