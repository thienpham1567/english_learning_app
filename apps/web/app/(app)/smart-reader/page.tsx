"use client";

import { Clock, Loader2, Sparkles, Trash2, Volume2, X } from "lucide-react";
import { AnimatePresence } from "motion/react";
import * as m from "motion/react-client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTextToSpeech } from "@/hooks/useTextToSpeech";
import { api } from "@/lib/api-client";
import { SmartReaderResult } from "./_components/SmartReaderResult";

export type ClauseNode = {
  text: string;
  type: string;
  role?: string;
  connector?: string | null;
  children?: ClauseNode[];
};

export type GrammarSentence = {
  sentence: string;
  structureLabel: string;
  skeleton: { subject: string; verb: string; object: string | null };
  clauseTree: ClauseNode[];
  tenses: Array<{
    tense: string;
    example: string;
    contrast: string;
  }>;
  patterns: Array<{
    pattern: string;
    inText: string;
    ruleName: string;
    usage: string;
    extraExample: string;
    studyHint: string;
  }>;
  learnerNote: string;
};

export type SmartReaderResponse = {
  id?: string;
  naturalTranslation: string;
  difficultyLevel: "beginner" | "intermediate" | "advanced";
  readingTips?: string;
  grammarAnalysis?: {
    focusSummary: string;
    sentences: GrammarSentence[];
  } | null;
};

type HistoryEntry = {
  id: string;
  preview: string | null;
  difficultyLevel: string;
  createdAt: string;
};

const SAMPLE_TEXTS = [
  {
    label: "Business Email",
    text: "I wanted to follow up on our previous discussion regarding the Q3 projections. Given the current market volatility, I believe we should revisit our initial assumptions and perhaps take a more conservative approach moving forward.",
  },
  {
    label: "Academic",
    text: "The implications of climate change cannot be overstated, given the unprecedented rate at which global temperatures have risen over the past century. Scientists warn that without immediate intervention, the consequences could be irreversible.",
  },
  {
    label: "Daily Conversation",
    text: "I've been meaning to catch up with you for ages! Things have been pretty hectic at work lately, but I'm finally getting the hang of my new role. How about we grab coffee sometime this week?",
  },
  {
    label: "Literature",
    text: "She gazed out the window, lost in thought, as the autumn leaves drifted lazily to the ground. There was something bittersweet about the changing seasons — a reminder that nothing, however beautiful, was meant to last forever.",
  },
];

const DIFFICULTY_COLORS: Record<string, string> = {
  beginner: "text-success",
  intermediate: "text-warning",
  advanced: "text-error",
};

const DIFFICULTY_LABELS: Record<string, string> = {
  all: "All",
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}h ago`;
  const diffD = Math.floor(diffH / 24);
  if (diffD < 7) return `${diffD}d ago`;
  return date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
}

const MAX_INPUT_LENGTH = 3000;

export default function SmartReaderPage() {
  const [input, setInput] = useState("");
  const [result, setResult] = useState<SmartReaderResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [activeSourceText, setActiveSourceText] = useState<string | null>(null);
  const [historyFilter, setHistoryFilter] = useState<string>("all");
  const tts = useTextToSpeech();
  const abortRef = useRef<AbortController | null>(null);

  // Auto-clear error when input changes
  useEffect(() => {
    if (error) setError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input]);

  // Load history
  const loadHistory = useCallback(async () => {
    setIsLoadingHistory(true);
    try {
      const rows = await api.get<HistoryEntry[]>("/smart-reader/history");
      setHistory(rows);
    } catch {
      // ignore
    } finally {
      setIsLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const analyze = useCallback(
    async (text?: string) => {
      const t = (text ?? input).trim();
      if (!t) return;

      // Abort any in-flight request
      if (abortRef.current) {
        abortRef.current.abort();
      }
      const ctrl = new AbortController();
      abortRef.current = ctrl;

      // Stop TTS if playing
      tts.stop?.();

      setIsLoading(true);
      setError(null);
      setResult(null);
      setActiveSourceText(t);

      try {
        const data = await api.post<SmartReaderResponse>("/smart-reader", { text: t });
        if (ctrl.signal.aborted) return;
        setResult(data);
        if (text) setInput(text);
        loadHistory();
      } catch (err) {
        if (ctrl.signal.aborted) return;
        const message =
          err && typeof err === "object" && "message" in err
            ? (err as { message: string }).message
            : "Analysis failed. Please try again.";
        setError(message);
      } finally {
        if (!ctrl.signal.aborted) setIsLoading(false);
      }
    },
    [input, loadHistory, tts],
  );

  const loadHistoryEntry = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const entry = await api.get<{
        sourceText: string;
        result: SmartReaderResponse;
      }>(`/smart-reader/history/${id}`);
      setInput(entry.sourceText);
      setActiveSourceText(entry.sourceText);
      setResult({ ...entry.result, id });
      setShowHistory(false);
    } catch {
      setError("Failed to load history entry.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Optimistic delete
  const deleteHistoryEntry = useCallback(
    async (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      // Optimistic: remove immediately
      const prev = history;
      setHistory((h) => h.filter((x) => x.id !== id));
      try {
        await api.delete(`/smart-reader/history/${id}`);
      } catch {
        // Revert on failure
        setHistory(prev);
      }
    },
    [history],
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      analyze();
    }
  };

  // Filter history by difficulty
  const filteredHistory =
    historyFilter === "all" ? history : history.filter((h) => h.difficultyLevel === historyFilter);

  const hasResult = !!result && !isLoading;

  return (
    <div className="flex min-h-full flex-col">
      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-6 md:px-6">
        <div className="mx-auto max-w-3xl space-y-5">
          {/* Input Section */}
          <m.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="rounded-2xl border border-border bg-surface shadow-sm overflow-hidden">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Paste English text here to analyze..."
                rows={hasResult ? 2 : 5}
                maxLength={MAX_INPUT_LENGTH}
                disabled={isLoading}
                className={`w-full resize-none border-0 bg-transparent p-4 text-sm leading-relaxed text-ink placeholder-text-muted outline-none focus:ring-0 focus:outline-none transition-all duration-300 ${hasResult ? "max-h-[80px]" : "max-h-[200px]"}`}
              />

              {/* Bottom toolbar */}
              <div className="flex items-center justify-between border-t border-border/50 px-4 py-2.5">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-mono ${input.length >= MAX_INPUT_LENGTH ? "text-error font-bold" : "text-text-muted"}`}
                  >
                    {input.length} / {MAX_INPUT_LENGTH.toLocaleString()}
                  </span>
                  {input.trim() && (
                    <button
                      onClick={() => tts.speak(input)}
                      disabled={tts.isLoading || tts.isSpeaking}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold text-text-muted hover:text-accent hover:bg-accent/5 transition-all cursor-pointer"
                    >
                      <Volume2 className="h-3 w-3" />
                      <span>{tts.isSpeaking ? "Playing..." : "Listen"}</span>
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {/* History button */}
                  <button
                    onClick={() => setShowHistory(!showHistory)}
                    className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition-all cursor-pointer border ${
                      showHistory
                        ? "border-accent bg-accent/10 text-accent"
                        : "border-border text-text-muted hover:border-accent/40 hover:text-accent"
                    }`}
                  >
                    <Clock className="h-3.5 w-3.5" />
                    History
                    {history.length > 0 && (
                      <span className="text-[9px] bg-accent/15 text-accent px-1.5 py-0.5 rounded-md font-bold">
                        {history.length}
                      </span>
                    )}
                  </button>

                  <span className="hidden sm:inline text-[10px] text-text-muted font-mono">⌘↵</span>
                  <button
                    onClick={() => analyze()}
                    disabled={!input.trim() || isLoading}
                    className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all duration-200 cursor-pointer active:scale-95 ${
                      input.trim() && !isLoading
                        ? "bg-accent text-white shadow-sm hover:brightness-110"
                        : "bg-surface-hover border border-border text-text-muted cursor-not-allowed opacity-50"
                    }`}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-3.5 w-3.5" />
                        Analyze
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </m.div>

          {/* History panel */}
          <AnimatePresence>
            {showHistory && (
              <m.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="rounded-2xl border border-border bg-surface shadow-sm">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-accent" />
                      <span className="text-xs font-bold text-ink">Recent Translations</span>
                    </div>
                    <button
                      onClick={() => setShowHistory(false)}
                      className="text-text-muted hover:text-ink transition-colors cursor-pointer"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Difficulty filter chips */}
                  <div className="flex items-center gap-1.5 px-4 py-2 border-b border-border/30">
                    {Object.entries(DIFFICULTY_LABELS).map(([key, label]) => (
                      <button
                        key={key}
                        onClick={() => setHistoryFilter(key)}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                          historyFilter === key
                            ? "bg-accent/15 text-accent border border-accent/30"
                            : "text-text-muted hover:text-ink hover:bg-surface-hover border border-transparent"
                        }`}
                      >
                        {label}
                        {key !== "all" && (
                          <span className="ml-1 opacity-60">
                            {
                              history.filter((h) => key === "all" || h.difficultyLevel === key)
                                .length
                            }
                          </span>
                        )}
                      </button>
                    ))}
                  </div>

                  {isLoadingHistory ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-5 w-5 animate-spin text-accent" />
                    </div>
                  ) : filteredHistory.length === 0 ? (
                    <div className="py-8 text-center text-xs text-text-muted">
                      {history.length === 0
                        ? "No translations yet. Try analyzing some text!"
                        : "No translations at this level."}
                    </div>
                  ) : (
                    <div className="max-h-[280px] overflow-y-auto divide-y divide-border/30">
                      {filteredHistory.map((entry) => (
                        <button
                          key={entry.id}
                          onClick={() => loadHistoryEntry(entry.id)}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-surface-hover/50 transition-colors text-left cursor-pointer group"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-ink truncate font-medium">
                              {entry.preview || "Untitled"}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span
                                className={`text-[9px] font-bold uppercase ${DIFFICULTY_COLORS[entry.difficultyLevel] ?? "text-text-muted"}`}
                              >
                                {entry.difficultyLevel}
                              </span>
                              <span className="text-[9px] text-text-muted">
                                {formatRelativeDate(entry.createdAt)}
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={(e) => deleteHistoryEntry(entry.id, e)}
                            className="opacity-0 group-hover:opacity-100 text-text-muted hover:text-error transition-all cursor-pointer p-1"
                            aria-label="Delete"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </m.div>
            )}
          </AnimatePresence>

          {/* Sample texts — shown when no result */}
          {!result && !isLoading && !error && !showHistory && (
            <m.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.3 }}
              className="space-y-3"
            >
              <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted font-mono px-1">
                Try a sample
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {SAMPLE_TEXTS.map((sample) => (
                  <m.button
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    key={sample.label}
                    onClick={() => {
                      setInput(sample.text);
                      analyze(sample.text);
                    }}
                    className="flex flex-col gap-1.5 rounded-xl border border-border bg-surface p-3.5 text-left hover:border-accent/40 hover:bg-accent/5 transition-all cursor-pointer group"
                  >
                    <span className="text-xs font-bold text-ink group-hover:text-accent transition-colors">
                      {sample.label}
                    </span>
                    <span className="text-[11px] text-text-muted leading-relaxed line-clamp-2">
                      {sample.text}
                    </span>
                  </m.button>
                ))}
              </div>
            </m.div>
          )}

          {/* Error */}
          {error && (
            <m.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-xl border border-error bg-error/10 p-4 text-sm text-error font-semibold"
            >
              {error}
            </m.div>
          )}

          {/* Loading skeleton */}
          {isLoading && (
            <m.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <div className="rounded-xl border border-border bg-surface p-5 space-y-3">
                <div className="h-4 w-32 rounded-lg bg-surface-hover animate-pulse" />
                <div className="h-4 w-full rounded-lg bg-surface-hover animate-pulse" />
                <div className="h-4 w-3/4 rounded-lg bg-surface-hover animate-pulse" />
                <div className="h-4 w-1/2 rounded-lg bg-surface-hover animate-pulse" />
              </div>
              <div className="rounded-xl border border-border bg-surface p-5 space-y-3">
                <div className="h-4 w-40 rounded-lg bg-surface-hover animate-pulse" />
                <div className="h-4 w-full rounded-lg bg-surface-hover animate-pulse" />
                <div className="h-4 w-2/3 rounded-lg bg-surface-hover animate-pulse" />
              </div>
            </m.div>
          )}

          {/* Result */}
          {result && !isLoading && (
            <SmartReaderResult result={result} tts={tts} sourceText={activeSourceText} />
          )}
        </div>
      </div>
    </div>
  );
}
