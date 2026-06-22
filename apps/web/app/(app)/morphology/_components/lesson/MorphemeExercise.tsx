"use client";

import { ChevronRight, CircleCheckBig, Flame } from "lucide-react";
import * as m from "motion/react-client";
import { Card } from "@/components/ui/card";
import type { MorphemeExercise as MorphemeExerciseData } from "@/lib/morphology/schema";
import { MatchExercise } from "./MatchExercise";
import { McqExercise } from "./McqExercise";
import { WordFormationExercise } from "./WordFormationExercise";

const TYPE_LABELS: Record<MorphemeExerciseData["type"], string> = {
  match: "Match",
  word_formation: "Word Formation",
  mcq: "Multiple Choice",
};

interface MorphemeExerciseProps {
  exercise: MorphemeExerciseData;
  exerciseIdx: number;
  totalCount: number;
  combo: number;
  revealed: boolean;
  onAnswer: (correct: boolean) => void;
  onNext: () => void;
}

/** Runner: progress + streak + the current exercise (by type) + advance. */
export function MorphemeExercise({
  exercise,
  exerciseIdx,
  totalCount,
  combo,
  revealed,
  onAnswer,
  onNext,
}: MorphemeExerciseProps) {
  const pct = Math.round(((exerciseIdx + 1) / totalCount) * 100);
  const isLast = exerciseIdx >= totalCount - 1;

  return (
    <div className="flex flex-col gap-4">
      {/* Progress */}
      <div className="flex flex-col gap-1.5">
        <div className="flex justify-between text-[12.5px] font-bold text-text-secondary">
          <span>
            Exercise {exerciseIdx + 1} of {totalCount}
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

      {/* Combo */}
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

      {/* Exercise */}
      <Card
        accentColor="accent"
        accentPosition="left"
        shadowSize="sm"
        className="p-5 md:p-6 bg-surface"
      >
        <span className="inline-flex self-start text-[10.5px] font-bold text-accent-active rounded-md bg-accent-light py-0.5 px-2 mb-3.5">
          {TYPE_LABELS[exercise.type]}
        </span>

        {exercise.type === "match" ? (
          <MatchExercise exercise={exercise} revealed={revealed} onAnswer={onAnswer} />
        ) : exercise.type === "word_formation" ? (
          <WordFormationExercise exercise={exercise} revealed={revealed} onAnswer={onAnswer} />
        ) : (
          <McqExercise exercise={exercise} revealed={revealed} onAnswer={onAnswer} />
        )}
      </Card>

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
              Next Exercise <ChevronRight size={16} />
            </>
          )}
        </m.button>
      )}
    </div>
  );
}
