import { readFileSync } from "fs";
import { join } from "path";

/**
 * Lazy-loaded word list for nearby word suggestions.
 * Loaded from a plain text file instead of a TS module to avoid
 * bloating the server runtime with a 5.4MB import (P1 audit fix).
 */
let _words: string[] | null = null;

function getWords(): string[] {
  if (!_words) {
    const filePath = join(process.cwd(), "data", "english-words.txt");
    const content = readFileSync(filePath, "utf8");
    _words = content.split("\n").filter(Boolean);
  }
  return _words;
}

function bisect(words: string[], target: string): number {
  let lo = 0;
  let hi = words.length;
  while (lo < hi) {
    const mid = (lo + hi) >>> 1;
    if (words[mid] < target) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

export function getNearbyWords(word: string, count = 4): string[] {
  const words = getWords();
  if (words.length === 0) return [];

  const lower = word.toLowerCase();
  const idx = bisect(words, lower);
  const isFound = words[idx] === lower;

  const result: string[] = [];

  const beforeStart = Math.max(0, idx - count);
  for (let i = beforeStart; i < idx; i++) {
    result.push(words[i]);
  }

  const afterStart = isFound ? idx + 1 : idx;
  const afterEnd = Math.min(words.length, afterStart + count);
  for (let i = afterStart; i < afterEnd; i++) {
    result.push(words[i]);
  }

  return result;
}
