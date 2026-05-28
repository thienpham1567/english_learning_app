"use client";

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
import { motion } from "motion/react";
import { useCallback, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { api } from "@/lib/api-client";
import type { GrammarCheckResponse, GrammarError } from "@/lib/writing-tools/schema";

const MAX_WORDS = 500;

const TYPE_META: Record<
  string,
  { label: string; color: string; icon: React.ReactNode }
> = {
  grammar: { label: "Grammar", color: "var(--error)", icon: <Bug /> },
  spelling: {
    label: "Spelling",
    color: "var(--warning, #e8a838)",
    icon: <AlertTriangle />,
  },
  style: {
    label: "Style",
    color: "var(--info, #5b8def)",
    icon: <Lightbulb />,
  },
};

/* ── Example prompts for instant demo ──────────────────── */

const EXAMPLE_PROMPTS = [
  {
    label: "Subject-verb agreement",
    text: "She don't know the answer because she didn't studied for the exam.",
    color: "var(--error)",
  },
  {
    label: "Uncountable nouns",
    text: "The informations is very important for us. We need more evidences.",
    color: "var(--warning, #e8a838)",
  },
  {
    label: "Tense errors",
    text: "I have been to Japan since 3 years. Yesterday I go to the store and buyed some milk.",
    color: "var(--error)",
  },
  {
    label: "Article & preposition",
    text: "She is interested on learning the English. He arrived to the office in Monday morning.",
    color: "var(--info, #5b8def)",
  },
];

/* ── Score gauge component ─────────────────────────────── */

function ScoreGauge({ score, label }: { score: number; label: string }) {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const dashoffset = circumference - (score / 100) * circumference;

  const color =
    score >= 90
      ? "var(--success)"
      : score >= 70
        ? "var(--accent)"
        : score >= 50
          ? "var(--warning, #e8a838)"
          : "var(--error)";

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={96} height={96} viewBox="0 0 96 96">
        {/* Background ring */}
        <circle cx="48" cy="48" r={radius} fill="none" stroke="var(--border)" strokeWidth="6" />
        {/* Score arc */}
        <circle
          cx="48"
          cy="48"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashoffset}
          transform="rotate(-90 48 48)"
          style={{ transition: "stroke-dashoffset 0.6s ease, stroke 0.3s" }}
        />
        {/* Score number */}
        <text
          x="48"
          y="44"
          textAnchor="middle"
          dominantBaseline="central"
          className="font-display font-bold"
          style={{ fontSize: 26, fill: color }}
        >
          {score}
        </text>
        <text
          x="48"
          y="62"
          textAnchor="middle"
          dominantBaseline="central"
          className="text-[9px] font-medium"
          style={{ fill: "var(--text-muted)" }}
        >
          / 100
        </text>
      </svg>
      <span className="text-xs font-semibold" style={{ color }}>
        {label}
      </span>
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
      title="Copy"
      className={`border-2 border-border bg-surface cursor-pointer text-[12px] py-1 px-2.5 rounded-lg font-bold flex items-center gap-1.5 transition-all duration-100 hover:-translate-y-px hover:shadow-sm active:translate-y-px active:shadow-none ${copied ? "text-success border-success/30" : "text-text-secondary"}`}
    >
      {copied ? <><Check size={13} /> Copied</> : <><Copy size={13} /> Copy</>}
    </button>
  );
}

/* ── Error card ────────────────────────────────────────── */

function ErrorCard({ error, onApply }: { error: GrammarError; onApply: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const meta = TYPE_META[error.type] ?? TYPE_META.grammar;

  return (
    <Card
      shadowSize="sm"
      size="sm"
      className="p-0 overflow-hidden transition-shadow duration-150 hover:shadow"
    >
      {/* Header */}
      <div
        onClick={() => setExpanded((p) => !p)}
        className="flex items-center justify-between cursor-pointer py-2.5 px-3.5 border-l-4"
        style={{ borderLeftColor: meta.color }}
      >
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          <span className="text-[13px]" style={{ color: meta.color }}>
            {meta.icon}
          </span>
          <span
            className="text-[11px] font-bold py-0.5 px-2 rounded-md"
            style={{
              color: meta.color,
              background: `color-mix(in srgb, ${meta.color} 10%, transparent)`,
            }}
          >
            {meta.label}
          </span>
          <span className="text-[13px] text-text-muted line-through">
            {error.original}
          </span>
          <span className="text-text-primary text-[13px]">→</span>
          <span className="text-[13px] text-emerald-500 font-bold">{error.correction}</span>
        </div>
        <span className="text-text-muted text-[10px] shrink-0 ml-2">
          {expanded ? <ChevronDown /> : <ChevronRight />}
        </span>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="flex flex-col gap-2.5 px-3.5 pb-3.5 pt-0 ml-1 border-l-4" style={{ borderLeftColor: meta.color }}>
          {/* Rule tag */}
          <span className="text-[11px] text-text-secondary italic">Rule: {error.rule}</span>

          {/* Explanation */}
          <div className="py-2.5 px-3.5 rounded-lg bg-surface-alt border-2 border-border text-[13px] leading-relaxed">
            <span className="font-bold text-text-secondary text-[11px] uppercase tracking-wide">Explanation:</span>
            <p className="text-text-primary mt-1 mb-0">
              {error.explanationEn}
            </p>
          </div>

          {/* Apply button */}
          <Button
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onApply();
            }}
            className="self-start"
          >
            <CircleCheckBig /> Apply suggestion
          </Button>
        </div>
      )}
    </Card>
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
      const msg = err instanceof Error ? err.message : "An error occurred";
      setError(
        msg.includes("Rate limit") || msg.includes("429")
          ? "Too many requests. Please wait 1 minute."
          : msg,
      );
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
    if (writingScore >= 90) return "Excellent!";
    if (writingScore >= 70) return "Good";
    if (writingScore >= 50) return "Needs Improvement";
    return "Many errors";
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
    <div className="flex flex-col gap-4">
      {/* Input area */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <span className="text-[13px] font-bold text-text-secondary">
            Enter or paste your text to check
          </span>
          <span
            className={`text-xs font-bold ${overLimit ? "text-error" : "text-text-muted"}`}
          >
            {wordCount}/{MAX_WORDS} words
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
          className={`app-textarea ${overLimit ? "border-error" : ""} w-full h-[180px] p-4 text-[15px]`}
          style={{ lineHeight: 1.7, resize: "vertical", fontFamily: "inherit" }}
        />
      </div>

      {/* Example prompts — only show when textarea is empty */}
      {!text.trim() && !result && (
        <div>
          <span className="text-[11px] font-black uppercase text-text-muted flex items-center gap-1.5 mb-2.5 tracking-widest">
            <Zap size={10} />
            Try now
          </span>
          <div className="grid gap-2.5 grid-cols-[repeat(auto-fill,minmax(240px,1fr))]">
            {EXAMPLE_PROMPTS.map((ex, i) => (
              <Card
                key={i}
                interactive
                shadowSize="sm"
                size="sm"
                className="cursor-pointer p-0 overflow-hidden"
                onClick={() => setText(ex.text)}
              >
                <div className="p-3 border-l-[3px] h-full" style={{ borderLeftColor: ex.color }}>
                  <span className="text-[11px] font-bold block mb-1" style={{ color: ex.color }}>
                    {ex.label}
                  </span>
                  <span className="text-[13px] text-text-secondary leading-normal italic line-clamp-2">
                    {ex.text}
                  </span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Action bar */}
      <div className="flex items-center gap-2.5 flex-wrap">
        <Button
          size="lg"
          onClick={check}
          disabled={!text.trim() || overLimit || loading}
          className="px-6"
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin" /> Checking...
            </>
          ) : (
            <>
              <CircleCheckBig /> Check Grammar
            </>
          )}
        </Button>

        {result && totalErrors > 0 && (
          <Button variant="outline" size="lg" onClick={applyAll} className="text-success">
            <CircleCheckBig /> Fix All ({totalErrors})
          </Button>
        )}

        {/* Keyboard shortcut hint */}
        {text.trim() && !result && (
          <span className="text-[11px] text-text-muted italic font-bold">⌘/Ctrl + Enter</span>
        )}
      </div>

      {/* Error message */}
      {error && (
        <Card shadowSize="none" size="sm" className="bg-error-bg border-error/30 text-destructive text-[13px] font-bold">
          {error}
        </Card>
      )}

      {/* Results */}
      {result && (
        <div className="flex flex-col gap-3">
          {/* Score + Stats dashboard */}
          <Card
            shadowSize="sm"
            size="sm"
            className={`p-0 overflow-hidden ${totalErrors === 0 ? "border-success/50" : ""}`}
          >
            <div className="flex" style={{ gap: 2 }}>
              {/* Writing score gauge */}
              {writingScore !== null && (
                <div
                  className="flex items-center justify-center py-4 px-5 w-[130px] shrink-0"
                  style={{
                    background:
                      totalErrors === 0
                        ? "color-mix(in srgb, var(--success) 6%, var(--surface))"
                        : "var(--surface)",
                  }}
                >
                  <ScoreGauge score={writingScore} label={scoreLabel} />
                </div>
              )}

              {/* Stats cells */}
              {totalErrors === 0 ? (
                <div
                  className="flex-1 flex items-center gap-2.5 py-5 px-6"
                  style={{ background: "color-mix(in srgb, var(--success) 6%, var(--surface))" }}
                >
                  <CircleCheckBig className="text-emerald-500 text-xl" />
                  <div>
                    <div className="text-base font-black text-emerald-500 font-display">
                      Excellent!
                    </div>
                    <div className="text-xs text-text-muted mt-0.5">
                      No errors detected
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {[
                    {
                      label: "Grammar",
                      value: result.stats.grammar,
                      color: "var(--error)",
                      icon: <Bug size={14} />,
                    },
                    {
                      label: "Spelling",
                      value: result.stats.spelling,
                      color: "var(--warning, #e8a838)",
                      icon: <AlertTriangle size={14} />,
                    },
                    {
                      label: "Style",
                      value: result.stats.style,
                      color: "var(--info, #5b8def)",
                      icon: <Lightbulb size={14} />,
                    },
                  ].map((s) => (
                    <div
                      key={s.label}
                      className="flex-1 flex items-center gap-3 bg-surface py-5 px-4"
                    >
                      <motion.span
                        className="flex items-center"
                        style={{
                          color: s.value > 0 ? s.color : "var(--text-muted)",
                          opacity: 0.8,
                        }}
                        animate={s.value > 0 ? { scale: [1, 1.15, 1] } : { scale: 1 }}
                        transition={{ duration: 0.3 }}
                      >
                        {s.icon}
                      </motion.span>
                      <div>
                        <div
                          className="text-3xl font-extrabold leading-none font-display"
                          style={{ color: s.value > 0 ? s.color : "var(--text-muted)" }}
                        >
                          {s.value}
                        </div>
                        <div className="text-[10px] text-text-muted font-bold uppercase mt-0.5 tracking-wider">
                          {s.label}
                        </div>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          </Card>

          {/* Error cards */}
          {result.errors.map((err, i) => (
            <ErrorCard key={`${err.offset}-${i}`} error={err} onApply={() => applyFix(err)} />
          ))}

          {/* Corrected text */}
          {totalErrors > 0 && (
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-xs font-bold text-text-secondary">Corrected text</span>
                <CopyButton text={result.correctedText} />
              </div>
              <Card
                shadowSize="sm"
                size="sm"
                className="text-sm text-text-primary border-success/30"
                style={{
                  background: "color-mix(in srgb, var(--success) 5%, var(--card-bg))",
                  lineHeight: 1.7,
                  whiteSpace: "pre-wrap",
                }}
              >
                {result.correctedText}
              </Card>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
