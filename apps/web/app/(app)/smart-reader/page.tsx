"use client";

import { BookOpenCheck, Loader2, Sparkles, Volume2 } from "lucide-react";
import * as m from "motion/react-client";
import { useCallback, useState } from "react";
import { api } from "@/lib/api-client";
import { useTextToSpeech } from "@/hooks/useTextToSpeech";
import { SmartReaderResult } from "./_components/SmartReaderResult";

export type SmartReaderResponse = {
  naturalTranslation: string;
  breakdown: Array<{
    phrase: string;
    meaning: string;
    note?: string;
  }>;
  vocabulary: Array<{
    word: string;
    pos: string;
    meaning: string;
    example?: string;
  }>;
  difficultyLevel: "beginner" | "intermediate" | "advanced";
  readingTips?: string;
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

export default function SmartReaderPage() {
  const [input, setInput] = useState("");
  const [result, setResult] = useState<SmartReaderResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const tts = useTextToSpeech();

  const analyze = useCallback(
    async (text?: string) => {
      const t = (text ?? input).trim();
      if (!t || isLoading) return;

      setIsLoading(true);
      setError(null);
      setResult(null);

      try {
        const data = await api.post<SmartReaderResponse>("/smart-reader", { text: t });
        setResult(data);
        if (text) setInput(text);
      } catch (err) {
        const message =
          err && typeof err === "object" && "message" in err
            ? (err as { message: string }).message
            : "Analysis failed. Please try again.";
        setError(message);
      } finally {
        setIsLoading(false);
      }
    },
    [input, isLoading],
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      analyze();
    }
  };

  return (
    <div className="flex min-h-full flex-col">
      {/* Header */}
      <div className="border-b-2 border-border bg-surface px-6 py-5">
        <div className="mx-auto max-w-3xl">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/10 text-accent border-2 border-accent/20">
              <BookOpenCheck className="h-4.5 w-4.5" />
            </div>
            <div>
              <h1 className="font-display text-lg font-semibold italic text-ink tracking-wide">
                Smart Reader
              </h1>
              <p className="text-xs text-text-muted mt-0.5">
                Dịch tự nhiên · Phân tích cấu trúc · Học từ vựng
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-6 md:px-6">
        <div className="mx-auto max-w-3xl space-y-6">
          {/* Input Section */}
          <m.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="rounded-2xl border-2 border-border bg-surface shadow-sm overflow-hidden">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Paste English text here to analyze..."
                rows={5}
                disabled={isLoading}
                className="w-full resize-none border-0 bg-transparent p-4 text-sm leading-relaxed text-ink placeholder-text-muted outline-none focus:ring-0 focus:outline-none"
              />

              {/* Bottom toolbar */}
              <div className="flex items-center justify-between border-t border-border/50 px-4 py-2.5">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-text-muted">
                    {input.length} / 3,000
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
                  <span className="hidden sm:inline text-[10px] text-text-muted font-mono">
                    ⌘↵ Analyze
                  </span>
                  <button
                    onClick={() => analyze()}
                    disabled={!input.trim() || isLoading}
                    className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all duration-200 cursor-pointer active:scale-95 ${
                      input.trim() && !isLoading
                        ? "bg-accent text-white shadow-sm hover:brightness-110"
                        : "bg-surface-hover border-2 border-border text-text-muted cursor-not-allowed opacity-50"
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

          {/* Sample texts — shown when no result */}
          {!result && !isLoading && !error && (
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
                    className="flex flex-col gap-1.5 rounded-xl border-2 border-border bg-surface p-3.5 text-left hover:border-accent/40 hover:bg-accent/5 transition-all cursor-pointer group"
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
              className="rounded-xl border-2 border-error bg-error/10 p-4 text-sm text-error font-semibold"
            >
              {error}
            </m.div>
          )}

          {/* Loading skeleton */}
          {isLoading && (
            <m.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-4"
            >
              <div className="rounded-xl border-2 border-border bg-surface p-5 space-y-3">
                <div className="h-4 w-32 rounded-lg bg-surface-hover animate-pulse" />
                <div className="h-4 w-full rounded-lg bg-surface-hover animate-pulse" />
                <div className="h-4 w-3/4 rounded-lg bg-surface-hover animate-pulse" />
                <div className="h-4 w-1/2 rounded-lg bg-surface-hover animate-pulse" />
              </div>
              <div className="rounded-xl border-2 border-border bg-surface p-5 space-y-3">
                <div className="h-4 w-40 rounded-lg bg-surface-hover animate-pulse" />
                <div className="h-4 w-full rounded-lg bg-surface-hover animate-pulse" />
                <div className="h-4 w-2/3 rounded-lg bg-surface-hover animate-pulse" />
              </div>
            </m.div>
          )}

          {/* Result */}
          {result && !isLoading && (
            <SmartReaderResult result={result} tts={tts} />
          )}
        </div>
      </div>
    </div>
  );
}
