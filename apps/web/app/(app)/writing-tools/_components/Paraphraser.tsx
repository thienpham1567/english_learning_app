"use client";

import { diffWords } from "diff";
import {
  ArrowLeftRight,
  BookOpen,
  Briefcase,
  Check,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  Copy,
  FileText,
  Loader2,
  Scissors,
  Sparkles,
  Wind,
  Zap,
} from "lucide-react";
import { motion } from "motion/react";
import { useCallback, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { api } from "@/lib/api-client";
import type { ParaphraseMode, ParaphraseResponse } from "@/lib/writing-tools/schema";

const MAX_WORDS = 500;

/* ── Mode definitions ─────────────────────────────────── */

type ModeInfo = {
  key: ParaphraseMode;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string; size?: number }>;
};

const MODES: ModeInfo[] = [
  {
    key: "standard",
    label: "Standard",
    description: "Rewrite with new vocabulary",
    icon: FileText,
  },
  { key: "fluency", label: "Fluency", description: "Improve natural flow", icon: Wind },
  { key: "formal", label: "Formal", description: "Professional style", icon: Briefcase },
  { key: "simple", label: "Simple", description: "Easy to understand vocabulary", icon: Check },
  { key: "creative", label: "Creative", description: "Vibrant expression", icon: Sparkles },
  { key: "expand", label: "Expand", description: "Add details", icon: BookOpen },
  { key: "shorten", label: "Shorten", description: "Concise and brief", icon: Scissors },
];

/* ── Mode-specific example prompts ────────────────────── */

const MODE_EXAMPLES: Record<string, { text: string; hint: string }[]> = {
  standard: [
    {
      text: "The students were very happy because they passed the difficult exam.",
      hint: "Simple sentence → paraphrase",
    },
    {
      text: "Technology has changed the way people communicate with each other.",
      hint: "Common topic",
    },
  ],
  fluency: [
    {
      text: "The reason why I like this city is because it has many interesting places to visit.",
      hint: "Wordy sentence → natural flow",
    },
  ],
  formal: [
    {
      text: "Hey, I just wanted to let you know that the meeting is gonna be moved to next week.",
      hint: "Casual → professional",
    },
  ],
  simple: [
    {
      text: "The proliferation of digital technologies has fundamentally transformed contemporary pedagogical methodologies.",
      hint: "Complex → simple",
    },
  ],
  creative: [
    { text: "The sunset was beautiful. The sky had many colors.", hint: "Bland → vibrant" },
  ],
  expand: [{ text: "Climate change is a serious problem.", hint: "Short → more detailed" }],
  shorten: [
    {
      text: "In my personal opinion, I believe that it is absolutely essential and critically important for students to develop strong reading habits.",
      hint: "Wordy → concise",
    },
  ],
};

/* ── Word diff renderer ───────────────────────────────── */

function WordDiff({ original, rewritten }: { original: string; rewritten: string }) {
  const parts = useMemo(() => diffWords(original, rewritten), [original, rewritten]);

  return (
    <span className="text-[15px]" style={{ lineHeight: 1.8 }}>
      {parts.map((part, i) => {
        if (part.added) {
          return (
            <span
              key={i}
              className="text-success rounded font-medium"
              style={{
                backgroundColor: "color-mix(in srgb, var(--success) 10%, transparent)",
                padding: "1px 3px",
              }}
            >
              {part.value}
            </span>
          );
        }
        if (part.removed) {
          return (
            <span
              key={i}
              className="text-destructive line-through opacity-50"
              style={{ padding: "1px 1px" }}
            >
              {part.value}
            </span>
          );
        }
        return <span key={i}>{part.value}</span>;
      })}
    </span>
  );
}

/* ── Copy button ──────────────────────────────────────── */

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
      {copied ? (
        <>
          <Check size={13} /> Copied
        </>
      ) : (
        <>
          <Copy size={13} /> Copy
        </>
      )}
    </button>
  );
}

/* ── Changes detail panel ─────────────────────────────── */

function ChangesPanel({ changes }: { changes: ParaphraseResponse["changes"] }) {
  const [expanded, setExpanded] = useState(false);
  if (changes.length === 0) return null;

  return (
    <Card shadowSize="sm" size="sm" className="p-0 overflow-hidden">
      <button
        onClick={() => setExpanded((p) => !p)}
        className="w-full flex items-center justify-between border-none bg-transparent cursor-pointer text-text-secondary text-[13px] font-bold py-2.5 px-3.5"
      >
        <span className="flex items-center gap-1.5">
          <motion.span
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            <ClipboardList size={16} className="text-accent" />
          </motion.span>
          {changes.length} vocabulary change{changes.length === 1 ? "" : "s"}
        </span>
        <span className="text-[10px]">{expanded ? <ChevronDown /> : <ChevronRight />}</span>
      </button>

      {expanded && (
        <div className="flex flex-col gap-1.5 px-3.5 pb-3.5">
          {changes.map((change, i) => (
            <div
              key={i}
              className="text-[13px] py-2 px-3 rounded-lg bg-surface-alt leading-relaxed border-l-[3px] border-l-accent"
            >
              <div>
                <span className="text-text-muted line-through">{change.original}</span>
                {" → "}
                <span className="text-success font-bold">{change.replacement}</span>
              </div>
              <div className="text-text-secondary text-xs mt-0.5">{change.reason}</div>
              {change.definitionVi && (
                <div className="text-accent text-xs italic flex items-center gap-1 mt-0.5">
                  <span>Definition:</span> {change.definitionVi}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

/* ── Main Paraphraser component ───────────────────────── */

export function Paraphraser() {
  const [text, setText] = useState("");
  const [mode, setMode] = useState<ParaphraseMode>("standard");
  const [synonymLevel, setSynonymLevel] = useState(50);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ParaphraseResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
  const overLimit = wordCount > MAX_WORDS;

  const paraphrase = useCallback(async () => {
    if (!text.trim() || overLimit) return;
    setError(null);
    setLoading(true);
    setResult(null);

    try {
      const data = await api.post<ParaphraseResponse>("/writing-tools/paraphrase", {
        text: text.trim(),
        mode,
        synonymLevel,
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
  }, [text, mode, synonymLevel, overLimit]);

  // Keyboard handler — Ctrl/Cmd + Enter
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        paraphrase();
      }
    },
    [paraphrase],
  );

  const currentExamples = MODE_EXAMPLES[mode] ?? MODE_EXAMPLES.standard;

  const sliderLabel =
    synonymLevel <= 30 ? "Low changes" : synonymLevel <= 70 ? "Moderate changes" : "High changes";

  return (
    <div className="flex flex-col gap-4">
      {/* Mode pills */}
      <div>
        <span className="text-xs font-bold text-text-secondary mb-2 block">Paraphrase Mode</span>
        <div className="flex gap-1.5 pb-1 overflow-x-auto scrollbar-none">
          {MODES.map((m) => {
            const active = mode === m.key;
            return (
              <button
                key={m.key}
                onClick={() => {
                  setMode(m.key);
                  setResult(null);
                }}
                title={m.description}
                className={`text-[13px] cursor-pointer flex items-center gap-1.5 shrink-0 py-2 px-3.5 rounded-lg font-bold transition-all duration-100 border-2 ${
                  active
                    ? "border-accent bg-accent text-text-on-accent shadow-sm"
                    : "border-border bg-surface text-text-secondary hover:bg-surface-hover hover:-translate-y-px hover:shadow-sm active:translate-y-0 active:shadow-none"
                }`}
              >
                <m.icon size={15} />
                {m.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Synonym slider */}
      <Card shadowSize="sm" size="sm" className="flex flex-row items-center gap-3">
        <span className="text-xs text-text-secondary font-bold whitespace-nowrap">
          Vocabulary change level:
        </span>
        <span className="text-[11px] text-text-muted w-[30px] font-bold">Low</span>
        <input
          type="range"
          min={0}
          max={100}
          value={synonymLevel}
          onChange={(e) => {
            setSynonymLevel(Number(e.target.value));
            setResult(null);
          }}
          className="flex-1 cursor-pointer"
          style={{ accentColor: "var(--accent)" }}
        />
        <span className="text-[11px] text-text-muted w-[40px] font-bold">High</span>
        <span className="text-xs font-bold text-accent py-0.5 px-2.5 rounded-md bg-accent-light whitespace-nowrap">
          {sliderLabel}
        </span>
      </Card>

      {/* Split panels */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
        {/* Left: Input */}
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-text-secondary">Original text</span>
            <span
              className={`text-[11px] font-bold ${overLimit ? "text-error" : "text-text-muted"}`}
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
            className={`app-textarea ${overLimit ? "border-error" : ""} w-full h-[220px] p-4 text-[15px]`}
            style={{ lineHeight: 1.7, resize: "vertical", fontFamily: "inherit" }}
          />

          {/* Example prompts — show when empty */}
          {!text.trim() && !result && (
            <div className="mt-2">
              <span className="text-[11px] font-black uppercase text-text-muted flex items-center gap-1.5 mb-1.5 tracking-widest">
                <Zap size={10} />
                Try now
              </span>
              <div className="flex gap-2 flex-wrap">
                {currentExamples.map((ex, i) => (
                  <Card
                    key={i}
                    interactive
                    shadowSize="sm"
                    size="sm"
                    className="cursor-pointer p-0 overflow-hidden flex-[1_1_200px]"
                    onClick={() => setText(ex.text)}
                  >
                    <div className="p-2.5 border-l-[3px] border-l-accent h-full">
                      <span className="text-[11px] font-bold text-accent block">{ex.hint}</span>
                      <span className="block text-xs text-text-secondary italic mt-1 leading-snug whitespace-nowrap overflow-hidden text-ellipsis">
                        {ex.text}
                      </span>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Output */}
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-text-secondary">Paraphrased Result</span>
            {result && <CopyButton text={result.result} />}
          </div>
          <Card
            shadowSize="sm"
            size="sm"
            className={`h-[220px] overflow-auto text-[15px] ${result ? "border-success/30" : ""}`}
            style={{
              background: result
                ? "color-mix(in srgb, var(--success) 3%, var(--card-bg))"
                : "var(--surface)",
              lineHeight: 1.7,
              color: result ? "var(--text-primary)" : "var(--text-muted)",
              whiteSpace: "pre-wrap",
            }}
          >
            {loading ? (
              <div className="flex items-center justify-center h-full gap-2 text-text-muted">
                <Loader2 className="animate-spin" size={18} />
                <span className="font-bold">Paraphrasing...</span>
              </div>
            ) : result ? (
              <WordDiff original={text.trim()} rewritten={result.result} />
            ) : (
              <span className="italic">Paraphrased result will appear here...</span>
            )}
          </Card>
        </div>
      </div>


      {/* Action bar */}
      <div className="flex items-center gap-2.5">
        <Button
          size="lg"
          onClick={paraphrase}
          disabled={!text.trim() || overLimit || loading}
          className="px-6"
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin" /> Processing...
            </>
          ) : (
            <>
              <ArrowLeftRight /> Paraphrase
            </>
          )}
        </Button>

        {result && (
          <span className="text-text-muted text-xs flex items-center gap-1.5 font-bold">
            {(() => {
              const activeMode = MODES.find((m) => m.key === mode);
              if (!activeMode) return null;
              const Icon = activeMode.icon;
              return <Icon size={12} />;
            })()}
            <span>
              {MODES.find((m) => m.key === mode)?.label} · Changes: {synonymLevel}%
            </span>
          </span>
        )}

        {/* Keyboard shortcut hint */}
        {text.trim() && !result && (
          <span className="text-[11px] text-text-muted italic font-bold">⌘/Ctrl + Enter</span>
        )}
      </div>

      {/* Error message */}
      {error && (
        <Card
          shadowSize="none"
          size="sm"
          className="bg-error-bg border-error/30 text-destructive text-[13px] font-bold"
        >
          {error}
        </Card>
      )}

      {/* Changes detail */}
      {result && <ChangesPanel changes={result.changes} />}
    </div>
  );
}
