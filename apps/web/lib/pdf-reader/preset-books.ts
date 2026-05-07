/**
 * Pre-bundled grammar PDF books served from /public/books/.
 * These are always available without user upload.
 */

export interface PresetBook {
  id: string;
  name: string;
  fileName: string;
  /** URL path served from public/ */
  url: string;
  category: string;
  /** Unique accent color for visual differentiation */
  accentColor: string;
}

export const PRESET_BOOKS: PresetBook[] = [
  {
    id: "preset_nouns_adjectives",
    name: "Nouns and Adjectives",
    fileName: "mastering_english_grammar_1_-_nouns_and_adjectives.pdf",
    url: "/books/mastering_english_grammar_1_-_nouns_and_adjectives.pdf",
    category: "Grammar",
    accentColor: "#C84B31",
  },
  {
    id: "preset_subjects_verbs",
    name: "Subjects and Verbs",
    fileName: "mastering_english_grammar_subjects_and_verbs_by_david_moeller.pdf",
    url: "/books/mastering_english_grammar_subjects_and_verbs_by_david_moeller.pdf",
    category: "Grammar",
    accentColor: "#4A7C6F",
  },
  {
    id: "preset_verbs_adverbs",
    name: "Verbs and Adverbs",
    fileName: "mastering_english_grammar_verbs_and_adverbs.pdf",
    url: "/books/mastering_english_grammar_verbs_and_adverbs.pdf",
    category: "Grammar",
    accentColor: "#B8987A",
  },
  {
    id: "preset_pronouns_prepositions",
    name: "Pronouns, Prepositions & Conjunctions",
    fileName: "mastering_english_grammar_pronouns_prepositions_and_conjunctions.pdf",
    url: "/books/mastering_english_grammar_pronouns_prepositions_and_conjunctions.pdf",
    category: "Grammar",
    accentColor: "#C4A35A",
  },
  {
    id: "preset_compound_sentences",
    name: "Compound Sentences",
    fileName: "mastering_english_grammar_-_compound_sentences.pdf",
    url: "/books/mastering_english_grammar_-_compound_sentences.pdf",
    category: "Grammar",
    accentColor: "#8B6F5E",
  },
  {
    id: "preset_complex_sentences",
    name: "Complex Sentences",
    fileName: "mastering_english_grammar_-_complex_sentences.pdf",
    url: "/books/mastering_english_grammar_-_complex_sentences.pdf",
    category: "Grammar",
    accentColor: "#6B4A3A",
  },
];
