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
    <div className="bg-surface border-2 border-border shadow-[4px_4px_0_var(--shadow-color)] py-4 px-5">
      <div className="mb-2.5 flex items-center justify-between gap-3 flex-wrap">
        <span className="font-mono text-[12px] font-bold uppercase tracking-wide text-text-primary">
          Câu {currentIdx + 1}
          <span className="text-text-muted font-semibold"> / {sentences.length}</span>
        </span>
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs font-black text-accent-active tabular-nums">
            {progress}%
          </span>
          <button
            type="button"
            onClick={onChangePassage}
            className="flex items-center gap-1 font-mono text-[10px] font-bold uppercase tracking-wide text-text-muted hover:text-ink transition-colors cursor-pointer"
          >
            <RefreshCw size={11} /> Đổi đoạn
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-2 overflow-hidden border-2 border-border bg-surface">
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
              className={`w-7 h-7 text-[10px] font-black font-mono cursor-pointer grid place-items-center transition-all duration-150 border-2 ${
                done
                  ? "border-border bg-success text-white"
                  : active
                    ? "border-border bg-accent text-text-on-accent shadow-[2px_2px_0_var(--shadow-color)]"
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
