import type { MorphemeType } from "./schema";

interface LessonPromptArgs {
  morpheme: string;
  type: MorphemeType;
  gloss: string;
}

/**
 * System prompt for generating a complete morpheme lesson. The model must return
 * a single JSON object matching MorphemeLessonSchema. Vietnamese for learner-facing
 * explanations/meanings; English for example sentences and the morpheme itself.
 */
export function buildMorphemeLessonPrompt({ morpheme, type, gloss }: LessonPromptArgs): string {
  return `You are an expert English vocabulary coach teaching MORPHOLOGY (word formation) to Vietnamese learners.

Create a focused lesson for the ${type} "${morpheme}" (core meaning: "${gloss}").

Return ONE valid JSON object with EXACTLY these fields:
{
  "morpheme": "${morpheme}",
  "type": "${type}",
  "gloss": "${gloss}",
  "meaningEn": "1-2 sentence explanation of the morpheme's meaning and how it changes words",
  "meaningVi": "giải thích ngắn gọn bằng tiếng Việt",
  "origin": "etymology, e.g. 'Latin: spectare (to look)' or 'Old English'",
  ${type === "suffix" ? `"posEffect": "the part of speech this suffix forms, e.g. 'noun'",` : ""}
  "family": [
    {
      "word": "a real English word built with this morpheme",
      "partOfSpeech": "noun|verb|adjective|adverb",
      "meaningVi": "nghĩa tiếng Việt",
      "exampleEn": "A natural sentence using the word.",
      "highlight": "the exact morpheme substring as it appears in the word, e.g. '${morpheme.replace(/-/g, "")}'"
    }
  ],
  "exercises": [
    { "type": "match", "prompt": "Match each item to its meaning.", "pairs": [ { "left": "word or affix", "right": "its meaning (Vietnamese or English)" } ] },
    { "type": "word_formation", "sentence": "Sentence with a ___ blank.", "baseWord": "the base word to transform", "answer": "correct derived form", "acceptedAnswers": ["optional variants"], "explanationVi": "vì sao", "explanationEn": "why" },
    { "type": "mcq", "sentence": "Sentence with a ___ blank.", "options": ["A","B","C","D"], "answer": "exact correct option text", "explanationVi": "vì sao", "explanationEn": "why" }
  ]
}

Requirements:
- 5-8 family words, ordered from most common to least.
- 6-9 exercises mixing all three types (at least one of each). Include at least 2 "match", 2 "word_formation", 2 "mcq".
- For "mcq", "answer" MUST be exactly equal to one of the 4 "options".
- "highlight" must be a substring that actually occurs in the example or word.
- Keep sentences natural and TOEIC-appropriate (workplace/everyday register).
- Return JSON only — no markdown, no commentary.`;
}

/**
 * System prompt for analyzing an arbitrary word into its morphemes + word family.
 * Returns JSON matching MorphemeAnalysisSchema.
 */
export function buildAnalyzePrompt(word: string): string {
  return `You are an English morphology expert helping Vietnamese learners.

Break the word "${word}" into its morphemes and list its word family.

Return ONE valid JSON object:
{
  "word": "${word}",
  "parts": [
    { "surface": "the morpheme as written, e.g. 'un'", "type": "prefix|suffix|root", "meaning": "its meaning (Vietnamese ok)" }
  ],
  "family": [
    { "word": "related derived word", "partOfSpeech": "noun|verb|adjective|adverb", "meaningVi": "nghĩa", "exampleEn": "A sentence.", "highlight": "shared morpheme substring" }
  ]
}

Requirements:
- "parts" must cover the whole word in order (prefix(es) → root → suffix(es)). If the word is a single root, return one part.
- 3-6 family words.
- Return JSON only.`;
}
