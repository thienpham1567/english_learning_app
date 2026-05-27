"use client";

import { CheckCircle, FileText, RefreshCw, Trophy, XCircle } from "lucide-react";
import { motion } from "motion/react";
import { DialogueTranscript } from "@/app/(app)/listening/_components/SpeakerLegend";
import { Button } from "@/components/ui/button";
import type { DialogueTurnPayload, ListeningSubmitResponse } from "@/lib/listening/types";

type Props = {
  result: ListeningSubmitResponse;
  onNewExercise: () => void;
  dialogueTurns?: DialogueTurnPayload[];
  scriptRevealed?: boolean;
};

export function Results({ result, onNewExercise, dialogueTurns, scriptRevealed }: Props) {
  const percentage = result.total > 0 ? Math.round((result.correct / result.total) * 100) : 0;
  const isGood = percentage >= 75;

  return (
    <div className="flex flex-col gap-5">
      {/* Score Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className={`rounded-lg p-6 text-center border-2 border-border shadow ${
          isGood ? "bg-success-bg" : "bg-error-bg"
        }`}
      >
        <div
          className={`text-5xl font-black font-mono leading-none ${
            isGood ? "text-[var(--success)]" : "text-[var(--error)]"
          }`}
        >
          {percentage}%
        </div>
        <div className="text-base font-bold mt-2 text-text-primary">
          {result.correct}/{result.total} correct answers
        </div>
        <div className="inline-flex items-center gap-1.5 mt-3 py-1.5 px-3.5 rounded-lg text-accent text-[13px] font-bold bg-accent-muted border-2 border-border shadow-sm">
          <Trophy size={14} /> +{result.xpEarned} XP
        </div>
        {scriptRevealed && (
          <div className="inline-flex items-center gap-1 mt-1.5 rounded-lg text-[11px] font-semibold py-1 px-2.5 bg-warning-bg text-[var(--warning)] ml-2">
            📖 Script viewed (-30% XP)
          </div>
        )}
      </motion.div>

      {/* Detailed Results */}
      <div>
        <div className="text-[11px] font-bold text-text-muted mb-2.5 uppercase tracking-widest">
          Result Details
        </div>
        <div className="flex flex-col gap-2.5">
          {result.results.map((r, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05, type: "spring", stiffness: 300, damping: 30 }}
              className={`bg-surface border-2 border-border rounded-lg p-3.5 ${
                r.correct ? "border-l-4 border-l-[var(--success)]" : "border-l-4 border-l-[var(--error)]"
              }`}
            >
              <div className="flex items-center gap-2 mb-1.5">
                {r.correct ? (
                  <CheckCircle className="text-[var(--success)] shrink-0" size={16} />
                ) : (
                  <XCircle className="text-[var(--error)] shrink-0" size={16} />
                )}
                <span className="text-[13px] font-bold text-text-primary">
                  {i + 1}. {r.question}
                </span>
              </div>
              {!r.correct && (
                <div className="text-xs text-text-muted ml-6">
                  <span className="text-[var(--error)] line-through">
                    {r.options[r.userAnswer]}
                  </span>
                  {" → "}
                  <span className="text-[var(--success)] font-semibold">
                    {r.options[r.correctIndex]}
                  </span>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Transcript */}
      <div>
        <div className="text-[11px] font-bold text-text-muted mb-2.5 uppercase tracking-widest flex items-center gap-1.5">
          <FileText size={13} /> Transcript
        </div>
        <div className="bg-surface border-2 border-border p-4 text-sm italic rounded-lg leading-[1.7] text-text-primary shadow-sm">
          {dialogueTurns && dialogueTurns.length > 0 ? (
            <DialogueTranscript turns={dialogueTurns} />
          ) : (
            result.passage
          )}
        </div>
      </div>

      {/* New Exercise Button */}
      <Button
        onClick={onNewExercise}
        className="w-full h-12 text-[15px] font-black flex items-center justify-center gap-2.5"
      >
        <RefreshCw size={16} /> New Exercise
      </Button>
    </div>
  );
}
