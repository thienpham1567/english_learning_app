import { wordToPhonemes } from "./phonemes";

export type WordScore = {
  word: string;
  spoken: string;
  score: number;
  status: "ok" | "slightly-off" | "wrong" | "missing";
  expectedPhonemes: string[] | null;
  actualPhonemes: string[] | null;
};

export type AlignmentResult = {
  overall: number;
  wordScores: WordScore[];
  referenceTokens: string[];
  spokenTokens: string[];
};

const PUNCT = /[.,!?;:"()[\]{}…—–"'""'']/g;

/** Tokenize into lowercase alphabetic words, stripping punctuation. */
export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(PUNCT, " ")
    .split(/\s+/)
    .filter((t) => /[a-z]/.test(t));
}

/** Classic Levenshtein distance between two arrays. */
function editDistance<T>(a: readonly T[], b: readonly T[]): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const dp = Array.from({ length: m + 1 }, () => new Array<number>(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j - 1], dp[i - 1][j], dp[i][j - 1]);
    }
  }
  return dp[m][n];
}

/** Needleman-Wunsch-style alignment: returns best per-reference mapping to spoken indices.
 *  Cells contain either a matched spoken index or null (insertion/deletion). */
function alignWords(ref: string[], spoken: string[]): Array<number | null> {
  const m = ref.length;
  const n = spoken.length;
  const dp = Array.from({ length: m + 1 }, () => new Array<number>(n + 1).fill(0));
  const back = Array.from({ length: m + 1 }, () => new Array<"d" | "u" | "l">(n + 1).fill("d"));
  for (let i = 0; i <= m; i++) { dp[i][0] = i; back[i][0] = "u"; }
  for (let j = 0; j <= n; j++) { dp[0][j] = j; back[0][j] = "l"; }
  back[0][0] = "d";
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = ref[i - 1] === spoken[j - 1] ? 0 : 1;
      const diag = dp[i - 1][j - 1] + cost;
      const up = dp[i - 1][j] + 1;
      const left = dp[i][j - 1] + 1;
      const best = Math.min(diag, up, left);
      dp[i][j] = best;
      back[i][j] = best === diag ? "d" : best === up ? "u" : "l";
    }
  }
  // Trace back to map each ref index to a spoken index (or null).
  const map: Array<number | null> = new Array(m).fill(null);
  let i = m;
  let j = n;
  while (i > 0 && j > 0) {
    const b = back[i][j];
    if (b === "d") { map[i - 1] = j - 1; i--; j--; }
    else if (b === "u") { i--; }
    else { j--; }
  }
  return map;
}

/** Score a single reference word against its (possibly missing) spoken counterpart. */
function scoreWord(refWord: string, spokenWord: string | null): WordScore {
  const expected = wordToPhonemes(refWord);
  const actual = spokenWord ? wordToPhonemes(spokenWord) : null;

  if (!spokenWord) {
    return {
      word: refWord,
      spoken: "",
      score: 0,
      status: "missing",
      expectedPhonemes: expected,
      actualPhonemes: null,
    };
  }

  if (refWord === spokenWord) {
    return {
      word: refWord,
      spoken: spokenWord,
      score: 100,
      status: "ok",
      expectedPhonemes: expected,
      actualPhonemes: actual,
    };
  }

  // Phoneme-level comparison when both are in CMUdict.
  if (expected && actual) {
    const dist = editDistance(expected, actual);
    const maxLen = Math.max(expected.length, actual.length);
    const phonemeSim = maxLen === 0 ? 1 : 1 - dist / maxLen;
    if (dist === 0) {
      // Homophone (e.g. "to" vs "two") — treat as OK.
      return { word: refWord, spoken: spokenWord, score: 100, status: "ok", expectedPhonemes: expected, actualPhonemes: actual };
    }
    if (phonemeSim >= 0.7 || dist <= 1) {
      return { word: refWord, spoken: spokenWord, score: 60, status: "slightly-off", expectedPhonemes: expected, actualPhonemes: actual };
    }
    return { word: refWord, spoken: spokenWord, score: 0, status: "wrong", expectedPhonemes: expected, actualPhonemes: actual };
  }

  // Fall back to string edit distance for out-of-dictionary words.
  const charDist = editDistance(refWord.split(""), spokenWord.split(""));
  const maxLen = Math.max(refWord.length, spokenWord.length);
  const charSim = maxLen === 0 ? 1 : 1 - charDist / maxLen;
  if (charSim >= 0.7 || charDist <= 2) {
    return { word: refWord, spoken: spokenWord, score: 60, status: "slightly-off", expectedPhonemes: expected, actualPhonemes: actual };
  }
  return { word: refWord, spoken: spokenWord, score: 0, status: "wrong", expectedPhonemes: expected, actualPhonemes: actual };
}

/** Align spoken text against reference and produce a word-by-word score + overall. */
export function alignAndScore(referenceText: string, spokenText: string): AlignmentResult {
  const referenceTokens = tokenize(referenceText);
  const spokenTokens = tokenize(spokenText);
  const map = alignWords(referenceTokens, spokenTokens);

  const wordScores = referenceTokens.map((refWord, i) => {
    const spokenIdx = map[i];
    const spokenWord = spokenIdx === null ? null : spokenTokens[spokenIdx];
    return scoreWord(refWord, spokenWord ?? null);
  });

  // Weighted by word length (longer words count more).
  const totalWeight = wordScores.reduce((s, w) => s + Math.max(1, w.word.length), 0);
  const weighted = wordScores.reduce(
    (s, w) => s + w.score * Math.max(1, w.word.length),
    0,
  );
  const overall = referenceTokens.length === 0 ? 0 : Math.round(weighted / totalWeight);

  return { overall, wordScores, referenceTokens, spokenTokens };
}

/** Rough transcript-vs-reference overlap, used to detect off-topic speech. */
export function transcriptOverlap(referenceText: string, spokenText: string): number {
  const ref = new Set(tokenize(referenceText));
  const spoken = tokenize(spokenText);
  if (spoken.length === 0 || ref.size === 0) return 0;
  const matches = spoken.filter((t) => ref.has(t)).length;
  return matches / ref.size;
}
