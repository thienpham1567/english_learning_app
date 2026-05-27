"use client";

import { CircleCheckBig, ClipboardList, Loader2, Send } from "lucide-react";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";

type Question = {
  question: string;
  options: string[];
};

type Props = {
  questions: Question[];
  selectedAnswers: (number | null)[];
  onSelectAnswer: (questionIndex: number, optionIndex: number) => void;
  onSubmit: () => void;
  allAnswered: boolean;
  isSubmitting: boolean;
};

export function QuestionCards({
  questions,
  selectedAnswers,
  onSelectAnswer,
  onSubmit,
  allAnswered,
  isSubmitting,
}: Props) {
  return (
    <div className="flex flex-col gap-4">
      <div className="text-[11px] font-bold text-text-muted uppercase tracking-widest flex items-center gap-1.5">
        <ClipboardList size={14} /> Questions ({questions.length})
      </div>

      {questions.map((q, qi) => (
        <motion.div
          key={qi}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: qi * 0.05, type: "spring", stiffness: 300, damping: 30 }}
          className="bg-surface border-2 border-border rounded-lg p-4 shadow-(--shadow-sm)"
        >
          <div className="text-sm font-bold text-text-primary mb-3">
            {qi + 1}. {q.question}
          </div>
          <div className="flex flex-col gap-1.5">
            {q.options.map((opt, oi) => {
              const isSelected = selectedAnswers[qi] === oi;
              return (
                <motion.button
                  key={oi}
                  onClick={() => onSelectAnswer(qi, oi)}
                  whileHover={{ x: 2 }}
                  whileTap={{ scale: 0.99 }}
                  className={`flex items-center gap-2.5 rounded-lg cursor-pointer text-[13px] text-left w-full p-2.5 px-3.5 transition-all duration-100 ${
                    isSelected
                      ? "border-2 border-accent bg-accent-light text-text-primary shadow-(--shadow-sm) -translate-y-0.5"
                      : "border-2 border-border bg-transparent text-text-primary hover:bg-surface-hover"
                  }`}
                >
                  <span
                    className={`w-[22px] h-[22px] rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 transition-all duration-100 ${
                      isSelected
                        ? "border-2 border-accent bg-accent text-ink"
                        : "border-2 border-border bg-transparent text-text-muted"
                    }`}
                  >
                    {isSelected ? <CircleCheckBig size={12} /> : String.fromCharCode(65 + oi)}
                  </span>
                  {opt}
                </motion.button>
              );
            })}
          </div>
        </motion.div>
      ))}

      {/* Submit button */}
      <Button
        onClick={onSubmit}
        disabled={!allAnswered || isSubmitting}
        className="w-full h-12 text-[15px] font-black flex items-center justify-center gap-2.5"
      >
        {isSubmitting ? <Loader2 className="animate-spin" /> : <Send size={16} />}
        {isSubmitting ? "Scoring..." : "Submit Answers"}
      </Button>
    </div>
  );
}
