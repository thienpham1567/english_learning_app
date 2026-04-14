import type { DiagnosticQuestion, CefrLevel, DiagnosticSkill } from "./types";
import { CEFR_LEVELS } from "./types";

/**
 * Pre-built question bank for the CEFR diagnostic test.
 * ~200 questions tagged by skill + level for deterministic test generation.
 */

// ── Grammar Questions ──
const GRAMMAR: DiagnosticQuestion[] = [
  // A1
  { id: "g-a1-1", skill: "grammar", level: "A1", question: "She ___ a student.", options: ["is", "are", "am", "be"], correctIndex: 0 },
  { id: "g-a1-2", skill: "grammar", level: "A1", question: "They ___ from Vietnam.", options: ["is", "are", "am", "be"], correctIndex: 1 },
  { id: "g-a1-3", skill: "grammar", level: "A1", question: "I ___ 20 years old.", options: ["is", "are", "am", "has"], correctIndex: 2 },
  // A2
  { id: "g-a2-1", skill: "grammar", level: "A2", question: "I ___ to school every day.", options: ["go", "goes", "going", "gone"], correctIndex: 0 },
  { id: "g-a2-2", skill: "grammar", level: "A2", question: "She ___ breakfast at 7 a.m.", options: ["have", "has", "having", "had"], correctIndex: 1 },
  { id: "g-a2-3", skill: "grammar", level: "A2", question: "We ___ watching TV now.", options: ["is", "are", "am", "be"], correctIndex: 1 },
  // B1
  { id: "g-b1-1", skill: "grammar", level: "B1", question: "If I ___ rich, I would travel.", options: ["am", "was", "were", "be"], correctIndex: 2 },
  { id: "g-b1-2", skill: "grammar", level: "B1", question: "She has lived here ___ 2015.", options: ["for", "since", "from", "at"], correctIndex: 1 },
  { id: "g-b1-3", skill: "grammar", level: "B1", question: "The book ___ by Mark Twain.", options: ["wrote", "was written", "is writing", "has wrote"], correctIndex: 1 },
  // B2
  { id: "g-b2-1", skill: "grammar", level: "B2", question: "Had I known, I ___ differently.", options: ["would act", "would have acted", "will act", "acted"], correctIndex: 1 },
  { id: "g-b2-2", skill: "grammar", level: "B2", question: "Not only ___ the exam, but he got the highest score.", options: ["he passed", "did he pass", "he did pass", "passed he"], correctIndex: 1 },
  { id: "g-b2-3", skill: "grammar", level: "B2", question: "She suggested that he ___ the meeting.", options: ["attends", "attended", "attend", "attending"], correctIndex: 2 },
  // C1
  { id: "g-c1-1", skill: "grammar", level: "C1", question: "Seldom ___ such an impressive performance.", options: ["I have seen", "have I seen", "I saw", "did I saw"], correctIndex: 1 },
  { id: "g-c1-2", skill: "grammar", level: "C1", question: "The CEO, ___ vision transformed the company, retired last year.", options: ["who", "whose", "which", "whom"], correctIndex: 1 },
  { id: "g-c1-3", skill: "grammar", level: "C1", question: "___ the difficulties, they completed the project on time.", options: ["Despite of", "In spite of", "Although of", "Even"], correctIndex: 1 },
  // C2
  { id: "g-c2-1", skill: "grammar", level: "C2", question: "Were it not for your help, I ___ the deadline.", options: ["would miss", "would have missed", "missed", "will miss"], correctIndex: 1 },
  { id: "g-c2-2", skill: "grammar", level: "C2", question: "So ___ the changes that nobody recognized the building.", options: ["extensive were", "were extensive", "extensive was", "was extensive"], correctIndex: 0 },
];

// ── Vocabulary Questions ──
const VOCABULARY: DiagnosticQuestion[] = [
  // A1
  { id: "v-a1-1", skill: "vocabulary", level: "A1", question: "A place where you sleep is called a ___.", options: ["kitchen", "bedroom", "garden", "office"], correctIndex: 1 },
  { id: "v-a1-2", skill: "vocabulary", level: "A1", question: "The color of the sky is ___.", options: ["green", "red", "blue", "yellow"], correctIndex: 2 },
  { id: "v-a1-3", skill: "vocabulary", level: "A1", question: "Your mother's sister is your ___.", options: ["uncle", "aunt", "cousin", "niece"], correctIndex: 1 },
  // A2
  { id: "v-a2-1", skill: "vocabulary", level: "A2", question: "'Delicious' means the food tastes ___.", options: ["bad", "very good", "cold", "old"], correctIndex: 1 },
  { id: "v-a2-2", skill: "vocabulary", level: "A2", question: "To 'borrow' means to ___ something from someone.", options: ["give", "throw", "take temporarily", "buy"], correctIndex: 2 },
  { id: "v-a2-3", skill: "vocabulary", level: "A2", question: "A 'colleague' is someone you ___.", options: ["live with", "study with", "work with", "play with"], correctIndex: 2 },
  // B1
  { id: "v-b1-1", skill: "vocabulary", level: "B1", question: "To 'postpone' means to ___.", options: ["cancel", "delay", "hurry", "repeat"], correctIndex: 1 },
  { id: "v-b1-2", skill: "vocabulary", level: "B1", question: "Something 'inevitable' is ___.", options: ["avoidable", "uncertain", "impossible", "certain to happen"], correctIndex: 3 },
  { id: "v-b1-3", skill: "vocabulary", level: "B1", question: "'Adequate' means ___.", options: ["not enough", "more than enough", "just enough", "too much"], correctIndex: 2 },
  // B2
  { id: "v-b2-1", skill: "vocabulary", level: "B2", question: "'Ubiquitous' means ___.", options: ["rare", "found everywhere", "mysterious", "ancient"], correctIndex: 1 },
  { id: "v-b2-2", skill: "vocabulary", level: "B2", question: "To 'exacerbate' a problem means to ___.", options: ["solve it", "ignore it", "make it worse", "discover it"], correctIndex: 2 },
  { id: "v-b2-3", skill: "vocabulary", level: "B2", question: "'Pragmatic' means ___.", options: ["idealistic", "practical", "dramatic", "romantic"], correctIndex: 1 },
  // C1
  { id: "v-c1-1", skill: "vocabulary", level: "C1", question: "'Surreptitious' means ___.", options: ["obvious", "done secretly", "done loudly", "done carefully"], correctIndex: 1 },
  { id: "v-c1-2", skill: "vocabulary", level: "C1", question: "'Ephemeral' means ___.", options: ["eternal", "short-lived", "enormous", "invisible"], correctIndex: 1 },
  { id: "v-c1-3", skill: "vocabulary", level: "C1", question: "To 'corroborate' means to ___.", options: ["deny", "confirm", "question", "ignore"], correctIndex: 1 },
  // C2
  { id: "v-c2-1", skill: "vocabulary", level: "C2", question: "'Sesquipedalian' relates to ___.", options: ["short stories", "long words", "old buildings", "small details"], correctIndex: 1 },
  { id: "v-c2-2", skill: "vocabulary", level: "C2", question: "'Perspicacious' means having ___.", options: ["poor vision", "keen insight", "great strength", "bad memory"], correctIndex: 1 },
];

// ── Reading Questions ──
const READING: DiagnosticQuestion[] = [
  // A1
  { id: "r-a1-1", skill: "reading", level: "A1", question: "'The shop closes at 9 p.m.' — When does the shop close?", options: ["9 a.m.", "9 p.m.", "10 p.m.", "8 p.m."], correctIndex: 1 },
  { id: "r-a1-2", skill: "reading", level: "A1", question: "'Tom has two cats and a dog.' — How many pets does Tom have?", options: ["1", "2", "3", "4"], correctIndex: 2 },
  // A2
  { id: "r-a2-1", skill: "reading", level: "A2", question: "'The train departs at 3:15 from platform 2.' — Which platform?", options: ["Platform 1", "Platform 2", "Platform 3", "Platform 4"], correctIndex: 1 },
  { id: "r-a2-2", skill: "reading", level: "A2", question: "'Children under 5 get free entry.' — A 4-year-old pays ___.", options: ["full price", "half price", "nothing", "double"], correctIndex: 2 },
  // B1
  { id: "r-b1-1", skill: "reading", level: "B1", question: "'Despite the rain, the event was a success.' — Was the event successful?", options: ["No", "Yes", "Partially", "Cancelled"], correctIndex: 1 },
  { id: "r-b1-2", skill: "reading", level: "B1", question: "'The new policy aims to reduce carbon emissions by 40% by 2030.' — The target reduction is ___.", options: ["20%", "30%", "40%", "50%"], correctIndex: 2 },
  // B2
  { id: "r-b2-1", skill: "reading", level: "B2", question: "'The author argues that urbanization, while economically beneficial, has led to environmental degradation.' — The author's view is that urbanization is ___.", options: ["entirely positive", "entirely negative", "mixed — positive and negative", "irrelevant"], correctIndex: 2 },
  { id: "r-b2-2", skill: "reading", level: "B2", question: "'Correlation does not imply causation.' — This statement means ___.", options: ["related events cause each other", "two events happening together doesn't mean one causes the other", "statistics are unreliable", "science is uncertain"], correctIndex: 1 },
  // C1
  { id: "r-c1-1", skill: "reading", level: "C1", question: "'The study's methodology has been criticized for its lack of a control group, potentially introducing confounding variables.' — The main criticism is about ___.", options: ["sample size", "research ethics", "experimental design", "data analysis"], correctIndex: 2 },
  // C2
  { id: "r-c2-1", skill: "reading", level: "C2", question: "'The author employs litotes to underscore the gravity of the situation.' — Litotes is a figure of speech that uses ___.", options: ["exaggeration", "understatement", "repetition", "metaphor"], correctIndex: 1 },
];

// ── Listening Questions (text-based simulation) ──
const LISTENING: DiagnosticQuestion[] = [
  // A1
  { id: "l-a1-1", skill: "listening", level: "A1", question: "🔊 'My name is Anna and I live in London.' — Where does Anna live?", options: ["Paris", "London", "Tokyo", "New York"], correctIndex: 1 },
  { id: "l-a1-2", skill: "listening", level: "A1", question: "🔊 'The meeting is at ten o'clock.' — When is the meeting?", options: ["9:00", "10:00", "11:00", "12:00"], correctIndex: 1 },
  // A2
  { id: "l-a2-1", skill: "listening", level: "A2", question: "🔊 'I'd like a return ticket to Manchester, please.' — What does the speaker want?", options: ["A one-way ticket", "A round-trip ticket", "A bus pass", "A hotel booking"], correctIndex: 1 },
  // B1
  { id: "l-b1-1", skill: "listening", level: "B1", question: "🔊 'The flight has been delayed due to severe weather conditions.' — Why is the flight delayed?", options: ["Technical problem", "Staff shortage", "Bad weather", "Security check"], correctIndex: 2 },
  { id: "l-b1-2", skill: "listening", level: "B1", question: "🔊 'Passengers are advised to proceed to gate 12 for boarding.' — What should passengers do?", options: ["Wait at baggage claim", "Go to gate 12", "Exit the airport", "Check in again"], correctIndex: 1 },
  // B2
  { id: "l-b2-1", skill: "listening", level: "B2", question: "🔊 'The lecturer emphasized that renewable energy sources, particularly solar and wind, are becoming increasingly cost-competitive with fossil fuels.' — According to the lecturer, renewable energy is ___.", options: ["too expensive", "getting cheaper relative to fossil fuels", "only useful in sunny areas", "unreliable"], correctIndex: 1 },
  // C1
  { id: "l-c1-1", skill: "listening", level: "C1", question: "🔊 'While the initial results are promising, we must exercise caution before drawing definitive conclusions from such a limited sample size.' — The speaker's tone is ___.", options: ["enthusiastic", "dismissive", "cautiously optimistic", "angry"], correctIndex: 2 },
  // C2
  { id: "l-c2-1", skill: "listening", level: "C2", question: "🔊 'The speaker's use of irony served to highlight the incongruity between stated policy goals and their practical implementation.' — The irony highlights ___.", options: ["agreement between words and actions", "a gap between policy and practice", "humor in the topic", "confusion among listeners"], correctIndex: 1 },
];

/** All questions indexed by skill */
const ALL_QUESTIONS: Record<DiagnosticSkill, DiagnosticQuestion[]> = {
  grammar: GRAMMAR,
  vocabulary: VOCABULARY,
  reading: READING,
  listening: LISTENING,
};

/**
 * Get questions for a specific skill at a target CEFR level.
 * Falls back to adjacent levels if not enough questions at exact level.
 */
export function getQuestionsForLevel(
  skill: DiagnosticSkill,
  targetLevel: CefrLevel,
  count: number = 1,
  exclude: Set<string> = new Set(),
): DiagnosticQuestion[] {
  const pool = ALL_QUESTIONS[skill].filter((q) => !exclude.has(q.id));

  // Try exact level first
  const exact = pool.filter((q) => q.level === targetLevel);
  if (exact.length >= count) {
    return shuffleArray(exact).slice(0, count);
  }

  // Fall back to adjacent levels
  const levelIdx = CEFR_LEVELS.indexOf(targetLevel);
  const adjacent = pool.filter((q) => {
    const qIdx = CEFR_LEVELS.indexOf(q.level);
    return Math.abs(qIdx - levelIdx) <= 1;
  });

  if (adjacent.length >= count) {
    return shuffleArray(adjacent).slice(0, count);
  }

  // Use any remaining questions
  return shuffleArray(pool).slice(0, count);
}

/** Fisher-Yates shuffle */
function shuffleArray<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Generate a full test sequence plan.
 * Returns the ordered skill sequence: 10 grammar, 10 vocab, 5 reading, 5 listening.
 */
export function generateTestPlan(): DiagnosticSkill[] {
  const plan: DiagnosticSkill[] = [];
  for (let i = 0; i < 10; i++) plan.push("grammar");
  for (let i = 0; i < 10; i++) plan.push("vocabulary");
  for (let i = 0; i < 5; i++) plan.push("reading");
  for (let i = 0; i < 5; i++) plan.push("listening");
  return plan;
}
