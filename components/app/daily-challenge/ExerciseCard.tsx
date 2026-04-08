"use client";

import type { Exercise } from "@/lib/daily-challenge/types";
import { FillInBlank } from "./FillInBlank";
import { SentenceOrder } from "./SentenceOrder";
import { TranslationExercise } from "./TranslationExercise";
import { ErrorCorrection } from "./ErrorCorrection";

type Props = {
  exercise: Exercise;
  onAnswer: (answer: string) => void;
  disabled: boolean;
};

export function ExerciseCard({ exercise, onAnswer, disabled }: Props) {
  switch (exercise.type) {
    case "fill-in-blank":
      return <FillInBlank data={exercise.data} instruction={exercise.instruction} onAnswer={onAnswer} disabled={disabled} />;
    case "sentence-order":
      return <SentenceOrder data={exercise.data} instruction={exercise.instruction} onAnswer={onAnswer} disabled={disabled} />;
    case "translation":
      return <TranslationExercise data={exercise.data} instruction={exercise.instruction} onAnswer={onAnswer} disabled={disabled} />;
    case "error-correction":
      return <ErrorCorrection data={exercise.data} instruction={exercise.instruction} onAnswer={onAnswer} disabled={disabled} />;
  }
}
