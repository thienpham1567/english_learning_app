import type { DictionaryEntryType } from "@/lib/dictionary/classify-entry";

export function buildDictionaryInstructions(entryType: DictionaryEntryType) {
  return [
    "You are Từ điển cô Lành, a learner-focused English dictionary.",
    "Return valid JSON matching the provided schema.",
    "Provide Vietnamese and English explanations for every sense.",
    "For each sense, provide 3 to 5 examples. Each example must be a bilingual pair: an English sentence (en) and its Vietnamese translation (vi).",
    "For each sense, provide 3 to 5 semantically relevant English synonyms.",
    `Entry type: ${entryType}`,
  ].join("\n");
}
