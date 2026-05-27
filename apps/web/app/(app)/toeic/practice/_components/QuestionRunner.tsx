"use client";

import { Button, Tag } from "antd";
import { CheckCircle, Flag, Loader2, PlayCircle, Volume2, XCircle } from "lucide-react";
import * as m from "motion/react-client";
import { useCallback, useEffect, useRef, useState } from "react";
import type { ToeicSessionQuestion } from "@/hooks/useToeicSession";

export type QuestionRunnerProps = {
  question: ToeicSessionQuestion | null;
  currentIndex: number;
  total: number;
  /** When true, hides explanation/correct answer until completion (mock + diagnostic). */
  hideExplanation?: boolean;
  /** Optional countdown timer in ms; shows time-up warning when reached. */
  timeLimit?: number;
  startedAt?: number | null;
  /** Pass attempt ID to enable flag persistence + bookmark feature. */
  attemptId?: string;
  /** Initial flag state (when resuming). */
  initialFlagged?: boolean;
  onAnswer: (selectedIndex: number | null) => void | Promise<void>;
  onNext: () => void;
  onComplete: () => void | Promise<unknown>;
};

export function QuestionRunner({
  question,
  currentIndex,
  total,
  hideExplanation = false,
  timeLimit,
  startedAt,
  attemptId,
  initialFlagged,
  onAnswer,
  onNext,
  onComplete,
}: QuestionRunnerProps) {
  const [selected, setSelected] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [part2PlayingIdx, setPart2PlayingIdx] = useState(-1); // -1 idle, 0=Q, 1=A, 2=B, 3=C, 4=done
  const [isFlagged, setIsFlagged] = useState<boolean>(initialFlagged ?? false);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    setSelected(null);
    setRevealed(false);
    setPart2PlayingIdx(-1);
    setIsFlagged(false);
  }, [question?.id]);

  const toggleFlag = useCallback(async () => {
    if (!question || !attemptId) return;
    const next = !isFlagged;
    setIsFlagged(next);
    void fetch("/api/toeic-practice/answer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        attemptId,
        questionId: question.id,
        selectedIndex: null,
        durationMs: 0,
        flagged: next,
      }),
    });
  }, [attemptId, isFlagged, question]);

  const playPart2Sequence = useCallback(async () => {
    if (!question?.audioSegments) return;
    const segments = question.audioSegments;
    const urls = [segments.question, ...segments.options].filter((u) => u && u.length > 0);
    const audio = audioRef.current;
    if (!audio) return;
    for (let i = 0; i < urls.length; i++) {
      setPart2PlayingIdx(i);
      audio.src = urls[i];
      audio.currentTime = 0;
      try {
        await audio.play();
        await new Promise<void>((resolve) => {
          const onEnd = () => {
            audio.removeEventListener("ended", onEnd);
            resolve();
          };
          audio.addEventListener("ended", onEnd);
        });
        if (i < urls.length - 1) await new Promise((r) => setTimeout(r, 800));
      } catch {
        break;
      }
    }
    setPart2PlayingIdx(4);
  }, [question?.audioSegments]);

  useEffect(() => {
    if (question?.audioSegments && part2PlayingIdx === -1) {
      void playPart2Sequence();
    }
  }, [question?.id, question?.audioSegments, part2PlayingIdx, playPart2Sequence]);

  useEffect(() => {
    if (!startedAt || !timeLimit) return;
    const tick = () => setElapsed(Date.now() - startedAt);
    tick();
    const i = setInterval(tick, 1000);
    return () => clearInterval(i);
  }, [startedAt, timeLimit]);

  useEffect(() => {
    if (timeLimit && startedAt && elapsed >= timeLimit) {
      void onComplete();
    }
  }, [elapsed, timeLimit, startedAt, onComplete]);

  useEffect(() => {
    if (!question) return;
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) return;
      const k = e.key.toLowerCase();
      let optIdx = -1;
      if (k === "1" || k === "a") optIdx = 0;
      else if (k === "2" || k === "b") optIdx = 1;
      else if (k === "3" || k === "c") optIdx = 2;
      else if (k === "4" || k === "d") optIdx = 3;

      if (optIdx >= 0 && optIdx < question.options.length && !(revealed && !hideExplanation)) {
        e.preventDefault();
        setSelected(optIdx);
        if (!hideExplanation) setRevealed(true);
        void onAnswer(optIdx);
        return;
      }
      if (e.key === " ") {
        if (audioRef.current?.src) {
          if (audioRef.current.paused) void audioRef.current.play();
          else audioRef.current.pause();
          e.preventDefault();
        }
        return;
      }
      if (k === "f") {
        e.preventDefault();
        void toggleFlag();
        return;
      }
      if (e.key === "Enter") {
        const canMoveOn = (hideExplanation && selected !== null) || (!hideExplanation && revealed);
        if (canMoveOn) {
          e.preventDefault();
          if (currentIndex === total - 1) void onComplete();
          else {
            setSelected(null);
            setRevealed(false);
            onNext();
          }
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [
    question,
    revealed,
    selected,
    hideExplanation,
    isFlagged,
    currentIndex,
    total,
    onAnswer,
    onNext,
    onComplete,
    toggleFlag,
  ]);

  if (!question) {
    return (
      <div
        className="flex justify-center items-center text-text-secondary font-bold"
        style={{ padding: 48 }}
      >
        <Loader2 className="animate-spin text-xl mr-2 text-accent" /> Loading question...
      </div>
    );
  }

  const isLast = currentIndex === total - 1;
  const canSubmit = !hideExplanation ? revealed : selected !== null;
  const showExplanationNow = !hideExplanation && revealed;

  const handlePick = (idx: number) => {
    if (revealed && !hideExplanation) return;
    setSelected(idx);
    if (!hideExplanation) {
      setRevealed(true);
    }
    void onAnswer(idx);
  };

  const handleNext = () => {
    if (isLast) {
      void onComplete();
    } else {
      setSelected(null);
      setRevealed(false);
      onNext();
    }
  };

  const remainingSec =
    timeLimit && startedAt ? Math.max(0, Math.ceil((timeLimit - elapsed) / 1000)) : null;

  return (
    <div className="anim-fade-up flex flex-col gap-4 w-[720px] w-full mx-auto">
      {/* Question metadata bar */}
      <div
        className="flex justify-between items-center bg-surface-alt rounded-(--radius-xl)"
        style={{ border: "1.5px solid var(--border)", padding: "10px 14px" }}
      >
        <span className="font-black text-text-secondary" style={{ fontSize: 13.5 }}>
          Question {currentIndex + 1} / {total}
        </span>
        <div className="flex gap-1.5 items-center">
          <span
            className="text-[10.5px] font-black rounded-md text-accent"
            style={{
              padding: "2px 8px",
              background: "var(--accent-light)",
              border: "1px solid var(--accent-muted)",
            }}
          >
            Part {question.part}
          </span>
          {remainingSec !== null && (
            <span
              className="text-[11px] font-black font-mono rounded-md"
              style={{
                padding: "2px 8px",
                background: remainingSec < 60 ? "rgba(239, 68, 68, 0.08)" : "var(--surface)",
                color: remainingSec < 60 ? "var(--error)" : "var(--text-secondary)",
                border: `1px solid ${remainingSec < 60 ? "rgba(239, 68, 68, 0.2)" : "var(--border)"}`,
              }}
            >
              {Math.floor(remainingSec / 60)}:{String(remainingSec % 60).padStart(2, "0")}
            </span>
          )}
        </div>
      </div>

      {/* Question Images */}
      {question.imageUrls && question.imageUrls.length > 0 && (
        <div
          className="flex gap-2 flex-wrap justify-center bg-(--surface) rounded-(--radius-xl)"
          style={{ border: "1.5px solid var(--border)", padding: 10 }}
        >
          {question.imageUrls.map((src) => (
            <img
              key={src}
              src={src}
              alt=""
              loading="lazy"
              decoding="async"
              className="h-[320px] rounded-(--radius-lg)"
              style={{ maxWidth: "100%", objectFit: "contain" }}
            />
          ))}
        </div>
      )}

      {/* Audio block */}
      {question.audioUrl && !question.audioSegments && (
        <div
          className="flex items-center gap-3 bg-(--surface) py-3 px-4 rounded-(--radius-xl)"
          style={{ border: "1.5px solid var(--border)" }}
        >
          <m.button
            type="button"
            onClick={() => audioRef.current?.play()}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="items-center gap-2 border-none rounded-(--radius-lg) text-[13px] font-extrabold cursor-pointer"
            style={{
              display: "inline-flex",
              padding: "10px 18px",
              background: "var(--accent)",
              color: "var(--text-on-accent)",
            }}
          >
            <Volume2 />
            <span>Play question audio</span>
          </m.button>
          <audio ref={audioRef} src={question.audioUrl} />
        </div>
      )}

      {/* Audio segment player for Part 2 */}
      {question.audioSegments && (
        <div
          className="bg-(--surface) rounded-(--radius-xl) flex justify-between items-center gap-3"
          style={{ border: "1.5px solid var(--border)", padding: "14px 18px" }}
        >
          <span className="text-[13px] font-extrabold text-text-secondary">
            {(() => {
              const hasQ = (question.audioSegments?.question ?? "").length > 0;
              const totalSegs = (hasQ ? 1 : 0) + (question.audioSegments?.options.length ?? 0);
              if (part2PlayingIdx === -1) return "Audio preparing...";
              if (part2PlayingIdx >= totalSegs) return "Audio finished — please select an answer";
              if (hasQ && part2PlayingIdx === 0) return "🔊 Playing: Question";
              const optIdx = hasQ ? part2PlayingIdx - 1 : part2PlayingIdx;
              return `🔊 Playing: Option (${String.fromCharCode(65 + optIdx)})`;
            })()}
          </span>
          <m.button
            type="button"
            disabled={part2PlayingIdx >= 0 && part2PlayingIdx < 4}
            onClick={() => {
              setPart2PlayingIdx(-1);
              void playPart2Sequence();
            }}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="items-center gap-1.5 py-1.5 px-3 bg-surface-alt text-text-primary font-extrabold"
            style={{
              display: "inline-flex",
              border: "1.5px solid var(--border)",
              borderRadius: "var(--radius-md)",
              fontSize: 12.5,
              cursor: part2PlayingIdx >= 0 && part2PlayingIdx < 4 ? "not-allowed" : "pointer",
            }}
          >
            <PlayCircle />
            <span>Replay</span>
          </m.button>
          <audio ref={audioRef} />
        </div>
      )}

      {/* Reading passage text */}
      {question.passageText && (
        <div
          className="bg-(--surface) p-4 rounded-(--radius-xl) text-text-primary font-medium"
          style={{
            whiteSpace: "pre-wrap",
            border: "1.5px solid var(--border)",
            fontSize: 14.5,
            lineHeight: 1.7,
          }}
        >
          {question.passageText}
        </div>
      )}

      {/* Question Text */}
      {question.questionText && (
        <div
          className="text-base font-black text-text-primary font-display"
          style={{ padding: "4px 2px" }}
        >
          {question.questionText}
        </div>
      )}

      {/* Choices buttons grid */}
      <div className="flex flex-col gap-2.5">
        {question.options.map((opt, idx) => {
          const isPicked = selected === idx;
          const isCorrect = showExplanationNow && question.correctIndex === idx;
          const isWrongPick = showExplanationNow && isPicked && question.correctIndex !== idx;
          const isLabelOnly = opt.length <= 2 && /^[A-D]$/i.test(opt.trim());

          let border = "1.5px solid var(--border)";
          let bg = "var(--surface)";
          let color = "var(--text-primary)";
          let iconElement = null;

          if (showExplanationNow) {
            if (idx === question.correctIndex) {
              bg = "rgba(16, 185, 129, 0.08)";
              border = "1.5px solid var(--success)";
              color = "var(--success)";
              iconElement = <CheckCircle className="text-emerald-500 text-base" />;
            } else if (isPicked) {
              bg = "rgba(239, 68, 68, 0.08)";
              border = "1.5px solid var(--error)";
              color = "var(--error)";
              iconElement = <XCircle className="text-destructive text-base" />;
            } else {
              bg = "var(--surface-alt)";
              color = "var(--text-muted)";
              border = "1px solid var(--border)";
            }
          } else if (isPicked) {
            border = "1.5px solid var(--accent)";
            bg = "var(--accent-light)";
            color = "var(--accent)";
          }

          return (
            <m.button
              type="button"
              key={`${question.id}-${idx}`}
              onClick={() => handlePick(idx)}
              disabled={revealed && !hideExplanation}
              whileHover={
                revealed && !hideExplanation ? {} : { x: 3, borderColor: "var(--accent)" }
              }
              whileTap={revealed && !hideExplanation ? {} : { scale: 0.98 }}
              className="rounded-(--radius-xl) text-left flex gap-2.5 items-center text-sm font-bold"
              style={{
                padding: "14px 18px",
                border,
                background: bg,
                color,
                cursor: revealed && !hideExplanation ? "default" : "pointer",
                transition: "background 0.2s, border-color 0.2s",
              }}
            >
              <span className="font-black w-[22px]" style={{ opacity: 0.7 }}>
                {String.fromCharCode(65 + idx)}.
              </span>
              <span className="flex-1">{isLabelOnly ? "" : opt}</span>
              {iconElement}
            </m.button>
          );
        })}
      </div>

      {/* Explanation Accordion Box */}
      {showExplanationNow && question.explanationVi && (
        <m.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-surface-alt p-4 rounded-(--radius-xl) text-text-secondary leading-relaxed font-medium"
          style={{ border: "1.5px solid var(--border)", fontSize: 13.5 }}
        >
          <div className="flex items-center gap-1.5 font-black text-text-primary mb-1.5">
            <CheckCircle className="text-emerald-500" />
            <span>Detailed Explanation:</span>
          </div>
          <p className="m-0">{question.explanationVi}</p>
        </m.div>
      )}

      {/* Control actions bar */}
      <div
        className="flex justify-between items-center gap-3 mt-3 pt-4"
        style={{ borderTop: "1.5px dashed var(--border)" }}
      >
        <m.button
          type="button"
          onClick={() => void toggleFlag()}
          disabled={!attemptId}
          whileTap={{ scale: 0.95 }}
          title="Phím tắt: F"
          className="items-center gap-1.5 py-2 px-4 rounded-(--radius-lg) text-[13px] font-extrabold"
          style={{
            display: "inline-flex",
            border: "1.5px solid var(--border)",
            background: isFlagged ? "rgba(239, 68, 68, 0.08)" : "var(--surface)",
            color: isFlagged ? "var(--error)" : "var(--text-secondary)",
            cursor: attemptId ? "pointer" : "not-allowed",
            transition: "all 0.15s",
          }}
        >
          {isFlagged ? <Flag /> : <Flag />}
          <span>{isFlagged ? "Flagged" : "Flag"}</span>
        </m.button>

        <div className="flex gap-2.5">
          {hideExplanation && selected === null && (
            <m.button
              type="button"
              onClick={() => void onAnswer(null)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="py-2 px-4 rounded-(--radius-lg) bg-(--surface) text-text-secondary text-[13px] cursor-pointer"
              style={{ border: "1.5px solid var(--border)", fontWeight: 850 }}
            >
              Skip
            </m.button>
          )}
          <m.button
            type="button"
            onClick={handleNext}
            disabled={!canSubmit && !hideExplanation}
            whileHover={!canSubmit && !hideExplanation ? {} : { scale: 1.02 }}
            whileTap={!canSubmit && !hideExplanation ? {} : { scale: 0.98 }}
            className="rounded-(--radius-lg) border-none text-[13px]"
            style={{
              padding: "10px 24px",
              background: !canSubmit && !hideExplanation ? "var(--border)" : "var(--accent)",
              color: !canSubmit && !hideExplanation ? "var(--text-muted)" : "var(--text-on-accent)",
              fontWeight: 850,
              cursor: !canSubmit && !hideExplanation ? "not-allowed" : "pointer",
              boxShadow: !canSubmit && !hideExplanation ? "none" : "0 4px 12px var(--accent-muted)",
              transition: "all 0.15s",
            }}
          >
            <span>{isLast ? "Submit" : "Next Question"}</span>
          </m.button>
        </div>
      </div>

      <div className="mt-1.5 text-[11px] text-text-muted text-center font-semibold">
        Shortcuts:{" "}
        <kbd
          className="bg-surface-alt rounded border-2 border-border"
          style={{ padding: "2px 5px" }}
        >
          1-4
        </kbd>{" "}
        or{" "}
        <kbd
          className="bg-surface-alt rounded border-2 border-border"
          style={{ padding: "2px 5px" }}
        >
          A-D
        </kbd>{" "}
        to select ·{" "}
        <kbd
          className="bg-surface-alt rounded border-2 border-border"
          style={{ padding: "2px 5px" }}
        >
          Space
        </kbd>{" "}
        play/pause audio ·{" "}
        <kbd
          className="bg-surface-alt rounded border-2 border-border"
          style={{ padding: "2px 5px" }}
        >
          F
        </kbd>{" "}
        to flag ·{" "}
        <kbd
          className="bg-surface-alt rounded border-2 border-border"
          style={{ padding: "2px 5px" }}
        >
          Enter
        </kbd>{" "}
        to continue
      </div>
    </div>
  );
}
