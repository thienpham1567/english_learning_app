"use client";

import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";

type ReviewQuestion = {
  id: string;
  part: number;
  number: number;
  questionText: string | null;
  options: string[];
  correctIndex: number;
  explanationVi: string | null;
};

type ReviewAnswer = {
  questionId: string;
  selectedIndex: number | null;
  isCorrect: boolean | null;
  flagged: boolean;
};

export function ReviewTabs({
  questions,
  answers,
}: {
  questions: ReviewQuestion[];
  answers: ReviewAnswer[];
}) {
  const [activeKey, setActiveKey] = useState("wrong");

  const byId = useMemo(() => new Map(answers.map((a) => [a.questionId, a])), [answers]);

  const wrong = useMemo(
    () => questions.filter((q) => byId.get(q.id)?.isCorrect === false),
    [questions, byId],
  );
  const bookmarked = useMemo(
    () => questions.filter((q) => byId.get(q.id)?.flagged === true),
    [questions, byId],
  );

  const renderList = (list: ReviewQuestion[]) => {
    if (list.length === 0) {
      return <div className="p-3 text-text-muted text-sm font-medium">No questions.</div>;
    }
    return (
      <div className="grid gap-3">
        {list.map((q) => {
          const a = byId.get(q.id);
          const userPick = a?.selectedIndex ?? null;
          return (
            <Card shadowSize="sm" className="p-4" key={q.id}>
              <div className="flex gap-2 items-center mb-2.5 flex-wrap">
                <span className="bg-blue-500/10 border border-blue-500/20 text-blue-600 py-0.5 px-2 rounded-md font-bold text-xs inline-block">
                  Part {q.part}
                </span>
                <span className="bg-accent/15 border border-accent/30 text-accent py-0.5 px-2 rounded-md font-bold text-xs inline-block">
                  Question {q.number}
                </span>
                {a?.flagged && (
                  <span className="bg-amber-500/10 border border-amber-500/20 text-amber-600 py-0.5 px-2 rounded-md font-bold text-xs inline-block">
                    Bookmarked
                  </span>
                )}
                {a?.isCorrect === false && (
                  <span className="bg-red-500/10 border border-red-500/20 text-red-600 py-0.5 px-2 rounded-md font-bold text-xs inline-block">
                    Incorrect
                  </span>
                )}
                {a?.isCorrect === true && (
                  <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 py-0.5 px-2 rounded-md font-bold text-xs inline-block">
                    Correct
                  </span>
                )}
                {a?.isCorrect === null && (
                  <span className="bg-accent/10 border border-accent/25 text-accent py-0.5 px-2 rounded-md font-bold text-xs inline-block">
                    Skipped
                  </span>
                )}
              </div>
              {q.questionText && (
                <div className="mb-2 font-semibold text-text-primary">{q.questionText}</div>
              )}
              <div className="grid gap-1.5">
                {q.options.map((opt, i) => {
                  const isCorrect = i === q.correctIndex;
                  const isPick = i === userPick;
                  const bg = isCorrect
                    ? "rgba(16,185,129,0.12)"
                    : isPick
                      ? "rgba(239,68,68,0.12)"
                      : "transparent";
                  const border = isCorrect
                    ? "border-emerald-500/30"
                    : isPick
                      ? "border-red-500/30"
                      : "border-transparent";
                  return (
                    <div
                      key={i}
                      className={`py-2 px-3.5 rounded-lg text-sm border font-medium flex items-center justify-between`}
                      style={{
                        background: bg,
                        borderColor: border,
                      }}
                    >
                      <span>
                        {String.fromCharCode(65 + i)}. {opt}
                      </span>
                      <div className="flex gap-1.5">
                        {isCorrect && (
                          <span className="bg-emerald-500/10 border border-emerald-500/25 text-emerald-600 py-0.5 px-2 rounded-md text-xs font-bold inline-block ml-2">
                            Correct Answer
                          </span>
                        )}
                        {isPick && !isCorrect && (
                          <span className="bg-red-500/10 border border-red-500/25 text-red-600 py-0.5 px-2 rounded-md text-xs font-bold inline-block ml-2">
                            Your Answer
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              {q.explanationVi && (
                <div className="mt-2.5 p-3 bg-surface-alt rounded-lg text-[13px] border border-border text-text-muted leading-relaxed font-medium">
                  <strong className="text-text-primary">Explanation:</strong> {q.explanationVi}
                </div>
              )}
            </Card>
          );
        })}
      </div>
    );
  };

  return (
    <Card shadowSize="sm" className="p-4">
      <div className="flex gap-1 mb-4 border-b border-border pb-2">
        {[
          { key: "wrong", label: `Incorrect (${wrong.length})` },
          { key: "all", label: `All (${questions.length})` },
          { key: "bookmarked", label: `Bookmarked (${bookmarked.length})` },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveKey(tab.key)}
            className={`py-1.5 px-3 rounded-lg text-sm font-bold cursor-pointer border-none transition-colors ${
              activeKey === tab.key
                ? "bg-accent text-[var(--text-on-accent)]"
                : "bg-transparent text-text-muted hover:bg-surface-alt"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {activeKey === "wrong" && renderList(wrong)}
      {activeKey === "all" && renderList(questions)}
      {activeKey === "bookmarked" && renderList(bookmarked)}
    </Card>
  );
}
