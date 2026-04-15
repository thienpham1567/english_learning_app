/** CEFR levels used in diagnostic test */
export const CEFR_LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"] as const;
export type CefrLevel = (typeof CEFR_LEVELS)[number];

/** Skill categories tested */
export type DiagnosticSkill = "grammar" | "vocabulary" | "reading" | "listening";

/** A single diagnostic question */
export interface DiagnosticQuestion {
  id: string;
  skill: DiagnosticSkill;
  level: CefrLevel;
  question: string;
  options: string[];
  correctIndex: number;
  explanation?: string;
}

/** Answer record */
export interface DiagnosticAnswer {
  questionId: string;
  skill: DiagnosticSkill;
  level: CefrLevel;
  selectedIndex: number;
  correct: boolean;
  timeMs: number;
}

/** Per-skill result */
export interface SkillResult {
  level: number;
  cefr: CefrLevel;
  correct: number;
  total: number;
}

/** Full test result */
export interface DiagnosticTestResult {
  overallCefr: CefrLevel;
  confidence: number;
  skills: Record<DiagnosticSkill, SkillResult>;
  answers: DiagnosticAnswer[];
}
