"use client";

import {
  Award,
  BookOpen,
  CheckCircle,
  ChevronRight,
  MessageSquare,
  TrendingUp,
  XCircle,
} from "lucide-react";
import { AnimatePresence } from "motion/react";
import * as m from "motion/react-client";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Sparkline } from "@/components/charts/Sparkline";
import { Card } from "@/components/ui/card";
import { api } from "@/lib/api-client";

interface SessionAnalysis {
  grammarScore: number;
  newVocabUsed: string[];
  repeatedErrors: { wrong: string; correct: string; rule: string }[];
  fluencyScore: number;
  fluencyTrend: "improving" | "stable" | "declining";
  recommendation: { text: string; actionUrl: string };
  cefrEstimate: string;
  exchangeCount: number;
}

interface SessionSummaryProps {
  conversationId: string | null;
  messageCount: number;
}

function ScoreRing({
  score,
  label,
  color,
  size = 56,
}: {
  score: number;
  label: string;
  color: string;
  size?: number;
}) {
  const strokeWidth = 4;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-1.5">
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--border)"
          strokeWidth={strokeWidth}
        />
        <m.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference - progress }}
          transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-sm font-black font-mono" style={{ color }}>
          {score}
        </span>
      </div>
      <span className="text-[9px] font-extrabold uppercase tracking-widest text-text-muted">
        {label}
      </span>
    </div>
  );
}

export function SessionSummary({ conversationId, messageCount }: SessionSummaryProps) {
  const [analysis, setAnalysis] = useState<SessionAnalysis | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // Only show after 5+ exchanges (10+ messages)
  const shouldAnalyze = messageCount >= 10 && conversationId;

  const fetchAnalysis = useCallback(async () => {
    if (!conversationId || loading || analysis) return;
    setLoading(true);
    try {
      const data = await api.post<SessionAnalysis>("/chatbot/analyze-session", {
        conversationId,
      });
      setAnalysis(data);
      setTimeout(() => setIsVisible(true), 500);
    } catch {
      // Silently fail — session analysis is optional
    } finally {
      setLoading(false);
    }
  }, [conversationId, loading, analysis]);

  // Auto-trigger when threshold reached
  useEffect(() => {
    if (shouldAnalyze && !analysis && !dismissed) {
      const timer = setTimeout(fetchAnalysis, 2000);
      return () => clearTimeout(timer);
    }
  }, [shouldAnalyze, analysis, dismissed, fetchAnalysis]);

  const fluencyColor =
    analysis?.fluencyTrend === "improving"
      ? "var(--success)"
      : analysis?.fluencyTrend === "declining"
        ? "var(--error)"
        : "var(--text-muted)";

  const fluencyIcon =
    analysis?.fluencyTrend === "improving"
      ? "↑"
      : analysis?.fluencyTrend === "declining"
        ? "↓"
        : "→";

  if (dismissed || !analysis) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <m.div
          initial={{ opacity: 0, y: 20, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.98 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="mt-6 mx-auto w-full max-w-2xl"
        >
          <Card shadowSize="default" className="overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b-2 border-border bg-accent/5">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-accent flex items-center gap-1.5">
                <Award size={12} />
                Session Report Card
              </span>
              <button
                onClick={() => setDismissed(true)}
                className="text-[10px] font-bold text-text-muted cursor-pointer bg-transparent border-none hover:text-ink transition-colors"
              >
                Dismiss
              </button>
            </div>

            <div className="p-5 flex flex-col gap-5">
              {/* Score Rings Row */}
              <div className="flex items-center justify-center gap-8">
                <div className="relative">
                  <ScoreRing score={analysis.grammarScore} label="Grammar" color="var(--accent)" />
                </div>
                <div className="relative">
                  <ScoreRing score={analysis.fluencyScore} label="Fluency" color={fluencyColor} />
                </div>
                <div className="flex flex-col items-center gap-1.5">
                  <div className="w-14 h-14 rounded-xl border-2 border-accent bg-accent/10 grid place-items-center">
                    <span className="text-sm font-black text-accent">{analysis.cefrEstimate}</span>
                  </div>
                  <span className="text-[9px] font-extrabold uppercase tracking-widest text-text-muted">
                    Level
                  </span>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-xl border-2 border-border bg-surface-alt p-3 text-center">
                  <div className="text-lg font-black text-ink font-mono">
                    {analysis.exchangeCount}
                  </div>
                  <div className="text-[9px] font-extrabold text-text-muted uppercase tracking-wide mt-0.5">
                    Exchanges
                  </div>
                </div>
                <div className="rounded-xl border-2 border-border bg-surface-alt p-3 text-center">
                  <div className="text-lg font-black text-success font-mono">
                    {analysis.newVocabUsed.length}
                  </div>
                  <div className="text-[9px] font-extrabold text-text-muted uppercase tracking-wide mt-0.5">
                    New Words
                  </div>
                </div>
                <div className="rounded-xl border-2 border-border bg-surface-alt p-3 text-center">
                  <div className="text-lg font-black font-mono" style={{ color: fluencyColor }}>
                    {fluencyIcon} {analysis.fluencyScore}%
                  </div>
                  <div className="text-[9px] font-extrabold text-text-muted uppercase tracking-wide mt-0.5">
                    Fluency
                  </div>
                </div>
              </div>

              {/* Repeated Errors */}
              {analysis.repeatedErrors.length > 0 && (
                <div>
                  <div className="text-[10px] font-extrabold uppercase tracking-widest text-warning mb-2 flex items-center gap-1.5">
                    <XCircle size={11} /> Errors to Watch
                  </div>
                  <div className="flex flex-col gap-1.5">
                    {analysis.repeatedErrors.slice(0, 3).map((err, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg border-2 border-border bg-surface text-xs"
                      >
                        <span className="text-error font-bold line-through">{err.wrong}</span>
                        <ChevronRight size={10} className="text-text-muted" />
                        <span className="text-success font-bold">{err.correct}</span>
                        <span className="text-text-muted ml-auto text-[10px]">{err.rule}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* New Vocab */}
              {analysis.newVocabUsed.length > 0 && (
                <div>
                  <div className="text-[10px] font-extrabold uppercase tracking-widest text-success mb-2 flex items-center gap-1.5">
                    <CheckCircle size={11} /> New Vocabulary Used
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {analysis.newVocabUsed.map((word) => (
                      <span
                        key={word}
                        className="px-2.5 py-1 rounded-lg border-2 border-success/20 bg-success/5 text-[11px] font-bold text-success"
                      >
                        {word}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommendation */}
              <Link
                href={analysis.recommendation.actionUrl}
                className="flex items-center gap-3 px-4 py-3 rounded-xl border-2 border-accent/20 bg-accent/5 no-underline transition-colors hover:bg-accent/10"
              >
                <BookOpen size={16} className="text-accent shrink-0" />
                <div className="flex-1">
                  <div className="text-xs font-bold text-ink">Recommended Next Step</div>
                  <div className="text-[11px] text-text-muted mt-0.5">
                    {analysis.recommendation.text}
                  </div>
                </div>
                <ChevronRight size={14} className="text-accent" />
              </Link>
            </div>
          </Card>
        </m.div>
      )}
    </AnimatePresence>
  );
}
