"use client";

import { useState, useCallback } from "react";
import { api } from "@/lib/api-client";
import { message } from "antd";
import type { ErrorEntry, SRSGrade } from "../_types/types";

interface UseErrorSRSReturn {
  /** Errors due for review */
  queue: ErrorEntry[];
  /** Total due count (may be > queue.length if capped) */
  dueCount: number;
  /** Currently reviewing */
  currentIndex: number;
  /** Loading state */
  loading: boolean;
  /** Grading state */
  grading: boolean;
  /** Session stats */
  reviewed: number;
  correct: number;
  /** Is session complete */
  isComplete: boolean;
  /** Fetch the review queue */
  fetchQueue: () => Promise<void>;
  /** Grade the current card and advance */
  gradeAndNext: (grade: SRSGrade) => Promise<void>;
  /** Reset session */
  resetSession: () => void;
  /** Current error being reviewed */
  currentError: ErrorEntry | null;
}

export function useErrorSRS(): UseErrorSRSReturn {
  const [queue, setQueue] = useState<ErrorEntry[]>([]);
  const [dueCount, setDueCount] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [grading, setGrading] = useState(false);
  const [reviewed, setReviewed] = useState(0);
  const [correct, setCorrect] = useState(0);

  const fetchQueue = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get<{ errors: ErrorEntry[]; dueCount: number }>("/errors/review");
      if (data) {
        setQueue(data.errors);
        setDueCount(data.dueCount);
        setCurrentIndex(0);
        setReviewed(0);
        setCorrect(0);
      }
    } catch {
      message.error("Không thể tải hàng đợi ôn tập");
    } finally {
      setLoading(false);
    }
  }, []);

  const gradeAndNext = useCallback(async (grade: SRSGrade) => {
    if (currentIndex >= queue.length) return;

    const error = queue[currentIndex];
    setGrading(true);

    try {
      await api.post("/errors/review", {
        errorId: error.id,
        grade,
      });

      setReviewed((r) => r + 1);
      if (grade >= 3) setCorrect((c) => c + 1);
      setCurrentIndex((i) => i + 1);
    } catch {
      message.error("Không thể lưu kết quả ôn tập");
    } finally {
      setGrading(false);
    }
  }, [currentIndex, queue]);

  const resetSession = useCallback(() => {
    setCurrentIndex(0);
    setReviewed(0);
    setCorrect(0);
  }, []);

  const currentError = currentIndex < queue.length ? queue[currentIndex] : null;
  const isComplete = queue.length > 0 && currentIndex >= queue.length;

  return {
    queue,
    dueCount,
    currentIndex,
    loading,
    grading,
    reviewed,
    correct,
    isComplete,
    fetchQueue,
    gradeAndNext,
    resetSession,
    currentError,
  };
}
