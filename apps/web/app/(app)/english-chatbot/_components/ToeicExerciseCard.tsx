"use client";

import {
  Check,
  Pencil,
  Pin,
  Play,
  RefreshCw,
  RotateCcw,
  Send,
  Target,
  TrendingUp,
  Volume2,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import {
  gradeToeicAnswers,
  type ToeicExercise,
  type ToeicGradeResult,
} from "@/lib/chat/toeic-exercise";

type Props = {
  exercise: ToeicExercise;
  /** Send a follow-up message into the chat (e.g. "explain my mistakes"). */
  onAskCoach?: (message: string) => void;
  isLoading?: boolean;
  /** Speak arbitrary text (used to play a listening passage). */
  onPlayAudio?: (text: string) => void;
  isPlaying?: boolean;
};

function renderBandMessage(pct: number) {
  if (pct >= 90) {
    return (
      <span className="inline-flex items-center gap-1">
        on track for a high score <Target className="h-3.5 w-3.5 text-accent shrink-0" />
      </span>
    );
  }
  if (pct >= 70) {
    return (
      <span className="inline-flex items-center gap-1">
        Good — a few gaps to close <TrendingUp className="h-3.5 w-3.5 text-success shrink-0" />
      </span>
    );
  }
  if (pct >= 50) {
    return (
      <span className="inline-flex items-center gap-1">
        Getting there — review the misses <Pin className="h-3.5 w-3.5 text-warning shrink-0" />
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1">
      Keep practicing — let's drill these{" "}
      <RotateCcw className="h-3.5 w-3.5 text-text-muted shrink-0" />
    </span>
  );
}

export function ToeicExerciseCard({
  exercise,
  onAskCoach,
  isLoading,
  onPlayAudio,
  isPlaying,
}: Props) {
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [result, setResult] = useState<ToeicGradeResult | null>(null);
  const [showTranscript, setShowTranscript] = useState(!exercise.isListening);

  const submitted = result !== null;
  const total = exercise.questions.length;
  const allAnswered = exercise.questions.every((q) => (answers[q.index] ?? "").trim().length > 0);

  const resultByIndex = useMemo(() => {
    const map = new Map<number, ToeicGradeResult["results"][number]>();
    if (result) for (const r of result.results) map.set(r.index, r);
    return map;
  }, [result]);

  const setAnswer = (index: number, value: string) => {
    if (submitted) return;
    setAnswers((prev) => ({ ...prev, [index]: value }));
  };

  const handleSubmit = () => {
    if (!allAnswered) return;
    setResult(gradeToeicAnswers(exercise, answers));
  };

  const handleReset = () => {
    setAnswers({});
    setResult(null);
  };

  const handleAskCoach = () => {
    if (!result || !onAskCoach) return;
    const wrong = result.results.filter((r) => !r.correct);
    if (wrong.length === 0) {
      onAskCoach(
        `I got all ${total} correct on the ${exercise.partLabel ?? "TOEIC"} exercise. Give me 2 harder follow-up questions.`,
      );
      return;
    }
    const lines = wrong.map((r) => {
      const q = exercise.questions.find((x) => x.index === r.index);
      return `Q${r.index}: I answered "${r.given || "(blank)"}", correct is "${r.expected}". (${q?.prompt ?? ""})`;
    });
    onAskCoach(
      `I scored ${result.score}/${total} on the ${exercise.partLabel ?? "TOEIC"} exercise. Please explain why I got these wrong and give 2 similar practice items:\n${lines.join("\n")}`,
    );
  };

  const scorePct = result ? Math.round((result.score / total) * 100) : 0;

  return (
    <div className="my-3 rounded-xl border-2 border-accent/20 bg-accent/3 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-accent/5 border-b border-accent/10">
        <div className="flex items-center gap-2">
          <Pencil className="h-3.5 w-3.5 text-accent shrink-0" />
          <span className="text-xs font-bold text-accent">
            {exercise.partLabel ?? "TOEIC Practice"}
          </span>
          <span className="text-[9px] font-bold text-text-muted bg-bg-deep px-1.5 py-0.5 rounded-md">
            {total} {total === 1 ? "question" : "questions"}
          </span>
        </div>
        {submitted && (
          <button
            onClick={handleReset}
            className="flex items-center gap-1 text-[10px] font-bold text-text-muted hover:text-accent transition-colors cursor-pointer"
          >
            <RefreshCw className="h-3 w-3" />
            Reset
          </button>
        )}
      </div>

      {/* Passage */}
      {exercise.passage && (
        <div className="px-4 pt-3">
          {exercise.isListening && onPlayAudio && (
            <button
              onClick={() => onPlayAudio(exercise.passage ?? "")}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent text-white text-xs font-bold cursor-pointer active:scale-95 transition-all hover:brightness-110"
            >
              {isPlaying ? (
                <Volume2 className="h-3.5 w-3.5 animate-pulse" />
              ) : (
                <Play className="h-3.5 w-3.5" />
              )}
              {isPlaying ? "Playing…" : "Play audio"}
            </button>
          )}
          {exercise.isListening && (
            <button
              onClick={() => setShowTranscript((v) => !v)}
              className="ml-2 text-[10px] font-bold text-text-muted hover:text-accent underline cursor-pointer"
            >
              {showTranscript ? "Hide transcript" : "Show transcript"}
            </button>
          )}
          {showTranscript && (
            <div className="mt-2 rounded-lg border border-border/60 bg-surface/60 p-3 text-[13px] leading-relaxed text-text-secondary whitespace-pre-wrap">
              {exercise.passage}
            </div>
          )}
        </div>
      )}

      {/* Questions */}
      <div className="px-4 py-3 space-y-4">
        {exercise.questions.map((q) => {
          const r = resultByIndex.get(q.index);
          return (
            <div key={q.index} className="flex gap-2.5 items-start">
              <span className="text-[11px] font-bold text-accent/60 mt-0.5 shrink-0 w-5 text-right">
                {q.index}.
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-sm text-ink leading-relaxed">{q.prompt}</div>

                {/* MCQ options */}
                {q.type === "mcq" && (
                  <div className="mt-2 grid gap-1.5">
                    {q.options.map((opt) => {
                      const chosen = (answers[q.index] ?? "") === opt.letter;
                      const isCorrectOpt = submitted && q.answer === opt.letter;
                      const isWrongChosen = submitted && chosen && !r?.correct;
                      return (
                        <button
                          key={opt.letter}
                          onClick={() => setAnswer(q.index, opt.letter)}
                          disabled={submitted}
                          className={`flex items-center gap-2 rounded-lg border-2 px-3 py-1.5 text-left text-[13px] transition-all ${
                            isCorrectOpt
                              ? "border-success/50 bg-success/10 text-success font-semibold"
                              : isWrongChosen
                                ? "border-error/50 bg-error/10 text-error font-semibold"
                                : chosen
                                  ? "border-accent bg-accent/10 text-ink font-semibold"
                                  : "border-border bg-surface text-text-secondary hover:border-accent/40"
                          } ${submitted ? "cursor-default" : "cursor-pointer"}`}
                        >
                          <span className="font-bold w-4 shrink-0">{opt.letter}</span>
                          <span className="flex-1">{opt.text}</span>
                          {isCorrectOpt && <Check className="h-3.5 w-3.5 shrink-0" />}
                          {isWrongChosen && <X className="h-3.5 w-3.5 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Fill-in input */}
                {q.type === "fill" && (
                  <input
                    type="text"
                    value={answers[q.index] ?? ""}
                    onChange={(e) => setAnswer(q.index, e.target.value)}
                    disabled={submitted}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && allAnswered && !submitted) handleSubmit();
                    }}
                    placeholder="Your answer…"
                    className={`mt-2 px-3 py-1 w-full max-w-[260px] text-sm rounded-lg border-2 outline-none transition-all ${
                      submitted
                        ? r?.correct
                          ? "border-success/40 bg-success/10 text-success font-semibold"
                          : "border-error/40 bg-error/10 text-error font-semibold"
                        : "bg-surface border-border focus:border-accent/50 text-ink"
                    }`}
                  />
                )}

                {/* Review line */}
                {submitted && r && (
                  <div className="mt-1.5 text-[12px] leading-relaxed">
                    {!r.correct && (
                      <span className="font-semibold text-success">Correct: {r.expected}</span>
                    )}
                    {q.why && (
                      <span className="text-text-muted">
                        {!r.correct ? " — " : ""}
                        {q.why}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer: submit OR score */}
      {!submitted ? (
        <div className="px-4 py-2.5 border-t border-accent/10 flex items-center justify-between">
          <span className="text-[10px] text-text-muted">Answer every question, then check</span>
          <button
            onClick={handleSubmit}
            disabled={!allAnswered || isLoading}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer active:scale-95 ${
              allAnswered && !isLoading
                ? "bg-accent text-white shadow-sm hover:brightness-110"
                : "bg-surface-hover border-2 border-border text-text-muted cursor-not-allowed opacity-50"
            }`}
          >
            <Send className="h-3 w-3" />
            Check Answers
          </button>
        </div>
      ) : (
        <div className="px-4 py-3 border-t border-accent/10 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-ink">
              {result.score}/{total}
            </span>
            <span className="text-[11px] font-semibold text-text-secondary inline-flex items-center gap-1">
              {scorePct}% · {renderBandMessage(scorePct)}
            </span>
          </div>
          {onAskCoach && (
            <button
              onClick={handleAskCoach}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold border-2 border-accent/30 text-accent hover:bg-accent/10 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
            >
              Ask coach about my mistakes
            </button>
          )}
        </div>
      )}
    </div>
  );
}
