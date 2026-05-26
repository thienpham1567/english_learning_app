/**
 * TOEIC LR scoring — approximate linear conversion from raw to scaled.
 *
 * Real ETS uses a per-test lookup table; we approximate with a linear curve.
 * Expected error band: ±20-30 points vs real ETS at ratio extremes; tighter
 * in the middle (550-750 range).
 *
 * Calibrate this curve once we have ≥5 real test scores by replacing
 * `linearScale` with a piecewise mapping.
 */

const SCALE_MIN = 5;
const SCALE_MAX = 495;

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

function linearScale(ratio: number): number {
  return Math.round(SCALE_MIN + clamp(ratio, 0, 1) * (SCALE_MAX - SCALE_MIN));
}

/** Convert raw correct count out of 100 (full Listening section) to 5-495. */
export function rawToScaledListening(rawCorrect: number, totalQuestions: number): number {
  if (totalQuestions <= 0) return SCALE_MIN;
  return linearScale(rawCorrect / totalQuestions);
}

/** Convert raw correct count out of 100 (full Reading section) to 5-495. */
export function rawToScaledReading(rawCorrect: number, totalQuestions: number): number {
  if (totalQuestions <= 0) return SCALE_MIN;
  return linearScale(rawCorrect / totalQuestions);
}

/**
 * Compute raw + scaled scores for a mock attempt given per-part stats.
 *
 * answers: list of { part, isCorrect } for every answered question
 */
export function computeMockScore(answers: Array<{ part: number; isCorrect: boolean | null }>): {
  rawListening: number;
  rawReading: number;
  scaledListening: number;
  scaledReading: number;
  totalScaled: number;
  listeningTotal: number;
  readingTotal: number;
} {
  let rawListening = 0;
  let rawReading = 0;
  let listeningTotal = 0;
  let readingTotal = 0;

  for (const a of answers) {
    const isListening = a.part >= 1 && a.part <= 4;
    const isReading = a.part >= 5 && a.part <= 7;
    if (isListening) {
      listeningTotal++;
      if (a.isCorrect === true) rawListening++;
    } else if (isReading) {
      readingTotal++;
      if (a.isCorrect === true) rawReading++;
    }
  }

  const scaledListening = rawToScaledListening(rawListening, listeningTotal);
  const scaledReading = rawToScaledReading(rawReading, readingTotal);

  return {
    rawListening,
    rawReading,
    scaledListening,
    scaledReading,
    totalScaled: scaledListening + scaledReading,
    listeningTotal,
    readingTotal,
  };
}
