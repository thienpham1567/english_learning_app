/**
 * Lightweight English lemmatizer (Story 19.4.1, AC6).
 *
 * Uses a simple rule-based approach instead of heavy NLP dependencies
 * (wink-lemmatizer, compromise, spacy). Covers the most common English
 * morphological patterns — sufficient for CEFR vocab tagging.
 *
 * Returns normalized, lowercase lemma forms.
 */

// ── Irregular verb/noun overrides (most common) ──
const IRREGULARS: Record<string, string> = {
  // Verbs
  was: "be", were: "be", been: "be", am: "be", is: "be", are: "be",
  had: "have", has: "have", having: "have",
  did: "do", does: "do", doing: "do", done: "do",
  went: "go", goes: "go", going: "go", gone: "go",
  said: "say", says: "say",
  got: "get", gets: "get", getting: "get", gotten: "get",
  made: "make", makes: "make", making: "make",
  came: "come", comes: "come", coming: "come",
  took: "take", takes: "take", taking: "take", taken: "take",
  knew: "know", knows: "know", knowing: "know", known: "know",
  thought: "think", thinks: "think", thinking: "think",
  told: "tell", tells: "tell", telling: "tell",
  found: "find", finds: "find", finding: "find",
  gave: "give", gives: "give", giving: "give", given: "give",
  ran: "run", runs: "run", running: "run",
  saw: "see", sees: "see", seeing: "see", seen: "see",
  left: "leave", leaves: "leave", leaving: "leave",
  felt: "feel", feels: "feel", feeling: "feel",
  kept: "keep", keeps: "keep", keeping: "keep",
  began: "begin", begins: "begin", beginning: "begin", begun: "begin",
  brought: "bring", brings: "bring", bringing: "bring",
  wrote: "write", writes: "write", writing: "write", written: "write",
  stood: "stand", stands: "stand", standing: "stand",
  heard: "hear", hears: "hear", hearing: "hear",
  let: "let", lets: "let", letting: "let",
  meant: "mean", means: "mean", meaning: "mean",
  set: "set", sets: "set", setting: "set",
  met: "meet", meets: "meet", meeting: "meet",
  paid: "pay", pays: "pay", paying: "pay",
  sat: "sit", sits: "sit", sitting: "sit",
  spoke: "speak", speaks: "speak", speaking: "speak", spoken: "speak",
  led: "lead", leads: "lead", leading: "lead",
  grew: "grow", grows: "grow", growing: "grow", grown: "grow",
  lost: "lose", loses: "lose", losing: "lose",
  held: "hold", holds: "hold", holding: "hold",
  bought: "buy", buys: "buy", buying: "buy",
  sent: "send", sends: "send", sending: "send",
  built: "build", builds: "build", building: "build",
  fell: "fall", falls: "fall", falling: "fall", fallen: "fall",
  caught: "catch", catches: "catch", catching: "catch",
  chose: "choose", chooses: "choose", choosing: "choose", chosen: "choose",
  broke: "break", breaks: "break", breaking: "break", broken: "break",
  spent: "spend", spends: "spend", spending: "spend",
  taught: "teach", teaches: "teach", teaching: "teach",
  understood: "understand", understands: "understand", understanding: "understand",
  drove: "drive", drives: "drive", driving: "drive", driven: "drive",
  drew: "draw", draws: "draw", drawing: "draw", drawn: "draw",
  wore: "wear", wears: "wear", wearing: "wear", worn: "wear",
  ate: "eat", eats: "eat", eating: "eat", eaten: "eat",
  threw: "throw", throws: "throw", throwing: "throw", thrown: "throw",
  rose: "rise", rises: "rise", rising: "rise", risen: "rise",
  sang: "sing", sings: "sing", singing: "sing", sung: "sing",
  swam: "swim", swims: "swim", swimming: "swim", swum: "swim",
  flew: "fly", flies: "fly", flying: "fly", flown: "fly",
  // Nouns
  children: "child", men: "man", women: "woman", people: "person",
  mice: "mouse", teeth: "tooth", feet: "foot", geese: "goose",
  oxen: "ox", phenomena: "phenomenon", criteria: "criterion",
  data: "datum", media: "medium", analyses: "analysis",
  // Adjectives
  better: "good", best: "good",
  worse: "bad", worst: "bad",
  more: "many", most: "many",
  less: "little", least: "little",
  further: "far", furthest: "far",
};

// ── Stop words to exclude from lexical tags ──
const STOP_WORDS = new Set([
  "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for",
  "of", "with", "by", "from", "as", "is", "was", "are", "were", "be",
  "been", "being", "have", "has", "had", "do", "does", "did", "will",
  "would", "could", "should", "may", "might", "shall", "can", "must",
  "not", "no", "nor", "so", "if", "then", "than", "that", "this",
  "these", "those", "it", "its", "he", "she", "they", "we", "you",
  "i", "me", "my", "your", "his", "her", "our", "their", "us", "them",
  "who", "whom", "which", "what", "when", "where", "how", "why",
  "all", "each", "every", "both", "few", "more", "most", "other",
  "some", "such", "only", "own", "same", "very", "just", "also",
  "about", "up", "out", "into", "over", "after", "before", "between",
  "under", "above", "below", "through", "during", "without", "within",
  "along", "around", "among", "against", "because", "until", "while",
  "there", "here", "too", "much", "many", "any", "well", "still",
  "even", "now", "back", "yet", "already", "always", "never", "often",
  "really", "quite", "rather",
]);

/**
 * Lemmatize a single English word using rule-based suffix stripping.
 */
export function lemmatize(word: string): string {
  const w = word.toLowerCase().trim();
  if (!w || w.length < 2) return w;

  // Check irregulars first
  if (IRREGULARS[w]) return IRREGULARS[w];

  // Rule-based suffix stripping (order matters)
  // -ies → -y (carries → carry)
  if (w.endsWith("ies") && w.length > 4) return w.slice(0, -3) + "y";
  // -ves → -f (leaves → leaf, wolves → wolf)
  if (w.endsWith("ves") && w.length > 4) return w.slice(0, -3) + "f";
  // -ses, -xes, -zes, -ches, -shes → remove -es
  if (w.endsWith("ses") || w.endsWith("xes") || w.endsWith("zes") || w.endsWith("ches") || w.endsWith("shes")) {
    return w.slice(0, -2);
  }
  // -ness → remove (happiness → happi → happy handled by -i→y below)
  if (w.endsWith("ness") && w.length > 5) {
    const stem = w.slice(0, -4);
    return stem.endsWith("i") ? stem.slice(0, -1) + "y" : stem;
  }
  // -ment → remove
  if (w.endsWith("ment") && w.length > 5) return w.slice(0, -4);
  // -tion, -sion → remove
  if ((w.endsWith("tion") || w.endsWith("sion")) && w.length > 5) return w.slice(0, -4) + "e";
  // -ly → remove (but not "fly", "apply")
  if (w.endsWith("ly") && w.length > 4) {
    const stem = w.slice(0, -2);
    return stem.endsWith("i") ? stem.slice(0, -1) + "y" : stem;
  }
  // -ing → remove (running → run, making → make)
  if (w.endsWith("ing") && w.length > 4) {
    const stem = w.slice(0, -3);
    // Double consonant: running → run
    if (stem.length >= 2 && stem[stem.length - 1] === stem[stem.length - 2]) {
      return stem.slice(0, -1);
    }
    // Check if stem+e is more likely (making → make)
    return stem;
  }
  // -ed → remove (played → play, loved → love)
  if (w.endsWith("ed") && w.length > 3) {
    const stem = w.slice(0, -2);
    if (w.endsWith("ied")) return w.slice(0, -3) + "y";
    // Double consonant: stopped → stop
    if (stem.length >= 2 && stem[stem.length - 1] === stem[stem.length - 2]) {
      return stem.slice(0, -1);
    }
    return stem.endsWith("e") ? stem : stem;
  }
  // -er → remove (faster → fast, bigger → big)
  if (w.endsWith("er") && w.length > 3) {
    const stem = w.slice(0, -2);
    if (stem.length >= 2 && stem[stem.length - 1] === stem[stem.length - 2]) {
      return stem.slice(0, -1);
    }
    return stem;
  }
  // -est → remove
  if (w.endsWith("est") && w.length > 4) {
    const stem = w.slice(0, -3);
    if (stem.length >= 2 && stem[stem.length - 1] === stem[stem.length - 2]) {
      return stem.slice(0, -1);
    }
    return stem;
  }
  // -s → remove (basic plural/3rd person)
  if (w.endsWith("s") && !w.endsWith("ss") && w.length > 3) {
    return w.slice(0, -1);
  }

  return w;
}

/**
 * Tokenize text into words, removing punctuation and numbers.
 */
export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z\s'-]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 2 && !/^\d+$/.test(w))
    .map((w) => w.replace(/^['-]+|['-]+$/g, "")); // trim leading/trailing quotes/hyphens
}

/**
 * Extract unique lemmas from text, excluding stop words.
 * Returns sorted, deduplicated array of lemmas.
 */
export function extractLemmas(text: string): string[] {
  const words = tokenize(text);
  const lemmas = new Set<string>();

  for (const word of words) {
    if (STOP_WORDS.has(word)) continue;
    const lemma = lemmatize(word);
    if (lemma.length >= 2 && !STOP_WORDS.has(lemma)) {
      lemmas.add(lemma);
    }
  }

  return Array.from(lemmas).sort();
}

/**
 * Check if a lemma is a stop word.
 */
export function isStopWord(word: string): boolean {
  return STOP_WORDS.has(word.toLowerCase());
}
