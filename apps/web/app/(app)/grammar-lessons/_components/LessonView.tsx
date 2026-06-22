"use client";

import { ArrowLeft, Loader2 } from "lucide-react";
import * as m from "motion/react-client";
import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { Card } from "@/components/ui/card";
import { buildGrammarChatbotPrompt } from "@/lib/grammar-lessons/chatbot-prompts";
import type { GrammarLessonProgressItem } from "@/lib/grammar-lessons/schema";
import { useGrammarLesson } from "../_hooks/useGrammarLesson";
import { ExercisePractice } from "./lesson/ExercisePractice";
import { LessonComplete } from "./lesson/LessonComplete";
import { LessonContent } from "./lesson/LessonContent";

interface Props {
  topicId: string;
  topicTitle: string;
  level: string;
  examMode: string;
  focusNote?: string;
  onBack: () => void;
  onComplete: (topicId: string, progress: GrammarLessonProgressItem) => void;
}

/**
 * LessonView — orchestrates a grammar lesson: theory → practice → results.
 * All state lives in useGrammarLesson; each phase renders a focused component.
 */
export function LessonView({
  topicId,
  topicTitle,
  level,
  examMode,
  focusNote,
  onBack,
  onComplete,
}: Props) {
  const l = useGrammarLesson({ topicId, topicTitle, level, examMode, focusNote, onComplete });
  const router = useRouter();

  // Open the English chatbot with a tailored practice prompt for this lesson.
  // The chatbot reads the `prompt` query param and auto-sends it.
  const practiceWithChat = useCallback(() => {
    const lessonTitle = l.lesson?.title ?? topicTitle;
    const prompt = buildGrammarChatbotPrompt(topicId, lessonTitle);
    router.push(`/english-chatbot?prompt=${encodeURIComponent(prompt)}`);
  }, [router, topicId, topicTitle, l.lesson?.title]);

  return (
    <div className="max-w-[700px] mx-auto w-full">
      {/* Back */}
      <m.button
        type="button"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onBack}
        className="inline-flex items-center gap-2 py-2 px-4 border border-border rounded-lg bg-surface text-accent-active cursor-pointer text-[13px] font-bold mb-4 shadow-sm"
      >
        <ArrowLeft size={15} /> Lesson List
      </m.button>

      {/* Loading */}
      {l.state === "loading" && (
        <Card shadowSize="md" className="text-center rounded-xl bg-surface py-16 px-6">
          <Loader2 className="animate-spin text-accent-active mx-auto" size={38} />
          <p className="text-text-secondary mt-5 font-bold text-[14.5px]">
            Generating lesson: <strong className="text-accent-active">{topicTitle}</strong>
          </p>
          <p className="text-text-muted mt-1 m-0 font-medium text-[12.5px]">
            AI is analyzing concepts and compiling practice questions…
          </p>
        </Card>
      )}

      {/* Error */}
      {l.error && (
        <div className="p-6 rounded-xl text-center border border-error/25 bg-error/5">
          <p className="font-bold text-sm text-error">{l.error}</p>
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

      {/* Theory */}
      {l.state === "lesson" && l.lesson && (
        <m.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <LessonContent
            lesson={l.lesson}
            level={level}
            onRegenerate={() => l.generateLesson(true)}
            onStart={l.startExercises}
            onPracticeChat={practiceWithChat}
          />
        </m.div>
      )}

      {/* Practice */}
      {l.state === "exercises" && l.currentExercise && (
        <ExercisePractice
          exercise={l.currentExercise}
          exerciseIdx={l.exerciseIdx}
          totalCount={l.totalCount}
          combo={l.combo}
          selected={l.selected}
          typedAnswer={l.typedAnswer}
          revealed={l.revealed}
          hintUsed={l.hintUsed}
          explLang={l.explLang}
          onSelect={l.handleAnswer}
          onTypedChange={l.setTypedAnswer}
          onSubmitWritten={l.handleWrittenAnswer}
          onUseHint={() => l.setHintUsed(true)}
          onLangChange={l.setExplLang}
          onNext={l.nextExercise}
        />
      )}

      {/* Results */}
      {l.state === "complete" && l.lesson && (
        <LessonComplete
          topicId={topicId}
          title={l.lesson.title}
          correctCount={l.correctCount}
          totalCount={l.totalCount}
          scorePct={l.scorePct}
          xpAwarded={l.xpAwarded}
          alreadyCompleted={l.alreadyCompleted}
          wrongAnswers={l.wrongAnswers}
          onBack={onBack}
          onRetry={l.startExercises}
          onPracticeChat={practiceWithChat}
        />
      )}
    </div>
  );
}
