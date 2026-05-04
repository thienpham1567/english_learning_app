"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { api } from "@/lib/api-client";
import type {
  DailyChallenge,
  ChallengeState,
  StreakInfo,
  Badge,
  ExerciseAnswer,
} from "@/lib/daily-challenge/types";

const PROGRESS_KEY = "daily-challenge-progress";

type SavedProgress = {
  date: string;
  currentExercise: number;
  userAnswers: { exerciseIndex: number; answer: string }[];
};

function getTodayKey() {
  return new Date().toISOString().slice(0, 10);
}

function loadSavedProgress(): SavedProgress | null {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SavedProgress;
    // Only restore if it's today's progress
    if (parsed.date !== getTodayKey()) {
      localStorage.removeItem(PROGRESS_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function saveProgress(currentExercise: number, userAnswers: { exerciseIndex: number; answer: string }[]) {
  try {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify({
      date: getTodayKey(),
      currentExercise,
      userAnswers,
    }));
  } catch { /* localStorage full — non-fatal */ }
}

function clearProgress() {
  try { localStorage.removeItem(PROGRESS_KEY); } catch { /* ignore */ }
}

export function useDailyChallenge() {
  const [state, setState] = useState<ChallengeState>("loading");
  const [challenge, setChallenge] = useState<DailyChallenge | null>(null);
  const [streak, setStreak] = useState<StreakInfo>({
    currentStreak: 0,
    bestStreak: 0,
    lastCompletedDate: null,
  });
  const [badges, setBadges] = useState<Badge[]>([]);
  const [currentExercise, setCurrentExercise] = useState(0);
  const [userAnswers, setUserAnswers] = useState<{ exerciseIndex: number; answer: string }[]>([]);
  const [results, setResults] = useState<{
    answers: ExerciseAnswer[];
    score: number;
    newBadges: Badge[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [timeElapsedMs, setTimeElapsedMs] = useState(0);
  const startTime = useRef(0);

  // Fetch today's challenge on mount
  useEffect(() => {
    (async () => {
      try {
        const data = await api.get<{
          challenge: DailyChallenge;
          streak: StreakInfo;
          badges: Badge[];
        }>("/daily-challenge/today");

        setChallenge(data.challenge);
          setStreak(data.streak);
          setBadges(data.badges);

          if (data.challenge.completedAt) {
            clearProgress();
            setState("completed");
          } else {
            // Restore partial progress if available
            const saved = loadSavedProgress();
            if (saved && saved.userAnswers.length > 0 && saved.currentExercise < (data.challenge.exercises?.length ?? 5)) {
              setCurrentExercise(saved.currentExercise);
              setUserAnswers(saved.userAnswers);
            }
            startTime.current = Date.now();
            setTimeElapsedMs(0);
            setState("active");
          }
      } catch {
        setError("Không thể tải thử thách. Vui lòng thử lại.");
        setState("error");
      }
    })();
  }, []);

  const submitAnswers = useCallback(
    async (answers: { exerciseIndex: number; answer: string }[]) => {
      setState("submitting");
      const elapsed = Date.now() - startTime.current;
      setTimeElapsedMs(elapsed);
      try {
        const data = await api.post<{
          answers: ExerciseAnswer[];
          score: number;
          streak: StreakInfo;
          badges: Badge[];
          newBadges: Badge[];
        }>("/daily-challenge/submit", {
          answers,
          timeElapsedMs: elapsed,
        });

        setResults({
          answers: data.answers,
          score: data.score,
          newBadges: data.newBadges,
        });
        setStreak(data.streak);
        setBadges(data.badges);

        // Log wrong answers to Error Notebook (fire-and-forget)
        const wrongAnswers = data.answers
          .filter((a: ExerciseAnswer) => a.isCorrect === false)
          .map((a: ExerciseAnswer) => {
            const exercise = challenge?.exercises[a.exerciseIndex];
            if (!exercise) return null;
            const stem = exercise.instruction || JSON.stringify(exercise.data);
            return {
              sourceModule: "daily-challenge",
              questionStem: stem,
              userAnswer: a.answer,
              correctAnswer: a.explanation ?? "N/A",
              explanationVi: a.explanation,
              grammarTopic: exercise.type,
            };
          })
          .filter(Boolean);

        if (wrongAnswers.length > 0) {
          void api.post("/errors", { errors: wrongAnswers }).catch(() => {});
        }

        // Clear saved progress on successful submission
        clearProgress();
        setState("results");
      } catch {
        setError("Không thể nộp bài. Vui lòng thử lại.");
        setState("active");
      }
    },
    [challenge],
  );

  const answerExercise = useCallback(
    (answer: string) => {
      const newAnswers = [...userAnswers, { exerciseIndex: currentExercise, answer }];
      setUserAnswers(newAnswers);

      const totalExercises = challenge?.exercises.length ?? 5;
      if (currentExercise + 1 >= totalExercises) {
        clearProgress();
        submitAnswers(newAnswers);
      } else {
        const nextIdx = currentExercise + 1;
        setCurrentExercise(nextIdx);
        // Persist partial progress to localStorage
        saveProgress(nextIdx, newAnswers);
      }
    },
    [challenge, currentExercise, submitAnswers, userAnswers],
  );

  return {
    state,
    challenge,
    streak,
    badges,
    currentExercise,
    results,
    error,
    timeElapsedMs,
    answerExercise,
  };
}
