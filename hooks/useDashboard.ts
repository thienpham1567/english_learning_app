"use client";

import { useCallback, useEffect, useState } from "react";

export interface DashboardData {
  flashcardsDue: number;
  vocabDue: number;
  dailyChallenge: { completed: boolean; score: number | null };
  streak: {
    currentStreak: number;
    bestStreak: number;
    lastCompletedDate: string | null;
  };
  badges: Array<{ id: string; label: string; emoji: string; unlocked: boolean }>;
  recentVocabulary: Array<{
    query: string;
    headword: string;
    level: string;
    lookedUpAt: string;
  }>;
  weeklyActivity: Array<{ day: string; count: number }>;
  totalXP: number;
}

type DashboardState =
  | { status: "loading" }
  | { status: "error"; error: string }
  | { status: "ready"; data: DashboardData };

export function useDashboard() {
  const [state, setState] = useState<DashboardState>({ status: "loading" });

  const fetchDashboard = useCallback(async () => {
    setState({ status: "loading" });
    try {
      const res = await fetch("/api/dashboard");
      if (!res.ok) throw new Error(`Dashboard fetch failed: ${res.status}`);
      const data: DashboardData = await res.json();
      setState({ status: "ready", data });
    } catch (err) {
      setState({
        status: "error",
        error: err instanceof Error ? err.message : "Unknown error",
      });
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  return { state, refetch: fetchDashboard };
}
