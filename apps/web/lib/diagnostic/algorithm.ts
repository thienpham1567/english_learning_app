import type { CefrLevel, DiagnosticSkill, DiagnosticAnswer, DiagnosticTestResult, SkillResult } from "./types";
import { CEFR_LEVELS } from "./types";

/** Numeric value for each CEFR level (maps to user_skill_profile scale) */
const CEFR_TO_NUMERIC: Record<CefrLevel, number> = {
  A1: 1.5, A2: 3.0, B1: 5.0, B2: 7.0, C1: 9.0, C2: 10.0,
};

/** Per-skill adaptive state during the test */
export interface SkillState {
  currentLevelIndex: number; // index into CEFR_LEVELS
  consecutiveCorrect: number;
  consecutiveWrong: number;
  answeredLevels: number[]; // numeric levels of answered questions
  correct: number;
  total: number;
}

/**
 * Create initial state for all skills.
 * All start at B1 (index 2).
 */
export function createInitialState(): Record<DiagnosticSkill, SkillState> {
  const make = (): SkillState => ({
    currentLevelIndex: 2, // B1
    consecutiveCorrect: 0,
    consecutiveWrong: 0,
    answeredLevels: [],
    correct: 0,
    total: 0,
  });
  return {
    grammar: make(),
    vocabulary: make(),
    reading: make(),
    listening: make(),
  };
}

/**
 * Process an answer and update the skill state.
 * Returns the updated state and the next question's target level.
 */
export function processAnswer(
  state: SkillState,
  answer: DiagnosticAnswer,
): { state: SkillState; nextLevelIndex: number } {
  const levelNumeric = CEFR_TO_NUMERIC[answer.level];
  state.answeredLevels.push(levelNumeric);
  state.total++;

  if (answer.correct) {
    state.correct++;
    state.consecutiveCorrect++;
    state.consecutiveWrong = 0;

    // 3 correct in a row → level up
    if (state.consecutiveCorrect >= 3) {
      state.currentLevelIndex = Math.min(state.currentLevelIndex + 1, CEFR_LEVELS.length - 1);
      state.consecutiveCorrect = 0;
    }
  } else {
    state.consecutiveWrong++;
    state.consecutiveCorrect = 0;

    // 2 wrong in a row → level down
    if (state.consecutiveWrong >= 2) {
      state.currentLevelIndex = Math.max(state.currentLevelIndex - 1, 0);
      state.consecutiveWrong = 0;
    }
  }

  return { state, nextLevelIndex: state.currentLevelIndex };
}

/**
 * Calculate final CEFR level from answered question levels.
 * Uses weighted average of last 5 answers per skill for more recent accuracy emphasis.
 */
function calculateSkillResult(state: SkillState): SkillResult {
  const levels = state.answeredLevels;
  if (levels.length === 0) {
    return { level: 5.0, cefr: "B1", correct: 0, total: 0 };
  }

  // Weighted average emphasizing recent answers
  const recent = levels.slice(-5);
  const avg = recent.reduce((s, v) => s + v, 0) / recent.length;

  // Find closest CEFR level
  let closestCefr: CefrLevel = "A1";
  let minDist = Infinity;
  for (const [cefr, val] of Object.entries(CEFR_TO_NUMERIC)) {
    const dist = Math.abs(avg - val);
    if (dist < minDist) {
      minDist = dist;
      closestCefr = cefr as CefrLevel;
    }
  }

  return {
    level: Math.round(avg * 10) / 10,
    cefr: closestCefr,
    correct: state.correct,
    total: state.total,
  };
}

/**
 * Calculate confidence based on answer consistency.
 * Higher consistency = higher confidence.
 */
function calculateConfidence(states: Record<DiagnosticSkill, SkillState>): number {
  const allLevels: number[] = [];
  for (const state of Object.values(states)) {
    allLevels.push(...state.answeredLevels);
  }
  if (allLevels.length < 5) return 0.5;

  const avg = allLevels.reduce((s, v) => s + v, 0) / allLevels.length;
  const variance = allLevels.reduce((s, v) => s + (v - avg) ** 2, 0) / allLevels.length;
  const stddev = Math.sqrt(variance);

  // Confidence: 1 - (stddev / maxPossibleStddev)
  // Max stddev when answers span full range (1.5 to 10) is ~3
  const confidence = Math.max(0.3, Math.min(1.0, 1 - stddev / 3));
  return Math.round(confidence * 100) / 100;
}

/**
 * Calculate overall CEFR from all skill results.
 */
export function calculateResults(
  states: Record<DiagnosticSkill, SkillState>,
  answers: DiagnosticAnswer[],
): DiagnosticTestResult {
  const skills: Record<DiagnosticSkill, SkillResult> = {
    grammar: calculateSkillResult(states.grammar),
    vocabulary: calculateSkillResult(states.vocabulary),
    reading: calculateSkillResult(states.reading),
    listening: calculateSkillResult(states.listening),
  };

  // Weighted average: grammar 30%, vocabulary 30%, reading 20%, listening 20%
  const weights = { grammar: 0.3, vocabulary: 0.3, reading: 0.2, listening: 0.2 };
  const overallLevel = Object.entries(skills).reduce(
    (sum, [skill, result]) => sum + result.level * weights[skill as DiagnosticSkill],
    0,
  );

  // Find closest CEFR for overall
  let overallCefr: CefrLevel = "A1";
  let minDist = Infinity;
  for (const [cefr, val] of Object.entries(CEFR_TO_NUMERIC)) {
    const dist = Math.abs(overallLevel - val);
    if (dist < minDist) {
      minDist = dist;
      overallCefr = cefr as CefrLevel;
    }
  }

  return {
    overallCefr,
    confidence: calculateConfidence(states),
    skills,
    answers,
  };
}
