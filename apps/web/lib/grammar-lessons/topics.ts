export type GrammarTopic = {
  id: string;
  title: string;
  level: "A2" | "B1" | "B2";
};

export type GrammarTopicCategory = {
  id: string;
  title: string;
  color: string;
  topics: GrammarTopic[];
};

export const GRAMMAR_TOPIC_CATEGORIES: GrammarTopicCategory[] = [
  {
    id: "tenses",
    title: "Thì (Tenses)",
    color: "var(--success)",
    topics: [
      { id: "present-simple", title: "Present Simple", level: "A2" },
      { id: "present-continuous", title: "Present Continuous", level: "A2" },
      { id: "present-perfect", title: "Present Perfect", level: "B1" },
      { id: "past-simple", title: "Past Simple", level: "A2" },
      { id: "future-will-going", title: "Future (will / going to)", level: "B1" },
    ],
  },
  {
    id: "modals",
    title: "Động từ khiếm khuyết (Modals)",
    color: "var(--accent)",
    topics: [
      { id: "can-could-may", title: "Can / Could / May", level: "A2" },
      { id: "must-have-to", title: "Must / Have to", level: "B1" },
      { id: "should-ought", title: "Should / Ought to", level: "B1" },
    ],
  },
  {
    id: "conditionals",
    title: "Câu điều kiện (Conditionals)",
    color: "var(--warning)",
    topics: [
      { id: "zero-first", title: "Zero & First Conditional", level: "B1" },
      { id: "second-conditional", title: "Second Conditional", level: "B1" },
      { id: "third-conditional", title: "Third Conditional", level: "B2" },
    ],
  },
  {
    id: "passive",
    title: "Bị động (Passive Voice)",
    color: "var(--secondary)",
    topics: [
      { id: "passive-simple", title: "Simple Passive", level: "B1" },
      { id: "passive-perfect", title: "Perfect Passive", level: "B2" },
      { id: "causative", title: "Causative (have/get)", level: "B2" },
    ],
  },
  {
    id: "clauses",
    title: "Mệnh đề (Clauses)",
    color: "var(--error)",
    topics: [
      { id: "relative-who-which", title: "Relative (who/which/that)", level: "B1" },
      { id: "relative-advanced", title: "Non-defining Relatives", level: "B2" },
      { id: "noun-clauses", title: "Noun Clauses", level: "B2" },
    ],
  },
  {
    id: "determiners",
    title: "Mạo từ & Lượng từ",
    color: "var(--xp)",
    topics: [
      { id: "articles", title: "A / An / The", level: "A2" },
      { id: "quantifiers", title: "Some / Any / Much / Many", level: "B1" },
      { id: "both-either-neither", title: "Both / Either / Neither", level: "B1" },
    ],
  },
];

export const GRAMMAR_TOPICS = GRAMMAR_TOPIC_CATEGORIES.flatMap((category) => category.topics);

export function getGrammarTopic(topicId: string): GrammarTopic | undefined {
  return GRAMMAR_TOPICS.find((topic) => topic.id === topicId);
}
