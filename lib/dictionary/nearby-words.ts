import { ENGLISH_WORDS } from "@/data/english-words";

function bisect(target: string): number {
  let lo = 0;
  let hi = ENGLISH_WORDS.length;
  while (lo < hi) {
    const mid = (lo + hi) >>> 1;
    if (ENGLISH_WORDS[mid] < target) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

export function getNearbyWords(word: string, count = 4): string[] {
  if (ENGLISH_WORDS.length === 0) return [];

  const lower = word.toLowerCase();
  const idx = bisect(lower);
  const isFound = ENGLISH_WORDS[idx] === lower;

  const result: string[] = [];

  const beforeStart = Math.max(0, idx - count);
  for (let i = beforeStart; i < idx; i++) {
    result.push(ENGLISH_WORDS[i]);
  }

  const afterStart = isFound ? idx + 1 : idx;
  const afterEnd = Math.min(ENGLISH_WORDS.length, afterStart + count);
  for (let i = afterStart; i < afterEnd; i++) {
    result.push(ENGLISH_WORDS[i]);
  }

  return result;
}
