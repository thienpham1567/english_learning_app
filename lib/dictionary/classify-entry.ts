export type DictionaryEntryType =
  | "word"
  | "collocation"
  | "phrasal_verb"
  | "idiom";

const phrasalVerbParticles = new Set([
  "up",
  "down",
  "off",
  "on",
  "out",
  "away",
  "back",
  "over",
  "through",
]);

export function classifyDictionaryEntry(query: string): DictionaryEntryType {
  const parts = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (parts.length === 1) return "word";
  if (parts.length === 2 && phrasalVerbParticles.has(parts[1])) return "phrasal_verb";
  if (parts.length >= 3) return "idiom";
  return "collocation";
}
