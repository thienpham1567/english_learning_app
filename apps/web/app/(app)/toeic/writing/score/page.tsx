"use client";

import { Progress, Tag, Tooltip } from "antd";
import {
  AlertTriangle,
  BookOpen,
  Calculator,
  CircleCheckBig,
  ClipboardList,
  Highlighter,
  Info,
  Link as LinkIcon,
  Loader2,
  Pencil,
  RefreshCw,
  Target,
} from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { RewritePanel } from "@/app/(app)/toeic/skills/_components/writing/RewritePanel";
import { useExamMode } from "@/components/shared/ExamModeProvider";
import { api } from "@/lib/api-client";

/* ── Types ─────────────────────────────────────────────────── */

type InlineIssue = {
  quote: string;
  startOffset: number;
  endOffset: number;
  category: "grammar" | "word-choice" | "coherence" | "task";
  suggestion: string;
  explanation: string;
};

type CriterionResult = { score: number; feedback: string };

type ScoreResult = {
  overall: number;
  criteria: {
    taskResponse: CriterionResult;
    coherence: CriterionResult;
    lexical: CriterionResult;
    grammar: CriterionResult;
  };
  inlineIssues: InlineIssue[];
  strengths: string[];
  nextSteps: string[];
  wordCount: number;
};

type ExamType = "ielts-task2" | "ielts-task1" | "toefl-independent";
type PageState = "input" | "scoring" | "result";

const EXAM_OPTIONS: { value: ExamType; label: string }[] = [
  { value: "ielts-task2", label: "IELTS Task 2" },
  { value: "ielts-task1", label: "IELTS Task 1" },
  { value: "toefl-independent", label: "TOEFL Independent" },
];

const CATEGORY_COLORS: Record<string, string> = {
  grammar: "var(--error)",
  "word-choice": "var(--warning)",
  coherence: "var(--info)",
  task: "var(--accent)",
};

/* ── InlineIssueItem ─────────────────────────────────────── */

function InlineIssueItem({
  issue,
  isHovered,
  onMouseEnter,
  onMouseLeave,
}: {
  issue: InlineIssue;
  isHovered: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}) {
  const [showRewrite, setShowRewrite] = useState(false);
  const color = CATEGORY_COLORS[issue.category] ?? "var(--text-muted)";

  return (
    <div
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className="text-[13px] rounded-lg overflow-hidden"
      style={{
        background: isHovered ? `${color}15` : "var(--surface)",
        borderLeft: `3px solid ${color}`,
      }}
    >
      <div className="py-2 px-3 cursor-pointer">
        <div className="flex justify-between items-start">
          <div>
            <Tag color={color} className="text-[10px]">
              {issue.category}
            </Tag>
            <span className="text-text-muted" style={{ textDecoration: "line-through" }}>
              {issue.quote}
            </span>
            {" → "}
            <span className="text-emerald-500 font-medium">{issue.suggestion}</span>
          </div>
          <button
            onClick={() => setShowRewrite((p) => !p)}
            title="Rewrite this sentence"
            className="border-none text-[11px] font-medium cursor-pointer rounded-md shrink-0 ml-2"
            style={{
              background: showRewrite ? `${color}20` : "transparent",
              color: showRewrite ? color : "var(--text-secondary)",
              padding: "2px 8px",
              whiteSpace: "nowrap",
            }}
          >
            <Highlighter /> Rewrite
          </button>
        </div>
        <p className="text-[11px] text-text-secondary" style={{ margin: "4px 0 0" }}>
          {issue.explanation}
        </p>
      </div>

      {showRewrite && (
        <div
          style={{
            padding: "0 12px 12px",
            borderTop: `1px solid ${color}20`,
            paddingTop: 10,
          }}
        >
          <RewritePanel initialSentence={issue.quote} compact />
        </div>
      )}
    </div>
  );
}

/* ── Component ─────────────────────────────────────────────── */

export default function EssayScorePage() {
  const { examMode } = useExamMode();

  const [state, setState] = useState<PageState>("input");
  const [exam, setExam] = useState<ExamType>(
    (examMode as string) === "toefl" ? "toefl-independent" : "ielts-task2",
  );
  const [essayText, setEssayText] = useState("");
  const [prompt, setPrompt] = useState("");
  const [result, setResult] = useState<ScoreResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hoveredIssue, setHoveredIssue] = useState<number | null>(null);

  const wordCount = useMemo(
    () => essayText.trim().split(/\s+/).filter(Boolean).length,
    [essayText],
  );

  /* ── Submit ────────────────────────────────── */

  const submitEssay = useCallback(async () => {
    if (wordCount < 150) {
      setError("Essay must be at least 150 words.");
      return;
    }
    setError(null);
    setState("scoring");

    try {
      const data = await api.post<ScoreResult>("/writing/score", {
        text: essayText,
        exam,
        prompt: prompt || undefined,
      });
      setResult(data);
      setState("result");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An error occurred";
      if (msg.includes("under-length")) {
        setError("Essay is too short (must be at least 150 words).");
      } else if (msg.includes("Rate limit")) {
        setError("You have scored too many essays. Please wait 1 minute.");
      } else {
        setError(msg);
      }
      setState("input");
    }
  }, [essayText, exam, prompt, wordCount]);

  /* ── Reset ─────────────────────────────────── */

  const startNew = useCallback(() => {
    setEssayText("");
    setPrompt("");
    setResult(null);
    setError(null);
    setState("input");
  }, []);

  /* ── Inline highlights ─────────────────────── */

  // Sorted issues — stable reference, does NOT depend on hoveredIssue
  const sortedIssues = useMemo(() => {
    if (!result || result.inlineIssues.length === 0) return [];
    return [...result.inlineIssues].sort((a, b) => a.startOffset - b.startOffset);
  }, [result]);

  // Highlight segments — stable reference, does NOT depend on hoveredIssue
  const highlightSegments = useMemo(() => {
    if (sortedIssues.length === 0) return null;
    const segments: React.ReactNode[] = [];
    let cursor = 0;

    sortedIssues.forEach((issue, idx) => {
      // Skip overlapping issues
      if (issue.startOffset < cursor) return;

      if (issue.startOffset > cursor) {
        segments.push(essayText.slice(cursor, issue.startOffset));
      }

      segments.push(
        <Tooltip
          key={idx}
          title={
            <div className="text-xs">
              <div className="font-semibold mb-1">
                <Tag color={CATEGORY_COLORS[issue.category]} className="text-[10px]">
                  {issue.category}
                </Tag>
              </div>
              <div>→ {issue.suggestion}</div>
              <div className="text-text-muted mt-1">{issue.explanation}</div>
            </div>
          }
        >
          <span
            data-issue-idx={idx}
            onMouseEnter={() => setHoveredIssue(idx)}
            onMouseLeave={() => setHoveredIssue(null)}
            className="cursor-pointer rounded-sm"
            style={{
              backgroundColor: `${CATEGORY_COLORS[issue.category]}20`,
              borderBottom: `2px solid ${CATEGORY_COLORS[issue.category]}`,
              transition: "background 0.2s",
              padding: "1px 0",
            }}
          >
            {essayText.slice(issue.startOffset, issue.endOffset)}
          </span>
        </Tooltip>,
      );

      cursor = issue.endOffset;
    });

    if (cursor < essayText.length) {
      segments.push(essayText.slice(cursor));
    }

    return segments;
  }, [sortedIssues, essayText]);

  /* ── Helpers ──────────────────────────────── */

  const isIelts = exam.startsWith("ielts");
  const maxScore = isIelts ? 9 : 30;
  const scoreColor = (s: number) => {
    const pct = s / maxScore;
    return pct >= 0.75 ? "var(--success)" : pct >= 0.5 ? "var(--warning)" : "var(--error)";
  };

  /* ── Render ──────────────────────────────── */

  return (
    <div className="flex flex-col h-full h-[0px] flex-1 overflow-auto">
      {/* Header */}
      <div style={{ padding: "24px 24px 16px", borderBottom: "1px solid var(--border)" }}>
        <div className="flex items-center gap-2.5 mb-1">
          <Pencil size={22} className="text-accent" />
          <h1 className="m-0 text-xl font-bold">Rubric Essay Scorer</h1>
        </div>
        <p className="m-0 text-[13px] text-text-secondary">
          Submit your essay and receive a detailed score breakdown according to IELTS/TOEFL rubrics
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 p-6 w-[800px] mx-auto w-full">
        {/* Error */}
        {error && (
          <div
            className="py-2.5 px-4 rounded-lg text-destructive mb-4 text-[13px]"
            style={{ background: "var(--error-bg)" }}
          >
            {error}
          </div>
        )}

        {/* Input */}
        {state === "input" && (
          <div className="flex flex-col gap-4">
            {/* Exam selector */}
            <div>
              <p className="text-xs text-text-secondary mb-2 font-semibold">Exam Type</p>
              <div className="flex gap-2 flex-wrap">
                {EXAM_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setExam(opt.value)}
                    className="py-2 px-4 rounded-lg cursor-pointer text-[13px]"
                    style={{
                      border:
                        exam === opt.value ? "2px solid var(--accent)" : "1px solid var(--border)",
                      background: exam === opt.value ? "var(--accent-muted)" : "transparent",
                      color: exam === opt.value ? "var(--accent)" : "var(--text-secondary)",
                      fontWeight: exam === opt.value ? 600 : 400,
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Prompt field */}
            <div>
              <p className="text-xs text-text-secondary mb-2 font-semibold">
                Prompt <span className="font-normal">(optional)</span>
              </p>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Paste the prompt here so that the AI can evaluate Task Response more accurately..."
                className="w-full h-[60px] p-3 border-2 border-border text-[13px]"
                style={{
                  borderRadius: 10,
                  background: "var(--card-bg)",
                  color: "var(--text)",
                  resize: "vertical",
                  fontFamily: "inherit",
                }}
              />
            </div>

            {/* Essay textarea */}
            <div>
              <div className="flex justify-between mb-2">
                <p className="text-xs text-text-secondary m-0 font-semibold">Essay</p>
                <span
                  className="text-[11px] font-medium"
                  style={{
                    color:
                      wordCount < 150
                        ? "var(--error)"
                        : wordCount > 2000
                          ? "var(--error)"
                          : "var(--text-secondary)",
                  }}
                >
                  {wordCount} words {wordCount < 150 && "(needs ≥ 150)"}
                </span>
              </div>
              <textarea
                value={essayText}
                onChange={(e) => setEssayText(e.target.value)}
                placeholder="Write or paste your essay here..."
                className="w-full h-[280px] p-4 rounded-xl border-2 border-border text-sm"
                style={{
                  background: "var(--card-bg)",
                  color: "var(--text)",
                  lineHeight: 1.8,
                  resize: "vertical",
                  fontFamily: "inherit",
                }}
              />
            </div>

            <button
              onClick={submitEssay}
              disabled={wordCount < 150}
              className="border-none text-[15px] font-semibold"
              style={{
                padding: "12px 32px",
                borderRadius: 10,
                background: wordCount < 150 ? "var(--border)" : "var(--accent)",
                color: "var(--text-on-accent)",
                cursor: wordCount < 150 ? "not-allowed" : "pointer",
                alignSelf: "center",
              }}
            >
              <Pencil /> Score Essay
            </button>
          </div>
        )}

        {/* Scoring */}
        {state === "scoring" && (
          <div className="text-center" style={{ padding: 48 }}>
            <Loader2 className="animate-spin text-accent" size={36} />
            <p className="text-text-secondary mt-4 text-sm">
              Scoring essay ({wordCount} words)...
            </p>
            <p className="text-text-secondary text-xs">This process may take 10–20 seconds</p>
          </div>
        )}

        {/* Result */}
        {state === "result" && result && (
          <div className="flex flex-col gap-4">
            {/* Overall score */}
            <div
              className="p-6 rounded-2xl border-2 border-border text-center"
              style={{ background: "var(--card-bg)" }}
            >
              <Progress
                type="circle"
                percent={(result.overall / maxScore) * 100}
                size={100}
                strokeColor={scoreColor(result.overall)}
                format={() => (
                  <span className="text-2xl font-bold">
                    {result.overall}
                    {isIelts ? "" : `/${maxScore}`}
                  </span>
                )}
              />
              <p className="text-[13px] text-text-secondary mt-2">
                {EXAM_OPTIONS.find((o) => o.value === exam)?.label} • {result.wordCount} words
              </p>

              {/* Criteria scores */}
              <div className="flex justify-center gap-5 mt-4 flex-wrap">
                {(
                  [
                    { key: "taskResponse", label: "Task" },
                    { key: "coherence", label: "Coherence" },
                    { key: "lexical", label: "Lexical" },
                    { key: "grammar", label: "Grammar" },
                  ] as const
                ).map((c) => {
                  const s = result.criteria[c.key];
                  return (
                    <Tooltip key={c.key} title={s.feedback}>
                      <div className="cursor-pointer">
                        <p className="text-[11px] text-text-secondary m-0">{c.label}</p>
                        <p
                          className="text-lg font-semibold m-0"
                          style={{ color: scoreColor(s.score) }}
                        >
                          {s.score}
                        </p>
                      </div>
                    </Tooltip>
                  );
                })}
              </div>
            </div>

            {/* Criteria feedback */}
            {(
              [
                {
                  key: "taskResponse",
                  label: (
                    <>
                      <ClipboardList /> Task Response
                    </>
                  ),
                  icon: null,
                },
                {
                  key: "coherence",
                  label: (
                    <>
                      <LinkIcon /> Coherence &amp; Cohesion
                    </>
                  ),
                  icon: null,
                },
                {
                  key: "lexical",
                  label: (
                    <>
                      <BookOpen /> Lexical Resource
                    </>
                  ),
                  icon: null,
                },
                {
                  key: "grammar",
                  label: (
                    <>
                      <Calculator /> Grammar
                    </>
                  ),
                  icon: null,
                },
              ] as const
            ).map((c) => {
              const s = result.criteria[c.key];
              return (
                <div
                  key={c.key}
                  className="p-4 rounded-xl border-2 border-border"
                  style={{ background: "var(--card-bg)" }}
                >
                  <div className="flex justify-between mb-1">
                    <p className="text-xs text-text-secondary m-0 font-semibold">{c.label}</p>
                    <Tag color={scoreColor(s.score)} className="text-xs font-semibold">
                      {s.score}
                    </Tag>
                  </div>
                  <p className="text-[13px] m-0 leading-relaxed">{s.feedback}</p>
                </div>
              );
            })}

            {/* Essay with inline highlights */}
            <div
              className="p-4 rounded-xl border-2 border-border"
              style={{ background: "var(--card-bg)" }}
            >
              <div className="flex justify-between mb-2">
                <p className="text-xs text-text-secondary m-0 font-semibold">
                  <Info /> Essay (hover to see suggestions)
                </p>
                <div className="flex gap-1.5">
                  {Object.entries(CATEGORY_COLORS).map(([cat, color]) => (
                    <Tag
                      key={cat}
                      color="default"
                      className="text-[9px]"
                      style={{ borderColor: color, color }}
                    >
                      {cat}
                    </Tag>
                  ))}
                </div>
              </div>
              <div
                className="text-sm"
                style={{ lineHeight: 1.8, whiteSpace: "pre-wrap", wordBreak: "break-word" }}
              >
                {highlightSegments ?? essayText}
              </div>
            </div>

            {/* Inline issues list */}
            {result.inlineIssues.length > 0 && (
              <div
                className="p-4 rounded-xl border-2 border-border"
                style={{ background: "var(--card-bg)" }}
              >
                <p className="text-xs text-text-secondary mb-2 font-semibold">
                  <AlertTriangle /> Detailed Corrections ({result.inlineIssues.length})
                </p>
                <div className="flex flex-col gap-2">
                  {result.inlineIssues.map((issue, i) => (
                    <InlineIssueItem
                      key={i}
                      issue={issue}
                      isHovered={hoveredIssue === i}
                      onMouseEnter={() => setHoveredIssue(i)}
                      onMouseLeave={() => setHoveredIssue(null)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Strengths & Next Steps */}
            <div
              className="grid gap-4"
              style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}
            >
              <div
                className="p-4 rounded-xl border-2 border-border"
                style={{ background: "var(--card-bg)" }}
              >
                <p className="text-xs text-text-secondary mb-2 font-semibold">
                  <CircleCheckBig className="text-emerald-500" /> Strengths
                </p>
                <ul className="m-0 text-[13px]" style={{ paddingLeft: 16, lineHeight: 1.8 }}>
                  {result.strengths.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>
              <div
                className="p-4 rounded-xl border-2 border-border"
                style={{ background: "var(--card-bg)" }}
              >
                <p className="text-xs text-text-secondary mb-2 font-semibold">
                  <Target /> Areas to Improve
                </p>
                <ul className="m-0 text-[13px]" style={{ paddingLeft: 16, lineHeight: 1.8 }}>
                  {result.nextSteps.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Actions */}
            <div className="text-center">
              <button
                onClick={startNew}
                className="rounded-lg border-none text-sm font-semibold cursor-pointer"
                style={{
                  padding: "10px 24px",
                  background: "var(--accent)",
                  color: "var(--text-on-accent)",
                }}
              >
                <RefreshCw /> Score New Essay
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
