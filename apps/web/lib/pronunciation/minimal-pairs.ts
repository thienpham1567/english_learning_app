/**
 * Minimal Pairs Dataset — Story 19.1.4 (AC2)
 *
 * ≥ 40 pairs across common English phoneme contrasts.
 * Each pair has a contrast tag used for weakness tracking.
 */

export type MinimalPair = {
  a: string;
  b: string;
  /** IPA contrast label, e.g. "ɪ-iː" */
  contrast: string;
  /** Short tag for aggregation, e.g. "short-long-i" */
  tag: string;
};

export type MinimalPairAnswerSummary = {
  pair: MinimalPair;
  correct: boolean;
};

export type MinimalPairTagStat = {
  tag: string;
  total: number;
  correct: number;
};

export const MINIMAL_PAIRS: MinimalPair[] = [
  // ── /ɪ/ vs /iː/ (short-long-i) ──
  { a: "ship", b: "sheep", contrast: "ɪ-iː", tag: "short-long-i" },
  { a: "sit", b: "seat", contrast: "ɪ-iː", tag: "short-long-i" },
  { a: "bit", b: "beat", contrast: "ɪ-iː", tag: "short-long-i" },
  { a: "hit", b: "heat", contrast: "ɪ-iː", tag: "short-long-i" },
  { a: "slip", b: "sleep", contrast: "ɪ-iː", tag: "short-long-i" },
  { a: "fill", b: "feel", contrast: "ɪ-iː", tag: "short-long-i" },
  { a: "lip", b: "leap", contrast: "ɪ-iː", tag: "short-long-i" },

  // ── /æ/ vs /e/ (a-e) ──
  { a: "bat", b: "bet", contrast: "æ-e", tag: "a-e" },
  { a: "pan", b: "pen", contrast: "æ-e", tag: "a-e" },
  { a: "man", b: "men", contrast: "æ-e", tag: "a-e" },
  { a: "bad", b: "bed", contrast: "æ-e", tag: "a-e" },
  { a: "sat", b: "set", contrast: "æ-e", tag: "a-e" },
  { a: "ham", b: "hem", contrast: "æ-e", tag: "a-e" },
  { a: "land", b: "lend", contrast: "æ-e", tag: "a-e" },

  // ── /θ/ vs /s/ (th-s) ──
  { a: "think", b: "sink", contrast: "θ-s", tag: "th-s" },
  { a: "thick", b: "sick", contrast: "θ-s", tag: "th-s" },
  { a: "thin", b: "sin", contrast: "θ-s", tag: "th-s" },
  { a: "thought", b: "sought", contrast: "θ-s", tag: "th-s" },
  { a: "theme", b: "seem", contrast: "θ-s", tag: "th-s" },
  { a: "thumb", b: "sum", contrast: "θ-s", tag: "th-s" },
  { a: "thaw", b: "saw", contrast: "θ-s", tag: "th-s" },

  // ── /v/ vs /w/ (v-w) ──
  { a: "vine", b: "wine", contrast: "v-w", tag: "v-w" },
  { a: "vest", b: "west", contrast: "v-w", tag: "v-w" },
  { a: "vet", b: "wet", contrast: "v-w", tag: "v-w" },
  { a: "veil", b: "wail", contrast: "v-w", tag: "v-w" },
  { a: "verse", b: "worse", contrast: "v-w", tag: "v-w" },
  { a: "very", b: "wary", contrast: "v-w", tag: "v-w" },
  { a: "vale", b: "whale", contrast: "v-w", tag: "v-w" },

  // ── /l/ vs /r/ (l-r) ──
  { a: "light", b: "right", contrast: "l-r", tag: "l-r" },
  { a: "lead", b: "read", contrast: "l-r", tag: "l-r" },
  { a: "long", b: "wrong", contrast: "l-r", tag: "l-r" },
  { a: "lock", b: "rock", contrast: "l-r", tag: "l-r" },
  { a: "lake", b: "rake", contrast: "l-r", tag: "l-r" },
  { a: "fly", b: "fry", contrast: "l-r", tag: "l-r" },
  { a: "play", b: "pray", contrast: "l-r", tag: "l-r" },

  // ── /ʃ/ vs /s/ (sh-s) ──
  { a: "she", b: "see", contrast: "ʃ-s", tag: "sh-s" },
  { a: "shore", b: "sore", contrast: "ʃ-s", tag: "sh-s" },
  { a: "show", b: "so", contrast: "ʃ-s", tag: "sh-s" },
  { a: "shave", b: "save", contrast: "ʃ-s", tag: "sh-s" },
  { a: "shin", b: "sin", contrast: "ʃ-s", tag: "sh-s" },
  { a: "sheet", b: "seat", contrast: "ʃ-s", tag: "sh-s" },
  { a: "shop", b: "sop", contrast: "ʃ-s", tag: "sh-s" },
];

/** All unique contrast tags in the dataset. */
export const CONTRAST_TAGS = [...new Set(MINIMAL_PAIRS.map((p) => p.tag))];

/** Get pairs filtered by contrast tag. */
export function getPairsByTag(tag: string): MinimalPair[] {
  return MINIMAL_PAIRS.filter((p) => p.tag === tag);
}

/** Shuffle array (Fisher-Yates). */
export function shuffle<T>(arr: readonly T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/** Pick n random pairs from the dataset (or filtered by tags). */
export function pickRandomPairs(n: number, focusTags?: string[]): MinimalPair[] {
  const pool = focusTags?.length
    ? MINIMAL_PAIRS.filter((p) => focusTags.includes(p.tag))
    : MINIMAL_PAIRS;
  if (n <= 0 || pool.length === 0) return [];
  if (!focusTags?.length) return shuffle(pool).slice(0, n);

  const picked: MinimalPair[] = [];
  let cycle: MinimalPair[] = [];

  while (picked.length < n) {
    if (cycle.length === 0) cycle = shuffle(pool);
    const next = cycle.pop();
    if (next) picked.push(next);
  }

  return picked;
}

/** Build per-contrast totals for persisted weakness aggregation. */
export function summarizeMinimalPairAnswersByTag(
  answers: MinimalPairAnswerSummary[],
): MinimalPairTagStat[] {
  const stats = new Map<string, MinimalPairTagStat>();

  for (const answer of answers) {
    const tag = answer.pair.tag;
    const existing = stats.get(tag) ?? { tag, total: 0, correct: 0 };
    existing.total += 1;
    if (answer.correct) existing.correct += 1;
    stats.set(tag, existing);
  }

  return [...stats.values()];
}

/** Return unique contrast tags missed in the session. */
export function getMissedContrastTags(answers: MinimalPairAnswerSummary[]): string[] {
  return [...new Set(answers.filter((a) => !a.correct).map((a) => a.pair.tag))];
}
