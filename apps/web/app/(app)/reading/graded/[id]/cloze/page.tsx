"use client";

import {
  ArrowLeft,
  CheckCircle,
  Flame,
  Loader2,
  Pencil,
  RefreshCw,
  Save,
  Trophy,
  XCircle,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api-client";

type ClozeItem = {
  blankIndex: number;
  before: string;
  blank: string;
  after: string;
  answer: string;
};

export default function ClozeTestPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [items, setItems] = useState<ClozeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [results, setResults] = useState<Record<number, boolean>>({});
  const [savingFlashcards, setSavingFlashcards] = useState(false);
  const inputRefs = useRef<Record<number, HTMLInputElement | null>>({});

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api
      .post<{ items: ClozeItem[] }>("/reading/cloze", { passageId: id, mode: "vocab-recall" })
      .then((data) => setItems(data.items ?? []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [id]);

  const handleChange = useCallback((idx: number, value: string) => {
    setAnswers((prev) => ({ ...prev, [idx]: value }));
  }, []);

  const handleSubmit = useCallback(() => {
    const res: Record<number, boolean> = {};
    for (const item of items) {
      const userAns = (answers[item.blankIndex] || "").trim().toLowerCase();
      res[item.blankIndex] = userAns === item.answer;
    }
    setResults(res);
    setSubmitted(true);
  }, [items, answers]);

  const saveMissedToFlashcards = useCallback(async () => {
    const missed = items.filter((item) => !results[item.blankIndex]);
    if (missed.length === 0) return;
    setSavingFlashcards(true);
    let saved = 0;
    for (const item of missed) {
      try {
        await api.post("/vocabulary/save", { query: item.answer });
        saved++;
      } catch {
        /* ok */
      }
    }
    setSavingFlashcards(false);
    toast.success(`Saved ${saved} words to notebook!`);
  }, [items, results]);

  const handleRetry = useCallback(() => {
    setAnswers({});
    setResults({});
    setSubmitted(false);
  }, []);

  const correctCount = Object.values(results).filter(Boolean).length;
  const totalCount = items.length;
  const score = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center p-15">
        <Loader2 className="animate-spin text-accent" size={32} />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-4 p-15">
        <Pencil size={48} className="text-text-muted" />
        <span className="text-text-secondary">Unable to generate quiz for this passage</span>
        <button
          type="button"
          onClick={() => router.push(`/reading/graded/${id}`)}
          className="text-accent font-bold cursor-pointer bg-transparent border-none flex items-center gap-1.5"
        >
          <ArrowLeft size={14} /> Back to Passage
        </button>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="w-full max-w-[720px] mx-auto flex flex-col gap-5">
        {/* Back */}
        <button
          type="button"
          onClick={() => router.push(`/reading/graded/${id}`)}
          className="text-text-muted text-[13px] self-start rounded-xl bg-transparent border-none cursor-pointer flex items-center gap-1.5"
        >
          <ArrowLeft size={12} /> Back to Passage
        </button>

        {/* Header card */}
        <div
          className="border-none rounded-[20px] py-5 px-6"
          style={{
            background: "linear-gradient(135deg, var(--accent), var(--secondary))",
          }}
        >
          <div className="flex items-center gap-3.5">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center"
              style={{ background: "rgba(255,255,255,0.2)" }}
            >
              <Pencil size={22} className="text-[var(--text-on-accent)]" />
            </div>
            <div>
              <span
                className="text-[11px] uppercase block"
                style={{ letterSpacing: "0.1em", color: "rgba(255,255,255,0.7)" }}
              >
                CLOZE TEST
              </span>
              <h3 className="m-0 font-display italic" style={{ color: "var(--text-on-accent)" }}>
                Fill in the Blanks
              </h3>
            </div>
            <span
              className="border-none font-bold text-[13px] ml-auto rounded-xl py-1 px-3.5"
              style={{
                background: "rgba(255,255,255,0.2)",
                color: "var(--text-on-accent)",
              }}
            >
              {totalCount} questions
            </span>
          </div>
        </div>

        {/* Score card (after submit) */}
        {submitted && (
          <div
            className="text-center rounded-[20px] py-6 px-6"
            style={{
              border: `2px solid ${score >= 80 ? "var(--success)" : score >= 50 ? "var(--warning)" : "var(--error)"}`,
              background:
                score >= 80
                  ? "color-mix(in srgb, var(--success) 3%, transparent)"
                  : score >= 50
                    ? "color-mix(in srgb, var(--warning) 3%, transparent)"
                    : "color-mix(in srgb, var(--error) 3%, transparent)",
            }}
          >
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3"
              style={{
                background:
                  score >= 80
                    ? "color-mix(in srgb, var(--success) 12%, transparent)"
                    : score >= 50
                      ? "color-mix(in srgb, var(--warning) 12%, transparent)"
                      : "color-mix(in srgb, var(--error) 12%, transparent)",
              }}
            >
              {score >= 80 ? (
                <Trophy size={28} className="text-success" />
              ) : score >= 50 ? (
                <Flame size={28} className="text-warning" />
              ) : (
                <Pencil size={28} className="text-error" />
              )}
            </div>
            <h3
              className="m-0 mb-1 text-3xl font-bold"
              style={{
                color:
                  score >= 80 ? "var(--success)" : score >= 50 ? "var(--warning)" : "var(--error)",
              }}
            >
              {score}%
            </h3>
            <span className="text-text-secondary">
              {correctCount}/{totalCount} correct
            </span>

            <div className="mt-4 flex gap-2 justify-center">
              <button
                type="button"
                onClick={handleRetry}
                className="rounded-xl border border-border bg-surface text-text-secondary font-bold cursor-pointer py-2 px-4 flex items-center gap-1.5 text-sm"
              >
                <RefreshCw size={14} /> Retry
              </button>
              {correctCount < totalCount && (
                <button
                  type="button"
                  onClick={saveMissedToFlashcards}
                  disabled={savingFlashcards}
                  className="rounded-xl border-none bg-accent text-[var(--text-on-accent)] font-bold cursor-pointer py-2 px-4 flex items-center gap-1.5 text-sm"
                >
                  {savingFlashcards ? (
                    <Loader2 className="animate-spin" size={14} />
                  ) : (
                    <Save size={14} />
                  )}
                  Save {totalCount - correctCount} incorrect words
                </button>
              )}
            </div>
          </div>
        )}

        {/* Cloze items */}
        <div className="flex flex-col gap-3">
          {items.map((item, i) => {
            const isCorrect = results[item.blankIndex];
            const userAns = answers[item.blankIndex] || "";
            const showResult = submitted;

            return (
              <div
                key={item.blankIndex}
                className="rounded-2xl py-3.5 px-5 transition-all duration-200"
                style={{
                  border: showResult
                    ? `1.5px solid ${isCorrect ? "var(--success)" : "var(--error)"}`
                    : "1px solid var(--border)",
                  background: showResult
                    ? isCorrect
                      ? "color-mix(in srgb, var(--success) 4%, transparent)"
                      : "color-mix(in srgb, var(--error) 4%, transparent)"
                    : undefined,
                }}
              >
                <div className="flex gap-3">
                  {/* Number badge */}
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 mt-0.5"
                    style={{
                      background: showResult
                        ? isCorrect
                          ? "color-mix(in srgb, var(--success) 8%, transparent)"
                          : "color-mix(in srgb, var(--error) 8%, transparent)"
                        : "var(--surface)",
                      color: showResult
                        ? isCorrect
                          ? "var(--success)"
                          : "var(--error)"
                        : "var(--text-muted)",
                    }}
                  >
                    {showResult ? (
                      isCorrect ? (
                        <CheckCircle size={14} />
                      ) : (
                        <XCircle size={14} />
                      )
                    ) : (
                      i + 1
                    )}
                  </div>

                  <div className="flex-1">
                    <span className="text-sm leading-[1.8]">
                      {item.before}{" "}
                      <input
                        ref={(el) => {
                          inputRefs.current[item.blankIndex] = el;
                        }}
                        type="text"
                        value={userAns}
                        onChange={(e) => handleChange(item.blankIndex, e.target.value)}
                        disabled={submitted}
                        placeholder="______"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            const nextItem = items[i + 1];
                            if (nextItem) inputRefs.current[nextItem.blankIndex]?.focus();
                            else handleSubmit();
                          }
                        }}
                        className="rounded-lg bg-surface text-sm font-semibold text-center outline-none transition-colors duration-200"
                        style={{
                          width: Math.max(90, item.answer.length * 12),
                          padding: "3px 10px",
                          border: showResult
                            ? `2px solid ${isCorrect ? "var(--success)" : "var(--error)"}`
                            : "1.5px dashed var(--accent)",
                          color: showResult
                            ? isCorrect
                              ? "var(--success)"
                              : "var(--error)"
                            : "var(--text)",
                        }}
                      />{" "}
                      {item.after}
                    </span>

                    {showResult && !isCorrect && (
                      <span className="block mt-1.5 text-xs text-success">
                        <CheckCircle className="mr-1 inline" size={12} />
                        Answer: <strong>{item.answer}</strong>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Submit button */}
        {!submitted && (
          <button
            type="button"
            onClick={handleSubmit}
            className="rounded-xl font-bold h-12 text-[15px] self-center px-8 border border-border bg-accent text-[var(--text-on-accent)] cursor-pointer flex items-center gap-2 shadow-sm"
          >
            <CheckCircle size={16} /> Submit Quiz ({totalCount} questions)
          </button>
        )}
      </div>
    </div>
  );
}
