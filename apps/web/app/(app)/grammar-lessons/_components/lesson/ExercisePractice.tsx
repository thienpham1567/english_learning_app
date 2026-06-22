"use client";

import { ChevronRight, CircleCheckBig, Flame } from "lucide-react";
import * as m from "motion/react-client";
import type { GrammarLessonExercise } from "@/lib/grammar-lessons/schema";
import type { ExplLang } from "../../_hooks/useGrammarLesson";
import { QuestionCard } from "./QuestionCard";

interface ExercisePracticeProps {
  exercise: GrammarLessonExercise;
  exerciseIdx: number;
  totalCount: number;
  combo: number;
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
  onNext: () => void;
}

/** The active practice flow: progress, streak, current question, and advance. */
export function ExercisePractice({
  exercise,
  exerciseIdx,
  totalCount,
  combo,
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
  onNext,
}: ExercisePracticeProps) {
  const pct = Math.round(((exerciseIdx + 1) / totalCount) * 100);
  const isLast = exerciseIdx >= totalCount - 1;

  return (
    <div className="flex flex-col gap-4">
      {/* Progress header */}
      <div className="flex flex-col gap-1.5">
        <div className="flex justify-between text-[12.5px] font-bold text-text-secondary">
          <span>
            Question {exerciseIdx + 1} of {totalCount}
          </span>
          <span className="text-accent-active">{pct}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-border overflow-hidden">
          <m.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ type: "spring", stiffness: 80, damping: 15 }}
            className="h-full rounded-full bg-gradient-to-r from-accent to-xp"
          />
        </div>
      </div>

      {/* Combo streak */}
      {combo >= 2 && (
        <m.div
          key={`combo-${combo}`}
          initial={{ scale: 0.5, y: -10 }}
          animate={{ scale: [1, 1.1, 1], y: 0 }}
          className="flex justify-center"
        >
          <span className="inline-flex items-center gap-1.5 rounded-lg text-sm font-bold py-1.5 px-4 text-text-on-accent bg-gradient-to-r from-fire to-xp shadow-sm">
            <Flame size={15} /> {combo} COMBO! 🔥
          </span>
        </m.div>
      )}

      {/* Question */}
      <QuestionCard
        exercise={exercise}
        selected={selected}
        typedAnswer={typedAnswer}
        revealed={revealed}
        hintUsed={hintUsed}
        explLang={explLang}
        onSelect={onSelect}
        onTypedChange={onTypedChange}
        onSubmitWritten={onSubmitWritten}
        onUseHint={onUseHint}
        onLangChange={onLangChange}
      />

      {/* Advance */}
      {revealed && (
        <m.button
          type="button"
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          onClick={onNext}
          className="w-full inline-flex items-center justify-center gap-2 rounded-xl py-3 px-6 text-[15px] font-bold text-text-on-accent bg-accent border border-border shadow-sm hover:bg-accent-hover cursor-pointer"
        >
          {isLast ? (
            <>
              View Results <CircleCheckBig size={16} />
            </>
          ) : (
            <>
              Next Question <ChevronRight size={16} />
            </>
          )}
        </m.button>
      )}
    </div>
  );
}
