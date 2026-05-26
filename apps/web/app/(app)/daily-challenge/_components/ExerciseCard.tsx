"use client";

import type { Exercise } from "@/lib/daily-challenge/types";
import { Collocation } from "./Collocation";
import { DialogueCompletion } from "./DialogueCompletion";
import { ErrorCorrection } from "./ErrorCorrection";
import { FillInBlank } from "./FillInBlank";
import { ReadingComprehension } from "./ReadingComprehension";
import { SentenceOrder } from "./SentenceOrder";
import { SynonymAntonym } from "./SynonymAntonym";
import { TranslationExercise } from "./TranslationExercise";
import { WordFormation } from "./WordFormation";

type Props = {
  exercise: Exercise;
  onAnswer: (answer: string) => void;
  disabled: boolean;
};

export function ExerciseCard({ exercise, onAnswer, disabled }: Props) {
  switch (exercise.type) {
    case "fill-in-blank":
      return (
        <FillInBlank
          data={exercise.data}
          instruction={exercise.instruction}
          onAnswer={onAnswer}
          disabled={disabled}
        />
      );
    case "sentence-order":
      return (
        <SentenceOrder
          data={exercise.data}
          instruction={exercise.instruction}
          onAnswer={onAnswer}
          disabled={disabled}
        />
      );
    case "translation":
      return (
        <TranslationExercise
          data={exercise.data}
          instruction={exercise.instruction}
          onAnswer={onAnswer}
          disabled={disabled}
        />
      );
    case "error-correction":
      return (
        <ErrorCorrection
          data={exercise.data}
          instruction={exercise.instruction}
          onAnswer={onAnswer}
          disabled={disabled}
        />
      );
    case "word-formation":
      return (
        <WordFormation
          data={exercise.data}
          instruction={exercise.instruction}
          onAnswer={onAnswer}
          disabled={disabled}
        />
      );
    case "dialogue-completion":
      return (
        <DialogueCompletion
          data={exercise.data}
          instruction={exercise.instruction}
          onAnswer={onAnswer}
          disabled={disabled}
        />
      );
    case "synonym-antonym":
      return (
        <SynonymAntonym
          data={exercise.data}
          instruction={exercise.instruction}
          onAnswer={onAnswer}
          disabled={disabled}
        />
      );
    case "reading-comprehension":
      return (
        <ReadingComprehension
          data={exercise.data}
          instruction={exercise.instruction}
          onAnswer={onAnswer}
          disabled={disabled}
        />
      );
    case "collocation":
      return (
        <Collocation
          data={exercise.data}
          instruction={exercise.instruction}
          onAnswer={onAnswer}
          disabled={disabled}
        />
      );
  }
}
