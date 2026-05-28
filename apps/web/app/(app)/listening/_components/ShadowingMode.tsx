"use client";

import {
  ChevronRight,
  CircleCheckBig,
  Info,
  Loader2,
  Mic,
  RefreshCw,
  Square,
  Volume2,
  XCircle,
} from "lucide-react";
import { motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { AudioPlayer } from "@/app/(app)/listening/_components/AudioPlayer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useSentenceAudio } from "@/hooks/useSentenceAudio";
import { api } from "@/lib/api-client";

type Sentence = { text: string; ipa: string; tip: string };
type WordAnalysis = { word: string; spoken: string; correct: boolean; issue?: string };
type EvalResult = {
  score: number;
  accuracy: number;
  fluency: number;
  feedback: string;
  wordAnalysis: WordAnalysis[];
  tips: string[];
};

type ShadowState =
  | "idle"
  | "loading"
  | "ready"
  | "recording"
  | "transcribing"
  | "evaluating"
  | "result"
  | "summary";

interface Props {
  examMode: string;
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

function scoreStroke(score: number): string {
  if (score >= 80) return "var(--success)";
  if (score >= 50) return "var(--warning)";
  return "var(--error)";
}

export default function ShadowingMode({ examMode }: Props) {
  const [state, setState] = useState<ShadowState>("idle");
  const [sentences, setSentences] = useState<Sentence[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [evalResult, setEvalResult] = useState<EvalResult | null>(null);
  const [spokenText, setSpokenText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sessionScores, setSessionScores] = useState<number[]>([]);
  const [skillUpdate, setSkillUpdate] = useState<{ cefr: string; levelUp: boolean } | null>(null);
  const [xpAwarded, setXpAwarded] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const currentSentence = sentences[currentIdx] ?? null;

  // AudioPlayer integration (Story 19.3.2 — AC4 migration)
  const sentenceAudio = useSentenceAudio();
  const [replaysUsed] = useState(0); // Shadowing has unlimited replays

  // Synthesize audio when sentence changes
  useEffect(() => {
    if (currentSentence && (state === "ready" || state === "recording")) {
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
    setEvalResult(null);
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

  // ── Recording ──
  const startRecording = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setError("Browser does not support audio recording.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/mp4";
      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.start();
      setState("recording");
    } catch {
      setError("Cannot access microphone.");
    }
  }, []);

  const stopRecording = useCallback(async () => {
    const recorder = mediaRecorderRef.current;
    if (!recorder || !currentSentence) return;

    return new Promise<void>((resolve) => {
      recorder.onstop = async () => {
        recorder.stream.getTracks().forEach((t) => t.stop());
        const audioBlob = new Blob(chunksRef.current, { type: "audio/webm" });
        setState("transcribing");

        try {
          const formData = new FormData();
          formData.append("audio", audioBlob, "recording.webm");
          const { text } = await api.post<{ text: string }>("/voice/transcribe", formData);
          setSpokenText(text);

          setState("evaluating");
          const result = await api.post<EvalResult>("/pronunciation/evaluate", {
            targetText: currentSentence.text,
            spokenText: text,
          });
          setEvalResult(result);
          setSessionScores((prev) => [...prev, result.score]);
          setState("result");
        } catch {
          setError("An error occurred during processing. Please try again.");
          setState("ready");
        }
        resolve();
      };
      recorder.stop();
    });
  }, [currentSentence]);

  // ── Next / Retry / Complete ──
  const nextSentence = useCallback(() => {
    if (currentIdx < sentences.length - 1) {
      setCurrentIdx((p) => p + 1);
      setEvalResult(null);
      setSpokenText("");
      sentenceAudio.clear();
      setState("ready");
    } else {
      // Pass current scores to avoid stale closure (F1 fix)
      completeSession(sessionScores);
    }
  }, [currentIdx, sentences.length, sessionScores, sentenceAudio]);

  const retryCurrent = useCallback(() => {
    setEvalResult(null);
    setSpokenText("");
    setSessionScores((prev) => prev.slice(0, -1));
    setState("ready");
  }, []);

  const completeSession = useCallback(async (finalScores: number[]) => {
    setState("loading");
    const scores = [...finalScores];
    const avg = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
    try {
      const data = await api.post<{
        xpAwarded: number;
        skillUpdate: { cefr: string; levelUp: boolean };
      }>("/shadowing/complete", {
        scores,
        avgScore: avg,
      });
      setXpAwarded(data.xpAwarded);
      setSkillUpdate(data.skillUpdate);
    } catch {
      /* continue to summary anyway */
    }
    setState("summary");
  }, []);

  const avgScore = sessionScores.length
    ? Math.round(sessionScores.reduce((a, b) => a + b, 0) / sessionScores.length)
    : 0;

  // Noop handlers for AudioPlayer compat (unlimited replays in Shadowing)
  const handleReplay = useCallback(() => true, []);
  const handleCycleSpeed = useCallback(() => {}, []);

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
          <Volume2 size={48} className="text-accent mx-auto mb-3" />
          <h2 className="mb-2 text-lg font-black text-text-primary">Shadowing</h2>
          <p className="text-text-secondary mb-2 text-[13px]">Listen → Repeat → Compare Pronunciation</p>
          <p className="text-text-secondary text-xs mb-6">
            5 sentences per session · Detailed AI evaluation · +25 XP
          </p>
          <Button onClick={startSession} className="h-11 px-8 text-[15px] font-black">
            Start Shadowing
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

      {/* ── Active: Ready / Recording / Processing ── */}
      {currentSentence && ["ready", "recording", "transcribing", "evaluating"].includes(state) && (
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

          {/* Sentence card */}
          <motion.div
            animate={state === "recording" ? { scale: [1, 1.01, 1] } : {}}
            transition={state === "recording" ? { repeat: Infinity, duration: 1.5 } : {}}
            className={`p-6 rounded-lg text-center bg-surface shadow-sm ${
              state === "recording"
                ? "border-2 border-[var(--error)]"
                : "border-2 border-border"
            }`}
          >
            <p className="text-xl font-bold mb-2 leading-normal text-text-primary">{currentSentence.text}</p>
            <p className="text-sm text-text-secondary mb-3 font-serif">{currentSentence.ipa}</p>
            <div className="text-xs text-text-muted flex items-center justify-center gap-1 cursor-help" title={currentSentence.tip}>
              <Info size={12} /> Pronunciation Tip: <span className="font-medium">{currentSentence.tip}</span>
            </div>
          </motion.div>

          {/* AudioPlayer — model sentence playback (AC4 migration) */}
          {sentenceAudio.audioUrl && (
            <AudioPlayer
              audioUrl={sentenceAudio.audioUrl}
              speed={1}
              replaysUsed={replaysUsed}
              maxReplays={999}
              onReplay={handleReplay}
              onCycleSpeed={handleCycleSpeed}
              selfManagedSpeed
            />
          )}
          {sentenceAudio.isLoading && (
            <div className="text-center text-xs text-text-muted flex items-center justify-center gap-1.5">
              <Loader2 size={14} className="animate-spin" /> Generating audio...
            </div>
          )}

          {/* Record button */}
          <div className="text-center">
            {state === "ready" && (
              <>
                <motion.button
                  onClick={startRecording}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  aria-label="Record"
                  className="w-20 h-20 rounded-full border-2 border-border text-3xl cursor-pointer bg-[var(--error)] text-white shadow-md hover:shadow-lg transition-shadow"
                >
                  <Mic size={28} className="mx-auto" />
                </motion.button>
                <p className="text-xs text-text-secondary mt-2">Press button to record</p>
              </>
            )}
            {state === "recording" && (
              <>
                <motion.button
                  onClick={stopRecording}
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ repeat: Infinity, duration: 1 }}
                  aria-label="Stop recording"
                  className="w-20 h-20 rounded-full border-3 border-[var(--error)] text-[var(--error)] text-xl cursor-pointer bg-surface"
                >
                  <Square size={24} className="mx-auto" />
                </motion.button>
                <p className="text-xs text-[var(--error)] mt-2 font-bold">
                  Recording... Click to stop
                </p>
              </>
            )}
            {(state === "transcribing" || state === "evaluating") && (
              <div>
                <Loader2 className="animate-spin text-accent mx-auto" size={32} />
                <p className="text-[13px] text-text-secondary mt-2">
                  {state === "transcribing" ? "Transcribing..." : "Evaluating..."}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Result ── */}
      {state === "result" && evalResult && currentSentence && (
        <div className="flex flex-col gap-4">
          {/* Score */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-6 text-center shadow"
          >
            {/* Custom circular progress */}
            <div className="relative w-[100px] h-[100px] mx-auto mb-2">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                <circle cx="50" cy="50" r="42" fill="none" stroke="var(--bg-deep)" strokeWidth="8" />
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  fill="none"
                  stroke={scoreStroke(evalResult.score)}
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${evalResult.score * 2.64} 264`}
                  className="transition-all duration-700 ease-out"
                />
              </svg>
              <span className={`absolute inset-0 flex items-center justify-center text-3xl font-black ${scoreColorClass(evalResult.score)}`}>
                {evalResult.score}
              </span>
            </div>
            <div className="flex justify-center gap-6 mt-4">
              <div>
                <p className="text-[11px] text-text-secondary m-0">Accuracy</p>
                <p className="text-lg font-bold m-0 text-text-primary">{evalResult.accuracy}%</p>
              </div>
              <div>
                <p className="text-[11px] text-text-secondary m-0">Fluency</p>
                <p className="text-lg font-bold m-0 text-text-primary">{evalResult.fluency}%</p>
              </div>
            </div>
          </motion.div>

          {/* What you said */}
          <Card shadowSize="sm" className="p-4">
            <p className="text-xs text-text-secondary font-bold mb-1">You said:</p>
            <p className="text-[15px] m-0 italic text-text-primary">&ldquo;{spokenText}&rdquo;</p>
          </Card>

          {/* Word analysis */}
          <Card shadowSize="sm" className="p-4">
            <p className="text-xs text-text-secondary mb-2 font-bold">Word Analysis:</p>
            <div className="flex flex-wrap gap-1.5">
              {evalResult.wordAnalysis.map((w, i) => (
                <span
                  key={i}
                  title={w.issue || "Correct!"}
                  className={`inline-flex items-center gap-0.5 text-[13px] py-1 px-2 rounded-lg border cursor-help ${
                    w.correct
                      ? "bg-success-bg border-[var(--success)] text-[var(--success)]"
                      : "bg-error-bg border-[var(--error)] text-[var(--error)]"
                  }`}
                >
                  {w.correct ? <CircleCheckBig size={11} /> : <XCircle size={11} />} {w.word}
                </span>
              ))}
            </div>
          </Card>

          {/* Feedback + tips */}
          <Card shadowSize="sm" className="p-4">
            <p className="text-[13px] mb-2 text-text-primary">{evalResult.feedback}</p>
            {evalResult.tips.length > 0 && (
              <ul className="m-0 text-[13px] text-text-secondary pl-4.5">
                {evalResult.tips.map((tip, i) => (
                  <li key={i}>{tip}</li>
                ))}
              </ul>
            )}
          </Card>

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
          <h2 className="mb-2 text-lg font-black text-text-primary">Shadowing Completed!</h2>
          <p className="text-text-secondary mb-2">
            Average Score: <strong className={`text-3xl ${scoreColorClass(avgScore)}`}>{avgScore}</strong>/100
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
                Sentence {i + 1}: {s}
              </span>
            ))}
          </div>
          <Button onClick={startSession} className="h-10 px-6 text-sm font-black flex items-center gap-1.5 mx-auto">
            <RefreshCw size={14} /> Practice Again
          </Button>
        </motion.div>
      )}
    </div>
  );
}
