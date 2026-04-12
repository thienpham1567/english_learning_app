"use client";

import { useState, useCallback } from "react";
import http from "@/lib/http";
import type { GrammarQuestion, QuizState } from "@/lib/grammar-quiz/types";
import { saveQuizHistory } from "@/components/app/grammar-quiz/QuizHistory";

const STORAGE_KEY = "grammar-quiz-level";

export function useGrammarQuiz() {
  const [state, setState] = useState<QuizState>("idle");
  const [level, setLevel] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem(STORAGE_KEY) ?? "medium";
    }
    return "medium";
  });
  const [questions, setQuestions] = useState<GrammarQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);

  const selectLevel = useCallback((newLevel: string) => {
    setLevel(newLevel);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, newLevel);
    }
  }, []);

  const generateQuiz = useCallback(
    async (quizLevel?: string, examMode?: string) => {
      const targetLevel = quizLevel ?? level;
      setState("loading");
      setError(null);
      try {
        const { data } = await http.post<{ questions: GrammarQuestion[] }>(
          "/grammar-quiz/generate",
          { level: targetLevel, count: 10, examMode },
        );
        setQuestions(data.questions);
        setAnswers(new Array(data.questions.length).fill(null));
        setCurrentIndex(0);
        setSelectedAnswer(null);
        setIsRevealed(false);
        setState("active");
      } catch {
        setError("Không thể tạo đề. Vui lòng thử lại.");
        setState("idle");
      }
    },
    [level],
  );

  const answerQuestion = useCallback(
    (optionIndex: number) => {
      if (isRevealed) return;
      setSelectedAnswer(optionIndex);
      setIsRevealed(true);
      setAnswers((prev) => {
        const next = [...prev];
        next[currentIndex] = optionIndex;
        return next;
      });
      // Combo tracking
      const isCorrect = optionIndex === questions[currentIndex]?.correctIndex;
      if (isCorrect) {
        setCombo((prev) => {
          const next = prev + 1;
          setMaxCombo((prevMax) => Math.max(prevMax, next));
          return next;
        });
      } else {
        setCombo(0);
      }
    },
    [currentIndex, isRevealed, questions],
  );

  const nextQuestion = useCallback(() => {
    const nextIdx = currentIndex + 1;
    if (nextIdx >= questions.length) {
      // Save to history before transitioning
      const finalScore = answers.reduce<number>(
        (acc, ans, i) => (ans !== null && ans === questions[i]?.correctIndex ? acc + 1 : acc),
        0,
      );
      saveQuizHistory({ level, score: finalScore, total: questions.length });
      // Award XP for quiz completion (fire-and-forget)
      void http.post("/xp", { activity: "quiz_complete" }).catch(() => {});
      setState("summary");
    } else {
      setCurrentIndex(nextIdx);
      setSelectedAnswer(null);
      setIsRevealed(false);
    }
  }, [currentIndex, questions, answers, level]);

  const retryQuiz = useCallback(() => {
    setAnswers(new Array(questions.length).fill(null));
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setIsRevealed(false);
    setCombo(0);
    setMaxCombo(0);
    setState("active");
  }, [questions.length]);

  const newQuiz = useCallback(() => {
    setQuestions([]);
    setAnswers([]);
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setIsRevealed(false);
    setCombo(0);
    setMaxCombo(0);
    setState("idle");
  }, []);

  const currentQuestion = state === "active" ? (questions[currentIndex] ?? null) : null;

  const score = answers.reduce<number>(
    (acc, ans, i) => (ans !== null && ans === questions[i]?.correctIndex ? acc + 1 : acc),
    0,
  );

  // Topic breakdown for summary
  const topicBreakdown = questions.reduce<Record<string, { correct: number; total: number }>>(
    (acc, q, i) => {
      const topic = q.grammarTopic;
      if (!acc[topic]) acc[topic] = { correct: 0, total: 0 };
      acc[topic].total += 1;
      if (answers[i] === q.correctIndex) acc[topic].correct += 1;
      return acc;
    },
    {},
  );

  return {
    state,
    level,
    questions,
    currentIndex,
    currentQuestion,
    answers,
    selectedAnswer,
    isRevealed,
    score,
    combo,
    maxCombo,
    topicBreakdown,
    error,
    selectLevel,
    generateQuiz,
    answerQuestion,
    nextQuestion,
    retryQuiz,
    newQuiz,
  };
}
