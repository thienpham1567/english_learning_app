import { dictionary } from "cmu-pronouncing-dictionary";

const STRESS = /[0-9]/g;

/**
 * Look up the ARPAbet phonemes for a word.
 * Strips stress digits so phoneme-distance comparisons are stress-independent.
 * Returns null if the word is not in CMUdict.
 */
export function wordToPhonemes(word: string): string[] | null {
  const key = word.toLowerCase().trim();
  if (!key) return null;
  const raw = (dictionary as Record<string, string>)[key];
  if (!raw) return null;
  return raw.replace(STRESS, "").split(/\s+/).filter(Boolean);
}

/** Format ARPAbet phonemes for display (e.g. "HH EH L OW"). */
export function phonemesDisplay(phonemes: string[]): string {
  return phonemes.join(" ");
}
