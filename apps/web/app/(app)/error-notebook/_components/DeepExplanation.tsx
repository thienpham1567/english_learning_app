"use client";
import {
  BookOpen,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  FlaskConical,
  Lightbulb,
  Loader2,
  XCircle,
  Zap,
} from "lucide-react";
import { useCallback, useState } from "react";
import { api } from "@/lib/api-client";

type DeepExplanationData = {
  whyWrong: string;
  whyCorrect: string;
  grammarRule: string;
  examples: string[];
  tip: string;
};

type Props = {
  errorId: string;
  cached: DeepExplanationData | null;
  /** Fallback plain explanation */
  fallbackEn?: string | null;
  fallbackVi?: string | null;
};

export function DeepExplanation({ errorId, cached, fallbackEn, fallbackVi }: Props) {
  const [data, setData] = useState<DeepExplanationData | null>(cached);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  const generate = useCallback(async () => {
    if (data) {
      setExpanded(true);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await api.post<{ explanation: DeepExplanationData }>(
        `/errors/${errorId}/explain`,
        {},
      );
      setData(result.explanation);
      setExpanded(true);
    } catch {
      setError("Không thể tạo giải thích. Thử lại sau.");
    } finally {
      setLoading(false);
    }
  }, [data, errorId]);

  // If data already loaded, just toggle
  const toggle = useCallback(() => {
    if (data) {
      setExpanded((prev) => !prev);
    } else {
      generate();
    }
  }, [data, generate]);

  return (
    <div className="mt-2.5">
      {/* Toggle button */}
      <button
        type="button"
        onClick={toggle}
        disabled={loading}
        className={`flex items-center gap-2 w-full px-3.5 py-2.5 rounded-[10px] border border-accent/20 text-[13px] font-semibold text-accent transition-all duration-200 text-left ${
          loading ? "cursor-wait" : "cursor-pointer"
        } ${expanded ? "bg-accent/6" : "bg-(--card-bg) hover:bg-accent/4"}`}
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lightbulb className="h-4 w-4" />}
        <span className="flex-1">
          {loading
            ? "Đang phân tích lỗi sai..."
            : data
              ? expanded
                ? "Ẩn giải thích chi tiết"
                : "Xem giải thích chi tiết"
              : "Phân tích lỗi sai với AI"}
        </span>
        {data && (
          <span className="text-[11px] text-text-muted">
            {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </span>
        )}
      </button>

      {/* Error state */}
      {error && (
        <div className="mt-2 px-3 py-2 rounded-lg bg-[color-mix(in_srgb,var(--error)_6%,var(--surface))] text-(--error) text-xs">
          {error}
          <button
            type="button"
            onClick={generate}
            className="ml-2 border-none bg-transparent text-accent cursor-pointer text-xs font-semibold underline"
          >
            Thử lại
          </button>
        </div>
      )}

      {/* Expanded content */}
      {expanded && data && (
        <div className="anim-fade-up mt-2.5 flex flex-col gap-2.5">
          {/* Why Wrong */}
          <div className="px-3.5 py-3 rounded-[10px] bg-[color-mix(in_srgb,var(--error)_4%,var(--surface))] border-l-3 border-l-(--error)">
            <div className="flex items-center gap-1.5 mb-1.5 text-xs font-bold text-(--error) uppercase tracking-wide">
              <XCircle className="h-3 w-3" /> Tại sao đáp án bạn chọn sai
            </div>
            <p className="m-0 text-[13px] leading-relaxed text-(--text)">{data.whyWrong}</p>
          </div>

          {/* Why Correct */}
          <div className="px-3.5 py-3 rounded-[10px] bg-[color-mix(in_srgb,var(--success)_4%,var(--surface))] border-l-3 border-l-(--success)">
            <div className="flex items-center gap-1.5 mb-1.5 text-xs font-bold text-(--success) uppercase tracking-wide">
              <CheckCircle className="h-3 w-3" /> Tại sao đáp án đúng là đúng
            </div>
            <p className="m-0 text-[13px] leading-relaxed text-(--text)">{data.whyCorrect}</p>
          </div>

          {/* Grammar Rule — Formula Card */}
          <div className="px-3.5 py-3 rounded-[10px] bg-gradient-to-br from-accent/8 to-[color-mix(in_srgb,var(--secondary)_6%,var(--surface))] border border-accent/15">
            <div className="flex items-center gap-1.5 mb-2 text-xs font-bold text-accent uppercase tracking-wide">
              <BookOpen className="h-3 w-3" /> Quy tắc ngữ pháp
            </div>
            <div className="px-3.5 py-2.5 rounded-lg bg-accent/6 font-mono text-[13px] font-semibold leading-relaxed text-ink tracking-wide">
              {data.grammarRule}
            </div>
          </div>

          {/* Examples */}
          <div className="px-3.5 py-3 rounded-[10px] bg-(--card-bg) border-2 border-border">
            <div className="flex items-center gap-1.5 mb-2 text-xs font-bold text-(--secondary) uppercase tracking-wide">
              <FlaskConical className="h-3 w-3" /> Ví dụ tương tự
            </div>
            <div className="flex flex-col gap-1.5">
              {data.examples.map((ex, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2 text-[13px] leading-relaxed text-(--text)"
                >
                  <span className="shrink-0 w-5 h-5 rounded-full bg-[color-mix(in_srgb,var(--secondary)_12%,var(--surface))] grid place-items-center text-[10px] font-bold text-(--secondary) mt-0.5">
                    {i + 1}
                  </span>
                  <span>{ex}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Tip */}
          <div className="px-3.5 py-2.5 rounded-[10px] bg-gradient-to-br from-[color-mix(in_srgb,var(--warning)_8%,var(--surface))] to-[color-mix(in_srgb,var(--xp)_6%,var(--surface))] border border-[color-mix(in_srgb,var(--warning)_15%,var(--border))] flex items-start gap-2.5">
            <Zap className="h-4 w-4 text-(--warning) mt-0.5 shrink-0" />
            <div>
              <div className="text-[11px] font-bold text-(--warning) uppercase tracking-wide mb-1">
                Mẹo ghi nhớ
              </div>
              <p className="m-0 text-[13px] leading-relaxed text-(--text)">{data.tip}</p>
            </div>
          </div>
        </div>
      )}

      {/* Fallback: show old explanation if no deep data and not expanded */}
      {!data && !expanded && !loading && (fallbackEn || fallbackVi) && (
        <div className="mt-2 px-3.5 py-2.5 rounded-lg bg-(--card-bg) border-2 border-border text-[13px] leading-relaxed">
          {fallbackVi && <p className="m-0 text-text-secondary italic">{fallbackVi}</p>}
        </div>
      )}
    </div>
  );
}
