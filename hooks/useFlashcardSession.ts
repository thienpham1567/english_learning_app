"use client";

import { useState, useCallback, useRef } from "react";
import http from "@/lib/http";
import type { DueCard } from "@/lib/flashcard/types";

type SessionState = "loading" | "active" | "empty" | "summary" | "error";

type SessionStats = {
  totalReviewed: number;
  totalQuality: number;
  forgottenCount: number;
};

export function useFlashcardSession() {
  const [cards, setCards] = useState<DueCard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [state, setState] = useState<SessionState>("loading");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [nextReviewAt, setNextReviewAt] = useState<string | null>(null);
  const [stats, setStats] = useState<SessionStats>({
    totalReviewed: 0,
    totalQuality: 0,
    forgottenCount: 0,
  });
  const hasFetched = useRef(false);

  const fetchDueCards = useCallback(async () => {
    if (hasFetched.current) return;
    hasFetched.current = true;
    setState("loading");
    try {
      const { data } = await http.get<{
        cards: DueCard[];
        nextReviewAt: string | null;
      }>("/flashcards/due");
      setCards(data.cards);
      setNextReviewAt(data.nextReviewAt);
      setCurrentIndex(0);
      setStats({ totalReviewed: 0, totalQuality: 0, forgottenCount: 0 });
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
        await http.post("/flashcards/review", {
          query: card.query,
          quality,
        });

        setStats((prev) => ({
          totalReviewed: prev.totalReviewed + 1,
          totalQuality: prev.totalQuality + quality,
          forgottenCount: prev.forgottenCount + (quality < 3 ? 1 : 0),
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
    setStats({ totalReviewed: 0, totalQuality: 0, forgottenCount: 0 });
    setState("loading");
    // Trigger re-fetch on next render cycle
    setTimeout(() => {
      hasFetched.current = false;
      fetchDueCards();
    }, 0);
  }, [fetchDueCards]);

  const currentCard = state === "active" ? cards[currentIndex] ?? null : null;
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

