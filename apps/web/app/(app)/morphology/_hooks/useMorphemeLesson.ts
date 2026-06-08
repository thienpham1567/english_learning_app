"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api-client";
import type {
  MorphemeExercise,
  MorphemeLesson,
  MorphemeProgressItem,
} from "@/lib/morphology/schema";
import type { MorphemeCatalogItem } from "../_data/morphemes";

export type MorphemeLessonState = "loading" | "lesson" | "error" | "exercises" | "complete";

type CompleteResponse = {
  xpAwarded: number;
  alreadyCompleted: boolean;
  progress: MorphemeProgressItem;
};

interface UseMorphemeLessonArgs {
  item: MorphemeCatalogItem;
  onCompleted?: () => void;
}

/**
 * useMorphemeLesson — lifecycle for one morpheme: generate the AI lesson, run the
 * mixed exercises, grade each, and submit completion (XP + progress). Mirrors the
 * grammar-lessons hook; subcomponents stay presentational.
 */
export function useMorphemeLesson({ item, onCompleted }: UseMorphemeLessonArgs) {
  const [state, setState] = useState<MorphemeLessonState>("loading");
  const [lesson, setLesson] = useState<MorphemeLesson | null>(null);

  const [exerciseIdx, setExerciseIdx] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [combo, setCombo] = useState(0);
  const [answers, setAnswers] = useState<
    { exerciseType: MorphemeExercise["type"]; correct: boolean }[]
  >([]);

  const [xpAwarded, setXpAwarded] = useState(0);
  const [alreadyCompleted, setAlreadyCompleted] = useState(false);

  const loadLesson = useCallback(
    (forceRefresh = false) =>
      api.post<MorphemeLesson>("/morphology/generate", {
        morphemeId: item.id,
        morpheme: item.morpheme,
        type: item.type,
        gloss: item.gloss,
        forceRefresh,
      }),
    [item.id, item.morpheme, item.type, item.gloss],
  );

  const generateLesson = useCallback(
    async (forceRefresh = true) => {
      setState("loading");
      try {
        const data = await loadLesson(forceRefresh);
        setLesson(data);
        setState("lesson");
      } catch {
        setState("error");
      }
    },
    [loadLesson],
  );

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const data = await loadLesson();
        if (!cancelled) {
          setLesson(data);
          setState("lesson");
        }
      } catch {
        if (!cancelled) setState("error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loadLesson]);

  const exercises = lesson?.exercises ?? [];
  const currentExercise = exercises[exerciseIdx] ?? null;
  const totalCount = exercises.length;
  const scorePct = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;

  const startExercises = useCallback(() => {
    setExerciseIdx(0);
    setRevealed(false);
    setCorrectCount(0);
    setCombo(0);
    setAnswers([]);
    setState("exercises");
  }, []);

  const recordResult = useCallback(
    (correct: boolean) => {
      if (revealed || !currentExercise) return;
      setRevealed(true);
      setAnswers((prev) => [...prev, { exerciseType: currentExercise.type, correct }]);
      if (correct) {
        setCorrectCount((c) => c + 1);
        setCombo((c) => c + 1);
      } else {
        setCombo(0);
      }
    },
    [revealed, currentExercise],
  );

  const submitCompletion = useCallback(async () => {
    setState("complete");
    try {
      const data = await api.post<CompleteResponse>("/morphology/complete", {
        morphemeId: item.id,
        morpheme: item.morpheme,
        correctCount,
        totalCount,
        answers,
      });
      setXpAwarded(data.xpAwarded);
      setAlreadyCompleted(data.alreadyCompleted);
    } catch {
      /* still show summary without XP */
    }
    onCompleted?.();
  }, [item.id, item.morpheme, correctCount, totalCount, answers, onCompleted]);

  const next = useCallback(() => {
    if (exerciseIdx < totalCount - 1) {
      setExerciseIdx((i) => i + 1);
      setRevealed(false);
    } else {
      void submitCompletion();
    }
  }, [exerciseIdx, totalCount, submitCompletion]);

  return {
    state,
    lesson,
    exerciseIdx,
    totalCount,
    currentExercise,
    revealed,
    combo,
    correctCount,
    scorePct,
    answers,
    xpAwarded,
    alreadyCompleted,
    // actions
    generateLesson,
    startExercises,
    recordResult,
    next,
  };
}
