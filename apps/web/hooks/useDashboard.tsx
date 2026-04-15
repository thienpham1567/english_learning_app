"use client";

import { createContext, useContext, useCallback, useEffect, useState, type ReactNode } from "react";
import { api } from "@/lib/api-client";

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

interface DashboardContextValue {
  state: DashboardState;
  refetch: () => Promise<void>;
}

const DashboardContext = createContext<DashboardContextValue | null>(null);

/**
 * DashboardProvider — fetches /api/dashboard once and shares data across
 * all consumers (home page, sidebar badges, session summary, etc.).
 * Eliminates duplicate fetches identified in the performance audit.
 */
export function DashboardProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DashboardState>({ status: "loading" });

  const fetchDashboard = useCallback(async () => {
    setState({ status: "loading" });
    try {
      const data = await api.get<DashboardData>("/dashboard");
      setState({ status: "ready", data });
    } catch (err) {
      setState({
        status: "error",
        error: err instanceof Error ? err.message : "Unknown error",
      });
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const data = await api.get<DashboardData>("/dashboard");
        if (!cancelled) setState({ status: "ready", data });
      } catch (err) {
        if (!cancelled) {
          setState({
            status: "error",
            error: err instanceof Error ? err.message : "Unknown error",
          });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <DashboardContext.Provider value={{ state, refetch: fetchDashboard }}>
      {children}
    </DashboardContext.Provider>
  );
}

/**
 * useDashboard — consumes dashboard data from the shared provider.
 * Drop-in replacement for the old hook that fetched independently.
 */
export function useDashboard() {
  const ctx = useContext(DashboardContext);
  if (!ctx) {
    throw new Error("useDashboard must be used within a DashboardProvider");
  }
  return ctx;
}
