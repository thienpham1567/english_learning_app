/** Types used across diagnostic components */

export type Question = {
  id: string;
  skill: string;
  level: string;
  question: string;
  options: string[];
  index: number;
};

export type SkillResult = {
  level: number;
  cefr: string;
  correct: number;
  total: number;
};

export type TestResult = {
  overallCefr: string;
  confidence: number;
  skills: Record<string, SkillResult>;
  xpAwarded: number;
};

export type DiagnosticStatus = {
  lastResult: {
    overallCefr: string;
    confidence: number;
    skillBreakdown: Record<string, SkillResult>;
    completedAt: string;
  } | null;
  canRetake: boolean;
  daysUntilRetake: number;
  hasResult: boolean;
};

export type Phase = "loading" | "welcome" | "test" | "submitting" | "results";
