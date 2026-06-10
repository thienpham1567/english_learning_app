/**
 * Minimal pairs: words that differ by only one phoneme.
 * Used to train discrimination between similar sounds.
 * Focus on pairs Vietnamese speakers commonly confuse.
 */

export type MinimalPair = {
  phonemeA: string;
  phonemeB: string;
  wordA: string;
  wordB: string;
  /** Brief note on the distinction */
  hint: string;
};

export const MINIMAL_PAIRS: MinimalPair[] = [
  // Vowels — Vietnamese speakers' top confusions
  { phonemeA: "ɪ", phonemeB: "iː", wordA: "ship", wordB: "sheep", hint: "Short vs long /i/" },
  { phonemeA: "ʊ", phonemeB: "uː", wordA: "pull", wordB: "pool", hint: "Short vs long /u/" },
  { phonemeA: "e", phonemeB: "æ", wordA: "pen", wordB: "pan", hint: "Mid vs low front vowel" },
  {
    phonemeA: "ʌ",
    phonemeB: "ɑː",
    wordA: "cut",
    wordB: "cart",
    hint: "Short central vs long back",
  },
  { phonemeA: "ɒ", phonemeB: "ɔː", wordA: "cot", wordB: "caught", hint: "Short vs long rounded" },
  { phonemeA: "æ", phonemeB: "ʌ", wordA: "bat", wordB: "but", hint: "Front vs central" },
  {
    phonemeA: "ɜː",
    phonemeB: "ɔː",
    wordA: "bird",
    wordB: "board",
    hint: "Central vs back rounded",
  },

  // Diphthongs
  {
    phonemeA: "eɪ",
    phonemeB: "aɪ",
    wordA: "late",
    wordB: "light",
    hint: "Starting height differs",
  },
  { phonemeA: "aʊ", phonemeB: "əʊ", wordA: "found", wordB: "phone", hint: "Open vs central start" },

  // Consonants — Vietnamese speakers' top confusions
  { phonemeA: "p", phonemeB: "b", wordA: "park", wordB: "bark", hint: "Voiceless vs voiced" },
  { phonemeA: "t", phonemeB: "d", wordA: "town", wordB: "down", hint: "Voiceless vs voiced" },
  { phonemeA: "s", phonemeB: "z", wordA: "sip", wordB: "zip", hint: "Voiceless vs voiced" },
  { phonemeA: "ʃ", phonemeB: "tʃ", wordA: "ship", wordB: "chip", hint: "Fricative vs affricate" },
  { phonemeA: "f", phonemeB: "v", wordA: "fan", wordB: "van", hint: "Voiceless vs voiced" },
  { phonemeA: "θ", phonemeB: "ð", wordA: "think", wordB: "this", hint: "Voiceless vs voiced /th/" },
  { phonemeA: "θ", phonemeB: "s", wordA: "think", wordB: "sink", hint: "Dental vs alveolar" },
  { phonemeA: "l", phonemeB: "r", wordA: "light", wordB: "right", hint: "Lateral vs approximant" },
  { phonemeA: "n", phonemeB: "ŋ", wordA: "thin", wordB: "thing", hint: "Alveolar vs velar nasal" },
  { phonemeA: "tʃ", phonemeB: "dʒ", wordA: "chain", wordB: "Jane", hint: "Voiceless vs voiced" },
  { phonemeA: "b", phonemeB: "v", wordA: "berry", wordB: "very", hint: "Bilabial vs labiodental" },
];

/** Get all minimal pairs that include a specific phoneme */
export function getPairsForPhoneme(symbol: string): MinimalPair[] {
  return MINIMAL_PAIRS.filter((p) => p.phonemeA === symbol || p.phonemeB === symbol);
}
