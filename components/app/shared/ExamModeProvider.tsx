"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";

export type ExamMode = "toeic" | "ielts";

type ExamModeContextType = {
  examMode: ExamMode;
  setExamMode: (mode: ExamMode) => Promise<void>;
  isLoading: boolean;
  label: string;
  icon: string;
};

const ExamModeContext = createContext<ExamModeContextType>({
  examMode: "toeic",
  setExamMode: async () => {},
  isLoading: true,
  label: "TOEIC",
  icon: "📊",
});

const MODE_META: Record<ExamMode, { label: string; icon: string }> = {
  toeic: { label: "TOEIC", icon: "📊" },
  ielts: { label: "IELTS", icon: "🎓" },
};

export function ExamModeProvider({ children }: { children: ReactNode }) {
  const [examMode, setExamModeState] = useState<ExamMode>("toeic");
  const [isLoading, setIsLoading] = useState(true);

  // Fetch on mount
  useEffect(() => {
    fetch("/api/preferences")
      .then((r) => r.json())
      .then((data) => {
        if (data.examMode === "toeic" || data.examMode === "ielts") {
          setExamModeState(data.examMode);
        }
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const setExamMode = useCallback(async (mode: ExamMode) => {
    const previousMode = examMode;
    setExamModeState(mode); // Optimistic update
    try {
      await fetch("/api/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ examMode: mode }),
      });
    } catch {
      // Revert to previous value on failure
      setExamModeState(previousMode);
    }
  }, [examMode]);

  const meta = MODE_META[examMode];

  return (
    <ExamModeContext.Provider
      value={{
        examMode,
        setExamMode,
        isLoading,
        label: meta.label,
        icon: meta.icon,
      }}
    >
      {children}
    </ExamModeContext.Provider>
  );
}

export function useExamMode() {
  return useContext(ExamModeContext);
}
