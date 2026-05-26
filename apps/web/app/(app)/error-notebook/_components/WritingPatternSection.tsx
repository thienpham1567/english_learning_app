"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Pencil,
  Loader2,
  CheckCircle,
  Zap,
  Trophy,
  ThumbsUp,
  Flame,
  Check,
  X as XIcon,
} from "lucide-react";

import { api } from "@/lib/api-client";
import { ERROR_TAG_LABELS, ERROR_TAG_DESCRIPTIONS, type ErrorTag } from "@/lib/writing/error-tags";

/* ── Types ──────────────────────────────────────────────── */

type ErrorPattern = {
  id: string;
  tag: string;
  count: number;
  lastSeenAt: string;
  quizGeneratedAt: string | null;
};

type QuizItem = {
  questionStem: string;
  options: string[];
  correctAnswer: string;
  explanationEn: string;
  explanationVi: string;
};

type QuizState = "idle" | "generating" | "active" | "done";

/* ── Sub-component: inline quiz player ──────────────────── */

function InlineQuiz({ items, errorLogIds, onDone }: { items: QuizItem[]; errorLogIds: string[]; onDone: (answers: Array<{ errorLogId: string; userAnswer: string; isCorrect: boolean }>) => void }) {
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [results, setResults] = useState<boolean[]>([]);
  const [answers, setAnswers] = useState<Array<{ errorLogId: string; userAnswer: string; isCorrect: boolean }>>([]);

  const item = items[current];
  const isAnswered = selected !== null;
  const isCorrect = selected === item.correctAnswer;
  const isDone = current >= items.length;

  const handleSelect = (opt: string) => {
    if (isAnswered) return;
    setSelected(opt);
    const correct = opt === item.correctAnswer;
    setResults((prev) => [...prev, correct]);
    if (errorLogIds[current]) {
      setAnswers((prev) => [...prev, {
        errorLogId: errorLogIds[current],
        userAnswer: opt,
        isCorrect: correct,
      }]);
    }
  };

  const handleNext = () => {
    setSelected(null);
    setCurrent((c) => c + 1);
  };

  if (isDone) {
    const score = results.filter(Boolean).length;
    const pct = Math.round((score / items.length) * 100);
    return (
      <div className="text-center py-6">
        {/* Custom circular progress */}
        <div className="relative inline-flex items-center justify-center w-20 h-20 mb-3">
          <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
            <circle cx="40" cy="40" r="34" fill="none" stroke="var(--border)" strokeWidth="6" />
            <circle
              cx="40" cy="40" r="34" fill="none"
              stroke={score === items.length ? "var(--success)" : "var(--warning)"}
              strokeWidth="6" strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 34}`}
              strokeDashoffset={`${2 * Math.PI * 34 * (1 - pct / 100)}`}
              className="transition-all duration-700"
            />
          </svg>
          <span className="absolute text-lg font-black text-ink">{score}/{items.length}</span>
        </div>
        <p className="mt-3 text-sm font-semibold">
          {score === items.length ? (
            <><Trophy className="h-4 w-4 text-(--success) inline mr-1.5" />Hoàn hảo!</>
          ) : score >= items.length / 2 ? (
            <><ThumbsUp className="h-4 w-4 text-accent inline mr-1.5" />Tốt!</>
          ) : (
            <><Flame className="h-4 w-4 text-(--warning) inline mr-1.5" />Cần ôn thêm!</>
          )}
        </p>
        <button
          onClick={() => onDone(answers)}
          className="mt-2 px-5 py-2 rounded-lg border-none bg-accent text-(--text-on-accent) text-[13px] font-semibold cursor-pointer"
        >
          Xong
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-between text-[11px] text-text-secondary">
        <span>Câu {current + 1}/{items.length}</span>
        <span>{results.filter(Boolean).length} đúng</span>
      </div>

      <p className="text-sm font-medium m-0 leading-relaxed">{item.questionStem}</p>

      <div className="flex flex-col gap-1.5">
        {item.options.map((opt) => {
          let bg = "var(--surface)";
          let border = "1px solid var(--border)";
          let color = "var(--text)";
          if (isAnswered) {
            if (opt === item.correctAnswer) { bg = "color-mix(in srgb, var(--success) 8%, var(--surface))"; border = "1px solid var(--success)"; color = "var(--success)"; }
            else if (opt === selected) { bg = "color-mix(in srgb, var(--error) 8%, var(--surface))"; border = "1px solid var(--error)"; color = "var(--error)"; }
          }
          return (
            <button
              key={opt}
              onClick={() => handleSelect(opt)}
              disabled={isAnswered}
              className="px-3 py-2 rounded-lg text-left text-[13px] transition-all duration-150"
              style={{
                border, background: bg, color,
                cursor: isAnswered ? "default" : "pointer",
                fontWeight: opt === item.correctAnswer && isAnswered ? 600 : 400,
              }}
            >
              {opt}
            </button>
          );
        })}
      </div>

      {isAnswered && (
        <div
          className="px-3 py-2 rounded-lg text-xs"
          style={{
            background: isCorrect ? "color-mix(in srgb, var(--success) 8%, var(--surface))" : "color-mix(in srgb, var(--error) 8%, var(--surface))",
            border: `1px solid color-mix(in srgb, ${isCorrect ? "var(--success)" : "var(--error)"} 27%, transparent)`,
            color: "var(--text)",
          }}
        >
          <p className="m-0 mb-1 font-semibold">
            {isCorrect ? <><Check className="h-3 w-3 inline mr-1" /> Đúng!</> : <><XIcon className="h-3 w-3 inline mr-1" /> Sai</>}
          </p>
          <p className="m-0 mb-0.5">{item.explanationEn}</p>
          <p className="m-0 text-text-secondary">{item.explanationVi}</p>
        </div>
      )}

      {isAnswered && (
        <button
          onClick={handleNext}
          className="self-end px-5 py-2 rounded-lg border-none bg-accent text-(--text-on-accent) text-[13px] font-semibold cursor-pointer"
        >
          {current + 1 < items.length ? "Câu tiếp →" : "Xem kết quả"}
        </button>
      )}
    </div>
  );
}

/* ── Main component ──────────────────────────────────────── */

export function WritingPatternSection() {
  const [patterns, setPatterns] = useState<ErrorPattern[]>([]);
  const [loading, setLoading] = useState(true);
  const [quizState, setQuizState] = useState<Record<string, QuizState>>({});
  const [quizItems, setQuizItems] = useState<Record<string, QuizItem[]>>({});
  const [quizIds, setQuizIds] = useState<Record<string, string[]>>({});

  const fetchPatterns = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get<{ patterns: ErrorPattern[] }>("/writing/pattern-quiz");
      setPatterns(data?.patterns ?? []);
    } catch {
      // silent — section just won't show
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPatterns();
  }, [fetchPatterns]);

  const generateQuiz = useCallback(async (tag: string) => {
    setQuizState((prev) => ({ ...prev, [tag]: "generating" }));
    try {
      const data = await api.post<{ items: QuizItem[]; insertedIds: string[] }>("/writing/pattern-quiz", {
        tag,
        exampleSentences: [], // AC6: no essay content sent
      });
      setQuizItems((prev) => ({ ...prev, [tag]: data.items }));
      setQuizIds((prev) => ({ ...prev, [tag]: data.insertedIds ?? [] }));
      setQuizState((prev) => ({ ...prev, [tag]: "active" }));
    } catch (err) {
      console.error(err);
      setQuizState((prev) => ({ ...prev, [tag]: "idle" }));
    }
  }, []);

  const finishQuiz = useCallback(async (tag: string, answers: Array<{ errorLogId: string; userAnswer: string; isCorrect: boolean }>) => {
    setQuizState((prev) => ({ ...prev, [tag]: "done" }));
    // Submit answers to update error_log records (AC5)
    if (answers.length > 0) {
      try {
        await api.patch("/writing/pattern-quiz", { answers });
      } catch (err) {
        console.error("Failed to submit quiz answers:", err);
      }
    }
  }, []);

  if (loading) return null; // Don't show while loading
  if (patterns.length === 0) return null; // Don't show if no patterns

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <Pencil className="h-4 w-4 text-accent" />
        <h2 className="m-0 text-[15px] font-bold">Lỗi viết lặp lại</h2>
        <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-600 border border-amber-500/25">
          {patterns.length} mẫu
        </span>
      </div>
      <p className="text-xs text-text-secondary m-0 mb-3">
        Các lỗi ngữ pháp bạn mắc ≥3 lần trong 14 ngày qua — luyện tập để khắc phục.
      </p>

      <div className="flex flex-col gap-2.5">
        {patterns.map((p) => {
          const label = ERROR_TAG_LABELS[p.tag as ErrorTag] ?? p.tag;
          const desc = ERROR_TAG_DESCRIPTIONS[p.tag as ErrorTag] ?? "";
          const state = quizState[p.tag] ?? "idle";

          return (
            <div
              key={p.id}
              className="rounded-xl border-2 border-border bg-(--card-bg) overflow-hidden"
            >
              {/* Pattern header */}
              <div className="px-4 py-3 flex items-center gap-2.5">
                <div className="flex-1">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-red-500/15 text-red-500 border border-red-500/25">
                      {p.count}×
                    </span>
                    <span className="text-[13px] font-semibold">{label}</span>
                    {p.quizGeneratedAt && (
                      <span className="relative group">
                        <CheckCircle className="h-3 w-3 text-(--success) cursor-help" />
                        <span className="hidden group-hover:block absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900 text-white text-[10px] font-medium whitespace-nowrap z-50 shadow-lg">
                          Quiz đã tạo: {new Date(p.quizGeneratedAt).toLocaleDateString("vi-VN")}
                        </span>
                      </span>
                    )}
                  </div>
                  <p className="m-0 text-[11px] text-text-secondary">{desc}</p>
                </div>

                {state === "idle" && (
                  <button
                    onClick={() => generateQuiz(p.tag)}
                    className="flex items-center gap-1 px-3.5 py-1.5 rounded-lg border-none bg-(--accent-muted) text-accent text-xs font-semibold cursor-pointer shrink-0 hover:bg-accent/15 transition-colors"
                  >
                    <Zap className="h-3 w-3" /> Luyện tập
                  </button>
                )}

                {state === "generating" && (
                  <span className="text-xs text-text-secondary flex items-center gap-1.5">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> Đang tạo...
                  </span>
                )}

                {state === "done" && (
                  <button
                    onClick={() => generateQuiz(p.tag)}
                    className="px-3.5 py-1.5 rounded-lg border-2 border-border bg-transparent text-text-secondary text-xs cursor-pointer shrink-0 hover:bg-surface-alt transition-colors"
                  >
                    Làm lại
                  </button>
                )}
              </div>

              {/* Inline quiz */}
              {state === "active" && quizItems[p.tag] && (
                <div className="px-4 pb-4 pt-3.5 border-t-2 border-border">
                  <InlineQuiz items={quizItems[p.tag]} errorLogIds={quizIds[p.tag] ?? []} onDone={(answers) => finishQuiz(p.tag, answers)} />
                </div>
              )}

              {state === "done" && (
                <div className="px-4 py-2 border-t-2 border-border bg-[color-mix(in_srgb,var(--success)_8%,var(--surface))] text-xs text-(--success) font-medium">
                  <CheckCircle className="h-3 w-3 inline mr-1.5" /> Quiz đã hoàn thành — câu hỏi đã được lưu vào sổ lỗi sai để ôn tập sau.
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
