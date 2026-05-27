"use client";

import { diffWords } from "diff";
import { BookOpen, Check, Copy, FileText, Highlighter, Loader2, MessageSquare } from "lucide-react";
import { useCallback, useMemo, useState } from "react";

import { api } from "@/lib/api-client";

/* ── Types ──────────────────────────────────────────────── */

type RewriteChange = {
  original: string;
  replacement: string;
  reason: string;
};

type RewriteVariant = {
  level: "natural" | "formal" | "c1";
  rewrite: string;
  changes: RewriteChange[];
};

type RewriteResponse = {
  variants: RewriteVariant[];
};

/* ── Constants ──────────────────────────────────────────── */

const LEVEL_META: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  natural: {
    label: "Natural",
    color: "var(--success)",
    icon: <MessageSquare className="h-3.5 w-3.5" />,
  },
  formal: { label: "Formal", color: "var(--info)", icon: <FileText className="h-3.5 w-3.5" /> },
  c1: { label: "C1/Academic", color: "var(--accent)", icon: <BookOpen className="h-3.5 w-3.5" /> },
};

const MAX_CHARS = 400;

/* ── Word diff renderer ─────────────────────────────────── */

function WordDiff({ original, rewritten }: { original: string; rewritten: string }) {
  const parts = useMemo(() => diffWords(original, rewritten), [original, rewritten]);

  return (
    <span className="text-sm leading-relaxed">
      {parts.map((part, i) => {
        if (part.added) {
          return (
            <span key={i} className="text-success bg-success/10 rounded px-1 font-medium">
              {part.value}
            </span>
          );
        }
        if (part.removed) {
          return (
            <span key={i} className="text-error line-through opacity-60 px-0.5">
              {part.value}
            </span>
          );
        }
        return <span key={i}>{part.value}</span>;
      })}
    </span>
  );
}

/* ── Copy button ────────────────────────────────────────── */

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const copy = useCallback(async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [text]);

  return (
    <button
      onClick={copy}
      title="Copy to clipboard"
      className={`border-none bg-transparent cursor-pointer text-xs p-1 rounded-md transition-colors ${
        copied ? "text-success" : "text-text-secondary hover:text-ink"
      }`}
    >
      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
    </button>
  );
}

/* ── Variant card ───────────────────────────────────────── */

function VariantCard({ variant, original }: { variant: RewriteVariant; original: string }) {
  const [expanded, setExpanded] = useState(false);
  const meta = LEVEL_META[variant.level] ?? {
    label: variant.level,
    color: "var(--text-secondary)",
    icon: <MessageSquare className="h-3.5 w-3.5" />,
  };

  return (
    <div
      className="rounded-2xl border bg-surface overflow-hidden"
      style={{ borderColor: `color-mix(in srgb, ${meta.color} 30%, transparent)` }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between p-3 px-4 border-b"
        style={{
          borderColor: `color-mix(in srgb, ${meta.color} 20%, transparent)`,
          backgroundColor: `color-mix(in srgb, ${meta.color} 8%, transparent)`,
        }}
      >
        <div className="flex items-center gap-2">
          <span style={{ color: meta.color }}>{meta.icon}</span>
          <span
            className="px-2.5 py-0.5 rounded-full text-[10px] font-bold text-white uppercase tracking-wider"
            style={{ backgroundColor: meta.color }}
          >
            {meta.label}
          </span>
          <span className="text-[10px] font-bold text-text-muted">
            {variant.changes.length} changes
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setExpanded((p) => !p)}
            className="border-none bg-transparent cursor-pointer text-[10px] font-bold text-text-secondary hover:text-ink"
          >
            {expanded ? "Hide details" : "Show changes"}
          </button>
          <CopyButton text={variant.rewrite} />
        </div>
      </div>

      {/* Diff view */}
      <div className="p-3.5 px-4.5 bg-bg-deep border-b border-border/10">
        <WordDiff original={original} rewritten={variant.rewrite} />
      </div>

      {/* Changes breakdown */}
      {expanded && variant.changes.length > 0 && (
        <div className="p-3.5 pt-0 flex flex-col gap-1.5 mt-2.5">
          {variant.changes.map((change, i) => (
            <div
              key={i}
              className="text-xs p-2.5 rounded-xl bg-surface-alt border border-border border-l-4"
              style={{ borderLeftColor: meta.color }}
            >
              <span className="line-through text-text-muted">{change.original}</span>
              <span className="text-text-muted mx-1">→</span>
              <span className="font-semibold" style={{ color: meta.color }}>
                {change.replacement}
              </span>
              <span className="text-text-muted ml-1.5">— {change.reason}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── RewritePanel ───────────────────────────────────────── */

type Props = {
  /** Initial sentence to prefill (e.g. from inline issue quote) */
  initialSentence?: string;
  /** Compact mode — hide header, minimal padding */
  compact?: boolean;
};

export function RewritePanel({ initialSentence = "", compact = false }: Props) {
  const [sentence, setSentence] = useState(initialSentence);
  const [loading, setLoading] = useState(false);
  const [variants, setVariants] = useState<RewriteVariant[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const charCount = sentence.length;
  const overLimit = charCount > MAX_CHARS;

  const rewrite = useCallback(async () => {
    if (!sentence.trim() || overLimit) return;
    setError(null);
    setLoading(true);
    setVariants(null);

    try {
      const data = await api.post<RewriteResponse>("/writing/rewrite", {
        sentence: sentence.trim(),
      });
      setVariants(data.variants);
      if (data.variants.length === 0) {
        setError("This sentence is already good — no improvements to suggest.");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An error occurred";
      if (msg.includes("Rate limit")) {
        setError("You have sent too many requests. Please wait 1 minute.");
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  }, [sentence, overLimit]);

  return (
    <div className="flex flex-col gap-3">
      {/* Header */}
      {!compact && (
        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
          <Highlighter className="h-4.5 w-4.5 text-accent" />
          <span className="font-bold text-sm text-ink">Improve Sentence</span>
          <span className="text-xs text-text-muted font-bold">
            — 3 versions: natural, formal, academic
          </span>
        </div>
      )}

      {/* Input */}
      <div>
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-xs text-text-muted font-bold">Original Sentence</span>
          <span
            className={`text-[10px] ${
              overLimit ? "text-error font-bold" : "text-text-muted font-bold"
            }`}
          >
            {charCount}/{MAX_CHARS}
          </span>
        </div>
        <textarea
          value={sentence}
          onChange={(e) => {
            setSentence(e.target.value);
            setVariants(null);
            setError(null);
          }}
          placeholder="Enter sentence to improve..."
          className={`w-full min-h-[80px] p-3 rounded-xl border bg-surface text-ink text-sm leading-relaxed resize-y focus:outline-none focus:ring-1 focus:ring-accent/30 font-body ${
            overLimit ? "border-red-500 focus:border-red-500" : "border-border focus:border-accent"
          }`}
        />
      </div>

      {/* Submit */}
      <button
        onClick={rewrite}
        disabled={!sentence.trim() || overLimit || loading}
        className={`px-5 py-2.5 rounded-lg border-2 border-border text-xs font-black flex items-center gap-1.5 self-start cursor-pointer transition-all duration-100 ${
          !sentence.trim() || overLimit || loading
            ? "bg-bg-deep text-text-muted cursor-not-allowed opacity-50"
            : "bg-accent text-ink shadow-sm hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
        }`}
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Rewriting...</span>
          </>
        ) : (
          <>
            <Highlighter className="h-4 w-4" />
            <span>Rewrite</span>
          </>
        )}
      </button>

      {/* Error */}
      {error && (
        <div className="p-3 rounded-xl bg-red-950/20 border border-red-900/30 text-xs text-red-400">
          {error}
        </div>
      )}

      {/* Results */}
      {variants && variants.length > 0 && (
        <div className="flex flex-col gap-2.5 mt-2 animate-in fade-in duration-200">
          <p className="text-xs text-text-muted m-0 font-extrabold">
            {variants.length} suggested versions
          </p>
          {variants.map((v) => (
            <VariantCard key={v.level} variant={v} original={sentence.trim()} />
          ))}
        </div>
      )}
    </div>
  );
}
