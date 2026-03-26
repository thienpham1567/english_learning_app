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
  "you",
]);

const vietnameseSignals = new Set([
  "anh",
  "ban",
  "cho",
  "co",
  "cach",
  "dung",
  "giai",
  "giup",
  "hoc",
  "hoi",
  "khong",
  "la",
  "lam",
  "moi",
  "minh",
  "muon",
  "nghia",
  "nghe",
  "oi",
  "qua",
  "the",
  "thi",
  "tieng",
  "toi",
  "viet",
  "vua",
  "ve",
]);

function normalizeText(input: string) {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function tokenize(input: string) {
  return normalizeText(input).match(/[a-z0-9]+/g) ?? [];
}

export function detectLanguage(input: string): DetectedLanguage {
  const text = input.trim();
  if (!text) return "unknown";

  const tokens = tokenize(text);
  let englishScore = 0;
  let vietnameseScore = 0;

  for (const token of tokens) {
    if (englishSignals.has(token)) englishScore += 1;
    if (vietnameseSignals.has(token)) vietnameseScore += 1;
  }

  if (englishScore > 0 && vietnameseScore > 0) return "mixed";
  if (vietnameseScore > 0) return "vietnamese";
  if (englishScore > 0) return "english";
  return "unknown";
}
