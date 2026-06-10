/**
 * Static mapping of grammar topics to TOEIC parts.
 * Used by the TOEIC Impact Map feature to show users
 * which grammar concepts affect which TOEIC sections.
 */

export interface ToeicImpact {
  topic: string;
  parts: string[];
  questionRange: string;
  estimatedPoints: number;
  description: string;
}

export const TOEIC_GRAMMAR_MAP: ToeicImpact[] = [
  {
    topic: "subject-verb-agreement",
    parts: ["Part 5", "Part 6"],
    questionRange: "Q101-110",
    estimatedPoints: 20,
    description: "Subject-verb agreement is tested frequently in incomplete sentences",
  },
  {
    topic: "tense",
    parts: ["Part 5", "Part 6", "Part 7"],
    questionRange: "Q101-130",
    estimatedPoints: 25,
    description:
      "Tense usage appears in sentence completion, text completion, and reading comprehension",
  },
  {
    topic: "article",
    parts: ["Part 5", "Part 6"],
    questionRange: "Q101-130",
    estimatedPoints: 15,
    description: "Articles (a/an/the) are tested in gap-fill questions",
  },
  {
    topic: "preposition",
    parts: ["Part 5", "Part 6"],
    questionRange: "Q101-130",
    estimatedPoints: 20,
    description: "Preposition collocations are one of the most frequently tested areas",
  },
  {
    topic: "word-form",
    parts: ["Part 5"],
    questionRange: "Q101-130",
    estimatedPoints: 20,
    description: "Word form (noun/verb/adjective/adverb) selection is a core Part 5 question type",
  },
  {
    topic: "conditional",
    parts: ["Part 5", "Part 6"],
    questionRange: "Q101-130",
    estimatedPoints: 10,
    description: "Conditional structures appear in both sentence and text completion",
  },
  {
    topic: "relative-clause",
    parts: ["Part 5", "Part 6", "Part 7"],
    questionRange: "Q101-200",
    estimatedPoints: 15,
    description: "Relative clauses affect both grammar questions and reading comprehension",
  },
  {
    topic: "passive-voice",
    parts: ["Part 5", "Part 6"],
    questionRange: "Q101-130",
    estimatedPoints: 15,
    description: "Passive construction is a common test pattern in TOEIC grammar sections",
  },
  {
    topic: "gerund-infinitive",
    parts: ["Part 5"],
    questionRange: "Q101-130",
    estimatedPoints: 10,
    description: "Gerund vs infinitive after specific verbs is a standard Part 5 item",
  },
  {
    topic: "vocabulary",
    parts: ["Part 5", "Part 6", "Part 7"],
    questionRange: "Q101-200",
    estimatedPoints: 30,
    description: "Vocabulary knowledge impacts all reading sections significantly",
  },
  {
    topic: "listening-detail",
    parts: ["Part 3", "Part 4"],
    questionRange: "Q41-100",
    estimatedPoints: 30,
    description: "Detail comprehension questions make up the majority of Part 3 and Part 4",
  },
  {
    topic: "listening-comprehension",
    parts: ["Part 1", "Part 2", "Part 3", "Part 4"],
    questionRange: "Q1-100",
    estimatedPoints: 40,
    description: "Overall listening comprehension affects all listening sections",
  },
];

/**
 * Look up TOEIC impact for a given grammar/error category.
 */
export function getToeicImpact(category: string): ToeicImpact | undefined {
  return TOEIC_GRAMMAR_MAP.find(
    (item) =>
      item.topic === category || item.topic.includes(category) || category.includes(item.topic),
  );
}
