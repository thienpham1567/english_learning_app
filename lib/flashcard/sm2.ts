import type { Sm2State } from "./types";

/**
 * SM-2 spaced repetition algorithm.
 *
 * @param prev  Current SM-2 state (or defaults for a new card).
 * @param quality  Self-rating: 0 = Again, 2 = Hard, 3 = Good, 5 = Easy.
 * @returns Next SM-2 state with updated easeFactor, interval, repetitions, and nextReview.
 *
 * @see https://en.wikipedia.org/wiki/SuperMemo#SM-2_algorithm
 */
export function computeSm2(prev: Sm2State, quality: number): Sm2State {
  const q = Math.max(0, Math.min(5, Math.round(quality)));

  let { easeFactor, interval, repetitions } = prev;

  // Update ease factor: EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
  easeFactor = easeFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
  easeFactor = Math.max(1.3, easeFactor);

  if (q < 3) {
    // Failed recall — reset to beginning
    repetitions = 0;
    interval = 0;
  } else {
    // Successful recall
    repetitions += 1;

    if (repetitions === 1) {
      interval = 1;
    } else if (repetitions === 2) {
      interval = 6;
    } else {
      interval = Math.round(interval * easeFactor);
    }
  }

  // Compute next review date
  const now = new Date();
  const nextDate = new Date(now);
  nextDate.setDate(nextDate.getDate() + interval);
  const nextReview = nextDate.toISOString();

  return { easeFactor, interval, repetitions, nextReview };
}

/**
 * Returns the default SM-2 state for a card that has never been reviewed.
 */
export function defaultSm2State(): Sm2State {
  return {
    easeFactor: 2.5,
    interval: 0,
    repetitions: 0,
    nextReview: new Date().toISOString(),
  };
}
