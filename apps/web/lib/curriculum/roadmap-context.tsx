"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { CURRICULUM, getAllUnits } from "@/lib/curriculum/data";

// ─── Types ───
export type RoadmapProgress = {
  completedUnits: string[];
  startDate: string; // ISO string — when user started the roadmap
};

const STORAGE_KEY = "roadmap-progress";

const DEFAULT_PROGRESS: RoadmapProgress = {
  completedUnits: [],
  startDate: new Date().toISOString(),
};

// ─── Context ───
type RoadmapContextType = {
  progress: RoadmapProgress;
  completedSet: Set<string>;
  toggleUnit: (unitId: string) => void;
  completeUnit: (unitId: string) => void;
  isUnitCompleted: (unitId: string) => boolean;
  getWeekProgress: (weekNumber: number) => { completed: number; total: number; percent: number };
  getPhaseProgress: (phaseId: string) => { completed: number; total: number; percent: number };
  getOverallProgress: () => { completed: number; total: number; percent: number };
  getCurrentWeek: () => number;
  getUnitsForModule: (targetModule: string) => { unitId: string; weekNumber: number }[];
  resetProgress: () => void;
};

const RoadmapContext = createContext<RoadmapContextType | null>(null);

export function RoadmapProvider({ children }: { children: React.ReactNode }) {
  const [progress, setProgress] = useState<RoadmapProgress>(DEFAULT_PROGRESS);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as RoadmapProgress;
        setProgress(parsed);
      }
    } catch {
      // Ignore parse errors
    }
    setIsLoaded(true);
  }, []);

  // Save to localStorage on change
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    }
  }, [progress, isLoaded]);

  const completedSet = new Set(progress.completedUnits);

  const toggleUnit = useCallback((unitId: string) => {
    setProgress((prev) => {
      const set = new Set(prev.completedUnits);
      if (set.has(unitId)) {
        set.delete(unitId);
      } else {
        set.add(unitId);
      }
      return { ...prev, completedUnits: [...set] };
    });
  }, []);

  /** One-way completion — only adds, never removes */
  const completeUnit = useCallback((unitId: string) => {
    setProgress((prev) => {
      if (prev.completedUnits.includes(unitId)) return prev;
      return { ...prev, completedUnits: [...prev.completedUnits, unitId] };
    });
  }, []);

  /** Find roadmap units whose exercises link to a given target module */
  const getUnitsForModule = useCallback((targetModule: string) => {
    const results: { unitId: string; weekNumber: number }[] = [];
    for (const phase of CURRICULUM.phases) {
      for (const week of phase.weeks) {
        for (const day of week.dailyPlan) {
          for (const unit of day.units) {
            if (unit.exercises.some((e) => e.targetModule === targetModule)) {
              results.push({ unitId: unit.id, weekNumber: week.weekNumber });
            }
          }
        }
      }
    }
    return results;
  }, []);

  const isUnitCompleted = useCallback((unitId: string) => completedSet.has(unitId), [completedSet]);

  const getWeekProgress = useCallback(
    (weekNumber: number) => {
      for (const phase of CURRICULUM.phases) {
        const week = phase.weeks.find((w) => w.weekNumber === weekNumber);
        if (week) {
          const total = week.dailyPlan.reduce((acc, d) => acc + d.units.length, 0);
          const completed = week.dailyPlan.reduce(
            (acc, d) => acc + d.units.filter((u) => completedSet.has(u.id)).length,
            0,
          );
          return {
            completed,
            total,
            percent: total > 0 ? Math.round((completed / total) * 100) : 0,
          };
        }
      }
      return { completed: 0, total: 0, percent: 0 };
    },
    [completedSet],
  );

  const getPhaseProgress = useCallback(
    (phaseId: string) => {
      const phase = CURRICULUM.phases.find((p) => p.id === phaseId);
      if (!phase) return { completed: 0, total: 0, percent: 0 };
      const total = phase.weeks.reduce(
        (acc, w) => acc + w.dailyPlan.reduce((a, d) => a + d.units.length, 0),
        0,
      );
      const completed = phase.weeks.reduce(
        (acc, w) =>
          acc +
          w.dailyPlan.reduce((a, d) => a + d.units.filter((u) => completedSet.has(u.id)).length, 0),
        0,
      );
      return { completed, total, percent: total > 0 ? Math.round((completed / total) * 100) : 0 };
    },
    [completedSet],
  );

  const getOverallProgress = useCallback(() => {
    const allUnits = getAllUnits();
    const total = allUnits.length;
    const completed = allUnits.filter((u) => completedSet.has(u.id)).length;
    return { completed, total, percent: total > 0 ? Math.round((completed / total) * 100) : 0 };
  }, [completedSet]);

  const getCurrentWeek = useCallback(() => {
    const start = new Date(progress.startDate);
    const now = new Date();
    const diffMs = now.getTime() - start.getTime();
    const diffWeeks = Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000));
    return Math.min(Math.max(diffWeeks + 1, 1), 24);
  }, [progress.startDate]);

  const resetProgress = useCallback(() => {
    setProgress(DEFAULT_PROGRESS);
  }, []);

  return (
    <RoadmapContext.Provider
      value={{
        progress,
        completedSet,
        toggleUnit,
        completeUnit,
        isUnitCompleted,
        getWeekProgress,
        getPhaseProgress,
        getOverallProgress,
        getCurrentWeek,
        getUnitsForModule,
        resetProgress,
      }}
    >
      {children}
    </RoadmapContext.Provider>
  );
}

export function useRoadmap() {
  const ctx = useContext(RoadmapContext);
  if (!ctx) throw new Error("useRoadmap must be used within RoadmapProvider");
  return ctx;
}
