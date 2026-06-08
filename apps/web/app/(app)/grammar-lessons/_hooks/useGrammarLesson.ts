"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api-client";
import { getUnitIdForGrammarTopic } from "@/lib/curriculum/grammar-mapping";
import { useRoadmap } from "@/lib/curriculum/roadmap-context";
import {
  type GrammarLessonAnswer,
  type GrammarLessonData,
  type GrammarLessonProgressItem,
  isGrammarAnswerCorrect,
} from "@/lib/grammar-lessons/schema";

export type LessonState = "loading" | "lesson" | "exercises" | "complete";
export type ExplLang = "vi" | "en";

type CompleteResponse = {
  xpAwarded: number;
  alreadyCompleted: boolean;
  loggedErrors: number;
  progress: GrammarLessonProgressItem;
};

interface UseGrammarLessonArgs {
  topicId: string;
  topicTitle: string;
  level: string;
  examMode: string;
  focusNote?: string;
  onComplete: (topicId: string, progress: GrammarLessonProgressItem) => void;
}

/**
 * useGrammarLesson — owns the full lesson lifecycle: generate the lesson, run
 * the practice exercises, grade answers, and submit completion (XP + roadmap).
 * Keeps LessonView and its subcomponents purely presentational.
 */
export function useGrammarLesson({
  topicId,
  topicTitle,
  level,
  examMode,
  focusNote,
  onComplete,
}: UseGrammarLessonArgs) {
  const { completeUnit } = useRoadmap();

  const [state, setState] = useState<LessonState>("loading");
  const [lesson, setLesson] = useState<GrammarLessonData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Per-exercise input
  const [exerciseIdx, setExerciseIdx] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [typedAnswer, setTypedAnswer] = useState("");
  const [revealed, setRevealed] = useState(false);
  const [hintUsed, setHintUsed] = useState(false);
  const [explLang, setExplLang] = useState<ExplLang>("vi");

  // Session aggregates
  const [correctCount, setCorrectCount] = useState(0);
  const [combo, setCombo] = useState(0);
  const [answers, setAnswers] = useState<GrammarLessonAnswer[]>([]);
  const [startedAt, setStartedAt] = useState<number | null>(null);

  // Completion result
  const [xpAwarded, setXpAwarded] = useState(0);
  const [loggedErrors, setLoggedErrors] = useState(0);
  const [alreadyCompleted, setAlreadyCompleted] = useState(false);

  const loadLesson = useCallback(
    (forceRefresh = false) =>
      api.post<GrammarLessonData>("/grammar-lessons/generate", {
        topic: topicId,
        topicTitle,
        examMode,
        level,
        focusNote,
        forceRefresh,
      }),
    [examMode, level, topicId, topicTitle, focusNote],
  );

  const generateLesson = useCallback(
    async (forceRefresh = true) => {
      setState("loading");
      setError(null);
      try {
        const data = await loadLesson(forceRefresh);
        setLesson(data);
        setState("lesson");
      } catch {
        setError("Failed to generate lesson. Please try again.");
        setState("lesson");
      }
    },
    [loadLesson],
  );

  // Auto-generate on mount
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const data = await loadLesson();
        if (!cancelled) {
          setLesson(data);
          setError(null);
          setState("lesson");
        }
      } catch {
        if (!cancelled) {
          setError("Failed to generate lesson. Please try again.");
          setState("lesson");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loadLesson]);

  const currentExercise = lesson?.exercises?.[exerciseIdx] ?? null;

  const resetExerciseInput = useCallback(() => {
    setSelected(null);
    setTypedAnswer("");
    setRevealed(false);
    setHintUsed(false);
    setExplLang("vi");
  }, []);

  const startExercises = useCallback(() => {
    setState("exercises");
    setExerciseIdx(0);
    setCorrectCount(0);
    setCombo(0);
    setAnswers([]);
    setStartedAt(Date.now());
    resetExerciseInput();
  }, [resetExerciseInput]);

  const recordAnswer = useCallback(
    (userAnswer: string, correct: boolean) => {
      if (revealed || !currentExercise) return;
      setAnswers((prev) => [
        ...prev,
        {
          exerciseId: currentExercise.id,
          type: currentExercise.type,
          questionStem: currentExercise.sentence,
          options: currentExercise.type === "multiple_choice" ? currentExercise.options : undefined,
          userAnswer,
          correctAnswer: currentExercise.answer,
          explanationVi: currentExercise.explanation,
          explanationEn: currentExercise.explanationEn,
          correct,
        },
      ]);
      setRevealed(true);
      if (correct) {
        setCorrectCount((c) => c + 1);
        setCombo((c) => c + 1);
      } else {
        setCombo(0);
      }
    },
    [revealed, currentExercise],
  );

  const handleAnswer = useCallback(
    (option: string) => {
      if (revealed || !currentExercise || currentExercise.type !== "multiple_choice") return;
      setSelected(option);
      recordAnswer(option, option === currentExercise.answer);
    },
    [revealed, currentExercise, recordAnswer],
  );

  const handleWrittenAnswer = useCallback(() => {
    if (!currentExercise || currentExercise.type === "multiple_choice") return;
    const userAnswer = typedAnswer.trim();
    if (!userAnswer) return;
    recordAnswer(
      userAnswer,
      isGrammarAnswerCorrect(userAnswer, currentExercise.answer, currentExercise.acceptedAnswers),
    );
  }, [currentExercise, typedAnswer, recordAnswer]);

  const nextExercise = useCallback(async () => {
    if (!lesson) return;
    if (exerciseIdx < lesson.exercises.length - 1) {
      setExerciseIdx((i) => i + 1);
      resetExerciseInput();
      return;
    }

    const completedAt = new Date().toISOString();
    const scorePct = Math.round((correctCount / lesson.exercises.length) * 100);
    const fallbackProgress: GrammarLessonProgressItem = {
      topicId,
      status: "completed",
      correctCount,
      totalCount: lesson.exercises.length,
      scorePct,
      completedAt,
      lastStudiedAt: completedAt,
    };

    try {
      const data = await api.post<CompleteResponse>("/grammar-lessons/complete", {
        topic: topicId,
        topicTitle,
        examMode,
        level,
        correctCount,
        totalCount: lesson.exercises.length,
        durationMs: startedAt ? Date.now() - startedAt : 0,
        answers,
      });
      setXpAwarded(data.xpAwarded);
      setLoggedErrors(data.loggedErrors);
      setAlreadyCompleted(data.alreadyCompleted);
      onComplete(topicId, data.progress);
    } catch {
      onComplete(topicId, fallbackProgress);
    }

    const roadmapUnitId = getUnitIdForGrammarTopic(topicId);
    if (roadmapUnitId) completeUnit(roadmapUnitId);
    setState("complete");
  }, [
    lesson,
    exerciseIdx,
    correctCount,
    answers,
    startedAt,
    topicId,
    topicTitle,
    examMode,
    level,
    onComplete,
    completeUnit,
    resetExerciseInput,
  ]);

  const totalCount = lesson?.exercises.length ?? 0;
  const scorePct = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;
  const wrongAnswers = answers.filter((a) => !a.correct);

  return {
    // state
    state,
    lesson,
    error,
    currentExercise,
    exerciseIdx,
    totalCount,
    selected,
    typedAnswer,
    revealed,
    hintUsed,
    explLang,
    correctCount,
    combo,
    answers,
    wrongAnswers,
    scorePct,
    xpAwarded,
    loggedErrors,
    alreadyCompleted,
    // setters
    setTypedAnswer,
    setHintUsed,
    setExplLang,
    // actions
    generateLesson,
    startExercises,
    handleAnswer,
    handleWrittenAnswer,
    nextExercise,
  };
}
