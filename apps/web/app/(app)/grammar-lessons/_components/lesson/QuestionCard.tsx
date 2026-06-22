"use client";

import { Eye, Lightbulb } from "lucide-react";
import * as m from "motion/react-client";
import { Card } from "@/components/ui/card";
import type { GrammarLessonExercise } from "@/lib/grammar-lessons/schema";
import type { ExplLang } from "../../_hooks/useGrammarLesson";
import { ExplanationBlock } from "./ExplanationBlock";
import { McqOptions } from "./McqOptions";
import { WrittenAnswer } from "./WrittenAnswer";

const TYPE_LABELS: Record<string, string> = {
  multiple_choice: "Multiple Choice",
  error_correction: "Error Correction",
  transformation: "Sentence Rewriting",
  free_write: "Free Writing",
};

const TIER_LABELS: Record<string, { label: string; color: string }> = {
  recognition: { label: "Recognition", color: "blue" },
  application: { label: "Application", color: "cyan" },
  production: { label: "Production", color: "purple" },
  context: { label: "Context", color: "volcano" },
};

interface QuestionCardProps {
  exercise: GrammarLessonExercise;
  selected: string | null;
  typedAnswer: string;
  revealed: boolean;
  hintUsed: boolean;
  explLang: ExplLang;
  onSelect: (option: string) => void;
  onTypedChange: (value: string) => void;
  onSubmitWritten: () => void;
  onUseHint: () => void;
  onLangChange: (lang: ExplLang) => void;
}

/** A single practice question: prompt, hint, answer input, and feedback. */
export function QuestionCard({
  exercise,
  selected,
  typedAnswer,
  revealed,
  hintUsed,
  explLang,
  onSelect,
  onTypedChange,
  onSubmitWritten,
  onUseHint,
  onLangChange,
}: QuestionCardProps) {
  const tier = exercise.tier ? TIER_LABELS[exercise.tier] : null;

  return (
    <Card
      accentColor="accent"
      accentPosition="left"
      shadowSize="sm"
      className="p-5 md:p-6 bg-surface"
    >
      {/* Tags */}
      <div className="flex items-center gap-2 mb-3.5">
        <span className="text-[10.5px] font-bold text-accent-active rounded-md bg-accent-light py-0.5 px-2">
          {TYPE_LABELS[exercise.type] ?? exercise.type}
        </span>
        {tier && (
          <span
            className="text-[10.5px] font-bold rounded-md py-0.5 px-2"
            style={{
              color: `var(--${tier.color})`,
              background: `color-mix(in srgb, var(--${tier.color}) 10%, transparent)`,
            }}
          >
            {tier.label}
          </span>
        )}
      </div>

      {/* Prompt */}
      <p className="font-bold leading-relaxed mb-4 text-text-primary text-[16.5px]">
        {exercise.sentence}
      </p>

      {/* Hint */}
      {exercise.hint && !revealed && !hintUsed && (
        <m.button
          type="button"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onUseHint}
          className="inline-flex items-center gap-1.5 py-1.5 px-3 mb-4 text-xs font-bold cursor-pointer rounded-md border border-warning/30 bg-warning/5 text-warning"
        >
          <Eye size={13} /> View Hint
        </m.button>
      )}
      {exercise.hint && hintUsed && !revealed && (
        <m.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-lg mb-4 py-2.5 px-3.5 text-[13px] text-text-secondary font-medium border border-warning/20 bg-warning/5 inline-flex items-start gap-2"
        >
          <Lightbulb size={14} className="text-warning shrink-0 mt-0.5" />
          <span>{exercise.hint}</span>
        </m.div>
      )}

      {/* Answer input */}
      {exercise.type === "multiple_choice" ? (
        <McqOptions
          options={exercise.options}
          answer={exercise.answer}
          selected={selected}
          revealed={revealed}
          onSelect={onSelect}
        />
      ) : (
        <WrittenAnswer
          typedAnswer={typedAnswer}
          onChange={onTypedChange}
          revealed={revealed}
          onSubmit={onSubmitWritten}
          answer={exercise.answer}
          acceptedAnswers={exercise.acceptedAnswers}
          instructionVi={exercise.instructionVi}
        />
      )}

      {/* Explanation */}
      {revealed && (
        <ExplanationBlock
          explanationVi={exercise.explanation}
          explanationEn={exercise.explanationEn}
          lang={explLang}
          onLangChange={onLangChange}
        />
      )}
    </Card>
  );
}
