"use client";

import {
  AlertTriangle,
  ArrowLeft,
  CircleCheckBig,
  Lightbulb,
  RefreshCw,
  Star,
  Trophy,
  XCircle,
} from "lucide-react";
import * as m from "motion/react-client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { GRAMMAR_TOPIC_TO_WEEK, getUnitIdForGrammarTopic } from "@/lib/curriculum/grammar-mapping";
import type { GrammarLessonAnswer } from "@/lib/grammar-lessons/schema";

interface LessonCompleteProps {
  topicId: string;
  title: string;
  correctCount: number;
  totalCount: number;
  scorePct: number;
  xpAwarded: number;
  alreadyCompleted: boolean;
  wrongAnswers: GrammarLessonAnswer[];
  onBack: () => void;
  onRetry: () => void;
}

function medalFor(scorePct: number): string {
  if (scorePct >= 90) return "🥇";
  if (scorePct >= 70) return "🥈";
  if (scorePct >= 50) return "🥉";
  return "🎓";
}

/** Post-practice summary: score, XP, roadmap progress, and incorrect-item review. */
export function LessonComplete({
  topicId,
  title,
  correctCount,
  totalCount,
  scorePct,
  xpAwarded,
  alreadyCompleted,
  wrongAnswers,
  onBack,
  onRetry,
}: LessonCompleteProps) {
  const router = useRouter();
  const [showReview, setShowReview] = useState(false);

  const unitId = getUnitIdForGrammarTopic(topicId);
  const mapping = unitId ? GRAMMAR_TOPIC_TO_WEEK[topicId] : null;

  return (
    <m.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}>
      <Card shadowSize="lg" className="rounded-xl bg-surface text-center p-6 md:p-10">
        <div className="relative inline-block mb-4">
          <Trophy size={56} className="text-success" />
          <Star size={20} className="absolute -top-1 -right-3 text-xp" />
        </div>

        <h2 className="mb-2 text-2xl font-black text-text-primary font-display">
          {medalFor(scorePct)} Lesson Completed!
        </h2>
        <p className="text-text-secondary mb-4 font-medium text-[14.5px] leading-normal">
          Topic: <span className="text-accent-active font-bold">{title}</span>
          <br />
          Score:{" "}
          <strong className="text-success">
            {correctCount}/{totalCount}
          </strong>{" "}
          ({scorePct}%)
        </p>

        {xpAwarded > 0 && (
          <div className="inline-flex items-center gap-1.5 rounded-lg text-accent-active text-base font-black mb-2 py-2 px-5 bg-accent-light shadow-sm">
            <Star size={18} /> +{xpAwarded} XP earned
          </div>
        )}
        {alreadyCompleted && (
          <p className="text-text-muted text-xs font-semibold mb-4">
            You have already earned XP for this lesson.
          </p>
        )}

        {/* Roadmap auto-completion */}
        {unitId && mapping && (
          <m.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="my-4"
          >
            <a
              href={`/roadmap/week/${mapping.weekNumber}`}
              className="no-underline inline-flex items-center gap-2 rounded-xl border-2 border-success/30 bg-success/10 px-4 py-2.5 text-xs font-bold text-success hover:bg-success/15 transition-colors"
            >
              <CircleCheckBig size={14} />
              Roadmap Week {mapping.weekNumber} — unit auto-completed ✓
            </a>
          </m.div>
        )}

        {/* Incorrect-item review */}
        {wrongAnswers.length > 0 && (
          <div className="mt-2 mb-6 text-left">
            <button
              type="button"
              onClick={() => setShowReview((v) => !v)}
              className="flex items-center gap-2 w-full py-3 px-4 rounded-lg cursor-pointer text-[13px] font-black text-error border-2 border-error/20 bg-error/5"
            >
              <AlertTriangle size={15} /> Review {wrongAnswers.length} incorrect{" "}
              {wrongAnswers.length === 1 ? "item" : "items"} · {showReview ? "Collapse" : "Expand"}
            </button>
            {showReview && (
              <m.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="flex flex-col gap-2 mt-2 overflow-hidden"
              >
                {wrongAnswers.map((wItem, idx) => (
                  <div key={idx} className="rounded-lg bg-surface-alt border-2 border-border p-3.5">
                    <p className="mb-2 font-bold text-text-primary text-[13.5px]">
                      {wItem.questionStem}
                    </p>
                    <div className="flex items-center gap-1.5 text-error font-bold text-[12.5px]">
                      <XCircle size={14} /> Your answer: {wItem.userAnswer}
                    </div>
                    <div className="flex items-center gap-1.5 text-success font-bold text-[12.5px] mt-1">
                      <CircleCheckBig size={14} /> Correct: {wItem.correctAnswer}
                    </div>
                    {wItem.explanationVi && (
                      <div className="mt-2 p-2 bg-surface rounded-md text-xs text-text-muted font-medium inline-flex items-start gap-1.5">
                        <Lightbulb size={13} className="text-accent shrink-0 mt-0.5" />
                        {wItem.explanationVi}
                      </div>
                    )}
                  </div>
                ))}
              </m.div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2.5 justify-center flex-wrap">
          <m.button
            type="button"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onBack}
            className="inline-flex items-center gap-1.5 rounded-lg bg-surface text-text-primary cursor-pointer font-black text-[13.5px] py-2.5 px-5 border-2 border-border shadow-sm"
          >
            <ArrowLeft size={15} /> Back
          </m.button>
          <m.button
            type="button"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onRetry}
            className="inline-flex items-center gap-1.5 rounded-lg text-accent-active cursor-pointer font-black text-[13.5px] py-2.5 px-5 border-2 border-accent bg-accent-light shadow-sm"
          >
            <RefreshCw size={15} /> Retry Practice
          </m.button>
          <m.button
            type="button"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => router.push("/grammar-quiz")}
            className="inline-flex items-center rounded-lg text-text-on-accent cursor-pointer font-black text-[13.5px] py-2.5 px-5 border-2 border-border bg-accent shadow-sm hover:bg-accent-hover"
          >
            Review Quiz
          </m.button>
        </div>
      </Card>
    </m.div>
  );
}
