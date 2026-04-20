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
  "subject-verb-agreement": "Chủ-vị hòa hợp",
  "article-a-an-the": "Mạo từ (a/an/the)",
  "word-form-confusion": "Dạng từ sai",
  "comma-splice": "Nối mệnh đề sai",
  "collocation": "Kết hợp từ",
  "preposition": "Giới từ",
  "tense-consistency": "Nhất quán thì động từ",
  "pronoun-reference": "Đại từ không rõ ràng",
  "sentence-fragment": "Câu thiếu thành phần",
  "run-on-sentence": "Câu quá dài/nối sai",
  "comparative-superlative": "So sánh hơn/nhất",
  "parallel-structure": "Cấu trúc song song",
  "passive-voice-misuse": "Bị động dùng sai",
  "conditional-form": "Câu điều kiện",
  "countable-uncountable": "Danh từ đếm được/không đếm được",
  "redundancy": "Thừa từ/ý",
  "word-choice": "Chọn từ không phù hợp",
  "punctuation": "Dấu câu",
};

export const ERROR_TAG_DESCRIPTIONS: Record<ErrorTag, string> = {
  "subject-verb-agreement": "The verb does not agree in number with its subject.",
  "article-a-an-the": "Incorrect or missing article (a, an, the, or zero article).",
  "word-form-confusion": "Using the wrong grammatical form of a word (noun/verb/adjective/adverb).",
  "comma-splice": "Two independent clauses joined with only a comma.",
  "collocation": "Words that do not naturally go together in English.",
  "preposition": "Wrong or missing preposition.",
  "tense-consistency": "Inconsistent verb tenses within a paragraph or essay.",
  "pronoun-reference": "A pronoun whose antecedent is ambiguous or missing.",
  "sentence-fragment": "A group of words punctuated as a sentence but lacking a main clause.",
  "run-on-sentence": "Two or more independent clauses incorrectly joined without punctuation.",
  "comparative-superlative": "Incorrect form of comparative or superlative adjective/adverb.",
  "parallel-structure": "Items in a list or comparison are not in the same grammatical form.",
  "passive-voice-misuse": "Passive voice used where active is clearer, or formed incorrectly.",
  "conditional-form": "Incorrect form of conditional sentence (if-clause or result clause).",
  "countable-uncountable": "A countable noun used as uncountable or vice versa.",
  "redundancy": "Unnecessary repetition of words or ideas.",
  "word-choice": "A word that is technically correct but unnatural or inappropriate in context.",
  "punctuation": "Missing, extra, or incorrect punctuation mark.",
};

/** Valid tag set for fast O(1) lookup */
export const VALID_ERROR_TAGS = new Set<string>(ERROR_TAGS);
