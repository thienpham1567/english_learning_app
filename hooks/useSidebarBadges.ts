"use client";

import { useDashboard } from "@/hooks/useDashboard";

interface SidebarBadges {
  flashcardsDue: number;
  vocabDue: number;
  dailyChallengeCompleted: boolean;
}

/**
 * useSidebarBadges — derives sidebar badge counts from the shared
 * DashboardProvider instead of making a separate fetch.
 */
export function useSidebarBadges(): SidebarBadges | null {
  const { state } = useDashboard();

  if (state.status !== "ready") return null;

  return {
    flashcardsDue: state.data.flashcardsDue ?? 0,
    vocabDue: state.data.vocabDue ?? 0,
    dailyChallengeCompleted: state.data.dailyChallenge?.completed ?? false,
  };
}
