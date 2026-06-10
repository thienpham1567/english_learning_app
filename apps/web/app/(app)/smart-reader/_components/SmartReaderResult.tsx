"use client";

import {
  BookOpenCheck,
  Check,
  ChevronDown,
  ChevronUp,
  ClipboardCopy,
  FileText,
  Lightbulb,
  Ruler,
  Volume2,
} from "lucide-react";
import * as m from "motion/react-client";
import { useCallback, useEffect, useState } from "react";
import { lookupWord } from "@/components/shared/FloatingDictionaryWidget";
import type { useTextToSpeech } from "@/hooks/useTextToSpeech";
import { api } from "@/lib/api-client";
import type { SmartReaderResponse } from "../page";

type Props = {
  result: SmartReaderResponse;
  tts: ReturnType<typeof useTextToSpeech>;
  sourceText?: string | null;
};

const DIFFICULTY_CONFIG = {
  beginner: { label: "Beginner", color: "text-success bg-success/10 border-success/30" },
  intermediate: { label: "Intermediate", color: "text-warning bg-warning/10 border-warning/30" },
  advanced: { label: "Advanced", color: "text-error bg-error/10 border-error/30" },
};

export function SmartReaderResult({ result, tts, sourceText }: Props) {
  const [expandedBreakdown, setExpandedBreakdown] = useState(true);
  const [expandedVocab, setExpandedVocab] = useState(true);
  const [copied, setCopied] = useState(false);
  const [savedWords, setSavedWords] = useState<Set<string>>(new Set());

  const diffConfig = DIFFICULTY_CONFIG[result.difficultyLevel] ?? DIFFICULTY_CONFIG.intermediate;

  // Check which vocabulary words are already saved in Dictionary
  useEffect(() => {
    if (!result.vocabulary.length) return;
    const words = result.vocabulary.map((v) => v.word.toLowerCase());
    (async () => {
      try {
        const data = await api.post<{ saved: string[] }>("/vocabulary/check-saved", { words });
        setSavedWords(new Set(data.saved.map((w: string) => w.toLowerCase())));
      } catch {
        // ignore — feature enhancement, not critical
      }
    })();
  }, [result.vocabulary]);

  // Copy full analysis as text
  const copyAnalysis = useCallback(() => {
    const lines: string[] = [];
    if (sourceText) {
      lines.push("📝 Original:", sourceText, "");
    }
    lines.push("🇻🇳 Bản dịch tự nhiên:", result.naturalTranslation, "");

    if (result.breakdown.length) {
      lines.push("📐 Phân tích cấu trúc:");
      result.breakdown.forEach((b) => {
        lines.push(`  • "${b.phrase}" → ${b.meaning}`);
        if (b.note) lines.push(`    💡 ${b.note}`);
      });
      lines.push("");
    }

    if (result.vocabulary.length) {
      lines.push("💡 Từ vựng quan trọng:");
      result.vocabulary.forEach((v) => {
        lines.push(`  • ${v.word} (${v.pos}) — ${v.meaning}`);
        if (v.example) lines.push(`    Ex: "${v.example}"`);
      });
      lines.push("");
    }

    if (result.readingTips) {
      lines.push("💡 Mẹo đọc hiểu:", result.readingTips);
    }

    navigator.clipboard.writeText(lines.join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [result, sourceText]);

  return (
    <m.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
      className="space-y-4"
    >
      {/* ── Source Text Card ── */}
      {sourceText && (
        <div className="rounded-2xl border-2 border-border bg-surface p-5 space-y-3 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-accent shrink-0" />
              <span className="text-xs font-bold uppercase tracking-wider text-text-muted font-mono">
                Original Text
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => tts.speak(sourceText)}
                disabled={tts.isLoading || tts.isSpeaking}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold text-text-muted hover:text-accent hover:bg-accent/5 transition-all cursor-pointer"
              >
                <Volume2 className="h-3 w-3" />
                <span>{tts.isSpeaking ? "Playing..." : "Listen"}</span>
              </button>
              <button
                onClick={copyAnalysis}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold text-text-muted hover:text-accent hover:bg-accent/5 transition-all cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="h-3 w-3 text-success" />
                    <span className="text-success">Copied!</span>
                  </>
                ) : (
                  <>
                    <ClipboardCopy className="h-3 w-3" />
                    <span>Copy All</span>
                  </>
                )}
              </button>
            </div>
          </div>
          <p className="text-sm leading-relaxed text-text-secondary italic">{sourceText}</p>
        </div>
      )}

      {/* ── Natural Translation ── */}
      <div className="rounded-2xl border-2 border-border bg-surface p-5 space-y-3 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-base">🇻🇳</span>
            <span className="text-xs font-bold uppercase tracking-wider text-text-muted font-mono">
              Bản dịch tự nhiên
            </span>
          </div>
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-lg border-2 text-[9px] font-bold uppercase tracking-wide ${diffConfig.color}`}
          >
            {diffConfig.label}
          </span>
        </div>

        <p className="text-sm leading-relaxed text-ink font-medium">{result.naturalTranslation}</p>
      </div>

      {/* ── Sentence Breakdown ── */}
      {result.breakdown.length > 0 && (
        <div className="rounded-2xl border-2 border-border bg-surface shadow-sm overflow-hidden">
          <button
            onClick={() => setExpandedBreakdown(!expandedBreakdown)}
            className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-surface-hover/30 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Ruler className="h-4 w-4 text-accent shrink-0" />
              <span className="text-xs font-bold uppercase tracking-wider text-text-muted font-mono">
                Phân tích cấu trúc
              </span>
              <span className="text-[10px] font-bold text-accent bg-accent/10 px-1.5 py-0.5 rounded-md">
                {result.breakdown.length}
              </span>
            </div>
            {expandedBreakdown ? (
              <ChevronUp className="h-4 w-4 text-text-muted" />
            ) : (
              <ChevronDown className="h-4 w-4 text-text-muted" />
            )}
          </button>

          {expandedBreakdown && (
            <div className="border-t border-border/50 px-5 py-3 space-y-3">
              {result.breakdown.map((item, i) => (
                <m.div
                  key={i}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="group flex gap-3 py-2"
                >
                  {/* Left accent bar */}
                  <div className="w-0.5 rounded-full bg-accent/40 shrink-0 group-hover:bg-accent transition-colors" />

                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-ink">&quot;{item.phrase}&quot;</span>
                      <button
                        onClick={() => tts.speak(item.phrase)}
                        disabled={tts.isLoading}
                        className="text-text-muted hover:text-accent transition-colors cursor-pointer"
                        aria-label={`Listen to "${item.phrase}"`}
                      >
                        <Volume2 className="h-3 w-3" />
                      </button>
                    </div>
                    <p className="text-xs text-text-secondary leading-relaxed">→ {item.meaning}</p>
                    {item.note && (
                      <p className="text-[11px] text-text-muted italic leading-relaxed inline-flex items-center gap-1">
                        <Lightbulb className="h-3 w-3 text-warning shrink-0" /> {item.note}
                      </p>
                    )}
                  </div>
                </m.div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Vocabulary ── */}
      {result.vocabulary.length > 0 && (
        <div className="rounded-2xl border-2 border-border bg-surface shadow-sm overflow-hidden">
          <button
            onClick={() => setExpandedVocab(!expandedVocab)}
            className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-surface-hover/30 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-accent shrink-0" />
              <span className="text-xs font-bold uppercase tracking-wider text-text-muted font-mono">
                Từ vựng quan trọng
              </span>
              <span className="text-[10px] font-bold text-accent bg-accent/10 px-1.5 py-0.5 rounded-md">
                {result.vocabulary.length}
              </span>
            </div>
            {expandedVocab ? (
              <ChevronUp className="h-4 w-4 text-text-muted" />
            ) : (
              <ChevronDown className="h-4 w-4 text-text-muted" />
            )}
          </button>

          {expandedVocab && (
            <div className="border-t border-border/50 px-5 py-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {result.vocabulary.map((item, i) => {
                  const isSaved = savedWords.has(item.word.toLowerCase());
                  return (
                    <m.div
                      key={i}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                      onClick={() => lookupWord(item.word)}
                      className="group rounded-xl border-2 border-border p-3 hover:border-accent/30 hover:bg-accent/5 transition-all cursor-pointer active:scale-[0.98]"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-bold text-ink group-hover:text-accent transition-colors">
                          {item.word}
                        </span>
                        <span className="text-[9px] font-bold text-text-muted bg-bg-deep px-1.5 py-0.5 rounded-md uppercase font-mono">
                          {item.pos}
                        </span>
                        {isSaved && (
                          <span className="text-[8px] font-bold text-success bg-success/10 px-1.5 py-0.5 rounded-md">
                            ✓ Saved
                          </span>
                        )}
                        <div className="flex items-center gap-1 ml-auto">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              tts.speak(item.word);
                            }}
                            disabled={tts.isLoading}
                            className="text-text-muted hover:text-accent transition-colors cursor-pointer"
                            aria-label={`Listen to "${item.word}"`}
                          >
                            <Volume2 className="h-3 w-3" />
                          </button>
                          <BookOpenCheck className="h-3 w-3 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </div>
                      <p className="text-xs text-text-secondary">{item.meaning}</p>
                      {item.example && (
                        <p className="text-[11px] text-text-muted mt-1.5 italic leading-relaxed border-l-2 border-border pl-2">
                          &quot;{item.example}&quot;
                        </p>
                      )}
                    </m.div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Reading Tips ── */}
      {result.readingTips && (
        <m.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl border-2 border-accent/20 bg-accent/5 p-4 flex gap-3"
        >
          <Lightbulb className="h-4 w-4 text-accent shrink-0 mt-0.5" />
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-accent font-mono">
              Mẹo đọc hiểu
            </span>
            <p className="text-xs text-text-secondary leading-relaxed mt-1">{result.readingTips}</p>
          </div>
        </m.div>
      )}
    </m.div>
  );
}
