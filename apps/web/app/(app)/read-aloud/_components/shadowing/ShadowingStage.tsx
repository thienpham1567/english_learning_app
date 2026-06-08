"use client";

import { ChevronRight, Loader2, Mic, PlayCircle, Redo, StopCircle, Volume2 } from "lucide-react";
import { AnimatePresence } from "motion/react";
import * as m from "motion/react-client";
import { useEffect, useRef, useState } from "react";
import type { ShadowStep } from "../../_hooks/useShadowing";
import { type EvalResult, ShadowResult } from "./ShadowResult";

interface ShadowingStageProps {
  step: ShadowStep;
  currentSentence: string;
  currentIdx: number;
  total: number;
  evalResult: EvalResult | null;
  onPlayReference: () => void;
  onStartRecording: () => void;
  onStopAndEvaluate: () => void;
  onRetry: () => void;
  onNext: () => void;
}

function formatElapsed(ms: number): string {
  const total = Math.floor(ms / 1000);
  const mm = String(Math.floor(total / 60)).padStart(2, "0");
  const ss = String(total % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

/** Live mm:ss timer that runs while the learner is recording. */
function RecordingTimer() {
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef(performance.now());
  useEffect(() => {
    const id = setInterval(() => setElapsed(performance.now() - startRef.current), 200);
    return () => clearInterval(id);
  }, []);
  return <span className="tabular-nums">{formatElapsed(elapsed)}</span>;
}

/** The central "stage" card that morphs through the shadowing phases. */
export function ShadowingStage({
  step,
  currentSentence,
  currentIdx,
  total,
  evalResult,
  onPlayReference,
  onStartRecording,
  onStopAndEvaluate,
  onRetry,
  onNext,
}: ShadowingStageProps) {
  const borderClass =
    step === "listening"
      ? "border-accent shadow"
      : step === "recording"
        ? "border-error shadow-sm"
        : "border-border";

  return (
    <div className="flex flex-col gap-4">
      <m.div
        key={currentIdx}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className={`bg-surface rounded-xl flex flex-col gap-5 py-6 px-5 border-2 transition-colors duration-200 ${borderClass}`}
      >
        {/* Model sentence */}
        <div>
          <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider mb-2 block">
            Model Sentence
          </span>
          <span
            className="text-lg text-text-primary font-semibold block"
            style={{ lineHeight: 1.7 }}
          >
            {currentSentence}
          </span>
        </div>

        <AnimatePresence mode="wait">
          {step === "idle" && (
            <m.div
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <m.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onPlayReference}
                className="w-full flex items-center justify-center gap-2.5 border-2 border-border py-3.5 px-5 rounded-2xl bg-accent text-ink text-[15px] font-black cursor-pointer font-body shadow hover:bg-accent-hover"
              >
                <Volume2 /> Listen to Model
              </m.button>
            </m.div>
          )}

          {step === "listening" && (
            <m.div
              key="listening"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-2"
            >
              <div className="flex items-center justify-center gap-2">
                <m.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  className="w-[12px] h-[12px] rounded-full bg-accent"
                />
                <span className="text-sm font-black text-accent-active">
                  Playing model sentence… Listen carefully
                </span>
              </div>
            </m.div>
          )}

          {step === "ready" && (
            <m.div
              key="ready"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <div className="flex gap-3">
                <m.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onPlayReference}
                  className="flex items-center justify-center gap-1.5 py-3 px-4 rounded-xl border-2 border-border bg-surface-alt text-text-secondary text-[13px] font-bold cursor-pointer font-body shrink-0"
                >
                  <PlayCircle size={13} /> Listen Again
                </m.button>
                <m.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onStartRecording}
                  className="flex-1 flex items-center justify-center gap-2.5 border-2 border-border py-3.5 px-5 rounded-2xl bg-error text-white text-[15px] font-black cursor-pointer font-body shadow-sm hover:bg-error/95"
                >
                  <Mic size={14} /> Speak Now
                </m.button>
              </div>
            </m.div>
          )}

          {step === "recording" && (
            <m.div
              key="recording"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <div className="flex flex-col items-center gap-3">
                <div className="flex items-center gap-2 text-sm font-bold text-error">
                  <m.div
                    animate={{ scale: [1, 1.3, 1], opacity: [1, 0.5, 1] }}
                    transition={{ repeat: Infinity, duration: 1 }}
                    className="w-[14px] h-[14px] rounded-full bg-error"
                  />
                  Recording <RecordingTimer />
                </div>
                <m.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onStopAndEvaluate}
                  className="flex items-center justify-center gap-2 rounded-xl text-error text-sm font-extrabold cursor-pointer font-body py-3 px-7 border-2 border-error bg-error/10 hover:bg-error/20 transition-colors"
                >
                  <StopCircle size={13} /> Stop & Grade
                </m.button>
              </div>
            </m.div>
          )}

          {step === "evaluating" && (
            <m.div
              key="evaluating"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-4 flex flex-col items-center justify-center gap-2"
            >
              <Loader2 className="animate-spin text-accent-active" size={24} />
              <div className="text-sm font-black text-accent-active">
                AI is grading your pronunciation…
              </div>
            </m.div>
          )}
        </AnimatePresence>
      </m.div>

      {/* Result */}
      <AnimatePresence>
        {step === "result" && evalResult && (
          <m.div
            key="result"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <ShadowResult result={evalResult} referenceText={currentSentence} />
            <div className="mt-3 flex gap-3">
              <m.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onRetry}
                className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 border-border bg-surface text-text-primary text-sm font-bold cursor-pointer font-body hover:bg-surface-hover transition-colors"
              >
                <Redo size={13} /> Retry
              </m.button>
              {currentIdx < total - 1 && (
                <m.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onNext}
                  className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 border-border bg-accent text-ink text-sm font-black cursor-pointer font-body shadow-sm hover:bg-accent-hover"
                >
                  Next Sentence <ChevronRight size={14} />
                </m.button>
              )}
            </div>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}
