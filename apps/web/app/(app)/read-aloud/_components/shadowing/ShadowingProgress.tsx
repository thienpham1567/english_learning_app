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
    <div className="bg-surface rounded-xl border-2 border-border shadow-sm py-4 px-5">
      <div className="mb-2.5 flex items-center justify-between gap-3">
        <span className="text-[13px] font-bold text-text-primary">
          Sentence {currentIdx + 1}
          <span className="text-text-muted font-semibold"> of {sentences.length}</span>
        </span>
        <div className="flex items-center gap-3">
          <span className="text-xs font-black text-accent">{progress}% complete</span>
          <button
            type="button"
            onClick={onChangePassage}
            className="flex items-center gap-1 text-[11px] font-bold text-text-muted hover:text-text-primary transition-colors cursor-pointer"
          >
            <RefreshCw size={11} /> Change passage
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-[6px] overflow-hidden rounded-[3px] bg-border">
        <m.div
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3 }}
          className="h-full rounded-[3px] bg-gradient-to-r from-accent to-xp"
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
              className={`w-6 h-6 rounded-md text-[10px] font-bold cursor-pointer grid place-items-center transition-all duration-150 ${
                done
                  ? "border-2 border-success/30 bg-success/15 text-success"
                  : active
                    ? "border-2 border-border bg-accent text-ink shadow-sm"
                    : "border-2 border-border/40 bg-surface-alt text-text-muted hover:border-border/60"
              }`}
            >
              {done ? <CircleCheckBig size={11} /> : i + 1}
            </button>
          );
        })}
      </div>
    </div>
  );
}
