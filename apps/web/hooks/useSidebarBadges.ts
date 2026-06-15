"use client";

import { useEffect, useState } from "react";
import { useDashboard } from "@/hooks/useDashboard";
import { api } from "@/lib/api-client";

interface SidebarBadges {
  vocabDue: number;
  /** Unified review task count from /api/review/due (Story 22.5, AC: 1). */
  reviewDue: number;
}

/**
 * useSidebarBadges — derives sidebar badge counts from the shared
 * DashboardProvider and the unified review API.
 *
 * AC: 2 — Legacy error badges remain from dashboard data.
 * AC: 3 — reviewDue is a separate count from the unified review queue,
 *          not double-counted with legacy badges.
 */
export function useSidebarBadges(): SidebarBadges | null {
  const { state } = useDashboard();
  const [reviewDue, setReviewDue] = useState(0);

  // Fetch unified review due count (lightweight, only reads item count)
  useEffect(() => {
    let cancelled = false;
    void api
      .get<{ items: { id: string }[] }>("/review/due")
      .then((data) => {
        if (!cancelled) setReviewDue(data.items.length);
      })
      .catch(() => {
        // Graceful degradation — badge just won't show
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (state.status !== "ready") return null;

  return {
    vocabDue: state.data.vocabDue ?? 0,
    reviewDue,
  };
}
