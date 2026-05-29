"use client";
import { CheckCircle, Loader2, XCircle, Zap } from "lucide-react";
import { useCallback, useState } from "react";
import { api } from "@/lib/api-client";

type PracticeData = {
  questionStem: string;
  options: string[];
  correctIndex: number;
  explanation: string;
};

type Props = {
  errorId: string;
  onResolved?: () => void;
};

export function InlinePractice({ errorId, onResolved }: Props) {
  const [data, setData] = useState<PracticeData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const generate = useCallback(async () => {
    setLoading(true);
    setError(null);
    setData(null);
    setSelected(null);
    setSubmitted(false);

    try {
      const res = await api.post<{ practice: PracticeData }>(`/errors/${errorId}/practice`, {});
      setData(res.practice);
    } catch {
      setError("Could not generate practice. Try again later.");
    } finally {
      setLoading(false);
    }
  }, [errorId]);

  const handleSubmit = useCallback(() => {
    if (selected === null || !data) return;
    setSubmitted(true);
    if (selected === data.correctIndex) {
      onResolved?.();
    }
  }, [selected, data, onResolved]);

  // Not started yet — show trigger button
  if (!data && !loading && !error) {
    return (
      <button
        type="button"
        onClick={generate}
        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border-2 border-accent/25 bg-card-bg cursor-pointer text-xs font-semibold text-accent-active transition-all duration-200 hover:bg-accent/8 hover:border-accent"
      >
        <Zap className="h-3.5 w-3.5" /> Practice Again
      </button>
    );
  }

  // Loading
  if (loading) {
    return (
      <div className="py-4 text-center">
        <Loader2 className="h-4.5 w-4.5 text-accent animate-inline" />
        <span className="ml-2 text-xs text-text-muted">Generating practice...</span>
      </div>
    );
  }

  // Error
  if (error) {
    return (
      <div className="text-xs text-error py-2">
        {error}{" "}
        <button
          type="button"
          onClick={generate}
          className="border-none bg-transparent text-accent-active cursor-pointer text-xs font-semibold underline"
        >
          Try again
        </button>
      </div>
    );
  }

  if (!data) return null;

  const isCorrect = submitted && selected === data.correctIndex;

  return (
    <div
      className="anim-fade-up mt-2.5 p-3.5 px-4 rounded-xl transition-all duration-200"
      style={{
        border: `1.5px solid ${submitted ? (isCorrect ? "var(--success)" : "var(--error)") : "color-mix(in srgb, var(--accent) 20%, var(--border))"}`,
        background: submitted
          ? isCorrect
            ? "color-mix(in srgb, var(--success) 4%, var(--surface))"
            : "color-mix(in srgb, var(--error) 4%, var(--surface))"
          : "var(--card-bg)",
      }}
    >
      {/* Question */}
      <div className="flex items-center gap-1.5 mb-2.5">
        <Zap className="h-3.5 w-3.5 text-accent" />
        <span className="text-[11px] font-bold uppercase tracking-wide text-accent-active">
          Practice Again
        </span>
      </div>
      <p className="text-sm font-medium m-0 mb-3 leading-snug text-ink">{data.questionStem}</p>

      {/* Options */}
      <div className="flex flex-col gap-1.5">
        {data.options.map((opt, i) => {
          let borderColor = "var(--border)";
          let bg = "transparent";
          let textColor = "var(--text)";

          if (submitted) {
            if (i === data.correctIndex) {
              borderColor = "var(--success)";
              bg = "color-mix(in srgb, var(--success) 8%, transparent)";
              textColor = "var(--success)";
            } else if (i === selected && i !== data.correctIndex) {
              borderColor = "var(--error)";
              bg = "color-mix(in srgb, var(--error) 8%, transparent)";
              textColor = "var(--error)";
            }
          } else if (selected === i) {
            borderColor = "var(--accent)";
            bg = "var(--accent-muted)";
            textColor = "var(--accent-active)";
          }

          return (
            <button
              key={i}
              onClick={() => !submitted && setSelected(i)}
              disabled={submitted}
              className="px-3 py-2.5 rounded-lg text-left text-[13px] transition-all duration-150"
              style={{
                border: `1.5px solid ${borderColor}`,
                background: bg,
                color: textColor,
                cursor: submitted ? "default" : "pointer",
                fontWeight: selected === i || (submitted && i === data.correctIndex) ? 600 : 400,
              }}
            >
              {String.fromCharCode(65 + i)}. {opt}
            </button>
          );
        })}
      </div>

      {/* Submit / Result */}
      {!submitted ? (
        <button
          onClick={handleSubmit}
          disabled={selected === null}
          className={`w-full mt-2.5 py-2.5 rounded-lg border-none text-[13px] font-semibold transition-all ${
            selected !== null
              ? "bg-accent text-text-on-accent cursor-pointer"
              : "bg-border text-text-muted cursor-not-allowed"
          }`}
        >
          Check
        </button>
      ) : (
        <div className="mt-2.5 flex flex-col gap-2">
          <div
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-[13px] font-semibold ${
              isCorrect
                ? "bg-[color-mix(in_srgb,var(--success)_8%,transparent)] text-success"
                : "bg-[color-mix(in_srgb,var(--error)_8%,transparent)] text-error"
            }`}
          >
            {isCorrect ? (
              <CheckCircle className="h-3.5 w-3.5" />
            ) : (
              <XCircle className="h-3.5 w-3.5" />
            )}
            {isCorrect ? "Correct! 🎉" : "Incorrect!"}
          </div>
          <p className="m-0 text-xs leading-relaxed text-text-secondary italic">
            {data.explanation}
          </p>
          <button
            onClick={generate}
            className="self-start px-3.5 py-1.5 rounded-lg border-2 border-border bg-card-bg cursor-pointer text-xs font-semibold text-accent-active hover:bg-accent/5"
          >
            Try another question →
          </button>
        </div>
      )}
    </div>
  );
}
