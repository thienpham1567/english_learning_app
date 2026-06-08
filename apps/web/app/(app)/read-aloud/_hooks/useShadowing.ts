"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useVoiceInput } from "@/hooks/useVoiceInput";
import { api } from "@/lib/api-client";
import type { EvalResult } from "../_components/shadowing/ShadowResult";
import { splitIntoSentences } from "./useSentences";

/** Phases of a single sentence's shadowing cycle. */
export type ShadowStep = "idle" | "listening" | "ready" | "recording" | "evaluating" | "result";

export interface ShadowingCompletion {
  xpAwarded: number;
  skillUpdate: { cefr: string; levelUp: boolean; newLevel?: number } | null;
}

interface UseShadowingArgs {
  text: string;
  voiceRole: string;
  speed: number;
}

/**
 * useShadowing — state machine + side effects for the read-aloud Shadowing flow.
 *
 * Splits a passage into sentences, plays a native model for each, records the
 * learner, grades the attempt via /api/read-aloud/evaluate, and on completion
 * awards XP + updates the listening skill via /api/shadowing/complete.
 */
export function useShadowing({ text, voiceRole, speed }: UseShadowingArgs) {
  const sentences = useMemo(() => splitIntoSentences(text), [text]);

  const [currentIdx, setCurrentIdx] = useState(0);
  const [step, setStep] = useState<ShadowStep>("idle");
  const [evalResult, setEvalResult] = useState<EvalResult | null>(null);
  const [sentenceResults, setSentenceResults] = useState<(EvalResult | null)[]>([]);
  const [completion, setCompletion] = useState<ShadowingCompletion | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const voice = useVoiceInput({ autoTranscribe: false });
  const submittedRef = useRef(false);

  /* Reset everything when the passage changes. */
  useEffect(() => {
    setCurrentIdx(0);
    setStep("idle");
    setEvalResult(null);
    setSentenceResults(new Array(sentences.length).fill(null));
    setCompletion(null);
    setIsSubmitting(false);
    submittedRef.current = false;
    audioRef.current?.pause();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  /* Stop any reference audio on unmount. */
  useEffect(() => () => audioRef.current?.pause(), []);

  const currentSentence = sentences[currentIdx] ?? "";
  const completedCount = sentenceResults.filter(Boolean).length;
  const progress = sentences.length > 0 ? Math.round((completedCount / sentences.length) * 100) : 0;
  const isComplete = sentences.length > 0 && sentenceResults.every(Boolean);
  const avgScore =
    completedCount > 0
      ? Math.round(sentenceResults.reduce((sum, r) => sum + (r?.overall ?? 0), 0) / completedCount)
      : 0;

  /* ── Play native model audio for the current sentence ── */
  const playReference = useCallback(async () => {
    if (!currentSentence.trim()) return;
    setStep("listening");
    setEvalResult(null);

    try {
      const res = await fetch("/api/read-aloud", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: currentSentence.trim(), voice: voiceRole, speed }),
      });
      if (!res.ok) throw new Error("TTS failed");

      const url = URL.createObjectURL(await res.blob());
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => {
        URL.revokeObjectURL(url);
        setStep("ready");
      };
      audio.onerror = () => {
        URL.revokeObjectURL(url);
        toast.error("Audio playback error");
        setStep("idle");
      };
      await audio.play();
    } catch {
      toast.error("Unable to play model sentence");
      setStep("idle");
    }
  }, [currentSentence, voiceRole, speed]);

  /* ── Start recording the learner ── */
  const startRecording = useCallback(async () => {
    setStep("recording");
    await voice.start();
  }, [voice]);

  /* ── Stop recording and grade the attempt ── */
  const stopAndEvaluate = useCallback(async () => {
    setStep("evaluating");
    const { blob, durationMs } = await voice.stopAndGetBlob();

    if (!blob) {
      toast.error("No audio recording found. Please try again.");
      setStep("ready");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("audio", blob, "shadowing.webm");
      formData.append("referenceText", currentSentence.trim());
      formData.append("durationMs", String(Math.round(durationMs)));

      const res = await fetch("/api/read-aloud/evaluate", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Unknown" }));
        if (err.error === "no-speech") {
          toast.warning("Speech not recognized. Please speak clearly and try again.");
          setStep("ready");
          return;
        }
        throw new Error(err.error || `HTTP ${res.status}`);
      }

      const result: EvalResult = await res.json();
      setEvalResult(result);
      setSentenceResults((prev) => {
        const next = [...prev];
        next[currentIdx] = result;
        return next;
      });
      setStep("result");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "AI grading failed");
      setStep("ready");
    }
  }, [voice, currentSentence, currentIdx]);

  /* ── Submit completion once every sentence is graded ── */
  useEffect(() => {
    if (!isComplete || submittedRef.current) return;
    submittedRef.current = true;
    setIsSubmitting(true);

    const scores = sentenceResults.map((r) => r?.overall ?? 0);
    const avg = avgScore;

    api
      .post<ShadowingCompletion>("/shadowing/complete", { scores, avgScore: avg })
      .then((data) => setCompletion(data))
      .catch(() => {
        /* Non-fatal — still show the summary, just without XP details. */
      })
      .finally(() => setIsSubmitting(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isComplete]);

  /* ── Navigation ── */
  const goToIndex = useCallback(
    (i: number) => {
      if (i < 0 || i >= sentences.length) return;
      audioRef.current?.pause();
      setCurrentIdx(i);
      setStep("idle");
      setEvalResult(sentenceResults[i] ?? null);
    },
    [sentences.length, sentenceResults],
  );

  const goToNext = useCallback(() => {
    if (currentIdx < sentences.length - 1) goToIndex(currentIdx + 1);
  }, [currentIdx, sentences.length, goToIndex]);

  const retry = useCallback(() => {
    setStep("idle");
    setEvalResult(null);
  }, []);

  const restart = useCallback(() => {
    audioRef.current?.pause();
    setCurrentIdx(0);
    setStep("idle");
    setEvalResult(null);
    setSentenceResults(new Array(sentences.length).fill(null));
    setCompletion(null);
    setIsSubmitting(false);
    submittedRef.current = false;
  }, [sentences.length]);

  return {
    sentences,
    currentIdx,
    currentSentence,
    step,
    evalResult,
    sentenceResults,
    progress,
    completedCount,
    isComplete,
    completion,
    isSubmitting,
    avgScore,
    voiceSupported: voice.isSupported,
    // actions
    playReference,
    startRecording,
    stopAndEvaluate,
    goToIndex,
    goToNext,
    retry,
    restart,
  };
}
