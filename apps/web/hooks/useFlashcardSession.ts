"use client";

import { useState, useCallback, useRef } from "react";
import { api } from "@/lib/api-client";
import type { DueCard } from "@/lib/flashcard/types";

type SessionState = "loading" | "active" | "empty" | "summary" | "error";

type SessionStats = {
  totalReviewed: number;
  totalQuality: number;
  forgottenCount: number;
  // Difficulty distribution buckets
  againCount: number;
  hardCount: number;
  goodCount: number;
  easyCount: number;
};

export function useFlashcardSession() {
  const [cards, setCards] = useState<DueCard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [state, setState] = useState<SessionState>("loading");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [nextReviewAt, setNextReviewAt] = useState<string | null>(null);
  const [stats, setStats] = useState<SessionStats>({
    totalReviewed: 0, totalQuality: 0, forgottenCount: 0,
    againCount: 0, hardCount: 0, goodCount: 0, easyCount: 0,
  });
  const hasFetched = useRef(false);

  const fetchDueCards = useCallback(async () => {
    if (hasFetched.current) return;
    hasFetched.current = true;
    setState("loading");
    try {
      const data = await api.get<{
        cards: DueCard[];
        nextReviewAt: string | null;
      }>("/flashcards/due");
      setCards(data.cards);
      setNextReviewAt(data.nextReviewAt);
      setCurrentIndex(0);
      setStats({ totalReviewed: 0, totalQuality: 0, forgottenCount: 0, againCount: 0, hardCount: 0, goodCount: 0, easyCount: 0 });
      setState(data.cards.length > 0 ? "active" : "empty");
    } catch {
      setState("error");
    }
  }, []);

  const submitReview = useCallback(
    async (quality: number) => {
      const card = cards[currentIndex];
      if (!card || isSubmitting) return;

      setIsSubmitting(true);
      try {
        await api.post("/flashcards/review", {
          query: card.query,
          quality,
        });

        setStats((prev) => ({
          totalReviewed: prev.totalReviewed + 1,
          totalQuality: prev.totalQuality + quality,
          forgottenCount: prev.forgottenCount + (quality < 3 ? 1 : 0),
          againCount: prev.againCount + (quality === 0 ? 1 : 0),
          hardCount: prev.hardCount + (quality === 2 ? 1 : 0),
          goodCount: prev.goodCount + (quality === 3 ? 1 : 0),
          easyCount: prev.easyCount + (quality === 5 ? 1 : 0),
        }));

        const nextIdx = currentIndex + 1;
        if (nextIdx >= cards.length) {
          setState("summary");
        } else {
          setCurrentIndex(nextIdx);
        }
      } finally {
        setIsSubmitting(false);
      }
    },
    [cards, currentIndex, isSubmitting],
  );

  const restart = useCallback(() => {
    hasFetched.current = false;
    setCards([]);
    setCurrentIndex(0);
    setStats({ totalReviewed: 0, totalQuality: 0, forgottenCount: 0, againCount: 0, hardCount: 0, goodCount: 0, easyCount: 0 });
    setState("loading");
    // Trigger re-fetch on next render cycle
    setTimeout(() => {
      hasFetched.current = false;
      fetchDueCards();
    }, 0);
  }, [fetchDueCards]);

  const currentCard = state === "active" ? (cards[currentIndex] ?? null) : null;
  const totalDue = cards.length;

  return {
    state,
    currentCard,
    currentIndex,
    totalDue,
    stats,
    isSubmitting,
    nextReviewAt,
    fetchDueCards,
    submitReview,
    restart,
  };
}
