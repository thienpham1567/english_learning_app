"use client";

/**
 * Generic TOEIC session driver. Used by:
 *  - /toeic/practice  (mode: practice — sends each answer to server)
 *  - /toeic/mock-test (mode: mock_test — 200Q, 2h)  [#2]
 *  - drill mode for SRS  [#8]
 *
 * Server is the source of truth for correctness. Client only knows
 * `selectedIndex` and `durationMs`. The server emits LearningEvent and
 * enqueues reviewTask on incorrect answers; mastery-engine reacts.
 */

import { useCallback, useRef, useState } from "react";
import { api } from "@/lib/api-client";

export type ToeicSessionMode = "practice" | "mock_test" | "drill";

export type ToeicSessionQuestion = {
  id: string;
  part: number;
  questionText: string | null;
  passageText: string | null;
  options: string[];
  /** -1 when reveal is not allowed (mock_test until completion). */
  correctIndex: number;
  explanationEn: string | null;
  explanationVi: string | null;
  audioUrl: string | null;
  /** For Part 2: { question, options[3] } URLs of segmented audio. */
  audioSegments: { question: string; options: string[] } | null;
  imageUrls: string[] | null;
  skillIds: string[];
  topic: string | null;
  parentId: string | null;
  groupOrder: number | null;
  number: number;
  examCode: string | null;
};

export type ToeicSessionState = "idle" | "loading" | "active" | "submitting" | "completed";

export type SessionStartParams = {
  mode: ToeicSessionMode;
  examCode?: string;
  part?: number | "listening" | "reading" | "all";
  count?: number;
  /** Time limit in ms; null/undefined = no limit. */
  timeLimit?: number;
  /** Filter by a single TOEIC subskill, e.g. "toeic.part5.verb_form". */
  skill?: string;
  /** For mode=drill: "skill" filter by skill OR "mistake" pull from due reviewTask. */
  drillSource?: "skill" | "mistake";
};

export type SessionAnswer = {
  questionId: string;
  selectedIndex: number | null;
  isCorrect: boolean | null;
  durationMs: number;
};

type CompleteResult = {
  correct: number;
  total: number;
  baselineSnapshot?: Record<string, number> | null;
};

export function useToeicSession() {
  const [state, setState] = useState<ToeicSessionState>("idle");
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<ToeicSessionQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<SessionAnswer[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [completedAt, setCompletedAt] = useState<number | null>(null);
  const [score, setScore] = useState<{ correct: number; total: number } | null>(null);
  const [baselineSnapshot, setBaselineSnapshot] = useState<Record<string, number> | null>(null);
  const questionShownAt = useRef<number>(0);

  const start = useCallback(async (params: SessionStartParams) => {
    setState("loading");
    setError(null);
    try {
      const res = await api.post<{
        attemptId: string;
        questions: ToeicSessionQuestion[];
      }>("/toeic-practice/start", params);
      setAttemptId(res.attemptId);
      setQuestions(res.questions);
      setAnswers([]);
      setCurrentIndex(0);
      setStartedAt(Date.now());
      setCompletedAt(null);
      setScore(null);
      setBaselineSnapshot(null);
      setState("active");
      questionShownAt.current = Date.now();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Không thể bắt đầu phiên TOEIC");
      setState("idle");
    }
  }, []);

  const answer = useCallback(
    async (selectedIndex: number | null) => {
      if (state !== "active" || !attemptId) return;
      const q = questions[currentIndex];
      if (!q) return;

      const durationMs = Date.now() - questionShownAt.current;
      // When server hides the answer (mock), correctIndex is -1 and we
      // cannot determine isCorrect locally. The /answer endpoint returns it.
      const localGuessIsCorrect =
        q.correctIndex === -1 || selectedIndex === null ? null : selectedIndex === q.correctIndex;

      const localAnswer: SessionAnswer = {
        questionId: q.id,
        selectedIndex,
        isCorrect: localGuessIsCorrect,
        durationMs,
      };
      setAnswers((prev) => [...prev, localAnswer]);

      try {
        const res = await api.post<{ ok: boolean; isCorrect: boolean | null }>(
          "/toeic-practice/answer",
          {
            attemptId,
            questionId: q.id,
            selectedIndex,
            durationMs,
          },
        );
        // Backfill server-confirmed correctness
        setAnswers((prev) =>
          prev.map((a, i) => (i === prev.length - 1 ? { ...a, isCorrect: res.isCorrect } : a)),
        );
      } catch (e: unknown) {
        // Local answer remains; server can recover from missed events.
        console.warn("answer submit failed", e);
      }
    },
    [state, attemptId, questions, currentIndex],
  );

  const next = useCallback(() => {
    setCurrentIndex((idx) => Math.min(idx + 1, questions.length - 1));
    questionShownAt.current = Date.now();
  }, [questions.length]);

  const goTo = useCallback(
    (idx: number) => {
      if (idx < 0 || idx >= questions.length) return;
      setCurrentIndex(idx);
      questionShownAt.current = Date.now();
    },
    [questions.length],
  );

  const complete = useCallback(async (): Promise<CompleteResult | null> => {
    if (!attemptId) return null;
    setState("submitting");
    try {
      const res = await api.post<CompleteResult>("/toeic-practice/complete", {
        attemptId,
      });
      setScore({ correct: res.correct, total: res.total });
      setBaselineSnapshot(res.baselineSnapshot ?? null);
      setCompletedAt(Date.now());
      setState("completed");
      return res;
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Không thể nộp bài");
      setState("active");
      return null;
    }
  }, [attemptId]);

  const reset = useCallback(() => {
    setState("idle");
    setAttemptId(null);
    setQuestions([]);
    setAnswers([]);
    setCurrentIndex(0);
    setStartedAt(null);
    setCompletedAt(null);
    setScore(null);
    setBaselineSnapshot(null);
    setError(null);
  }, []);

  return {
    state,
    attemptId,
    questions,
    currentIndex,
    currentQuestion: questions[currentIndex] ?? null,
    answers,
    score,
    baselineSnapshot,
    error,
    startedAt,
    completedAt,
    start,
    answer,
    next,
    goTo,
    complete,
    reset,
  };
}
