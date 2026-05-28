"use client";

import {
  Check,
  ChevronRight,
  CircleCheckBig,
  Info,
  Loader2,
  Pencil,
  RefreshCw,
  XCircle,
} from "lucide-react";
import { motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { AudioPlayer } from "@/app/(app)/listening/_components/AudioPlayer";
import { Button } from "@/components/ui/button";
import { useSentenceAudio } from "@/hooks/useSentenceAudio";
import { api } from "@/lib/api-client";

type Sentence = { text: string; ipa: string; tip: string };

type DiffWord = {
  word: string;
  typed?: string;
  status: "correct" | "wrong" | "missing";
};

type DictationState = "idle" | "loading" | "ready" | "checked" | "summary";

interface Props {
  examMode: string;
}

const MAX_REPLAYS = 3;

const STATUS_COLORS: Record<string, string> = {
  correct: "text-[var(--success)]",
  wrong: "text-[var(--error)]",
  missing: "text-[var(--warning)]",
};

const STATUS_BG: Record<string, string> = {
  correct: "bg-success-bg border-[var(--success)]",
  wrong: "bg-error-bg border-[var(--error)]",
  missing: "bg-warning-bg border-[var(--warning)]",
};

const STATUS_DOT: Record<string, string> = {
  correct: "bg-[var(--success)]",
  wrong: "bg-[var(--error)]",
  missing: "bg-[var(--warning)]",
};

/** Normalize text for comparison: lowercase, strip punctuation */
function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s']/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Compare target vs typed at word level */
function diffWords(target: string, typed: string): DiffWord[] {
  const targetWords = normalize(target).split(/\s+/).filter(Boolean);
  const typedWords = normalize(typed).split(/\s+/).filter(Boolean);

  return targetWords.map((word, i) => {
    if (i < typedWords.length && typedWords[i] === word) {
      return { word, status: "correct" };
    } else if (i < typedWords.length) {
      return { word, typed: typedWords[i], status: "wrong" };
    } else {
      return { word, status: "missing" };
    }
  });
}

function scoreColorClass(score: number): string {
  if (score >= 80) return "text-[var(--success)]";
  if (score >= 50) return "text-[var(--warning)]";
  return "text-[var(--error)]";
}

function scoreBorderColor(score: number): string {
  if (score >= 80) return "border-[var(--success)]";
  if (score >= 50) return "border-[var(--warning)]";
  return "border-[var(--error)]";
}

function scoreBgColor(score: number): string {
  if (score >= 80) return "bg-success-bg";
  if (score >= 50) return "bg-warning-bg";
  return "bg-error-bg";
}

export default function DictationMode({ examMode }: Props) {
  const [state, setState] = useState<DictationState>("idle");
  const [sentences, setSentences] = useState<Sentence[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [typedText, setTypedText] = useState("");
  const [diff, setDiff] = useState<DiffWord[]>([]);
  const [accuracy, setAccuracy] = useState(0);
  const [replaysUsed, setReplaysUsed] = useState(0);
  const [sessionScores, setSessionScores] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [skillUpdate, setSkillUpdate] = useState<{ cefr: string; levelUp: boolean } | null>(null);
  const [xpAwarded, setXpAwarded] = useState(0);

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const currentSentence = sentences[currentIdx] ?? null;

  // AudioPlayer integration (Story 19.3.2 — AC4 migration)
  const sentenceAudio = useSentenceAudio();

  // Synthesize audio when sentence changes
  useEffect(() => {
    if (currentSentence && state === "ready") {
      sentenceAudio.synthesize(currentSentence.text);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIdx, currentSentence?.text]);

  // ── Generate sentences ──
  const startSession = useCallback(async () => {
    setState("loading");
    setError(null);
    setSessionScores([]);
    setCurrentIdx(0);
    setTypedText("");
    setDiff([]);
    setReplaysUsed(0);
    setSkillUpdate(null);
    setXpAwarded(0);
    sentenceAudio.clear();

    try {
      const data = await api.post<{ sentences: Sentence[] }>("/pronunciation/sentences", {
        level: "intermediate",
        count: 5,
        examMode,
      });
      if (!data.sentences?.length) throw new Error("No sentences");
      setSentences(data.sentences);
      setState("ready");
    } catch {
      setError("Unable to generate exercise. Please try again.");
      setState("idle");
    }
  }, [examMode, sentenceAudio]);

  // Replay handler for AudioPlayer — counts replays
  const handleReplay = useCallback(() => {
    if (replaysUsed >= MAX_REPLAYS) return false;
    setReplaysUsed((p) => p + 1);
    return true;
  }, [replaysUsed]);

  // Noop for speed — AudioPlayer manages speed internally
  const handleCycleSpeed = useCallback(() => {}, []);

  // ── Check answer ──
  const checkAnswer = useCallback(() => {
    if (!currentSentence || !typedText.trim()) return;
    const result = diffWords(currentSentence.text, typedText);
    const correctCount = result.filter((w) => w.status === "correct").length;
    const pct = Math.round((correctCount / result.length) * 100);
    setDiff(result);
    setAccuracy(pct);
    setSessionScores((prev) => [...prev, pct]);
    setState("checked");
  }, [currentSentence, typedText]);

  // ── Next sentence ──
  const nextSentence = useCallback(() => {
    if (currentIdx < sentences.length - 1) {
      setCurrentIdx((p) => p + 1);
      setTypedText("");
      setDiff([]);
      setReplaysUsed(0);
      sentenceAudio.clear();
      setState("ready");
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      completeSession(sessionScores);
    }
  }, [currentIdx, sentences.length, sessionScores, sentenceAudio]);

  // ── Retry current sentence ──
  const retryCurrent = useCallback(() => {
    setTypedText("");
    setDiff([]);
    setSessionScores((prev) => prev.slice(0, -1));
    setReplaysUsed(0);
    setState("ready");
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  // ── Complete session ──
  const completeSession = useCallback(async (finalScores: number[]) => {
    setState("loading");
    const scores = [...finalScores];
    const avg = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
    try {
      const data = await api.post<{
        xpAwarded: number;
        skillUpdate: { cefr: string; levelUp: boolean };
      }>("/dictation/complete", {
        scores,
        avgAccuracy: avg,
      });
      setXpAwarded(data.xpAwarded);
      setSkillUpdate(data.skillUpdate);
    } catch {
      /* continue to summary */
    }
    setState("summary");
  }, []);

  const avgScore = sessionScores.length
    ? Math.round(sessionScores.reduce((a, b) => a + b, 0) / sessionScores.length)
    : 0;

  // ── RENDER ──
  return (
    <div className="w-full max-w-2xl mx-auto">
      {error && (
        <div className="py-2.5 px-4 rounded-lg text-[var(--error)] mb-4 text-[13px] bg-error-bg border-2 border-[color-mix(in_srgb,var(--error)_25%,var(--border))] flex items-center gap-1.5">
          ⚠️ {error}
        </div>
      )}

      {/* ── Idle ── */}
      {state === "idle" && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center p-8 border-2 border-border rounded-lg bg-surface shadow"
        >
          <Pencil size={48} className="text-accent mx-auto mb-3" />
          <h2 className="mb-2 text-lg font-black text-text-primary">Dictation</h2>
          <p className="text-text-secondary mb-2 text-[13px]">Listen → Type → Check each word</p>
          <p className="text-text-secondary text-xs mb-6">
            5 sentences per session · Max 3 replays · +25 XP
          </p>
          <Button onClick={startSession} className="h-11 px-8 text-[15px] font-black">
            Start Dictation
          </Button>
        </motion.div>
      )}

      {/* ── Loading ── */}
      {state === "loading" && (
        <div className="text-center py-10">
          <Loader2 className="animate-spin text-accent mx-auto" size={32} />
          <p className="text-text-secondary mt-3">Generating exercise...</p>
        </div>
      )}

      {/* ── Ready: Listen + Type ── */}
      {state === "ready" && currentSentence && (
        <div className="flex flex-col gap-5">
          {/* Progress */}
          <div className="flex items-center gap-3 text-[13px] text-text-secondary">
            <span className="font-bold">
              Sentence {currentIdx + 1}/{sentences.length}
            </span>
            <div className="flex-1 h-1.5 rounded-full bg-bg-deep overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-accent"
                initial={{ width: 0 }}
                animate={{ width: `${((currentIdx + 1) / sentences.length) * 100}%` }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
            </div>
          </div>

          {/* Instruction */}
          <div className="p-4 rounded-lg text-center border-2 border-border bg-surface">
            <p className="text-sm text-text-secondary m-0">
              🎧 Listen and type the sentence you hear
            </p>
          </div>

          {/* AudioPlayer — sentence playback (AC4 migration) */}
          {sentenceAudio.audioUrl ? (
            <AudioPlayer
              audioUrl={sentenceAudio.audioUrl}
              speed={1}
              replaysUsed={replaysUsed}
              maxReplays={MAX_REPLAYS}
              onReplay={handleReplay}
              onCycleSpeed={handleCycleSpeed}
              selfManagedSpeed
            />
          ) : sentenceAudio.isLoading ? (
            <div className="text-center py-5">
              <Loader2 className="animate-spin text-accent mx-auto" size={24} />
              <p className="text-xs text-text-muted mt-2">Generating audio...</p>
            </div>
          ) : null}

          {/* Text input */}
          <textarea
            ref={inputRef}
            value={typedText}
            onChange={(e) => setTypedText(e.target.value)}
            placeholder="Type the sentence you hear..."
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                checkAnswer();
              }
            }}
            className="w-full h-[100px] p-4 rounded-lg border-2 border-border text-[15px] leading-relaxed bg-surface text-text-primary font-[inherit] resize-y outline-none focus-visible:shadow-sm focus-visible:-translate-y-0.5 transition-all"
          />

          {/* Check button */}
          <Button
            onClick={checkAnswer}
            disabled={!typedText.trim()}
            className="h-11 text-[15px] font-black flex items-center justify-center gap-1.5"
          >
            Check{" "}
            <motion.span
              animate={typedText.trim() ? { scale: [1, 1.15, 1] } : { scale: 1 }}
              transition={{ duration: 0.3 }}
              className="flex items-center"
            >
              <Check size={16} />
            </motion.span>
          </Button>
        </div>
      )}

      {/* ── Checked: Show diff ── */}
      {state === "checked" && currentSentence && (
        <div className="flex flex-col gap-4">
          {/* Score */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`p-6 rounded-lg border-2 border-border text-center bg-surface shadow`}
          >
            {/* Custom circular progress */}
            <div className="relative w-[100px] h-[100px] mx-auto mb-3">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  fill="none"
                  stroke="var(--bg-deep)"
                  strokeWidth="8"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  fill="none"
                  stroke={
                    accuracy >= 80
                      ? "var(--success)"
                      : accuracy >= 50
                        ? "var(--warning)"
                        : "var(--error)"
                  }
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${accuracy * 2.64} 264`}
                  className="transition-all duration-700 ease-out"
                />
              </svg>
              <span
                className={`absolute inset-0 flex items-center justify-center text-3xl font-black ${scoreColorClass(accuracy)}`}
              >
                {accuracy}%
              </span>
            </div>
            <p className="text-[13px] text-text-secondary mt-2">
              {accuracy === 100
                ? "Perfect! 🎉"
                : accuracy >= 80
                  ? "Very Good! 👏"
                  : accuracy >= 50
                    ? "Good job, keep it up! 💪"
                    : "Needs practice 📝"}
            </p>
          </motion.div>

          {/* Word diff */}
          <div className="p-4 rounded-lg border-2 border-border bg-surface">
            <p className="text-xs text-text-secondary mb-2 font-bold">Word Analysis:</p>
            <div className="flex flex-wrap gap-1.5">
              {diff.map((w, i) => (
                <span
                  key={i}
                  className={`inline-flex items-center gap-0.5 py-1 px-2 rounded-lg text-sm font-medium border ${STATUS_BG[w.status]} ${STATUS_COLORS[w.status]}`}
                >
                  {w.status === "correct" && <CircleCheckBig size={11} />}
                  {w.status === "wrong" && <XCircle size={11} />}
                  {w.status === "missing" && <Info size={11} />}
                  {w.word}
                  {w.status === "wrong" && w.typed && (
                    <span className="text-[11px] ml-1 opacity-70">({w.typed})</span>
                  )}
                </span>
              ))}
            </div>
            <div className="mt-3 flex gap-4 text-[11px] text-text-secondary">
              <span className="flex items-center gap-1">
                <span className={`w-2 h-2 rounded-full ${STATUS_DOT.correct}`} /> Correct
              </span>
              <span className="flex items-center gap-1">
                <span className={`w-2 h-2 rounded-full ${STATUS_DOT.wrong}`} /> Incorrect
              </span>
              <span className="flex items-center gap-1">
                <span className={`w-2 h-2 rounded-full ${STATUS_DOT.missing}`} /> Missing
              </span>
            </div>
          </div>

          {/* Revealed original */}
          <div className="p-4 rounded-lg border-2 border-border bg-surface">
            <p className="text-xs text-text-secondary font-bold mb-1">Original Sentence:</p>
            <p className="text-base font-bold mb-1 text-text-primary">{currentSentence.text}</p>
            <p className="text-[13px] text-text-secondary mb-2 font-serif">{currentSentence.ipa}</p>
            <p className="text-xs text-text-secondary m-0 flex items-center gap-1">
              <Info size={11} />
              {currentSentence.tip}
            </p>
          </div>

          {/* What you typed */}
          <div className="p-4 rounded-lg border-2 border-border bg-surface">
            <p className="text-xs text-text-secondary font-bold mb-1">You typed:</p>
            <p className="text-[15px] m-0 italic text-text-primary">&ldquo;{typedText}&rdquo;</p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-center">
            <motion.button
              onClick={retryCurrent}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.97 }}
              className="rounded-lg border-2 border-border bg-surface cursor-pointer text-[13px] font-bold py-2.5 px-5 text-text-primary hover:bg-surface-hover hover:shadow-sm transition-all duration-100 flex items-center gap-1.5"
            >
              <RefreshCw size={14} /> Retry
            </motion.button>
            <Button
              onClick={nextSentence}
              className="text-[13px] font-black py-2.5 px-5 flex items-center gap-1.5"
            >
              {currentIdx < sentences.length - 1 ? (
                <>
                  Next Sentence <ChevronRight size={14} />
                </>
              ) : (
                <>
                  Complete <CircleCheckBig size={14} />
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* ── Summary ── */}
      {state === "summary" && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center p-8 border-2 border-border rounded-lg bg-surface shadow"
        >
          <div className="mb-4">
            {avgScore >= 80 ? (
              <CircleCheckBig size={48} className="text-[var(--success)] mx-auto" />
            ) : avgScore >= 50 ? (
              <Info size={48} className="text-[var(--warning)] mx-auto" />
            ) : (
              <XCircle size={48} className="text-[var(--error)] mx-auto" />
            )}
          </div>
          <h2 className="mb-2 text-lg font-black text-text-primary">Dictation Completed!</h2>
          <p className="text-text-secondary mb-2">
            Average Accuracy:{" "}
            <strong className={`text-3xl ${scoreColorClass(avgScore)}`}>{avgScore}%</strong>
          </p>
          {xpAwarded > 0 && (
            <p className="text-accent text-[13px] font-bold mb-2">+{xpAwarded} XP</p>
          )}
          {skillUpdate && (
            <p
              className={`text-[13px] mb-4 ${
                skillUpdate.levelUp ? "text-[var(--success)]" : "text-text-secondary"
              }`}
            >
              {skillUpdate.levelUp
                ? `🎉 Listening Level: ${skillUpdate.cefr}!`
                : `📊 Listening Level: ${skillUpdate.cefr}`}
            </p>
          )}
          <div className="flex gap-2 justify-center flex-wrap mb-5">
            {sessionScores.map((s, i) => (
              <span
                key={i}
                className={`text-[13px] font-bold py-1 px-2.5 rounded-lg border-2 ${scoreBorderColor(s)} ${scoreBgColor(s)} ${scoreColorClass(s)}`}
              >
                Sentence {i + 1}: {s}%
              </span>
            ))}
          </div>
          <Button
            onClick={startSession}
            className="h-10 px-6 text-sm font-black flex items-center gap-1.5 mx-auto"
          >
            <RefreshCw size={14} /> Practice Again
          </Button>
        </motion.div>
      )}
    </div>
  );
}
