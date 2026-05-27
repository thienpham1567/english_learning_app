"use client";
import { CircleCheckBig, ClipboardList, Loader2, Send } from "lucide-react";

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
      <div
        className="text-[13px] font-semibold text-text-muted uppercase"
        style={{ letterSpacing: 1 }}
      >
        <ClipboardList style={{ marginRight: 6 }} /> Questions ({questions.length})
      </div>

      {questions.map((q, qi) => (
        <div
          key={qi}
          className="bg-(--surface) border-2 border-border p-4"
          style={{ borderRadius: "var(--radius-md)" }}
        >
          <div className="text-sm font-semibold mb-3" style={{ color: "var(--text)" }}>
            {qi + 1}. {q.question}
          </div>
          <div className="flex flex-col gap-1.5">
            {q.options.map((opt, oi) => {
              const isSelected = selectedAnswers[qi] === oi;
              return (
                <button
                  key={oi}
                  onClick={() => onSelectAnswer(qi, oi)}
                  className="flex items-center gap-2.5 rounded-(--radius-sm) cursor-pointer text-[13px] text-left w-full"
                  style={{
                    padding: "10px 14px",
                    border: isSelected ? "2px solid var(--accent)" : "1px solid var(--border)",
                    background: isSelected ? "var(--accent-surface)" : "transparent",
                    color: "var(--text)",
                    transition: "all 0.15s ease",
                  }}
                >
                  <span
                    className="w-[22px] h-[22px] rounded-full flex items-center justify-center text-[11px] font-bold shrink-0"
                    style={{
                      border: isSelected ? "2px solid var(--accent)" : "1px solid var(--border)",
                      background: isSelected ? "var(--accent)" : "transparent",
                      color: isSelected ? "var(--text-on-accent)" : "var(--text-muted)",
                    }}
                  >
                    {isSelected ? <CircleCheckBig /> : String.fromCharCode(65 + oi)}
                  </span>
                  {opt}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {/* Submit button */}
      <button
        onClick={onSubmit}
        disabled={!allAnswered || isSubmitting}
        className="flex items-center justify-center gap-2.5 border-none text-[15px] font-bold"
        style={{
          padding: "14px 24px",
          borderRadius: "var(--radius-md)",
          background: allAnswered
            ? "linear-gradient(135deg, var(--accent), var(--accent-hover))"
            : "var(--border)",
          color: allAnswered ? "var(--text-on-accent)" : "var(--text-muted)",
          cursor: allAnswered && !isSubmitting ? "pointer" : "not-allowed",
          transition: "all 0.2s ease",
          opacity: isSubmitting ? 0.7 : 1,
        }}
      >
        {isSubmitting ? <Loader2 className="animate-spin" /> : <Send />}
        {isSubmitting ? "Scoring..." : "Submit Answers"}
      </button>
    </div>
  );
}
