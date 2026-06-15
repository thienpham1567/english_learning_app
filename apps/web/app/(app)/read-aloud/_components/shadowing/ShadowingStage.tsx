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
      ? "border-accent"
      : step === "recording"
        ? "border-error"
        : "border-border";

  return (
    <div className="flex flex-col gap-4">
      <m.div
        key={currentIdx}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className={`bg-surface flex flex-col gap-5 py-6 px-5 border-2 shadow-[4px_4px_0_var(--shadow-color)] transition-colors duration-200 ${borderClass}`}
      >
        {/* Model sentence */}
        <div>
          <span className="font-mono text-[10px] font-bold text-text-muted uppercase tracking-[0.18em] mb-2 flex items-center gap-1.5">
            <span className="text-accent">▶</span> Câu mẫu
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
                whileHover={{ x: -1, y: -1 }}
                whileTap={{ x: 0, y: 0 }}
                onClick={onPlayReference}
                className="w-full flex items-center justify-center gap-2.5 border-2 border-border py-3.5 px-5 bg-accent text-text-on-accent text-[15px] font-black uppercase tracking-tight font-display cursor-pointer shadow-[4px_4px_0_var(--shadow-color)] hover:shadow-[5px_5px_0_var(--shadow-color)] active:shadow-[1px_1px_0_var(--shadow-color)]"
              >
                <Volume2 /> Nghe câu mẫu
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
                  whileHover={{ x: -1, y: -1 }}
                  whileTap={{ x: 0, y: 0 }}
                  onClick={onPlayReference}
                  className="flex items-center justify-center gap-1.5 py-3 px-4 border-2 border-border bg-surface-alt text-text-secondary text-[12px] font-bold uppercase font-mono cursor-pointer shrink-0 shadow-[2px_2px_0_var(--shadow-color)] hover:shadow-[3px_3px_0_var(--shadow-color)] active:shadow-none"
                >
                  <PlayCircle size={13} /> Nghe lại
                </m.button>
                <m.button
                  whileHover={{ x: -1, y: -1 }}
                  whileTap={{ x: 0, y: 0 }}
                  onClick={onStartRecording}
                  className="flex-1 flex items-center justify-center gap-2.5 border-2 border-border py-3.5 px-5 bg-error text-white text-[15px] font-black uppercase tracking-tight font-display cursor-pointer shadow-[4px_4px_0_var(--shadow-color)] hover:shadow-[5px_5px_0_var(--shadow-color)] active:shadow-[1px_1px_0_var(--shadow-color)]"
                >
                  <Mic size={14} /> Nói ngay
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
                  whileHover={{ x: -1, y: -1 }}
                  whileTap={{ x: 0, y: 0 }}
                  onClick={onStopAndEvaluate}
                  className="flex items-center justify-center gap-2 text-error text-sm font-black uppercase font-mono cursor-pointer py-3 px-7 border-2 border-border bg-error/10 shadow-[3px_3px_0_var(--shadow-color)] hover:shadow-[4px_4px_0_var(--shadow-color)] active:shadow-none transition-shadow"
                >
                  <StopCircle size={13} /> Dừng &amp; chấm
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
              <div className="font-mono text-sm font-black uppercase tracking-wide text-accent-active">
                AI đang chấm phát âm…
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
                whileHover={{ x: -1, y: -1 }}
                whileTap={{ x: 0, y: 0 }}
                onClick={onRetry}
                className="flex-1 flex items-center justify-center gap-2 py-3 px-4 border-2 border-border bg-surface text-text-primary text-sm font-bold uppercase font-mono cursor-pointer shadow-[2px_2px_0_var(--shadow-color)] hover:shadow-[3px_3px_0_var(--shadow-color)] active:shadow-none transition-shadow"
              >
                <Redo size={13} /> Thử lại
              </m.button>
              {currentIdx < total - 1 && (
                <m.button
                  whileHover={{ x: -1, y: -1 }}
                  whileTap={{ x: 0, y: 0 }}
                  onClick={onNext}
                  className="flex-1 flex items-center justify-center gap-2 py-3 px-4 border-2 border-border bg-accent text-text-on-accent text-sm font-black uppercase tracking-tight font-display cursor-pointer shadow-[3px_3px_0_var(--shadow-color)] hover:shadow-[4px_4px_0_var(--shadow-color)] active:shadow-none transition-shadow"
                >
                  Câu tiếp <ChevronRight size={14} />
                </m.button>
              )}
            </div>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}
