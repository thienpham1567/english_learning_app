"use client";
import { createContext, type ReactNode, useContext } from "react";

export type ExamMode = "toeic";

type ExamModeContextType = {
  examMode: ExamMode;
  setExamMode: (mode: ExamMode) => Promise<void>;
  isLoading: boolean;
  label: string;
  icon: string;
};

const TOEIC_CONTEXT: ExamModeContextType = {
  examMode: "toeic",
  setExamMode: async () => {},
  isLoading: false,
  label: "TOEIC",
  icon: "bar-chart",
};

const ExamModeContext = createContext<ExamModeContextType>(TOEIC_CONTEXT);

/**
 * ExamModeProvider — locked to TOEIC-only.
 * The app is now a dedicated TOEIC self-study platform.
 * Provider interface is kept stable so no downstream changes are needed.
 */
export function ExamModeProvider({ children }: { children: ReactNode }) {
  return <ExamModeContext.Provider value={TOEIC_CONTEXT}>{children}</ExamModeContext.Provider>;
}

export function useExamMode() {
  return useContext(ExamModeContext);
}
