import type { ExamMode } from "@/components/app/shared/ExamModeProvider";

/**
 * Exam-mode-specific prompt enhancements for AI-powered modules.
 * Each module can call getExamContext() to get mode-appropriate instructions.
 */

type ExamContext = {
  label: string;
  grammarPromptSuffix: string;
  listeningPromptSuffix: string;
  dailyChallengeTopics: string;
  writingPromptSuffix: string;
  readingSections: string[];
};

const EXAM_CONTEXTS: Record<ExamMode, ExamContext> = {
  toeic: {
    label: "TOEIC",
    grammarPromptSuffix: `Follow the TOEIC Reading Part 5 (Incomplete Sentences) format.
Topics should cover: verb forms/tenses, prepositions, conjunctions, relative pronouns, word forms (noun/verb/adjective/adverb), articles, conditionals, passive voice, and other common TOEIC grammar points.
Context: business English, workplace communication, office scenarios, corporate emails, meetings, travel for business.`,

    listeningPromptSuffix: `Context for passages: business meetings, office announcements, phone conversations, travel arrangements, customer service, product launches.
Use professional/workplace English appropriate for TOEIC listening sections (Parts 1-4).`,

    dailyChallengeTopics: `Topics: workplace, business meetings, office email, corporate communication, presentations, customer service interactions. Use professional English.`,

    writingPromptSuffix: `Focus on TOEIC writing tasks: business emails, memos, short reports, meeting summaries, professional correspondence.`,

    readingSections: [
      "business",
      "money",
      "technology",
      "world",
      "education",
    ],
  },

  ielts: {
    label: "IELTS",
    grammarPromptSuffix: `Follow IELTS-style grammar testing with a focus on academic English.
Topics should cover: complex sentences, conditionals, subjunctive mood, reported speech, articles with abstract nouns, relative clauses, nominalization, hedging language, and discourse markers.
Context: academic writing, research, science, social issues, environment, culture.`,

    listeningPromptSuffix: `Context for passages: university lectures, academic seminars, student conversations about coursework, public talks on science/environment/society, radio interviews on current topics.
Use academic/semi-formal English appropriate for IELTS listening sections (Sections 1-4).`,

    dailyChallengeTopics: `Topics: academic life, science, environment, social issues, culture, globalization, health, technology in education. Use academic English with formal register.`,

    writingPromptSuffix: `Focus on IELTS writing tasks: Task 1 (describe a graph/chart/diagram) and Task 2 (argumentative/discussion essay). Use academic register.`,

    readingSections: [
      "science",
      "environment",
      "education",
      "society",
      "culture",
      "technology",
    ],
  },
};

/** Get exam-specific context for AI prompt building */
export function getExamContext(mode: ExamMode): ExamContext {
  return EXAM_CONTEXTS[mode];
}

/** Validate and normalize exam mode from request body */
export function parseExamMode(value: unknown): ExamMode {
  if (value === "ielts") return "ielts";
  return "toeic"; // default
}
