import type { DetectedLanguage } from "@/lib/chat/types";

const englishSignals = new Set([
  "a",
  "am",
  "and",
  "are",
  "can",
  "do",
  "does",
  "english",
  "from",
  "help",
  "i",
  "in",
  "is",
  "me",
  "no",
  "problem",
  "join",
  "meeting",
  "practice",
  "sentence",
  "speak",
  "speaking",
  "thanks",
  "this",
  "to",
  "understand",
  "want",
  "what",
  "when",
  "where",
  "why",
  "will",
  "you",
]);

const vietnameseStrongSignals = new Set([
  "cho",
  "cach",
  "di",
  "dung",
  "duoc",
  "giai",
  "giup",
  "hoc",
  "hoi",
  "khong",
  "muon",
  "nghia",
  "nghe",
  "thi",
  "tieng",
  "toi",
  "vua",
]);

const vietnameseContextWeakSignals = new Set([
  "ban",
  "co",
  "la",
  "moi",
  "nao",
  "oi",
  "qua",
  "roi",
  "ve",
]);

const vietnameseNameWeakSignals = new Set([
  "anh",
  "lam",
  "minh",
  "viet",
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

function hasVietnamesePhraseSignal(tokens: string[]) {
  for (let index = 0; index < tokens.length - 1; index += 1) {
    if (tokens[index] === "co" && tokens[index + 1] === "the") {
      return true;
    }
  }

  return false;
}

export function detectLanguage(input: string): DetectedLanguage {
  const text = input.trim();
  if (!text) return "unknown";

  const tokens = tokenize(text);
  let englishScore = 0;
  let vietnameseStrongScore = 0;
  let vietnameseContextWeakScore = 0;
  let vietnameseNameWeakScore = 0;

  if (hasVietnamesePhraseSignal(tokens)) {
    vietnameseStrongScore += 1;
  }

  for (const token of tokens) {
    if (englishSignals.has(token)) englishScore += 1;
    if (vietnameseStrongSignals.has(token)) vietnameseStrongScore += 1;
    if (vietnameseContextWeakSignals.has(token)) vietnameseContextWeakScore += 1;
    if (vietnameseNameWeakSignals.has(token)) vietnameseNameWeakScore += 1;
  }

  if (englishScore > 0 && vietnameseStrongScore > 0) return "mixed";
  if (englishScore > 0 && vietnameseContextWeakScore >= 2) return "mixed";
  if (vietnameseStrongScore > 0) return "vietnamese";
  if (englishScore > 0) return "english";
  if (vietnameseContextWeakScore >= 2) return "vietnamese";
  if (vietnameseNameWeakScore >= 2) return "unknown";
  return "unknown";
}
