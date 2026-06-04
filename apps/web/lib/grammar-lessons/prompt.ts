/**
 * Grammar-lesson prompt framework.
 *
 * Design philosophy: keep the PEDAGOGY CORE (how to teach a grammar point well)
 * exam-agnostic, and treat exam flavour (TOEIC / IELTS) as a thin, pluggable
 * CONTEXT PACK layered on top. The default core is everyday General English —
 * exams are an optional overlay, never baked into the teaching itself.
 *
 * The prompt is assembled from 6 layers:
 *   L1 ROLE         — who the model is              (fixed)
 *   L2 PEDAGOGY     — Form–Meaning–Use + practice   (fixed, the core)
 *   L3 TOPIC SPEC   — topic + CEFR + difficulty      (per lesson)
 *   L4 CONTEXT PACK — register / domains / exam tips  (pluggable)
 *   L5 OUTPUT       — JSON contract                  (fixed)
 *   L6 QUALITY GATE — constraints + self-check        (fixed)
 */

import { EXAM_LABELS } from "@/lib/exam-mode/context";

export type GrammarContextId = "general" | "toeic" | "ielts";

export interface ContextPack {
  id: GrammarContextId;
  /** Human-readable label, e.g. "General English". */
  label: string;
  /** Learner aspiration used in the role line. */
  goal: string;
  /** Register name examples/exercises must use. */
  register: string;
  /** Where example sentences should be drawn from. */
  exampleDomains: string;
  /** Exam-strategy tips. `null` for General English (no "test tricks"). */
  examTips: { label: string; scope: string; example: string } | null;
  /** Setting for the longer passage-level (context-tier) exercises. */
  passageSetting: string;
}

/**
 * Context packs. `general` is the default core; `toeic` / `ielts` are overlays
 * that only change register, example domains and exam tips — the pedagogy stays
 * identical.
 */
export const CONTEXT_PACKS: Record<GrammarContextId, ContextPack> = {
  general: {
    id: "general",
    label: "General English",
    goal: "communicate naturally and accurately in everyday English",
    register: "natural everyday English (neutral register)",
    exampleDomains:
      "daily life, family and friends, school and study, travel and food, work and hobbies, simple conversations and messages",
    examTips: null,
    passageSetting: "a short everyday paragraph",
  },
  toeic: {
    id: "toeic",
    label: EXAM_LABELS.toeic,
    goal: "achieve TOEIC 900+ scores",
    register: "professional business English",
    exampleDomains:
      "business emails, memos, meeting minutes, company announcements, HR policies, financial reports, product launches",
    examTips: {
      label: "TOEIC test-taking strategy tip",
      scope: "specific to Part 5 (Incomplete Sentences) / Part 6 (Text Completion)",
      example: "e.g., 'Khi thấy trạng từ _____, hãy chọn thì _____'",
    },
    passageSetting: "a TOEIC Part 6 text-completion passage",
  },
  ielts: {
    id: "ielts",
    label: EXAM_LABELS.ielts,
    goal: "achieve IELTS band 7+ scores",
    register: "formal academic English",
    exampleDomains:
      "academic essays, reports describing data and charts, research summaries, discussions of social, environmental, scientific and cultural issues",
    examTips: {
      label: "IELTS exam strategy tip",
      scope: "specific to improving Writing Task 2 / Speaking Grammatical Range & Accuracy",
      example: "e.g., 'Dùng cấu trúc này trong Writing Task 2 để nâng tiêu chí Grammatical Range'",
    },
    passageSetting: "an IELTS Reading gap-fill passage",
  },
};

export function resolveContextPack(id: string | undefined): ContextPack {
  if (id === "toeic") return CONTEXT_PACKS.toeic;
  if (id === "ielts") return CONTEXT_PACKS.ielts;
  return CONTEXT_PACKS.general;
}

/** CEFR-aware difficulty calibration for sentences and distractors. */
function difficultyGuidance(level: string): string {
  switch (level) {
    case "A1":
    case "A2":
      return "Elementary (A1-A2): short sentences, high-frequency vocabulary, one grammar point per item, obvious-but-fair distractors.";
    case "B2":
      return "Upper-intermediate (B2): longer multi-clause sentences, less common vocabulary, subtle distractors that require careful reading.";
    case "C1":
    case "C2":
      return "Advanced (C1-C2): complex multi-clause sentences, nuanced word choice, near-synonym distractors, trap phrasing.";
    default:
      return "Intermediate (B1): moderate sentence length, common vocabulary, plausible distractors.";
  }
}

export interface GrammarLessonPromptInput {
  topicTitle: string;
  level: string;
  context: ContextPack;
  /** Optional Vietnamese "ghi chú trọng tâm" to prioritise. */
  focusNote?: string;
}

/** Assemble the full system prompt from the 6 layers. */
export function buildGrammarLessonPrompt(input: GrammarLessonPromptInput): string {
  const { topicTitle, level, context, focusNote } = input;
  const tips = context.examTips;

  // L4 — the toeicTips output field is repurposed per pack. For General English
  // there are no exam tricks, so we ask for practical accuracy tips instead.
  const tipsFieldGuidance = tips
    ? `"toeicTips": [
    "${tips.label} 1 in Vietnamese — ${tips.scope}, ${tips.example}",
    "Tip 2 — how to eliminate wrong answers quickly for this grammar point",
    "Tip 3 — common traps learners fall into with this grammar topic"
  ],`
    : `"toeicTips": [
    "Practical accuracy tip 1 in Vietnamese — a quick way to self-check this structure while speaking or writing",
    "Tip 2 — the single most common slip to watch out for",
    "Tip 3 — a memory hook or rule of thumb that makes the structure stick"
  ],`;

  const tipsRule = tips
    ? `- "toeicTips": 2-3 items in Vietnamese, each ${tips.scope}.`
    : `- "toeicTips": 2-3 practical accuracy tips in Vietnamese for everyday use (NO exam/test references).`;

  // ── L1 ROLE ──────────────────────────────────────────────
  const role = `You are a world-class English grammar teacher and curriculum designer who has helped thousands of Vietnamese learners ${context.goal}. You explain grammar the way the best teachers do: clearly, with vivid examples, and with deep awareness of the mistakes Vietnamese speakers specifically make.`;

  // ── L2 PEDAGOGY CORE (exam-agnostic) ─────────────────────
  const pedagogy = `TEACHING FRAMEWORK — every lesson must cover all three dimensions of the grammar point:
- FORM: what the structure looks like (the formula and how it is built).
- MEANING: what idea or relationship it expresses.
- USE: when, why, and in what register a native speaker actually chooses it.

Then strengthen the lesson with:
- ERROR ANALYSIS targeted at VIETNAMESE learners (L1 interference): mistakes caused by translating directly from Vietnamese, missing inflections, word-order habits, etc. — not generic errors.
- CONTRAST with structures that are easily confused with this one.
- GRADED PRACTICE that climbs from recognition to production:
    recognition → spot the correct form,
    application → use it in a richer context,
    production → fix an error / transform a sentence (learner writes),
    context → choose the right form inside a short passage.`;

  // ── L3 TOPIC SPEC ────────────────────────────────────────
  const topicSpec = `TOPIC: "${topicTitle}"
TARGET LEVEL: ${level || "B1"}
DIFFICULTY CALIBRATION: ${difficultyGuidance(level)}

DISTRACTOR DESIGN (apply to every multiple_choice exercise):
- All 4 options must be the SAME part of speech OR closely related word forms of the same root.
- Distractors must be plausible elsewhere but clearly wrong in THIS sentence.
- Include realistic traps: wrong tense, wrong word form, similar-sounding words, wrong preposition/conjunction.
- Never include absurd options; exactly ONE option is unambiguously correct.`;

  // ── L5 OUTPUT CONTRACT ───────────────────────────────────
  const output = `Return ONLY valid JSON (no comments, no trailing commas, no markdown fences) with this exact structure:
{
  "title": "${topicTitle}",
  "titleVi": "Vietnamese translation of the topic name",
  "formula": "Grammar formula/structure (e.g., S + have/has + V3/ed)",
  "explanationEn": "Detailed English explanation (5-8 sentences) covering FORM, MEANING and USE. Use standard grammar terminology.",
  "explanation": "Detailed Vietnamese explanation (5-8 sentences) in simple, accessible Vietnamese. Say clearly when and why Vietnamese learners struggle with this point.",
  "usageNotes": [
    "Usage note 1 in Vietnamese — a real scenario where this structure is used in ${context.label} (${context.register})",
    "Usage note 2 — formal vs informal, or written vs spoken differences",
    "Usage note 3 — common collocations or fixed expressions using this structure",
    "Usage note 4 (optional) — time signals or keywords that trigger this structure"
  ],
  ${tipsFieldGuidance}
  "timeSignals": [
    "signal 1 (e.g., 'since', 'for', 'already')",
    "signal 2",
    "signal 3"
  ],
  "confusionPairs": [
    {
      "structureA": "Structure A name (e.g., 'Because + clause')",
      "structureB": "Structure B name (e.g., 'Because of + noun phrase')",
      "difference": "Vietnamese explanation of the key difference (2-3 sentences)",
      "exampleA": "Example sentence using structure A",
      "exampleB": "Example sentence using structure B"
    }
  ],
  "examples": [
    { "en": "Example sentence 1 in ${context.register}", "vi": "Vietnamese translation", "highlight": "key grammar part" },
    { "en": "Example 2", "vi": "...", "highlight": "..." },
    { "en": "Example 3", "vi": "...", "highlight": "..." },
    { "en": "Example 4", "vi": "...", "highlight": "..." },
    { "en": "Example 5", "vi": "...", "highlight": "..." },
    { "en": "Example 6", "vi": "...", "highlight": "..." }
  ],
  "commonMistakes": [
    { "wrong": "Incorrect sentence", "correct": "Correct sentence", "note": "Vietnamese explanation (2-3 sentences)", "noteEn": "English explanation (2-3 sentences)" },
    { "wrong": "...", "correct": "...", "note": "...", "noteEn": "..." },
    { "wrong": "...", "correct": "...", "note": "...", "noteEn": "..." },
    { "wrong": "...", "correct": "...", "note": "...", "noteEn": "..." }
  ],
  "exercises": [
    { "id": "1", "type": "multiple_choice", "tier": "recognition", "sentence": "Sentence with _____ blank", "answer": "correct", "options": ["opt1", "opt2", "opt3", "opt4"], "explanation": "Vietnamese explanation", "explanationEn": "English explanation", "hint": "Short rule reminder", "instructionVi": "Chọn đáp án đúng." },
    { "id": "2", "type": "multiple_choice", "tier": "recognition", "sentence": "...", "answer": "...", "options": ["...","...","...","..."], "explanation": "...", "explanationEn": "...", "hint": "...", "instructionVi": "Chọn đáp án đúng." },
    { "id": "3", "type": "multiple_choice", "tier": "recognition", "sentence": "...", "answer": "...", "options": ["...","...","...","..."], "explanation": "...", "explanationEn": "...", "hint": "...", "instructionVi": "Chọn đáp án đúng." },
    { "id": "4", "type": "multiple_choice", "tier": "recognition", "sentence": "...", "answer": "...", "options": ["...","...","...","..."], "explanation": "...", "explanationEn": "...", "hint": "...", "instructionVi": "Chọn đáp án đúng." },
    { "id": "5", "type": "multiple_choice", "tier": "application", "sentence": "More complex contextual sentence with _____", "answer": "...", "options": ["...","...","...","..."], "explanation": "...", "explanationEn": "...", "hint": "...", "instructionVi": "Chọn đáp án đúng." },
    { "id": "6", "type": "multiple_choice", "tier": "application", "sentence": "...", "answer": "...", "options": ["...","...","...","..."], "explanation": "...", "explanationEn": "...", "hint": "...", "instructionVi": "Chọn đáp án đúng." },
    { "id": "7", "type": "error_correction", "tier": "production", "sentence": "Sentence with grammar error to fix", "answer": "Corrected full sentence", "explanation": "Vietnamese explanation", "explanationEn": "English explanation", "hint": "Look at the verb form...", "acceptedAnswers": ["alternative correct version"], "instructionVi": "Tìm và sửa lỗi sai trong câu." },
    { "id": "8", "type": "transformation", "tier": "production", "sentence": "Sentence to transform using the target structure", "answer": "Expected transformed sentence", "explanation": "Vietnamese explanation", "explanationEn": "English explanation", "hint": "Use the structure: ...", "acceptedAnswers": ["alternative valid answer"], "instructionVi": "Viết lại câu dùng cấu trúc vừa học." },
    { "id": "9", "type": "multiple_choice", "tier": "context", "sentence": "A longer passage (2-3 sentences) with _____ blank — ${context.passageSetting}", "answer": "...", "options": ["...","...","...","..."], "explanation": "...", "explanationEn": "...", "hint": "...", "instructionVi": "Đọc đoạn văn và chọn đáp án đúng." },
    { "id": "10", "type": "multiple_choice", "tier": "context", "sentence": "Another passage — ${context.passageSetting}", "answer": "...", "options": ["...","...","...","..."], "explanation": "...", "explanationEn": "...", "hint": "...", "instructionVi": "Đọc đoạn văn và chọn đáp án đúng." }
  ]
}`;

  // ── L6 QUALITY GATE ──────────────────────────────────────
  const qualityGate = `CRITICAL RULES:
- "explanation" / "note" fields are ALWAYS Vietnamese; "explanationEn" / "noteEn" fields are ALWAYS English.
- ALL examples and exercise sentences MUST use ${context.register}: ${context.exampleDomains}.
- Exactly 10 exercises with the ids, types and tiers exactly as listed above — do NOT change them.
- Only multiple_choice has "options" (exactly 4); written exercises (error_correction, transformation) must NOT include "options" and must provide 1-2 "acceptedAnswers".
- Tier "context" exercises must use longer, passage-like sentences (2-3 sentences).
- Every exercise needs a "hint" that recalls the rule without revealing the answer.
- "usageNotes": 3-4 items in Vietnamese.
${tipsRule}
- "timeSignals": 3-6 signal words/adverbs for this structure (e.g., "since", "already"). If none apply, return [].
- "confusionPairs": 1-2 pairs Vietnamese learners commonly confuse with this topic. If none apply, return [].
- "commonMistakes": exactly 4, each with Vietnamese (note) and English (noteEn) explanations (2-3 sentences each), focused on Vietnamese-learner errors.
- "examples": exactly 6.

SELF-CHECK before returning: confirm the output is a single valid JSON object; exactly 10 exercises; every multiple_choice has exactly 4 options and exactly one matches its "answer"; written exercises have no "options"; Vietnamese fields are Vietnamese and English fields are English. Fix any issue, then return JSON only.`;

  const base = [role, pedagogy, topicSpec, output, qualityGate].join("\n\n");

  return focusNote
    ? `${base}\n\nIMPORTANT FOCUS — prioritise these points in the explanation, examples, and exercises:\n${focusNote}`
    : base;
}
