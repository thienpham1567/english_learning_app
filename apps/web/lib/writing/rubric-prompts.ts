/**
 * Rubric-calibrated system prompts for essay scoring (AC3).
 *
 * Each exam variant has a tailored prompt that instructs the model to score
 * against the official rubric criteria and return structured JSON.
 */

export type ExamVariant = "ielts-task2" | "ielts-task1" | "toefl-independent";

export const EXAM_LABELS: Record<ExamVariant, string> = {
  "ielts-task2": "IELTS Writing Task 2",
  "ielts-task1": "IELTS Writing Task 1",
  "toefl-independent": "TOEFL Independent Writing",
};

/** Score ranges per exam type. */
export const SCORE_RANGES: Record<ExamVariant, { min: number; max: number; step: number }> = {
  "ielts-task2": { min: 1, max: 9, step: 0.5 },
  "ielts-task1": { min: 1, max: 9, step: 0.5 },
  "toefl-independent": { min: 1, max: 30, step: 1 },
};

const IELTS_CRITERIA = `
Score each criterion on a 1–9 band scale (half-band increments: 5.0, 5.5, 6.0, etc.).
Use the IELTS public band descriptors. Be slightly conservative — when in doubt, err on the lower band.

Criteria:
1. Task Response (TR): How well the essay addresses all parts of the task.
2. Coherence & Cohesion (CC): Logical organization, paragraphing, use of cohesive devices.
3. Lexical Resource (LR): Range and accuracy of vocabulary, natural collocations.
4. Grammatical Range & Accuracy (GRA): Variety and accuracy of sentence structures.

Overall = average of 4 criteria, rounded to nearest 0.5.`;

const TOEFL_CRITERIA = `
Score each criterion on a 1–5 scale (integers only).
Use ETS TOEFL Independent Writing rubric.

Criteria:
1. Task Response: How well the essay addresses the prompt with clear position and supporting ideas.
2. Coherence: Organization, transitions, logical flow between ideas.
3. Lexical Resource: Vocabulary range, word choice accuracy, idiomatic usage.
4. Grammar: Sentence variety, grammatical control, error frequency.

Overall = sum of 4 criteria scaled to 1–30 range (multiply sum/20 by 30, round to nearest integer).`;

function buildSystemPrompt(exam: ExamVariant): string {
  const isIelts = exam.startsWith("ielts");
  const criteria = isIelts ? IELTS_CRITERIA : TOEFL_CRITERIA;
  const taskSpecific = exam === "ielts-task1"
    ? "This is an IELTS Task 1 (report/letter). Evaluate how well the writer describes/summarizes data or writes a letter."
    : exam === "ielts-task2"
      ? "This is an IELTS Task 2 (essay). Evaluate argumentation, position, examples, and conclusion."
      : "This is a TOEFL Independent Writing task. Evaluate the writer's ability to state and support an opinion.";

  return `You are an expert ${EXAM_LABELS[exam]} examiner.
${taskSpecific}
${criteria}

INSTRUCTIONS:
- Read the essay carefully. If a prompt is provided, evaluate Task Response against it.
- Identify inline issues: grammar errors, awkward word choices, coherence gaps, task-related problems.
- For each inline issue, quote the EXACT text from the essay (verbatim, case-sensitive).
- Provide 2-3 specific strengths and 2-3 actionable next steps.
- Perform a self-check pass: verify each quoted issue actually exists in the essay text.
- Return ONLY valid JSON matching the schema below. No markdown fences.

JSON Schema:
{
  "overall": number,
  "criteria": {
    "taskResponse": { "score": number, "feedback": "string" },
    "coherence": { "score": number, "feedback": "string" },
    "lexical": { "score": number, "feedback": "string" },
    "grammar": { "score": number, "feedback": "string" }
  },
  "inlineIssues": [
    {
      "quote": "exact text from essay",
      "category": "grammar" | "word-choice" | "coherence" | "task",
      "suggestion": "corrected or improved version",
      "explanation": "brief rule or reason",
      "tag": "one of: subject-verb-agreement | article-a-an-the | word-form-confusion | comma-splice | collocation | preposition | tense-consistency | pronoun-reference | sentence-fragment | run-on-sentence | comparative-superlative | parallel-structure | passive-voice-misuse | conditional-form | countable-uncountable | redundancy | word-choice | punctuation"
    }
  ],
  "strengths": ["string"],
  "nextSteps": ["string"]
}

Limit inlineIssues to the 10 most impactful. Order by severity (most critical first).`;
}

export function buildScoringPrompt(
  exam: ExamVariant,
  text: string,
  prompt?: string,
  targetScore?: number,
  vocabBank?: Array<{ term: string }>,
): {
  system: string;
  user: string;
} {
  const system = buildSystemPrompt(exam);

  let user = `**Essay:**\n${text}`;
  if (prompt) user = `**Prompt:** ${prompt}\n\n${user}`;
  if (typeof targetScore === "number") {
    const label = exam.startsWith("ielts") ? "Target band" : "Target score";
    user += `\n\n**${label}:** ${targetScore} — calibrate feedback to help the writer reach this level.`;
  }
  if (vocabBank && vocabBank.length > 0) {
    const terms = vocabBank.map((v) => v.term).join(", ");
    user += `\n\n**Vocab Bank (guided writing):** ${terms}\nIn your lexical feedback, specifically comment on whether the writer used these terms, how naturally they were integrated, and which ones were missed.`;
  }

  return { system, user };
}

/** Word count helper. */
export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

/** Minimum word count before scoring (AC3). */
export const MIN_WORD_COUNT = 150;

/** Maximum word count (dev notes: cap at 2000 words). */
export const MAX_WORD_COUNT = 2000;
