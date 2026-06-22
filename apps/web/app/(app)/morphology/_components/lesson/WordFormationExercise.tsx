"use client";

import { CircleCheckBig } from "lucide-react";
import * as m from "motion/react-client";
import { useState } from "react";
import type { MorphemeExercise } from "@/lib/morphology/schema";
import { ExplanationNote } from "./ExplanationNote";

type WordFormationData = Extract<MorphemeExercise, { type: "word_formation" }>;

interface WordFormationExerciseProps {
  exercise: WordFormationData;
  revealed: boolean;
  onAnswer: (correct: boolean) => void;
}

function normalize(s: string): string {
  return s.trim().toLowerCase();
}

/** Type the correct derived form of the base word to fill the blank. */
export function WordFormationExercise({
  exercise,
  revealed,
  onAnswer,
}: WordFormationExerciseProps) {
  const [value, setValue] = useState("");

  const accepted = [exercise.answer, ...(exercise.acceptedAnswers ?? [])].map(normalize);
  const isCorrect = revealed && accepted.includes(normalize(value));

  const submit = () => {
    if (revealed || !value.trim()) return;
    onAnswer(accepted.includes(normalize(value)));
  };

  return (
    <div className="flex flex-col gap-4">
      <p className="font-bold text-text-primary text-[16.5px] leading-relaxed">
        {exercise.sentence}
      </p>

      <div className="inline-flex items-center gap-2 self-start rounded-lg bg-accent-light border border-accent/20 py-1 px-3 text-[12.5px] font-bold text-accent-active">
        Base word: <span className="font-bold">{exercise.baseWord}</span>
      </div>

      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        disabled={revealed}
        placeholder="Type the correct form…"
        onKeyDown={(e) => {
          if (e.key === "Enter") submit();
        }}
        className="w-full rounded-xl bg-surface text-text-primary text-sm py-3 px-4 border border-border outline-none transition-colors focus:border-accent disabled:opacity-70"
      />

      {!revealed && (
        <m.button
          type="button"
          whileHover={value.trim() ? { scale: 1.02 } : undefined}
          whileTap={value.trim() ? { scale: 0.98 } : undefined}
          onClick={submit}
          disabled={!value.trim()}
          className={`self-end inline-flex items-center gap-2 rounded-xl text-[13px] font-bold py-2.5 px-5 border transition-colors ${
            value.trim()
              ? "bg-accent text-text-on-accent border-border cursor-pointer hover:bg-accent-hover"
              : "bg-surface-alt text-text-muted border-border cursor-default"
          }`}
        >
          <CircleCheckBig size={14} /> Submit
        </m.button>
      )}

      {revealed && (
        <>
          <div
            className={`rounded-xl border py-3 px-3.5 text-[13px] font-medium ${
              isCorrect ? "border-success/40 bg-success/10" : "border-error/40 bg-error/10"
            }`}
          >
            <span className="font-bold text-text-secondary">Your answer: </span>
            <span className="text-text-primary">{value || "—"}</span>
          </div>
          <div className="rounded-xl border border-success bg-success/10 py-3 px-3.5 text-[13px] font-bold text-success inline-flex items-start gap-2">
            <CircleCheckBig size={15} className="shrink-0 mt-0.5" />
            <span>{exercise.answer}</span>
          </div>
          <ExplanationNote
            explanationVi={exercise.explanationVi}
            explanationEn={exercise.explanationEn}
          />
        </>
      )}
    </div>
  );
}
