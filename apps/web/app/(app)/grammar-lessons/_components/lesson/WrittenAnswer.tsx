"use client";

import { CircleCheckBig } from "lucide-react";
import * as m from "motion/react-client";
import { isGrammarAnswerCorrect } from "@/lib/grammar-lessons/schema";

interface WrittenAnswerProps {
  typedAnswer: string;
  onChange: (value: string) => void;
  revealed: boolean;
  onSubmit: () => void;
  answer: string;
  acceptedAnswers?: string[];
  instructionVi?: string;
}

/** Free-text answer input (error correction / transformation) with reveal. */
export function WrittenAnswer({
  typedAnswer,
  onChange,
  revealed,
  onSubmit,
  answer,
  acceptedAnswers,
  instructionVi,
}: WrittenAnswerProps) {
  const trimmed = typedAnswer.trim();
  const isCorrect = revealed && isGrammarAnswerCorrect(typedAnswer, answer, acceptedAnswers);

  return (
    <div className="flex flex-col gap-3">
      <textarea
        value={typedAnswer}
        onChange={(e) => onChange(e.target.value)}
        disabled={revealed}
        rows={3}
        placeholder={instructionVi ?? "Type your answer here…"}
        className="w-full rounded-xl bg-surface text-text-primary text-sm leading-normal py-3 px-4 border-2 border-border outline-none transition-colors focus:border-accent disabled:opacity-70 resize-y"
      />

      {!revealed && (
        <m.button
          type="button"
          whileHover={trimmed ? { scale: 1.02 } : undefined}
          whileTap={trimmed ? { scale: 0.98 } : undefined}
          onClick={onSubmit}
          disabled={!trimmed}
          className={`self-end inline-flex items-center gap-2 rounded-xl text-[13px] font-black py-2.5 px-5 border-2 transition-colors ${
            trimmed
              ? "bg-accent text-text-on-accent border-border cursor-pointer hover:bg-accent-hover"
              : "bg-surface-alt text-text-muted border-border cursor-default"
          }`}
        >
          <CircleCheckBig size={14} /> Submit Answer
        </m.button>
      )}

      {revealed && (
        <div className="flex flex-col gap-2">
          <div
            className={`rounded-xl border-2 py-3 px-3.5 text-[13px] font-medium ${
              isCorrect ? "border-success/40 bg-success/10" : "border-error/40 bg-error/10"
            }`}
          >
            <span className="font-bold text-text-secondary">Your answer: </span>
            <span className="text-text-primary">{typedAnswer}</span>
          </div>
          <div className="rounded-xl border-2 border-success bg-success/10 py-3 px-3.5 text-[13px] font-bold text-success inline-flex items-start gap-2">
            <CircleCheckBig size={15} className="shrink-0 mt-0.5" />
            <span>{answer}</span>
          </div>
        </div>
      )}
    </div>
  );
}
