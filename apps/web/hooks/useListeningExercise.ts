"use client";

import { useState, useCallback } from "react";
import type {
  CefrLevel,
  ExerciseType,
  ListeningExerciseResponse,
  ListeningSubmitResponse,
} from "@/lib/listening/types";
import { api } from "@/lib/api-client";

type State = "idle" | "loading" | "active" | "submitting" | "submitted";

export function useListeningExercise() {
  const [state, setState] = useState<State>("idle");
  const [exercise, setExercise] = useState<ListeningExerciseResponse | null>(null);
  const [result, setResult] = useState<ListeningSubmitResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<(number | null)[]>([]);
  const [replaysUsed, setReplaysUsed] = useState(0);
  const [selectedSpeed, setSelectedSpeed] = useState(1.0);

  const MAX_REPLAYS = 3;

  const generate = useCallback(async (level: CefrLevel, exerciseType: ExerciseType, examMode?: string) => {
    setState("loading");
    setError(null);
    setResult(null);

    try {
      const data = await api.post<ListeningExerciseResponse>("/listening/generate", {
        level, exerciseType, examMode,
      });
      setExercise(data);
      setSelectedAnswers(new Array(data.questions.length).fill(null));
      setReplaysUsed(0);
      setSelectedSpeed(1.0);
      setState("active");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate exercise");
      setState("idle");
    }
  }, []);

  const selectAnswer = useCallback((questionIndex: number, optionIndex: number) => {
    setSelectedAnswers((prev) => {
      const next = [...prev];
      next[questionIndex] = optionIndex;
      return next;
    });
  }, []);

  const submit = useCallback(async () => {
    if (!exercise) return;

    // Check all questions answered
    if (selectedAnswers.some((a) => a === null)) return;

    setState("submitting");
    setError(null);

    try {
      const data = await api.post<ListeningSubmitResponse>("/listening/submit", {
        exerciseId: exercise.id,
        answers: selectedAnswers as number[],
      });
      setResult(data);
      setState("submitted");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit");
      setState("active");
    }
  }, [exercise, selectedAnswers]);

  const useReplay = useCallback(() => {
    if (replaysUsed < MAX_REPLAYS) {
      setReplaysUsed((prev) => prev + 1);
      return true; // caller should replay audio
    }
    return false;
  }, [replaysUsed]);

  const cycleSpeed = useCallback(() => {
    setSelectedSpeed((prev) => {
      if (prev === 0.75) return 1.0;
      if (prev === 1.0) return 1.25;
      return 0.75;
    });
  }, []);

  const reset = useCallback(() => {
    setState("idle");
    setExercise(null);
    setResult(null);
    setError(null);
    setSelectedAnswers([]);
    setReplaysUsed(0);
    setSelectedSpeed(1.0);
  }, []);

  const allAnswered = selectedAnswers.length > 0 && selectedAnswers.every((a) => a !== null);

  return {
    state,
    exercise,
    result,
    error,
    selectedAnswers,
    replaysUsed,
    maxReplays: MAX_REPLAYS,
    selectedSpeed,
    allAnswered,
    generate,
    selectAnswer,
    submit,
    useReplay,
    cycleSpeed,
    reset,
  };
}
