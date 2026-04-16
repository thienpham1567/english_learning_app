import type { DetectedLanguage } from "@/lib/chat/types";

const englishPhrases = [
  ["can", "you"],
  ["can", "i", "ask"],
  ["can", "i"],
  ["help", "me"],
  ["please", "explain"],
  ["hello", "teacher"],
  ["good", "morning"],
  ["what", "is"],
  ["what", "does"],
  ["i", "want"],
  ["will", "join"],
  ["join", "the", "meeting"],
  ["speak", "english"],
  ["i", "am"],
];

const englishTokens = new Set([
  "am",
  "ask",
  "does",
  "english",
  "from",
  "help",
  "hello",
  "is",
  "join",
  "meeting",
  "morning",
  "problem",
  "practice",
  "please",
  "sentence",
  "teacher",
  "thanks",
  "understand",
  "question",
  "want",
  "went",
  "what",
  "will",
  "yesterday",
]);

const vietnamesePhrases = [
  ["co", "the"],
  ["co", "oi"],
  ["day", "la", "gi"],
  ["em", "chua", "hieu"],
  ["xin", "chao"],
  ["cam", "on"],
  ["giao", "vien"],
  ["tieng", "anh"],
  ["toi", "can"],
  ["can", "giup"],
  ["can", "hoc"],
  ["toi", "muon"],
  ["la", "ban"],
  ["giai", "thich"],
];

const vietnameseTokens = new Set([
  "cach",
  "chua",
  "di",
  "dung",
  "duoc",
  "em",
  "giai",
  "giup",
  "hoc",
  "hoi",
  "hieu",
  "khong",
  "muon",
  "nghia",
  "nghe",
  "noi",
  "nua",
  "toi",
  "tieng",
  "vua",
  "thich",
]);

function normalizeText(input: string) {
  return input
    .replace(/[đĐ]/g, "d")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function tokenize(input: string) {
  return normalizeText(input).match(/[a-z0-9]+/g) ?? [];
}

function hasPhrase(tokens: string[], phrase: readonly string[]) {
  if (phrase.length === 0 || tokens.length < phrase.length) {
    return false;
  }

  for (let index = 0; index <= tokens.length - phrase.length; index += 1) {
    let matched = true;
    for (let offset = 0; offset < phrase.length; offset += 1) {
      if (tokens[index + offset] !== phrase[offset]) {
        matched = false;
        break;
      }
    }

    if (matched) {
      return true;
    }
  }

  return false;
}

function countPhraseMatches(tokens: string[], phrases: readonly (readonly string[])[]) {
  let count = 0;
  for (const phrase of phrases) {
    if (hasPhrase(tokens, phrase)) {
      count += 1;
    }
  }
  return count;
}

function countTokenMatches(tokens: string[], signals: Set<string>) {
  let count = 0;
  for (const token of tokens) {
    if (signals.has(token)) {
      count += 1;
    }
  }
  return count;
}

export function detectLanguage(input: string): DetectedLanguage {
  const text = input.trim();
  if (!text) return "unknown";

  // Fast path: Vietnamese diacritical marks or đ/Đ are unambiguous — detect before normalization
  if (/[đĐàáâãèéêìíòóôõùúýăắặẳẵấầẩẫậếềệểễốồộổỗơớờợởỡưứừựửữ]/u.test(text)) {
    return "vietnamese";
  }

  const tokens = tokenize(text);
  const englishScore =
    countPhraseMatches(tokens, englishPhrases) + countTokenMatches(tokens, englishTokens);
  const vietnameseScore =
    countPhraseMatches(tokens, vietnamesePhrases) + countTokenMatches(tokens, vietnameseTokens);

  if (englishScore > 0 && vietnameseScore > 0) return "mixed";
  if (vietnameseScore > 0) return "vietnamese";
  if (englishScore > 0) return "english";
  return "unknown";
}
