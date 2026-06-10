"use client";

import { Check, Pencil, RefreshCw, Send, X } from "lucide-react";
import { useCallback, useState } from "react";

type Question = {
  /** Full original line: "She ___ (live) in Da Nang since 2020." */
  original: string;
  /** Parts split around blanks: ["She ", " (live) in Da Nang since 2020."] */
  parts: string[];
  /** Number of blanks in this question */
  blankCount: number;
  /** Question index (1-based) */
  index: number;
};

type Props = {
  /** Raw quiz text (multiple lines, each with ___ blanks) */
  text: string;
  /** Title/header text above the quiz (optional) */
  title?: string;
  /** Callback to send answers for AI checking */
  onSubmitAnswers?: (formattedMessage: string) => void;
  /** Whether the chat is currently loading (sending) */
  isLoading?: boolean;
};

/** Regex: detects numbered questions with blanks */
const QUESTION_LINE_RE = /^(\d+)[.)]\s+(.+_{2,}.+)$/;
const BLANK_RE = /_{2,}/g;

/** Parse quiz text into structured questions */
function parseQuestions(text: string): Question[] {
  const lines = text.split("\n");
  const questions: Question[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    const match = trimmed.match(QUESTION_LINE_RE);
    if (match) {
      const [, idx, content] = match;
      const parts = content.split(BLANK_RE);
      const blankCount = (content.match(BLANK_RE) || []).length;
      if (blankCount > 0) {
        questions.push({
          original: content,
          parts,
          blankCount,
          index: Number.parseInt(idx, 10),
        });
      }
    }
  }

  return questions;
}

/** Check if a block of text contains exercise-like content */
export function hasExercisePattern(text: string): boolean {
  const lines = text.split("\n");
  let count = 0;
  for (const line of lines) {
    if (QUESTION_LINE_RE.test(line.trim())) count++;
    if (count >= 2) return true;
  }
  return false;
}

/**
 * Split message text into segments: regular markdown and exercise blocks.
 * Returns array of { type: 'text' | 'exercise', content: string, title?: string }
 */
export function splitExerciseBlocks(text: string): Array<{
  type: "text" | "exercise";
  content: string;
  title?: string;
}> {
  const lines = text.split("\n");
  const segments: Array<{ type: "text" | "exercise"; content: string; title?: string }> = [];
  let currentText: string[] = [];
  let exerciseLines: string[] = [];
  let exerciseTitle = "";
  let inExercise = false;

  const flushText = () => {
    if (currentText.length > 0) {
      segments.push({ type: "text", content: currentText.join("\n") });
      currentText = [];
    }
  };

  const flushExercise = () => {
    if (exerciseLines.length > 0) {
      segments.push({
        type: "exercise",
        content: exerciseLines.join("\n"),
        title: exerciseTitle || undefined,
      });
      exerciseLines = [];
      exerciseTitle = "";
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    const isQuestion = QUESTION_LINE_RE.test(trimmed);

    if (isQuestion) {
      if (!inExercise) {
        // Check if previous line was a title (bold header or "Mini-quiz" etc.)
        if (currentText.length > 0) {
          const lastLine = currentText[currentText.length - 1].trim();
          if (
            lastLine.match(/^#+\s/) ||
            lastLine.match(/^\*\*.*\*\*$/) ||
            lastLine.toLowerCase().includes("quiz") ||
            lastLine.toLowerCase().includes("exercise") ||
            lastLine.toLowerCase().includes("fill") ||
            lastLine.toLowerCase().includes("practice") ||
            lastLine.toLowerCase().includes("try")
          ) {
            exerciseTitle = lastLine.replace(/^#+\s*/, "").replace(/\*\*/g, "");
            currentText.pop();
          }
        }
        flushText();
        inExercise = true;
      }
      exerciseLines.push(trimmed);
    } else {
      if (inExercise) {
        // Allow empty lines within exercise block
        if (trimmed === "" && i + 1 < lines.length && QUESTION_LINE_RE.test(lines[i + 1].trim())) {
          continue;
        }
        // End of exercise block
        flushExercise();
        inExercise = false;
      }
      currentText.push(line);
    }
  }

  // Flush remaining
  if (inExercise) flushExercise();
  flushText();

  return segments;
}

export function ExerciseCard({ text, title, onSubmitAnswers, isLoading }: Props) {
  const questions = parseQuestions(text);
  // answers[questionIdx][blankIdx]
  const [answers, setAnswers] = useState<string[][]>(() =>
    questions.map((q) => Array(q.blankCount).fill("")),
  );
  const [submitted, setSubmitted] = useState(false);

  const updateAnswer = useCallback((qIdx: number, bIdx: number, value: string) => {
    setAnswers((prev) => {
      const next = prev.map((a) => [...a]);
      next[qIdx][bIdx] = value;
      return next;
    });
  }, []);

  const allFilled = answers.every((a) => a.every((v) => v.trim().length > 0));

  const handleSubmit = () => {
    if (!allFilled || !onSubmitAnswers) return;
    setSubmitted(true);

    // Format answers as a readable message for the AI to check
    const lines = questions.map((q, qi) => {
      let result = q.original;
      let blankIdx = 0;
      result = result.replace(BLANK_RE, () => {
        const ans = answers[qi][blankIdx] || "???";
        blankIdx++;
        return ans;
      });
      return `${q.index}. ${result}`;
    });

    onSubmitAnswers(lines.join("\n"));
  };

  const handleReset = () => {
    setAnswers(questions.map((q) => Array(q.blankCount).fill("")));
    setSubmitted(false);
  };

  if (questions.length === 0) return null;

  return (
    <div className="my-3 rounded-xl border-2 border-accent/20 bg-accent/3 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-accent/5 border-b border-accent/10">
        <div className="flex items-center gap-2">
          <Pencil className="h-3.5 w-3.5 text-accent shrink-0" />
          <span className="text-xs font-bold text-accent">{title || "Exercise"}</span>
          <span className="text-[9px] font-bold text-text-muted bg-bg-deep px-1.5 py-0.5 rounded-md">
            {questions.length} {questions.length === 1 ? "question" : "questions"}
          </span>
        </div>
        {submitted && (
          <button
            onClick={handleReset}
            className="flex items-center gap-1 text-[10px] font-bold text-text-muted hover:text-accent transition-colors cursor-pointer"
          >
            <RefreshCw className="h-3 w-3" />
            Reset
          </button>
        )}
      </div>

      {/* Questions */}
      <div className="px-4 py-3 space-y-3">
        {questions.map((q, qi) => (
          <div key={qi} className="flex gap-2.5 items-start">
            <span className="text-[11px] font-bold text-accent/60 mt-1.5 shrink-0 w-5 text-right">
              {q.index}.
            </span>
            <div className="flex-1 flex items-center flex-wrap gap-y-1.5 text-sm text-ink leading-relaxed">
              {q.parts.map((part, pi) => (
                <span key={pi} className="contents">
                  <span>{part}</span>
                  {pi < q.blankCount && (
                    <input
                      type="text"
                      value={answers[qi]?.[pi] ?? ""}
                      onChange={(e) => updateAnswer(qi, pi, e.target.value)}
                      disabled={submitted}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && allFilled && !submitted) {
                          handleSubmit();
                        }
                      }}
                      placeholder="..."
                      className={`inline-block mx-1 px-2 py-0.5 w-[120px] text-sm text-center font-medium rounded-lg border-2 outline-none transition-all duration-200 ${
                        submitted
                          ? "bg-accent/10 border-accent/30 text-accent font-bold"
                          : "bg-surface border-border focus:border-accent/50 text-ink placeholder:text-text-muted/40"
                      }`}
                    />
                  )}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Submit button */}
      {!submitted && (
        <div className="px-4 py-2.5 border-t border-accent/10 flex items-center justify-between">
          <span className="text-[10px] text-text-muted">
            Fill in all blanks, then check your answers
          </span>
          <button
            onClick={handleSubmit}
            disabled={!allFilled || isLoading}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer active:scale-95 ${
              allFilled && !isLoading
                ? "bg-accent text-white shadow-sm hover:brightness-110"
                : "bg-surface-hover border-2 border-border text-text-muted cursor-not-allowed opacity-50"
            }`}
          >
            <Send className="h-3 w-3" />
            Check Answers
          </button>
        </div>
      )}

      {submitted && (
        <div className="px-4 py-2 border-t border-accent/10 flex items-center gap-2">
          <Check className="h-3.5 w-3.5 text-success" />
          <span className="text-[11px] font-medium text-text-secondary">
            Answers submitted — check the response below!
          </span>
        </div>
      )}
    </div>
  );
}
