export type ExamType = "toeic" | "ielts";

export type GrammarTopic = {
  id: string;
  title: string;
  level: "A2" | "B1" | "B2" | "C1";
  exams: ExamType[];
};

export type GrammarTopicCategory = {
  id: string;
  title: string;
  color: string;
  exams: ExamType[];
  topics: GrammarTopic[];
};

export const GRAMMAR_TOPIC_CATEGORIES: GrammarTopicCategory[] = [
  // ──────────────────────────────────────────────
  // SHARED (TOEIC + IELTS)
  // ──────────────────────────────────────────────
  {
    id: "tenses",
    title: "Thì (Tenses)",
    color: "var(--success)",
    exams: ["toeic", "ielts"],
    topics: [
      { id: "present-simple", title: "Present Simple", level: "A2", exams: ["toeic", "ielts"] },
      { id: "present-continuous", title: "Present Continuous", level: "A2", exams: ["toeic", "ielts"] },
      { id: "present-perfect", title: "Present Perfect", level: "B1", exams: ["toeic", "ielts"] },
      { id: "past-simple", title: "Past Simple", level: "A2", exams: ["toeic", "ielts"] },
      { id: "past-continuous", title: "Past Continuous", level: "B1", exams: ["toeic", "ielts"] },
      { id: "past-perfect", title: "Past Perfect", level: "B1", exams: ["toeic", "ielts"] },
      { id: "future-will-going", title: "Future (will / going to)", level: "B1", exams: ["toeic", "ielts"] },
      { id: "future-perfect", title: "Future Perfect", level: "B2", exams: ["ielts"] },
    ],
  },
  {
    id: "subject-verb-agreement",
    title: "Hòa hợp Chủ-Vị (S-V Agreement)",
    color: "var(--info)",
    exams: ["toeic", "ielts"],
    topics: [
      { id: "sva-basic", title: "Singular / Plural Rules", level: "A2", exams: ["toeic", "ielts"] },
      { id: "sva-collective", title: "Collective Nouns", level: "B1", exams: ["toeic", "ielts"] },
      { id: "sva-indefinite", title: "Indefinite Pronouns (everyone, each)", level: "B1", exams: ["toeic", "ielts"] },
      { id: "sva-prepositional-traps", title: "Prepositional Phrase Traps", level: "B1", exams: ["toeic"] },
    ],
  },
  {
    id: "parts-of-speech",
    title: "Từ loại (Parts of Speech)",
    color: "var(--accent)",
    exams: ["toeic", "ielts"],
    topics: [
      { id: "pos-noun-adj-adv", title: "Noun / Adjective / Adverb Forms", level: "A2", exams: ["toeic", "ielts"] },
      { id: "pos-suffixes", title: "Derivation Suffixes (-tion, -ment, -ly)", level: "B1", exams: ["toeic", "ielts"] },
      { id: "pos-word-form-selection", title: "Word Form Selection in Context", level: "B1", exams: ["toeic"] },
    ],
  },
  {
    id: "modals",
    title: "Động từ khiếm khuyết (Modals)",
    color: "var(--accent)",
    exams: ["toeic", "ielts"],
    topics: [
      { id: "can-could-may", title: "Can / Could / May", level: "A2", exams: ["toeic", "ielts"] },
      { id: "must-have-to", title: "Must / Have to", level: "B1", exams: ["toeic", "ielts"] },
      { id: "should-ought", title: "Should / Ought to", level: "B1", exams: ["toeic", "ielts"] },
    ],
  },
  {
    id: "prepositions",
    title: "Giới từ (Prepositions)",
    color: "var(--warning)",
    exams: ["toeic", "ielts"],
    topics: [
      { id: "prep-time", title: "Time Prepositions (in / on / at)", level: "A2", exams: ["toeic", "ielts"] },
      { id: "prep-place-direction", title: "Place & Direction", level: "A2", exams: ["toeic", "ielts"] },
      { id: "prep-collocations", title: "Verb + Preposition Collocations", level: "B1", exams: ["toeic", "ielts"] },
      { id: "prep-phrasal-verbs", title: "Phrasal Verbs", level: "B1", exams: ["toeic", "ielts"] },
    ],
  },
  {
    id: "conjunctions",
    title: "Liên từ & Kết nối (Conjunctions)",
    color: "var(--secondary)",
    exams: ["toeic", "ielts"],
    topics: [
      { id: "conj-coordinating", title: "And / But / Or / So", level: "A2", exams: ["toeic", "ielts"] },
      { id: "conj-subordinating", title: "Although / Because / While / If", level: "B1", exams: ["toeic", "ielts"] },
      { id: "conj-transitions", title: "However / Therefore / Moreover", level: "B1", exams: ["toeic", "ielts"] },
    ],
  },
  {
    id: "conditionals",
    title: "Câu điều kiện (Conditionals)",
    color: "var(--warning)",
    exams: ["toeic", "ielts"],
    topics: [
      { id: "zero-first", title: "Zero & First Conditional", level: "B1", exams: ["toeic", "ielts"] },
      { id: "second-conditional", title: "Second Conditional", level: "B1", exams: ["toeic", "ielts"] },
      { id: "third-conditional", title: "Third Conditional", level: "B2", exams: ["toeic", "ielts"] },
      { id: "mixed-conditional", title: "Mixed Conditionals", level: "C1", exams: ["ielts"] },
    ],
  },
  {
    id: "comparatives",
    title: "So sánh (Comparatives & Superlatives)",
    color: "var(--xp)",
    exams: ["toeic", "ielts"],
    topics: [
      { id: "comp-er-est", title: "-er / -est & more / most", level: "A2", exams: ["toeic", "ielts"] },
      { id: "comp-as-as", title: "As...as / Not as...as", level: "B1", exams: ["toeic", "ielts"] },
      { id: "comp-irregular", title: "Irregular Forms (better, worse...)", level: "B1", exams: ["toeic", "ielts"] },
    ],
  },
  {
    id: "gerunds-infinitives",
    title: "V-ing & To-V (Gerunds / Infinitives)",
    color: "var(--success)",
    exams: ["toeic", "ielts"],
    topics: [
      { id: "gi-verb-gerund", title: "Verb + Gerund (enjoy doing)", level: "B1", exams: ["toeic", "ielts"] },
      { id: "gi-verb-infinitive", title: "Verb + Infinitive (decide to do)", level: "B1", exams: ["toeic", "ielts"] },
      { id: "gi-both", title: "Both Forms (remember doing / to do)", level: "B1", exams: ["toeic", "ielts"] },
    ],
  },
  {
    id: "passive",
    title: "Bị động (Passive Voice)",
    color: "var(--secondary)",
    exams: ["toeic", "ielts"],
    topics: [
      { id: "passive-simple", title: "Simple Passive", level: "B1", exams: ["toeic", "ielts"] },
      { id: "passive-perfect", title: "Perfect Passive", level: "B2", exams: ["toeic", "ielts"] },
      { id: "causative", title: "Causative (have/get something done)", level: "B2", exams: ["toeic", "ielts"] },
    ],
  },
  {
    id: "pronouns",
    title: "Đại từ (Pronouns)",
    color: "var(--info)",
    exams: ["toeic", "ielts"],
    topics: [
      { id: "pron-personal-possessive", title: "Personal & Possessive Pronouns", level: "A2", exams: ["toeic", "ielts"] },
      { id: "pron-reflexive", title: "Reflexive Pronouns (myself, themselves)", level: "B1", exams: ["toeic", "ielts"] },
      { id: "pron-agreement", title: "Pronoun-Antecedent Agreement", level: "B1", exams: ["toeic"] },
    ],
  },
  {
    id: "clauses",
    title: "Mệnh đề (Clauses)",
    color: "var(--error)",
    exams: ["toeic", "ielts"],
    topics: [
      { id: "relative-who-which", title: "Relative (who / which / that)", level: "B1", exams: ["toeic", "ielts"] },
      { id: "relative-advanced", title: "Non-defining Relatives", level: "B2", exams: ["toeic", "ielts"] },
      { id: "noun-clauses", title: "Noun Clauses", level: "B2", exams: ["toeic", "ielts"] },
    ],
  },
  {
    id: "determiners",
    title: "Mạo từ & Lượng từ",
    color: "var(--xp)",
    exams: ["toeic", "ielts"],
    topics: [
      { id: "articles", title: "A / An / The", level: "A2", exams: ["toeic", "ielts"] },
      { id: "quantifiers", title: "Some / Any / Much / Many", level: "B1", exams: ["toeic", "ielts"] },
      { id: "both-either-neither", title: "Both / Either / Neither", level: "B1", exams: ["toeic", "ielts"] },
    ],
  },

  // ──────────────────────────────────────────────
  // IELTS-ONLY ADVANCED
  // ──────────────────────────────────────────────
  {
    id: "complex-sentences",
    title: "Câu phức (Complex Sentences)",
    color: "var(--accent)",
    exams: ["ielts"],
    topics: [
      { id: "cs-adverbial", title: "Adverbial Clauses", level: "B2", exams: ["ielts"] },
      { id: "cs-multiple-clause", title: "Multiple Clause Linking", level: "B2", exams: ["ielts"] },
      { id: "cs-participle", title: "Participle Clauses", level: "C1", exams: ["ielts"] },
    ],
  },
  {
    id: "inversion",
    title: "Đảo ngữ & Nhấn mạnh (Inversion)",
    color: "var(--error)",
    exams: ["ielts"],
    topics: [
      { id: "inv-negative-adverb", title: "Negative Adverb Inversion (Never have I...)", level: "C1", exams: ["ielts"] },
      { id: "inv-cleft", title: "Cleft Sentences (It was X that...)", level: "B2", exams: ["ielts"] },
      { id: "inv-fronting", title: "Fronting & Emphasis", level: "C1", exams: ["ielts"] },
    ],
  },
  {
    id: "nominalization",
    title: "Danh từ hoá (Nominalization)",
    color: "var(--secondary)",
    exams: ["ielts"],
    topics: [
      { id: "nom-verb-to-noun", title: "Verb → Noun Transforms (discover → discovery)", level: "B2", exams: ["ielts"] },
      { id: "nom-academic-register", title: "Formal Academic Register", level: "C1", exams: ["ielts"] },
    ],
  },
  {
    id: "advanced-structures",
    title: "Cấu trúc nâng cao (Advanced)",
    color: "var(--warning)",
    exams: ["ielts"],
    topics: [
      { id: "adv-subjunctive", title: "Subjunctive (suggest that he go...)", level: "C1", exams: ["ielts"] },
      { id: "adv-wish-if-only", title: "Wish / If only", level: "B2", exams: ["ielts"] },
      { id: "adv-hedging", title: "Hedging (tends to, is likely to)", level: "B2", exams: ["ielts"] },
    ],
  },
];

export const GRAMMAR_TOPICS = GRAMMAR_TOPIC_CATEGORIES.flatMap((category) => category.topics);

export function getGrammarTopic(topicId: string): GrammarTopic | undefined {
  return GRAMMAR_TOPICS.find((topic) => topic.id === topicId);
}

export function getCategoriesForExam(exam: ExamType): GrammarTopicCategory[] {
  return GRAMMAR_TOPIC_CATEGORIES.filter((cat) => cat.exams.includes(exam)).map((cat) => ({
    ...cat,
    topics: cat.topics.filter((t) => t.exams.includes(exam)),
  }));
}
