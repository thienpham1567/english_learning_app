"use client";

import { useState, useCallback, useMemo } from "react";

import { api } from "@/lib/api-client";
import type { GrammarCheckResponse, GrammarError } from "@/lib/writing-tools/schema";
import {
  AlertTriangle,
  Bug,
  Check,
  ChevronDown,
  ChevronRight,
  CircleCheckBig,
  Copy,
  Lightbulb,
  Loader2,
  Zap,
} from "lucide-react";

const MAX_WORDS = 500;

const TYPE_META: Record<string, { label: string; labelVi: string; color: string; icon: React.ReactNode }> = {
  grammar: { label: "Grammar", labelVi: "Ngữ pháp", color: "var(--error)", icon: <Bug /> },
  spelling: { label: "Spelling", labelVi: "Chính tả", color: "var(--warning, #e8a838)", icon: <AlertTriangle /> },
  style: { label: "Style", labelVi: "Phong cách", color: "var(--info, #5b8def)", icon: <Lightbulb /> },
};

/* ── Example prompts for instant demo ──────────────────── */

const EXAMPLE_PROMPTS = [
  { label: "Subject-verb agreement", text: "She don't know the answer because she didn't studied for the exam.", color: "var(--error)" },
  { label: "Uncountable nouns", text: "The informations is very important for us. We need more evidences.", color: "var(--warning, #e8a838)" },
  { label: "Tense errors", text: "I have been to Japan since 3 years. Yesterday I go to the store and buyed some milk.", color: "var(--error)" },
  { label: "Article & preposition", text: "She is interested on learning the English. He arrived to the office in Monday morning.", color: "var(--info, #5b8def)" },
];

/* ── Score gauge component ─────────────────────────────── */

function ScoreGauge({ score, label }: { score: number; label: string }) {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const dashoffset = circumference - (score / 100) * circumference;

  const color =
    score >= 90 ? "var(--success)" :
    score >= 70 ? "var(--accent)" :
    score >= 50 ? "var(--warning, #e8a838)" :
    "var(--error)";

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
      <svg width={96} height={96} viewBox="0 0 96 96">
        {/* Background ring */}
        <circle
          cx="48" cy="48" r={radius}
          fill="none" stroke="var(--surface)" strokeWidth="6"
        />
        {/* Score arc */}
        <circle
          cx="48" cy="48" r={radius}
          fill="none" stroke={color} strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashoffset}
          transform="rotate(-90 48 48)"
          style={{ transition: "stroke-dashoffset 0.6s ease, stroke 0.3s" }}
        />
        {/* Score number */}
        <text
          x="48" y="44"
          textAnchor="middle" dominantBaseline="central"
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 26,
            fontWeight: 700,
            fill: color,
          }}
        >
          {score}
        </text>
        <text
          x="48" y="62"
          textAnchor="middle" dominantBaseline="central"
          style={{ fontSize: 9, fill: "var(--text-muted)", fontWeight: 500 }}
        >
          / 100
        </text>
      </svg>
      <span style={{ fontSize: 12, fontWeight: 600, color }}>{label}</span>
    </div>
  );
}

/* ── Copy button ───────────────────────────────────────── */

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      style={{
        border: "none",
        background: "transparent",
        cursor: "pointer",
        color: copied ? "var(--success)" : "var(--text-secondary)",
        fontSize: 13,
        padding: "4px 8px",
        borderRadius: 6,
      }}
      title="Sao chép"
    >
      {copied ? <Check /> : <Copy />}
    </button>
  );
}

/* ── Error card ────────────────────────────────────────── */

function ErrorCard({
  error,
  onApply,
}: {
  error: GrammarError;
  onApply: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const meta = TYPE_META[error.type] ?? TYPE_META.grammar;

  return (
    <div
      style={{
        borderRadius: 12,
        border: "1px solid var(--border)",
        background: "var(--card-bg)",
        overflow: "hidden",
        transition: "box-shadow 0.2s",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 14px",
          borderLeft: `4px solid ${meta.color}`,
          cursor: "pointer",
        }}
        onClick={() => setExpanded((p) => !p)}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ color: meta.color, fontSize: 13 }}>{meta.icon}</span>
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: meta.color,
              padding: "2px 8px",
              borderRadius: 10,
              background: `color-mix(in srgb, ${meta.color} 10%, transparent)`,
            }}
          >
            {meta.labelVi}
          </span>
          <span style={{ fontSize: 13, color: "var(--text-muted)", textDecoration: "line-through" }}>
            {error.original}
          </span>
          <span className="text-[var(--text-primary)]" style={{ fontSize: 13 }}>→</span>
          <span style={{ fontSize: 13, color: "var(--success)", fontWeight: 500 }}>
            {error.correction}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span className="text-[var(--text-muted)]" style={{ fontSize: 10 }}>
            {expanded ? <ChevronDown /> : <ChevronRight />}
          </span>
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div
          style={{
            padding: "0 14px 12px 22px",
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          {/* Rule tag */}
          <span
            style={{
              fontSize: 11,
              color: "var(--text-secondary)",
              fontStyle: "italic",
            }}
          >
            Rule: {error.rule}
          </span>

          {/* Vietnamese explanation */}
          <div
            style={{
              padding: "8px 12px",
              borderRadius: 8,
              background: "var(--surface)",
              fontSize: 13,
              lineHeight: 1.6,
            }}
          >
            <span style={{ fontWeight: 600, color: "var(--text-secondary)", fontSize: 11 }}>
              🇻🇳 Giải thích:
            </span>
            <p style={{ margin: "4px 0 0", color: "var(--text-primary)" }}>
              {error.explanationVi}
            </p>
          </div>

          {/* English explanation */}
          <div
            style={{
              padding: "8px 12px",
              borderRadius: 8,
              background: "var(--surface)",
              fontSize: 13,
              lineHeight: 1.6,
            }}
          >
            <span style={{ fontWeight: 600, color: "var(--text-secondary)", fontSize: 11 }}>
              🇬🇧 Explanation:
            </span>
            <p style={{ margin: "4px 0 0", color: "var(--text-primary)" }}>
              {error.explanationEn}
            </p>
          </div>

          {/* Apply button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onApply();
            }}
            style={{
              alignSelf: "flex-start",
              padding: "6px 14px",
              borderRadius: 8,
              border: "none",
              background: "var(--accent)",
              color: "var(--text-on-accent)",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <CircleCheckBig /> Áp dụng sửa lỗi
          </button>
        </div>
      )}
    </div>
  );
}

/* ── Main GrammarChecker component ─────────────────────── */

export function GrammarChecker() {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GrammarCheckResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
  const overLimit = wordCount > MAX_WORDS;

  const check = useCallback(async () => {
    if (!text.trim() || overLimit) return;
    setError(null);
    setLoading(true);
    setResult(null);

    try {
      const data = await api.post<GrammarCheckResponse>("/writing-tools/grammar-check", {
        text: text.trim(),
      });
      setResult(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Có lỗi xảy ra";
      setError(msg.includes("Rate limit") || msg.includes("429")
        ? "Bạn đã gửi quá nhiều yêu cầu. Vui lòng đợi 1 phút."
        : msg);
    } finally {
      setLoading(false);
    }
  }, [text, overLimit]);

  const applyFix = useCallback(
    (err: GrammarError) => {
      const before = text.slice(0, err.offset);
      const after = text.slice(err.offset + err.length);
      const newText = before + err.correction + after;
      setText(newText);

      // Recalculate remaining errors with adjusted offsets
      if (result) {
        const lengthDiff = err.correction.length - err.original.length;
        const updatedErrors = result.errors
          .filter((e) => e !== err)
          .map((e) => ({
            ...e,
            offset: e.offset > err.offset ? e.offset + lengthDiff : e.offset,
          }));
        setResult({
          ...result,
          errors: updatedErrors,
          stats: {
            grammar: updatedErrors.filter((e) => e.type === "grammar").length,
            spelling: updatedErrors.filter((e) => e.type === "spelling").length,
            style: updatedErrors.filter((e) => e.type === "style").length,
          },
        });
      }
    },
    [text, result],
  );

  const applyAll = useCallback(() => {
    if (!result) return;
    setText(result.correctedText);
    setResult({ ...result, errors: [], stats: { grammar: 0, spelling: 0, style: 0 } });
  }, [result]);

  const totalErrors = result ? result.errors.length : 0;

  // Writing score — computed from error density
  const writingScore = useMemo(() => {
    if (!result || wordCount === 0) return null;
    const raw = Math.max(0, 100 - (totalErrors / wordCount) * 200);
    return Math.round(Math.min(100, raw));
  }, [result, totalErrors, wordCount]);

  const scoreLabel = useMemo(() => {
    if (writingScore === null) return "";
    if (writingScore >= 90) return "Tuyệt vời!";
    if (writingScore >= 70) return "Khá tốt";
    if (writingScore >= 50) return "Cần cải thiện";
    return "Nhiều lỗi";
  }, [writingScore]);

  // Keyboard handler — Ctrl/Cmd + Enter
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        check();
      }
    },
    [check],
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Input area */}
      <div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 8,
          }}
        >
          <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text-secondary)" }}>
            Nhập hoặc dán văn bản cần kiểm tra
          </span>
          <span
            style={{
              fontSize: 12,
              color: overLimit ? "var(--error)" : "var(--text-muted)",
              fontWeight: overLimit ? 600 : 400,
            }}
          >
            {wordCount}/{MAX_WORDS} từ
          </span>
        </div>

        <textarea
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            setResult(null);
            setError(null);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Type or paste your English text here..."
          className={`app-textarea ${overLimit ? "border-error" : ""}`}
          style={{
            width: "100%",
            minHeight: 180,
            padding: 16,
            fontSize: 15,
            lineHeight: 1.7,
            resize: "vertical",
            fontFamily: "inherit",
          }}
        />
      </div>

      {/* Example prompts — only show when textarea is empty */}
      {!text.trim() && !result && (
        <div>
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.12em",
              color: "var(--text-muted)",
              display: "flex",
              alignItems: "center",
              gap: 6,
              marginBottom: 8,
            }}
          >
            <Zap size={10} />
            Thử ngay
          </span>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
              gap: 8,
            }}
          >
            {EXAMPLE_PROMPTS.map((ex, i) => (
              <button
                key={i}
                onClick={() => setText(ex.text)}
                style={{
                  textAlign: "left",
                  padding: "10px 14px",
                  borderRadius: 10,
                  border: "1px solid var(--border)",
                  borderLeft: `3px solid ${ex.color}`,
                  background: "var(--card-bg)",
                  cursor: "pointer",
                  transition: "all 0.15s",
                  display: "flex",
                  flexDirection: "column",
                  gap: 4,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "var(--accent)";
                  e.currentTarget.style.transform = "translateY(-1px)";
                  e.currentTarget.style.boxShadow = "0 3px 12px rgba(0,0,0,0.06)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "var(--border)";
                  e.currentTarget.style.borderLeftColor = ex.color;
                  e.currentTarget.style.transform = "none";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <span style={{ fontSize: 11, fontWeight: 600, color: ex.color }}>
                  {ex.label}
                </span>
                <span
                  style={{
                    fontSize: 13,
                    color: "var(--text-secondary)",
                    lineHeight: 1.5,
                    fontStyle: "italic",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                  }}
                >
                  {ex.text}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Action bar */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <button
          onClick={check}
          disabled={!text.trim() || overLimit || loading}
          style={{
            padding: "10px 24px",
            borderRadius: 10,
            border: "none",
            background:
              !text.trim() || overLimit || loading ? "var(--border)" : "var(--accent)",
            color: "var(--text-on-accent)",
            fontSize: 14,
            fontWeight: 600,
            cursor: !text.trim() || overLimit || loading ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            gap: 6,
            transition: "background 0.2s",
          }}
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin" /> Đang kiểm tra...
            </>
          ) : (
            <>
              <CircleCheckBig /> Kiểm tra ngữ pháp
            </>
          )}
        </button>

        {result && totalErrors > 0 && (
          <button
            onClick={applyAll}
            style={{
              padding: "10px 20px",
              borderRadius: 10,
              border: "1px solid var(--success)",
              background: "transparent",
              color: "var(--success)",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <CircleCheckBig /> Sửa tất cả ({totalErrors})
          </button>
        )}

        {/* Keyboard shortcut hint */}
        {text.trim() && !result && (
          <span style={{ fontSize: 11, color: "var(--text-muted)", fontStyle: "italic" }}>
            ⌘/Ctrl + Enter
          </span>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div
          style={{
            padding: "10px 16px",
            borderRadius: 10,
            background: "var(--error-bg)",
            color: "var(--error)",
            fontSize: 13,
          }}
        >
          {error}
        </div>
      )}

      {/* Results */}
      {result && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {/* Score + Stats dashboard */}
          <div
            className="anim-fade-up"
            style={{
              display: "flex",
              gap: 1,
              background: "var(--border)",
              borderRadius: 16,
              overflow: "hidden",
              border: totalErrors === 0 ? "1px solid var(--success)" : "1px solid var(--border)",
              boxShadow: "var(--shadow-sm)",
            }}
          >
            {/* Writing score gauge */}
            {writingScore !== null && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "16px 20px",
                  background: totalErrors === 0
                    ? "color-mix(in srgb, var(--success) 6%, var(--surface))"
                    : "var(--surface)",
                  minWidth: 130,
                }}
              >
                <ScoreGauge score={writingScore} label={scoreLabel} />
              </div>
            )}

            {/* Stats cells */}
            {totalErrors === 0 ? (
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "18px 22px",
                  background: "color-mix(in srgb, var(--success) 6%, var(--surface))",
                }}
              >
                <CircleCheckBig style={{ color: "var(--success)", fontSize: 20 }} />
                <div>
                  <div
                    style={{
                      fontSize: 16,
                      fontWeight: 700,
                      color: "var(--success)",
                      fontFamily: "var(--font-display)",
                    }}
                  >
                    Tuyệt vời!
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
                    Không phát hiện lỗi nào
                  </div>
                </div>
              </div>
            ) : (
              <>
                {[
                  { label: "Ngữ pháp", value: result.stats.grammar, color: "var(--error)", icon: "✗" },
                  { label: "Chính tả", value: result.stats.spelling, color: "var(--warning, #e8a838)", icon: "!" },
                  { label: "Phong cách", value: result.stats.style, color: "var(--info, #5b8def)", icon: "~" },
                ].map((s) => (
                  <div
                    key={s.label}
                    style={{
                      flex: 1,
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "18px 18px",
                      background: "var(--surface)",
                    }}
                  >
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 900,
                        color: s.value > 0 ? s.color : "var(--text-muted)",
                        opacity: 0.6,
                        fontFamily: "monospace",
                        lineHeight: 1,
                      }}
                    >
                      {s.icon}
                    </span>
                    <div>
                      <div
                        style={{
                          fontSize: 24,
                          fontWeight: 800,
                          color: s.value > 0 ? s.color : "var(--text-muted)",
                          lineHeight: 1,
                          fontFamily: "var(--font-display)",
                        }}
                      >
                        {s.value}
                      </div>
                      <div
                        style={{
                          fontSize: 10,
                          color: "var(--text-muted)",
                          fontWeight: 500,
                          marginTop: 2,
                          textTransform: "uppercase",
                          letterSpacing: "0.1em",
                        }}
                      >
                        {s.label}
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>

          {/* Error cards */}
          {result.errors.map((err, i) => (
            <ErrorCard key={`${err.offset}-${i}`} error={err} onApply={() => applyFix(err)} />
          ))}

          {/* Corrected text */}
          {totalErrors > 0 && (
            <div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 6,
                }}
              >
                <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)" }}>
                  Văn bản đã sửa
                </span>
                <CopyButton text={result.correctedText} />
              </div>
              <div
                style={{
                  padding: 16,
                  borderRadius: 12,
                  background: "color-mix(in srgb, var(--success) 5%, var(--card-bg))",
                  border: "1px solid color-mix(in srgb, var(--success) 20%, var(--border))",
                  fontSize: 14,
                  lineHeight: 1.7,
                  color: "var(--text-primary)",
                  whiteSpace: "pre-wrap",
                }}
              >
                {result.correctedText}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
