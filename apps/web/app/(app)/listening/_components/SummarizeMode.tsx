"use client";

import {
  AlertTriangle,
  CircleCheckBig,
  Eye,
  FileText,
  Headphones,
  Info,
  Loader2,
  RefreshCw,
  Send,
  XCircle,
} from "lucide-react";
import { motion } from "motion/react";
import { useCallback, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { api } from "@/lib/api-client";
import type { CefrLevel } from "@/lib/listening/types";
import { CEFR_LEVELS } from "@/lib/listening/types";
import { AudioPlayer } from "./AudioPlayer";

// ── Types ──
type CoverageItem = {
  idea: string;
  covered: boolean;
  whereInSummary?: string;
};

type ScoreResult = {
  attemptId: string;
  overall: number;
  accuracyScore: number;
  coverageScore: number;
  concisenessScore: number;
  keyIdeas: string[];
  coverage: CoverageItem[];
  feedback: string;
  passage: string;
};

type Exercise = {
  id: string;
  level: string;
  audioUrl: string;
};

type SummarizeState = "idle" | "listening" | "writing" | "scoring" | "result";

interface Props {
  examMode: string;
}

function scoreColorClass(n: number): string {
  if (n >= 80) return "text-[var(--success)]";
  if (n >= 60) return "text-[var(--warning)]";
  return "text-[var(--error)]";
}

function scoreStroke(n: number): string {
  if (n >= 80) return "var(--success)";
  if (n >= 60) return "var(--warning)";
  return "var(--error)";
}

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

// Noop handlers for AudioPlayer (unlimited replays in summarize mode)
const noop = () => true;
const noopVoid = () => {};

export default function SummarizeMode({ examMode }: Props) {
  const [state, setState] = useState<SummarizeState>("idle");
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [summaryText, setSummaryText] = useState("");
  const [result, setResult] = useState<ScoreResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showPassage, setShowPassage] = useState(false);
  // Adaptive level selection (D1 resolution)
  const [selectedLevel, setSelectedLevel] = useState<CefrLevel>("B1");

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const wc = wordCount(summaryText);
  const wcOk = wc >= 30 && wc <= 400;
  const wcColor =
    wc < 30 ? "text-text-muted" : wc > 400 ? "text-[var(--error)]" : "text-[var(--success)]";

  // ── Generate exercise ──
  const startSession = useCallback(async () => {
    setState("idle");
    setError(null);
    setExercise(null);
    setSummaryText("");
    setResult(null);
    setShowPassage(false);

    setState("listening");
    try {
      const data = await api.post<Exercise>("/listening/generate", {
        level: selectedLevel.toLowerCase(), // use selected level (D1 fix)
        exerciseType: "comprehension",
        examMode,
      });
      setExercise(data);
    } catch {
      setError("Unable to generate listening exercise. Please try again.");
      setState("idle");
    }
  }, [examMode, selectedLevel]);

  // ── Submit summary ──
  const submitSummary = useCallback(async () => {
    if (!exercise || !wcOk) return;
    setState("scoring");
    setError(null);

    try {
      const data = await api.post<ScoreResult>("/listening/summary-score", {
        exerciseId: exercise.id,
        summary: summaryText.trim(),
      });
      setResult(data);
      setState("result");
    } catch (err: unknown) {
      // Extract server error message from API client error shape
      type ApiError = { response?: { data?: { error?: string } }; message?: string };
      const apiErr = err as ApiError;
      const msg =
        apiErr?.response?.data?.error ??
        apiErr?.message ??
        "An error occurred while scoring. Please try again.";
      setError(msg);
      setState("writing");
    }
  }, [exercise, summaryText, wcOk]);

  // ── RENDER ──
  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col gap-5">
      {/* Error banner */}
      {error && (
        <div className="py-2.5 px-4 rounded-lg text-[var(--error)] text-[13px] bg-error-bg border border-[color-mix(in_srgb,var(--error)_25%,var(--border))] flex items-center gap-1.5">
          <AlertTriangle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      {/* ── Idle: level picker + start ── */}
      {state === "idle" && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 shadow"
        >
          {/* Wrap idle content in Card */}
          <div className="text-center mb-6">
            <FileText size={40} className="text-accent mx-auto mb-2" />
            <h2 className="text-lg font-bold m-0 mb-1.5 text-text-primary">
              Listen &amp; Summarize
            </h2>
            <p className="text-text-secondary m-0 text-[13px]">
              Listen to the passage → Summarize → AI grades key ideas
            </p>
          </div>

          {/* Compact CEFR level selector */}
          <div className="mb-5">
            <div className="text-[11px] font-bold text-text-muted mb-2.5 uppercase tracking-widest">
              CEFR Level
            </div>
            <div className="flex gap-2 flex-wrap">
              {CEFR_LEVELS.map((l) => (
                <motion.button
                  key={l}
                  onClick={() => setSelectedLevel(l)}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  className={`py-1.5 px-3.5 rounded-lg font-bold text-[13px] cursor-pointer border transition-all duration-100 ${
                    selectedLevel === l
                      ? "border-primary bg-primary text-primary-foreground shadow-sm -translate-y-0.5"
                      : "border-border bg-surface text-text-primary hover:bg-surface-hover"
                  }`}
                >
                  {l}
                </motion.button>
              ))}
            </div>
            <p className="text-[11px] text-text-muted mt-1.5">
              Selected: <strong>{selectedLevel}</strong> · 3–5 sentences · 30–400 words
            </p>
          </div>

          <Button onClick={startSession} className="w-full h-11 text-[15px] font-bold">
            Start
          </Button>
        </motion.div>
      )}

      {/* ── Loading audio ── */}
      {state === "listening" && !exercise && (
        <div className="text-center py-10">
          <Loader2 className="animate-spin text-accent mx-auto" size={32} />
          <p className="text-text-secondary mt-3">Generating listening exercise...</p>
        </div>
      )}

      {/* ── Listening: player + write prompt ── */}
      {(state === "listening" || state === "writing") && exercise && (
        <>
          {/* Instruction */}
          <Card
            shadowSize="sm"
            className="py-3 px-4 text-[13px] text-text-secondary flex items-start gap-2"
          >
            <Headphones className="h-4 w-4 shrink-0 text-accent mt-0.5" />
            <span>
              <strong>Listen to the passage below.</strong> The original transcript will be revealed
              after you submit your summary.
            </span>
          </Card>

          {/* AudioPlayer (AC1 — reuses 19.3.2 component with A-B loop + speed) */}
          <AudioPlayer
            audioUrl={exercise.audioUrl}
            speed={1}
            replaysUsed={0}
            maxReplays={999}
            onReplay={noop}
            onCycleSpeed={noopVoid}
            selfManagedSpeed
          />

          {/* Summary textarea — shown after first play or via button */}
          {state === "writing" && (
            <div className="flex flex-col gap-2.5">
              <label
                htmlFor="summarize-textarea"
                className="text-[13px] font-bold text-text-primary"
              >
                Summarize the passage in your own words (3–5 sentences):
              </label>
              <textarea
                id="summarize-textarea"
                ref={textareaRef}
                value={summaryText}
                onChange={(e) => setSummaryText(e.target.value)}
                placeholder="Write your summary here... (minimum 30 words, maximum 400 words)"
                rows={6}
                className="w-full rounded-lg border border-border text-sm p-3.5 bg-surface leading-[1.7] resize-y text-text-primary font-[inherit] outline-none focus-visible:shadow-sm focus-visible:-translate-y-0.5 transition-all"
              />
              {/* Word count indicator */}
              <div className="flex justify-between items-center text-xs">
                <span className={`font-bold flex items-center gap-1 ${wcColor}`}>
                  {wc} words{" "}
                  {wc < 30 ? (
                    "(minimum 30 required)"
                  ) : wc > 400 ? (
                    "(too long, maximum 400)"
                  ) : (
                    <CircleCheckBig size={14} className="text-[var(--success)]" />
                  )}
                </span>
                <Button
                  onClick={submitSummary}
                  disabled={!wcOk}
                  className="text-[13px] font-bold py-2.5 px-5 flex items-center gap-1.5"
                >
                  <Send size={14} /> Submit
                </Button>
              </div>
            </div>
          )}

          {/* "Start writing" button — shows after listening */}
          {state === "listening" && (
            <div className="text-center">
              <motion.button
                onClick={() => setState("writing")}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.97 }}
                className="rounded-lg bg-transparent text-accent text-[13px] font-bold cursor-pointer py-2.5 px-6 border border-accent hover:bg-accent-light hover:shadow-sm transition-all duration-100"
              >
                Finished Listening → Start Summarizing
              </motion.button>
            </div>
          )}
        </>
      )}

      {/* ── Scoring ── */}
      {state === "scoring" && (
        <div className="text-center py-10">
          <Loader2 className="animate-spin text-accent mx-auto" size={32} />
          <p className="text-text-secondary mt-3">AI is grading your summary...</p>
        </div>
      )}

      {/* ── Result ── */}
      {state === "result" && result && (
        <div className="flex flex-col gap-4">
          {/* Score overview */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-6 text-center shadow"
          >
            {/* Custom circular progress */}
            <div className="relative w-[110px] h-[110px] mx-auto mb-2">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  fill="none"
                  stroke="var(--bg-deep)"
                  strokeWidth="8"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  fill="none"
                  stroke={scoreStroke(result.overall)}
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${result.overall * 2.64} 264`}
                  className="transition-all duration-700 ease-out"
                />
              </svg>
              <span
                className={`absolute inset-0 flex items-center justify-center text-[26px] font-bold ${scoreColorClass(result.overall)}`}
              >
                {result.overall}
              </span>
            </div>
            <p className="text-[13px] text-text-secondary mt-3">Overall Score</p>

            {/* Sub-scores */}
            <div className="flex justify-center gap-6 mt-4">
              {[
                { label: "Accuracy", value: result.accuracyScore },
                { label: "Coverage", value: result.coverageScore },
                { label: "Conciseness", value: result.concisenessScore },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-[11px] text-text-secondary mb-1">{label}</p>
                  <p className={`text-lg font-bold m-0 ${scoreColorClass(value)}`}>{value}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Feedback */}
          {result.feedback && (
            <Card shadowSize="sm" className="p-4">
              <p className="text-xs font-bold text-text-secondary mb-1.5 flex items-center gap-1">
                <Info size={12} /> AI Feedback:
              </p>
              <p className="text-[13px] m-0 leading-relaxed text-text-primary">{result.feedback}</p>
            </Card>
          )}

          {/* Key ideas coverage (AC3 — color-coded) */}
          <Card shadowSize="sm" className="p-4">
            <p className="text-xs font-bold text-text-secondary mb-2.5">
              Key ideas in the passage:
            </p>
            <div className="flex flex-col gap-2">
              {result.coverage.map((item, i) => (
                <div
                  key={i}
                  className={`flex items-start gap-2 py-2 px-3 rounded-lg border ${
                    item.covered
                      ? "bg-success-bg border-[color-mix(in_srgb,var(--success)_20%,transparent)]"
                      : "bg-error-bg border-[color-mix(in_srgb,var(--error)_20%,transparent)]"
                  }`}
                >
                  <span className="text-sm shrink-0 mt-0.5">
                    {item.covered ? (
                      <CircleCheckBig size={15} className="text-[var(--success)]" />
                    ) : (
                      <XCircle size={15} className="text-[var(--error)]" />
                    )}
                  </span>
                  <div className="flex-1">
                    <p className="m-0 text-[13px] font-medium text-text-primary">{item.idea}</p>
                    {item.covered && item.whereInSummary && (
                      <p className="text-[11px] text-text-muted italic mt-0.5">
                        {item.whereInSummary}
                      </p>
                    )}
                  </div>
                  <span
                    className={`shrink-0 text-[11px] font-bold py-0.5 px-2 rounded-lg border ml-auto ${
                      item.covered
                        ? "bg-success-bg border-[var(--success)] text-[var(--success)]"
                        : "bg-error-bg border-[var(--error)] text-[var(--error)]"
                    }`}
                  >
                    {item.covered ? "Covered" : "Missing"}
                  </span>
                </div>
              ))}
            </div>
          </Card>

          {/* Your summary */}
          <Card shadowSize="sm" className="p-4">
            <p className="text-xs font-bold text-text-secondary mb-1.5">Your summary:</p>
            <p className="text-sm m-0 italic leading-[1.7] text-text-primary">{summaryText}</p>
          </Card>

          {/* Transcript reveal (AC3 — revealed after submission) */}
          <Card shadowSize="sm" className="p-4">
            <button
              onClick={() => setShowPassage((p) => !p)}
              className="flex items-center gap-1.5 bg-transparent border-none cursor-pointer text-accent text-[13px] font-bold p-0 hover:underline"
            >
              <Eye size={14} />
              {showPassage ? "Hide original transcript" : "Show original transcript"}
            </button>
            {showPassage && (
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="text-sm mt-2.5 leading-[1.8] text-text-primary"
              >
                {result.passage}
              </motion.p>
            )}
          </Card>

          {/* Actions */}
          <div className="flex gap-3 justify-center">
            <motion.button
              onClick={() => {
                setState("writing");
                setResult(null);
                setSummaryText("");
                setShowPassage(false);
              }}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.97 }}
              className="rounded-lg border border-border bg-surface cursor-pointer text-[13px] font-bold py-2.5 px-5 text-text-primary hover:bg-surface-hover hover:shadow-sm transition-all duration-100 flex items-center gap-1.5"
            >
              <RefreshCw size={14} /> Rewrite
            </motion.button>
            <Button
              onClick={startSession}
              className="text-[13px] font-bold py-2.5 px-5 flex items-center gap-1.5"
            >
              New Exercise
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
