/**
 * Deterministic filler-word detection (AC4).
 *
 * Counts occurrences of common filler words/phrases in a transcript.
 * Uses word-boundary matching, case-insensitive.
 */

const FILLER_PATTERNS: Array<{ label: string; pattern: RegExp }> = [
  { label: "um", pattern: /\bum\b/gi },
  { label: "uh", pattern: /\buh\b/gi },
  { label: "like", pattern: /\blike\b/gi },
  { label: "you know", pattern: /\byou know\b/gi },
  { label: "sort of", pattern: /\bsort of\b/gi },
  { label: "kind of", pattern: /\bkind of\b/gi },
  { label: "basically", pattern: /\bbasically\b/gi },
];

export type FillerResult = {
  fillerCount: number;
  fillers: Array<{ filler: string; count: number }>;
};

export function detectFillers(transcript: string): FillerResult {
  const fillers: Array<{ filler: string; count: number }> = [];
  let fillerCount = 0;

  for (const { label, pattern } of FILLER_PATTERNS) {
    const matches = transcript.match(pattern);
    const count = matches?.length ?? 0;
    if (count > 0) {
      fillers.push({ filler: label, count });
      fillerCount += count;
    }
  }

  return { fillerCount, fillers };
}

/** WPM calculation (AC5). */
export function calculateWpm(transcript: string, durationMs: number): number {
  const wordCount = transcript.trim().split(/\s+/).filter(Boolean).length;
  const minutes = durationMs / 60_000;
  return minutes > 0 ? Math.round(wordCount / minutes) : 0;
}

/**
 * Target WPM ranges by CEFR level (AC5).
 * C1 is open-ended ("150+"); use null for `max` to signal that no upper bound
 * should be used in the fluency penalty.
 */
export const WPM_TARGETS: Record<
  string,
  { min: number; max: number | null; label: string }
> = {
  a2: { min: 90, max: 110, label: "A2: 90–110 wpm" },
  b1: { min: 110, max: 130, label: "B1: 110–130 wpm" },
  b2: { min: 130, max: 150, label: "B2: 130–150 wpm" },
  c1: { min: 150, max: null, label: "C1: 150+ wpm" },
};

/**
 * Penalty for deviating from the CEFR target band.
 * - Inside [min, max] (or ≥ min for open-ended C1): 0 penalty.
 * - Outside the band: 0.5 points per wpm of deviation from the nearest edge.
 */
export function wpmDeviationPenalty(
  wpm: number,
  target: { min: number; max: number | null },
): number {
  if (wpm < target.min) return (target.min - wpm) * 0.5;
  if (target.max !== null && wpm > target.max) return (wpm - target.max) * 0.5;
  return 0;
}
