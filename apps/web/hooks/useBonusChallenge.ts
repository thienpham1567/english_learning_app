"use client";

import { useState, useCallback, useRef } from "react";
import { api } from "@/lib/api-client";
import type {
  DailyChallenge,
  ExerciseAnswer,
} from "@/lib/daily-challenge/types";

type BonusState = "idle" | "loading" | "active" | "submitting" | "results" | "completed" | "error";

const BONUS_PROGRESS_KEY = "daily-bonus-progress";

function getTodayKey() {
  return new Date().toISOString().slice(0, 10);
}

function loadBonusProgress(): { date: string; currentExercise: number; userAnswers: { exerciseIndex: number; answer: string }[] } | null {
  try {
    const raw = localStorage.getItem(BONUS_PROGRESS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed.date !== getTodayKey()) {
      localStorage.removeItem(BONUS_PROGRESS_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function saveBonusProgress(currentExercise: number, userAnswers: { exerciseIndex: number; answer: string }[]) {
  try {
    localStorage.setItem(BONUS_PROGRESS_KEY, JSON.stringify({ date: getTodayKey(), currentExercise, userAnswers }));
  } catch { /* non-fatal */ }
}

function clearBonusProgress() {
  try { localStorage.removeItem(BONUS_PROGRESS_KEY); } catch { /* ignore */ }
}

export function useBonusChallenge() {
  const [state, setState] = useState<BonusState>("idle");
  const [challenge, setChallenge] = useState<DailyChallenge | null>(null);
  const [currentExercise, setCurrentExercise] = useState(0);
  const [userAnswers, setUserAnswers] = useState<{ exerciseIndex: number; answer: string }[]>([]);
  const [results, setResults] = useState<{ answers: ExerciseAnswer[]; score: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [timeElapsedMs, setTimeElapsedMs] = useState(0);
  const startTime = useRef(0);

  const startBonus = useCallback(async () => {
    setState("loading");
    setError(null);
    try {
      const data = await api.get<{ challenge: DailyChallenge }>("/daily-challenge/bonus");
      setChallenge(data.challenge);

      if (data.challenge.completedAt) {
        clearBonusProgress();
        setState("completed");
      } else {
        // Restore partial progress
        const saved = loadBonusProgress();
        if (saved && saved.userAnswers.length > 0 && saved.currentExercise < (data.challenge.exercises?.length ?? 3)) {
          setCurrentExercise(saved.currentExercise);
          setUserAnswers(saved.userAnswers);
        }
        startTime.current = Date.now();
        setTimeElapsedMs(0);
        setState("active");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Không thể tải bonus round.";
      setError(msg);
      setState("error");
    }
  }, []);

  const submitBonusAnswers = useCallback(
    async (answers: { exerciseIndex: number; answer: string }[]) => {
      setState("submitting");
      const elapsed = Date.now() - startTime.current;
      setTimeElapsedMs(elapsed);
      try {
        const data = await api.post<{ answers: ExerciseAnswer[]; score: number }>("/daily-challenge/bonus/submit", {
          answers,
          timeElapsedMs: elapsed,
        });
        setResults(data);
        clearBonusProgress();
        setState("results");
      } catch {
        setError("Không thể nộp bài bonus.");
        setState("active");
      }
    },
    [],
  );

  const answerExercise = useCallback(
    (answer: string) => {
      const newAnswers = [...userAnswers, { exerciseIndex: currentExercise, answer }];
      setUserAnswers(newAnswers);

      const totalExercises = challenge?.exercises.length ?? 3;
      if (currentExercise + 1 >= totalExercises) {
        clearBonusProgress();
        submitBonusAnswers(newAnswers);
      } else {
        const nextIdx = currentExercise + 1;
        setCurrentExercise(nextIdx);
        saveBonusProgress(nextIdx, newAnswers);
      }
    },
    [challenge, currentExercise, submitBonusAnswers, userAnswers],
  );

  return {
    state,
    challenge,
    currentExercise,
    results,
    error,
    timeElapsedMs,
    startBonus,
    answerExercise,
  };
}
