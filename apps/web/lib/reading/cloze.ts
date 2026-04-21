/**
 * Cloze generator — Story 19.4.4 (AC2, AC6)
 *
 * Pure, deterministic function. No LLM needed.
 * Given a passage body + user's known vocab lemmas, generates blanks
 * preferring vocab-recall words, then content words at configurable density.
 */

// ── Stopwords (non-blanking candidates) ──
const STOP_WORDS = new Set([
  "the","a","an","and","or","but","in","on","at","to","for","of","with","by",
  "from","as","is","was","are","were","be","been","being","have","has","had",
  "do","does","did","will","would","could","should","may","might","shall","can",
  "must","not","no","nor","so","if","then","than","that","this","these","those",
  "it","its","he","she","they","we","you","i","me","my","your","his","her","our",
  "their","us","them","who","whom","which","what","when","where","how","why",
  "all","each","every","both","few","more","most","other","some","such","only",
  "own","same","very","just","also","about","up","out","into","over","after",
  "before","between","under","above","below","through","during","without",
  "within","along","around","among","against","because","until","while",
  "there","here","too","much","many","any","well","still","even","now",
  "back","yet","already","always","never","often","really","quite","rather",
]);

export type ClozeItem = {
  /** Index of this blank in the token array */
  blankIndex: number;
  /** Text before the blank (context) */
  before: string;
  /** The blanked word (surface form) */
  blank: string;
  /** Text after the blank (context) */
  after: string;
  /** Correct answer */
  answer: string;
};

type ClozeMode = "vocab-recall" | "density";

/**
 * Simple lemmatizer (inline, matches lib/reading/lemmatize.ts logic)
 */
function lemmatize(word: string): string {
  let w = word.toLowerCase();
  if (w.endsWith("ies") && w.length > 4) w = w.slice(0, -3) + "y";
  else if (w.endsWith("ing") && w.length > 4) w = w.slice(0, -3);
  else if (w.endsWith("ed") && w.length > 3) w = w.slice(0, -2);
  else if (w.endsWith("s") && !w.endsWith("ss") && w.length > 3) w = w.slice(0, -1);
  return w;
}

/**
 * Tokenize passage into word/separator pairs.
 */
function tokenize(text: string): Array<{ type: "word" | "sep"; value: string }> {
  const tokens: Array<{ type: "word" | "sep"; value: string }> = [];
  const parts = text.split(/(\b[a-zA-Z'-]+\b)/);
  for (const part of parts) {
    if (!part) continue;
    if (/^[a-zA-Z'-]+$/.test(part) && part.length >= 2) {
      tokens.push({ type: "word", value: part });
    } else {
      tokens.push({ type: "sep", value: part });
    }
  }
  return tokens;
}

/**
 * Generate cloze items from a passage body.
 *
 * @param body     - The passage text
 * @param vocabSet - Set of user's known vocab lemmas (lowercase)
 * @param mode     - "vocab-recall" (prefer user vocab) or "density" (every Nth content word)
 * @param density  - For density mode, blank every Nth content word (default 7)
 *
 * Deterministic: same inputs always produce the same blanks (AC6).
 */
export function generateCloze(
  body: string,
  vocabSet: Set<string>,
  mode: ClozeMode = "vocab-recall",
  density: number = 7,
): ClozeItem[] {
  const tokens = tokenize(body);
  const wordIndices: number[] = [];

  // Collect content-word indices
  for (let i = 0; i < tokens.length; i++) {
    if (tokens[i].type === "word") {
      const lower = tokens[i].value.toLowerCase().replace(/[^a-z]/g, "");
      if (lower.length >= 2 && !STOP_WORDS.has(lower)) {
        wordIndices.push(i);
      }
    }
  }

  // Select which indices to blank
  const blankIndices = new Set<number>();

  if (mode === "vocab-recall") {
    // Phase 1: blank words whose lemma is in user's vocab
    for (const idx of wordIndices) {
      const lemma = lemmatize(tokens[idx].value);
      if (vocabSet.has(lemma)) {
        blankIndices.add(idx);
      }
    }

    // Phase 2: if too few (<5), supplement with density-based
    if (blankIndices.size < 5) {
      let contentCount = 0;
      for (const idx of wordIndices) {
        if (blankIndices.has(idx)) continue;
        contentCount++;
        if (contentCount % density === 0) {
          blankIndices.add(idx);
        }
      }
    }
  } else {
    // Density mode: every Nth content word
    let contentCount = 0;
    for (const idx of wordIndices) {
      contentCount++;
      if (contentCount % density === 0) {
        blankIndices.add(idx);
      }
    }
  }

  // Cap at ~30 blanks max for UX
  const sortedBlanks = Array.from(blankIndices).sort((a, b) => a - b);
  const cappedBlanks = sortedBlanks.slice(0, 30);

  // Build cloze items with before/after context
  const items: ClozeItem[] = [];
  for (const blankIdx of cappedBlanks) {
    // Gather 3 tokens of context before and after
    const beforeParts: string[] = [];
    for (let j = Math.max(0, blankIdx - 6); j < blankIdx; j++) {
      beforeParts.push(tokens[j].value);
    }

    const afterParts: string[] = [];
    for (let j = blankIdx + 1; j <= Math.min(tokens.length - 1, blankIdx + 6); j++) {
      afterParts.push(tokens[j].value);
    }

    items.push({
      blankIndex: blankIdx,
      before: beforeParts.join("").trim(),
      blank: tokens[blankIdx].value,
      after: afterParts.join("").trim(),
      answer: tokens[blankIdx].value.toLowerCase(),
    });
  }

  return items;
}
