"use client";

import { ArrowLeft, Loader2 } from "lucide-react";
import * as m from "motion/react-client";
import { Card } from "@/components/ui/card";
import type { MorphemeCatalogItem } from "../_data/morphemes";
import { useMorphemeLesson } from "../_hooks/useMorphemeLesson";
import { MorphemeComplete } from "./lesson/MorphemeComplete";
import { MorphemeContent } from "./lesson/MorphemeContent";
import { MorphemeExercise } from "./lesson/MorphemeExercise";

interface MorphemeLessonViewProps {
  item: MorphemeCatalogItem;
  onBack: () => void;
  onCompleted?: () => void;
}

/** Orchestrates a morpheme lesson: theory → exercises → results. */
export function MorphemeLessonView({ item, onBack, onCompleted }: MorphemeLessonViewProps) {
  const l = useMorphemeLesson({ item, onCompleted });

  return (
    <div className="max-w-[700px] mx-auto w-full">
      <m.button
        type="button"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onBack}
        className="inline-flex items-center gap-2 py-2 px-4 border border-border rounded-lg bg-surface text-accent-active cursor-pointer text-[13px] font-bold mb-4 shadow-sm"
      >
        <ArrowLeft size={15} /> Morpheme List
      </m.button>

      {l.state === "loading" && (
        <Card shadowSize="md" className="text-center rounded-xl bg-surface py-16 px-6">
          <Loader2 className="animate-spin text-accent-active mx-auto" size={38} />
          <p className="text-text-secondary mt-5 font-bold text-[14.5px]">
            Generating lesson: <strong className="text-accent-active">{item.morpheme}</strong>
          </p>
          <p className="text-text-muted mt-1 m-0 font-medium text-[12.5px]">
            AI is building the word family and exercises…
          </p>
        </Card>
      )}

      {l.state === "error" && (
        <div className="p-6 rounded-xl text-center border border-error/25 bg-error/5">
          <p className="font-bold text-sm text-error">
            Failed to generate lesson. Please try again.
          </p>
          <m.button
            type="button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => l.generateLesson(false)}
            className="mt-3 rounded-lg cursor-pointer font-bold py-2 px-5 bg-error text-text-on-accent border border-border"
          >
            Retry
          </m.button>
        </div>
      )}

      {l.state === "lesson" && l.lesson && (
        <m.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <MorphemeContent
            lesson={l.lesson}
            onStart={l.startExercises}
            onRegenerate={() => l.generateLesson(true)}
          />
        </m.div>
      )}

      {l.state === "exercises" && l.currentExercise && (
        <MorphemeExercise
          exercise={l.currentExercise}
          exerciseIdx={l.exerciseIdx}
          totalCount={l.totalCount}
          combo={l.combo}
          revealed={l.revealed}
          onAnswer={l.recordResult}
          onNext={l.next}
        />
      )}

      {l.state === "complete" && (
        <MorphemeComplete
          morpheme={item.morpheme}
          correctCount={l.correctCount}
          totalCount={l.totalCount}
          scorePct={l.scorePct}
          xpAwarded={l.xpAwarded}
          alreadyCompleted={l.alreadyCompleted}
          onRetry={l.startExercises}
          onBack={onBack}
        />
      )}
    </div>
  );
}
