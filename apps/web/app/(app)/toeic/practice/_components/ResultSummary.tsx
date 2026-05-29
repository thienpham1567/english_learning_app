"use client";

import { AlertTriangle, CheckCircle, Lightbulb, RefreshCw, XCircle } from "lucide-react";

import * as m from "motion/react-client";
import type { SessionAnswer, ToeicSessionQuestion } from "@/hooks/useToeicSession";

export function ResultSummary({
  score,
  answers,
  questions,
  onReset,
}: {
  score: { correct: number; total: number } | null;
  answers: SessionAnswer[];
  questions: ToeicSessionQuestion[];
  onReset: () => void;
}) {
  const correct = score?.correct ?? 0;
  const total = score?.total ?? questions.length;
  const wrong = answers.filter((a) => a.isCorrect === false);
  const percentage = Math.round((correct / Math.max(1, total)) * 100);

  return (
    <div className="anim-fade-up grid gap-5 w-[720px] w-full mx-auto">
      {/* Score Summary Card */}
      <div
        className="bg-surface rounded-xl p-6 flex justify-between items-center gap-4"
        style={{ border: "1.5px solid var(--border)", boxShadow: "var(--shadow-md)" }}
      >
        <div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-4xl text-text-primary font-display" style={{ fontWeight: 950 }}>
              {correct}
            </span>
            <span className="text-base text-text-muted font-bold">/ {total} correct answers</span>
          </div>
          <div
            className="items-center gap-1.5 mt-1.5 font-extrabold"
            style={{
              display: "inline-flex",
              padding: "2px 10px",
              borderRadius: 20,
              background:
                percentage >= 70 ? "color-mix(in srgb, var(--success) 8%, transparent)" : "color-mix(in srgb, var(--warning) 8%, transparent)",
              color: percentage >= 70 ? "var(--success)" : "var(--warning)",
              fontSize: 12.5,
              border: `1px solid ${percentage >= 70 ? "color-mix(in srgb, var(--success) 20%, transparent)" : "color-mix(in srgb, var(--warning) 20%, transparent)"}`,
            }}
          >
            {percentage >= 70 ? <CheckCircle size={12} /> : <AlertTriangle size={12} />}
            <span>Accuracy Rate: {percentage}%</span>
          </div>
        </div>

        <m.button
          onClick={onReset}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          className="border-none rounded-lg cursor-pointer items-center gap-1.5"
          style={{
            padding: "10px 20px",
            background: "var(--accent)",
            color: "var(--text-on-accent)",
            fontSize: 13.5,
            fontWeight: 850,
            display: "inline-flex",
            boxShadow: "0 4px 12px var(--accent-muted)",
          }}
        >
          <RefreshCw />
          <span>Continue Practice</span>
        </m.button>
      </div>

      {/* Wrong answers detail panel */}
      {wrong.length > 0 ? (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2" style={{ paddingLeft: 4 }}>
            <XCircle className="text-destructive text-base" />
            <h4 className="m-0 font-black text-text-primary" style={{ fontSize: 14.5 }}>
              Details of {wrong.length} incorrect answers
            </h4>
          </div>

          <div className="grid gap-3">
            {wrong.map((a) => {
              const q = questions.find((qq) => qq.id === a.questionId);
              if (!q) return null;
              return (
                <div
                  key={a.questionId}
                  className="p-4 bg-surface rounded-xl"
                  style={{ border: "1.5px solid var(--border)", boxShadow: "var(--shadow-sm)" }}
                >
                  <div className="flex justify-between items-center mb-2.5">
                    <span className="text-[13px] font-extrabold text-text-primary">
                      Question #{q.number}
                    </span>
                    <span
                      className="text-[10px] font-black rounded-md bg-surface-alt text-text-secondary border-2 border-border"
                      style={{ padding: "2px 8px" }}
                    >
                      Part {q.part}
                    </span>
                  </div>

                  {q.questionText && (
                    <p className="mb-3 text-sm font-bold text-text-primary leading-normal">
                      {q.questionText}
                    </p>
                  )}

                  {/* Choices summary */}
                  <div className="flex flex-col gap-1.5 mb-3">
                    {q.options.map((opt, oIdx) => {
                      const isCorrect = q.correctIndex === oIdx;
                      const isUserPick = a.selectedIndex === oIdx;
                      if (!isCorrect && !isUserPick) return null;

                      return (
                        <div
                          key={oIdx}
                          className="flex items-center gap-2 py-1.5 px-3 font-bold"
                          style={{
                            fontSize: 12.5,
                            borderRadius: "var(--radius-md)",
                            background: isCorrect
                              ? "color-mix(in srgb, var(--success) 6%, transparent)"
                              : "color-mix(in srgb, var(--error) 6%, transparent)",
                            color: isCorrect ? "var(--success)" : "var(--error)",
                            border: `1px solid ${isCorrect ? "color-mix(in srgb, var(--success) 15%, transparent)" : "color-mix(in srgb, var(--error) 15%, transparent)"}`,
                          }}
                        >
                          <span style={{ opacity: 0.8 }}>{String.fromCharCode(65 + oIdx)}.</span>
                          <span className="flex-1">{opt}</span>
                          <span>{isCorrect ? "Correct Answer" : "Your Answer"}</span>
                        </div>
                      );
                    })}
                  </div>

                  {q.explanationVi && (
                    <div
                      className="bg-surface-alt border-2 border-border text-text-secondary font-medium"
                      style={{
                        padding: "10px 12px",
                        borderRadius: "var(--radius-md)",
                        fontSize: 12.5,
                        lineHeight: 1.55,
                      }}
                    >
                      <div className="flex items-center gap-1 font-extrabold text-text-primary mb-1">
                        <Lightbulb style={{ color: "var(--warning)" }} />
                        <span>Explanation:</span>
                      </div>
                      <p className="m-0">{q.explanationVi}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div
          className="text-center rounded-xl text-success"
          style={{
            padding: "32px 20px",
            background: "color-mix(in srgb, var(--success) 6%, transparent)",
            border: "1.5px dashed var(--success)",
          }}
        >
          <CheckCircle className="text-4xl mb-3" />
          <p className="m-0 font-extrabold" style={{ fontSize: 14.5 }}>
            Excellent! You answered all questions correctly in this session.
          </p>
        </div>
      )}
    </div>
  );
}
