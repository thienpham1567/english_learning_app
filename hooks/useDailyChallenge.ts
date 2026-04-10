"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import http from "@/lib/http";
import type {
  DailyChallenge,
  ChallengeState,
  StreakInfo,
  Badge,
  ExerciseAnswer,
} from "@/lib/daily-challenge/types";

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
  const startTime = useRef(Date.now());

  // Fetch today's challenge on mount
  useEffect(() => {
    (async () => {
      try {
        const { data } = await http.get<{
          challenge: DailyChallenge;
          streak: StreakInfo;
          badges: Badge[];
        }>("/daily-challenge/today");

        setChallenge(data.challenge);
        setStreak(data.streak);
        setBadges(data.badges);

        if (data.challenge.completedAt) {
          setState("completed");
        } else {
          startTime.current = Date.now();
          setState("active");
        }
      } catch {
        setError("Không thể tải thử thách. Vui lòng thử lại.");
        setState("error");
      }
    })();
  }, []);

  const answerExercise = useCallback(
    (answer: string) => {
      const newAnswers = [...userAnswers, { exerciseIndex: currentExercise, answer }];
      setUserAnswers(newAnswers);

      const totalExercises = challenge?.exercises.length ?? 5;
      if (currentExercise + 1 >= totalExercises) {
        // Submit all answers
        submitAnswers(newAnswers);
      } else {
        setCurrentExercise((prev) => prev + 1);
      }
    },
    [currentExercise, userAnswers, challenge],
  );

  const submitAnswers = useCallback(
    async (answers: { exerciseIndex: number; answer: string }[]) => {
      setState("submitting");
      const elapsed = Date.now() - startTime.current;
      try {
        const { data } = await http.post<{
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
        setState("results");
      } catch {
        setError("Không thể nộp bài. Vui lòng thử lại.");
        setState("active");
      }
    },
    [],
  );

  const timeElapsedMs = Date.now() - startTime.current;

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
