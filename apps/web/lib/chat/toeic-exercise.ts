export type ToeicQuestionType = "mcq" | "fill";

export type ToeicOption = { letter: string; text: string };

export type ToeicQuestion = {
  index: number;
  prompt: string;
  type: ToeicQuestionType;
  options: ToeicOption[];
  /** MCQ: bare letter "A".."D". Fill: canonical (first) accepted answer. */
  answer: string;
  /** MCQ: [letter]. Fill: normalized accepted variants. */
  acceptedAnswers: string[];
  why?: string;
};

export type ToeicExercise = {
  partLabel?: string;
  passage?: string;
  isListening: boolean;
  questions: ToeicQuestion[];
};

export type ToeicSegment = { type: "text"; content: string } | { type: "toeic"; content: string };

const FENCE_RE = /```toeic[^\n]*\n([\s\S]*?)```/g;
const TAG_RE = /^\[(.+)\]\s*$/;
const Q_RE = /^(?:Q|Question\s*)?(\d+)[.)]\s*(.*)$/i;
const OPT_RE = /^([A-D])[.)]\s*(.*)$/;
const ANSWER_RE = /^Answer:\s*(.*)$/i;
const WHY_RE = /^(?:Why|Explanation):\s*(.*)$/i;
const PASSAGE_RE = /^Passage:\s*(.*)$/i;

/** Lowercase, trim, collapse spaces, strip surrounding light punctuation. */
function normalize(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ")
    .replace(/^["'.,!?;:()[\]]+|["'.,!?;:()[\]]+$/g, "");
}

/** Split a message into ordered text + toeic-block segments. */
export function splitToeicBlocks(text: string): ToeicSegment[] {
  const segments: ToeicSegment[] = [];
  let lastIndex = 0;
  FENCE_RE.lastIndex = 0;
  let m: RegExpExecArray | null = FENCE_RE.exec(text);
  while (m !== null) {
    if (m.index > lastIndex) {
      segments.push({ type: "text", content: text.slice(lastIndex, m.index) });
    }
    segments.push({ type: "toeic", content: m[1] });
    lastIndex = m.index + m[0].length;
    m = FENCE_RE.exec(text);
  }
  if (lastIndex < text.length) {
    segments.push({ type: "text", content: text.slice(lastIndex) });
  }
  return segments;
}

export function hasToeicBlock(text: string): boolean {
  FENCE_RE.lastIndex = 0;
  return FENCE_RE.test(text);
}

/** Parse the inner content of a ```toeic block into a typed exercise, or null. */
export function parseToeicExercise(raw: string): ToeicExercise | null {
  const lines = raw.split("\n");
  let partLabel: string | undefined;
  const passageLines: string[] = [];
  let inPassage = false;
  let sawContent = false;
  const questions: ToeicQuestion[] = [];
  let current: ToeicQuestion | null = null;

  const pushCurrent = () => {
    if (current) {
      current.type = current.options.length > 0 ? "mcq" : "fill";
      questions.push(current);
      current = null;
    }
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed === "") {
      if (inPassage) passageLines.push("");
      continue;
    }

    // Optional part tag — only as the very first content line.
    if (!sawContent) {
      const tag = trimmed.match(TAG_RE);
      if (tag) {
        partLabel = tag[1].trim();
        sawContent = true;
        continue;
      }
    }
    sawContent = true;

    const passageStart = trimmed.match(PASSAGE_RE);
    if (passageStart && !current) {
      inPassage = true;
      if (passageStart[1].trim()) passageLines.push(passageStart[1].trim());
      continue;
    }

    const qMatch = trimmed.match(Q_RE);
    if (qMatch && /^(?:Q|Question\s*)?\d+[.)]/i.test(trimmed)) {
      inPassage = false;
      pushCurrent();
      current = {
        index: Number.parseInt(qMatch[1], 10),
        prompt: qMatch[2].trim(),
        type: "fill",
        options: [],
        answer: "",
        acceptedAnswers: [],
      };
      continue;
    }

    if (current) {
      const opt = trimmed.match(OPT_RE);
      if (opt) {
        current.options.push({ letter: opt[1].toUpperCase(), text: opt[2].trim() });
        continue;
      }
      const ans = trimmed.match(ANSWER_RE);
      if (ans) {
        const val = ans[1].trim();
        current.answer = val;
        current.acceptedAnswers = val
          .split(/[/|]/)
          .map((v) => normalize(v))
          .filter(Boolean);
        continue;
      }
      const why = trimmed.match(WHY_RE);
      if (why) {
        current.why = why[1].trim();
        continue;
      }
      current.prompt = current.prompt ? `${current.prompt} ${trimmed}` : trimmed;
      continue;
    }

    // Content before the first question and not a tag/passage marker → passage.
    inPassage = true;
    passageLines.push(trimmed);
  }
  pushCurrent();

  if (questions.length === 0) return null;

  for (const q of questions) {
    if (q.type === "mcq") {
      const letter = q.answer.toUpperCase().match(/[A-D]/)?.[0] ?? "";
      q.answer = letter;
      q.acceptedAnswers = letter ? [letter] : [];
    } else if (q.acceptedAnswers.length === 0 && q.answer) {
      q.acceptedAnswers = [normalize(q.answer)];
    }
  }

  const passage = passageLines.join("\n").trim() || undefined;
  const isListening = /listening|part\s*[1-4]\b/i.test(partLabel ?? "");

  return { partLabel, passage, isListening, questions };
}

export type ToeicQuestionResult = {
  index: number;
  correct: boolean;
  given: string;
  expected: string;
};

export type ToeicGradeResult = {
  results: ToeicQuestionResult[];
  score: number;
  total: number;
};

/** Grade learner answers locally. `given` is keyed by question index. */
export function gradeToeicAnswers(
  exercise: ToeicExercise,
  given: Record<number, string>,
): ToeicGradeResult {
  const results: ToeicQuestionResult[] = exercise.questions.map((q) => {
    const raw = (given[q.index] ?? "").trim();
    let correct = false;
    if (q.type === "mcq") {
      correct = raw.toUpperCase() === q.answer && q.answer !== "";
    } else {
      const norm = normalize(raw);
      correct = norm.length > 0 && q.acceptedAnswers.includes(norm);
    }
    return {
      index: q.index,
      correct,
      given: raw,
      expected: q.type === "mcq" ? q.answer : (q.acceptedAnswers[0] ?? q.answer),
    };
  });
  const score = results.filter((r) => r.correct).length;
  return { results, score, total: exercise.questions.length };
}
