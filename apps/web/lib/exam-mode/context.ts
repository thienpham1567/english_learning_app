/**
 * Exam-mode-specific prompt enhancements for AI-powered modules.
 * Each module can call getExamContext() to get mode-appropriate instructions.
 *
 * Note: The client-side ExamMode type is locked to "toeic" only.
 * This module keeps "ielts" entries for API-level backward compatibility
 * (request bodies may still contain "ielts" from legacy data).
 */

/** Internal exam mode type — broader than the client-side ExamMode */
export type ExamModeValue = "toeic" | "ielts";

type ExamContext = {
  label: string;
  grammarPromptSuffix: string;
  listeningPromptSuffix: string;
  dailyChallengeTopics: string;
  writingPromptSuffix: string;
  readingSections: string[];
};

const EXAM_CONTEXTS: Record<ExamModeValue, ExamContext> = {
  toeic: {
    label: "TOEIC",
    grammarPromptSuffix: `Follow the TOEIC Reading Part 5 (Incomplete Sentences) format.
Topics should cover: verb forms/tenses, prepositions, conjunctions, relative pronouns, word forms (noun/verb/adjective/adverb), articles, conditionals, passive voice, and other common TOEIC grammar points.
Context: business English, workplace communication, office scenarios, corporate emails, meetings, travel for business.`,

    listeningPromptSuffix: `Context for passages: business meetings, office announcements, phone conversations, travel arrangements, customer service, product launches.
Use professional/workplace English appropriate for TOEIC listening sections (Parts 1-4).`,

    dailyChallengeTopics: `Topics (rotate through different ones each day, never repeat the same sub-topic two days in a row): workplace communication, business meetings, office email, corporate presentations, customer service, job interviews, salary negotiations, project management, supply chain logistics, marketing campaigns, product launches, trade shows, human resources, company policies, financial reports, international trade, travel arrangements, hotel reservations, airport announcements, restaurant dining, health and safety at work, technology upgrades, team building, performance reviews, contract negotiations. Use professional English with varied vocabulary.`,

    writingPromptSuffix: `Focus on TOEIC writing tasks: business emails, memos, short reports, meeting summaries, professional correspondence.`,

    readingSections: ["business", "money", "technology", "world", "education"],
  },

  ielts: {
    label: "IELTS",
    grammarPromptSuffix: `Follow IELTS-style grammar testing with a focus on academic English.
Topics should cover: complex sentences, conditionals, subjunctive mood, reported speech, articles with abstract nouns, relative clauses, nominalization, hedging language, and discourse markers.
Context: academic writing, research, science, social issues, environment, culture.`,

    listeningPromptSuffix: `Context for passages: university lectures, academic seminars, student conversations about coursework, public talks on science/environment/society, radio interviews on current topics.
Use academic/semi-formal English appropriate for IELTS listening sections (Sections 1-4).`,

    dailyChallengeTopics: `Topics (rotate through different ones each day, never repeat the same sub-topic two days in a row): academic life, university lectures, scientific research, environmental conservation, climate change debates, social inequality, cultural diversity, globalization effects, public health policy, education reform, technology ethics, space exploration, marine biology, urban planning, migration patterns, art history, linguistic theory, economic development, renewable energy, psychology experiments, archaeological discoveries, literary criticism, philosophy of mind, artificial intelligence ethics, sustainable agriculture. Use academic English with formal register.`,

    writingPromptSuffix: `Focus on IELTS writing tasks: Task 1 (describe a graph/chart/diagram) and Task 2 (argumentative/discussion essay). Use academic register.`,

    readingSections: ["science", "environment", "education", "society", "culture", "technology"],
  },
};

/** Get exam-specific context for AI prompt building */
export function getExamContext(mode: ExamModeValue): ExamContext {
  return EXAM_CONTEXTS[mode];
}

/** Validate and normalize exam mode from request body */
export function parseExamMode(value: unknown): ExamModeValue {
  if (value === "ielts") return "ielts";
  return "toeic"; // default
}
