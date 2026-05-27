/**
 * Error tag taxonomy for writing pattern classification (Story 19.2.4).
 *
 * Each tag maps to a human-readable label and a brief description used
 * in quiz generation prompts and the error-notebook UI.
 */

export const ERROR_TAGS = [
  "subject-verb-agreement",
  "article-a-an-the",
  "word-form-confusion",
  "comma-splice",
  "collocation",
  "preposition",
  "tense-consistency",
  "pronoun-reference",
  "sentence-fragment",
  "run-on-sentence",
  "comparative-superlative",
  "parallel-structure",
  "passive-voice-misuse",
  "conditional-form",
  "countable-uncountable",
  "redundancy",
  "word-choice",
  "punctuation",
] as const;

export type ErrorTag = (typeof ERROR_TAGS)[number];

export const ERROR_TAG_LABELS: Record<ErrorTag, string> = {
  "subject-verb-agreement": "Subject-Verb Agreement",
  "article-a-an-the": "Articles (a/an/the)",
  "word-form-confusion": "Word Form Confusion",
  "comma-splice": "Comma Splice",
  collocation: "Collocation",
  preposition: "Preposition",
  "tense-consistency": "Tense Consistency",
  "pronoun-reference": "Pronoun Reference",
  "sentence-fragment": "Sentence Fragment",
  "run-on-sentence": "Run-on Sentence",
  "comparative-superlative": "Comparative & Superlative",
  "parallel-structure": "Parallel Structure",
  "passive-voice-misuse": "Passive Voice Misuse",
  "conditional-form": "Conditional Form",
  "countable-uncountable": "Countable & Uncountable",
  redundancy: "Redundancy",
  "word-choice": "Word Choice",
  punctuation: "Punctuation",
};

export const ERROR_TAG_DESCRIPTIONS: Record<ErrorTag, string> = {
  "subject-verb-agreement": "The verb does not agree in number with its subject.",
  "article-a-an-the": "Incorrect or missing article (a, an, the, or zero article).",
  "word-form-confusion": "Using the wrong grammatical form of a word (noun/verb/adjective/adverb).",
  "comma-splice": "Two independent clauses joined with only a comma.",
  collocation: "Words that do not naturally go together in English.",
  preposition: "Wrong or missing preposition.",
  "tense-consistency": "Inconsistent verb tenses within a paragraph or essay.",
  "pronoun-reference": "A pronoun whose antecedent is ambiguous or missing.",
  "sentence-fragment": "A group of words punctuated as a sentence but lacking a main clause.",
  "run-on-sentence": "Two or more independent clauses incorrectly joined without punctuation.",
  "comparative-superlative": "Incorrect form of comparative or superlative adjective/adverb.",
  "parallel-structure": "Items in a list or comparison are not in the same grammatical form.",
  "passive-voice-misuse": "Passive voice used where active is clearer, or formed incorrectly.",
  "conditional-form": "Incorrect form of conditional sentence (if-clause or result clause).",
  "countable-uncountable": "A countable noun used as uncountable or vice versa.",
  redundancy: "Unnecessary repetition of words or ideas.",
  "word-choice": "A word that is technically correct but unnatural or inappropriate in context.",
  punctuation: "Missing, extra, or incorrect punctuation mark.",
};

/** Valid tag set for fast O(1) lookup */
export const VALID_ERROR_TAGS = new Set<string>(ERROR_TAGS);
