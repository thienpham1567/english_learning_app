"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api-client";

export type ToeicPartFilter = "3" | "4" | "5" | "6" | "7" | "listening" | "reading" | "all";

export type ToeicQuestion = {
  id: string;
  part: string;
  content: string;
  options: string[];
  correctIndex: number;
  explanationEn: string;
  explanationVi: string;
  topic: string;
  audio: string | null;
  images: { image_path: string }[] | null;
  parentId: string | null;
  examName: string;
  number: number;
};

export type ToeicState = "idle" | "loading" | "active" | "review";

const HISTORY_KEY = "toeic-practice-history";

export type ToeicHistoryEntry = {
  date: string;
  examName: string;
  part: string;
  score: number;
  total: number;
  timeMs: number;
};

function loadHistory(): ToeicHistoryEntry[] {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function saveHistory(entry: ToeicHistoryEntry) {
  const history = loadHistory();
  history.unshift(entry);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, 30)));
}

export function useToeicPractice() {
  const [state, setState] = useState<ToeicState>("idle");
  const [questions, setQuestions] = useState<ToeicQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedExam, setSelectedExam] = useState<string>("random");
  const [selectedPart, setSelectedPart] = useState<ToeicPartFilter>("all");
  const [questionCount, setQuestionCount] = useState(10);
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(0);
  const [history, setHistory] = useState<ToeicHistoryEntry[]>([]);

  useEffect(() => {
    setHistory(loadHistory());
  }, []);

  const startPractice = useCallback(async () => {
    setState("loading");
    setError(null);
    try {
      const body: Record<string, unknown> = {
        count: questionCount,
        part: selectedPart,
      };
      if (selectedExam !== "random") {
        body.examName = selectedExam;
      }
      const data = await api.post<{ questions: ToeicQuestion[] }>("/toeic-practice", body);
      setQuestions(data.questions);
      setAnswers(new Array(data.questions.length).fill(null));
      setCurrentIndex(0);
      setSelectedAnswer(null);
      setIsRevealed(false);
      setStartTime(Date.now());
      setState("active");
    } catch {
      setError("Không thể tải đề. Vui lòng thử lại.");
      setState("idle");
    }
  }, [selectedExam, selectedPart, questionCount]);

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
    },
    [currentIndex, isRevealed],
  );

  const nextQuestion = useCallback(() => {
    const nextIdx = currentIndex + 1;
    if (nextIdx >= questions.length) {
      const now = Date.now();
      setEndTime(now);
      const score = answers.reduce<number>(
        (acc, ans, i) => (ans !== null && ans === questions[i]?.correctIndex ? acc + 1 : acc),
        0,
      );
      const entry: ToeicHistoryEntry = {
        date: new Date().toISOString(),
        examName: selectedExam === "random" ? "Ngẫu nhiên" : selectedExam,
        part: selectedPart,
        score,
        total: questions.length,
        timeMs: now - startTime,
      };
      saveHistory(entry);
      setHistory(loadHistory());
      setState("review");
    } else {
      setCurrentIndex(nextIdx);
      setSelectedAnswer(null);
      setIsRevealed(false);
    }
  }, [currentIndex, questions, answers, startTime, selectedExam, selectedPart]);

  const resetPractice = useCallback(() => {
    setState("idle");
    setQuestions([]);
    setAnswers([]);
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setIsRevealed(false);
  }, []);

  const retryWrong = useCallback(() => {
    const wrong = questions.filter((_, i) => answers[i] !== questions[i]?.correctIndex);
    if (wrong.length === 0) return;
    setQuestions(wrong);
    setAnswers(new Array(wrong.length).fill(null));
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setIsRevealed(false);
    setStartTime(Date.now());
    setState("active");
  }, [questions, answers]);

  const score = answers.reduce<number>(
    (acc, ans, i) => (ans !== null && ans === questions[i]?.correctIndex ? acc + 1 : acc),
    0,
  );

  const currentQuestion = state === "active" ? (questions[currentIndex] ?? null) : null;

  return {
    state,
    questions,
    currentIndex,
    currentQuestion,
    answers,
    selectedAnswer,
    isRevealed,
    score,
    error,
    selectedExam,
    setSelectedExam,
    selectedPart,
    setSelectedPart,
    questionCount,
    setQuestionCount,
    history,
    startTime,
    endTime,
    startPractice,
    answerQuestion,
    nextQuestion,
    resetPractice,
    retryWrong,
  };
}
