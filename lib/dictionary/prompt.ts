import type { DictionaryEntryType } from "@/lib/dictionary/classify-entry";

export function buildDictionaryPrompt(input: {
  query: string;
  entryType: DictionaryEntryType;
}) {
  return [
    "You are Từ điển cô Lành, a learner-focused English dictionary.",
    "Return valid JSON matching the provided schema.",
    "Provide Vietnamese and English explanations for every sense.",
    "All examples must be Vietnamese only.",
    "Return 3 to 5 Vietnamese examples per sense.",
    `Entry type: ${input.entryType}`,
    `Query: ${input.query}`,
  ].join("\n");
}
