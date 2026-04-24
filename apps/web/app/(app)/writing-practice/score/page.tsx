"use client";

import { api } from "@/lib/api-client";
import { useState, useCallback, useMemo } from "react";
import {
  EditOutlined,
  LoadingOutlined,
  CheckCircleOutlined,
  ReloadOutlined,
  InfoCircleOutlined,
  WarningOutlined,
  FormOutlined,
  BookOutlined,
  AimOutlined,
  HighlightOutlined,
  LinkOutlined,
  CalculatorOutlined,
} from "@ant-design/icons";
import { Progress, Tag, Tooltip } from "antd";

import { useExamMode } from "@/components/shared/ExamModeProvider";
import { RewritePanel } from "@/app/(app)/writing-practice/_components/RewritePanel";

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
      style={{
        fontSize: 13,
        borderRadius: 8,
        background: isHovered ? `${color}15` : "var(--surface)",
        borderLeft: `3px solid ${color}`,
        overflow: "hidden",
      }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div style={{ padding: "8px 12px", cursor: "pointer" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <Tag color={color} style={{ fontSize: 10 }}>{issue.category}</Tag>
            <span style={{ textDecoration: "line-through", color: "var(--text-muted)" }}>{issue.quote}</span>
            {" → "}
            <span style={{ color: "var(--success)", fontWeight: 500 }}>{issue.suggestion}</span>
          </div>
          <button
            onClick={() => setShowRewrite((p) => !p)}
            title="Rewrite this sentence"
            style={{
              border: "none",
              background: showRewrite ? `${color}20` : "transparent",
              color: showRewrite ? color : "var(--text-secondary)",
              fontSize: 11,
              fontWeight: 500,
              cursor: "pointer",
              borderRadius: 6,
              padding: "2px 8px",
              whiteSpace: "nowrap",
              flexShrink: 0,
              marginLeft: 8,
            }}
          >
            <HighlightOutlined /> Viết lại
          </button>
        </div>
        <p style={{ margin: "4px 0 0", fontSize: 11, color: "var(--text-secondary)" }}>
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

  const wordCount = useMemo(() => essayText.trim().split(/\s+/).filter(Boolean).length, [essayText]);

  /* ── Submit ────────────────────────────────── */

  const submitEssay = useCallback(async () => {
    if (wordCount < 150) {
      setError("Bài viết cần ít nhất 150 từ.");
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
      const msg = err instanceof Error ? err.message : "Có lỗi xảy ra";
      if (msg.includes("under-length")) {
        setError("Bài viết quá ngắn (cần ít nhất 150 từ).");
      } else if (msg.includes("Rate limit")) {
        setError("Bạn đã chấm quá nhiều bài. Vui lòng đợi 1 phút.");
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
            <div style={{ fontSize: 12 }}>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>
                <Tag color={CATEGORY_COLORS[issue.category]} style={{ fontSize: 10 }}>{issue.category}</Tag>
              </div>
              <div>→ {issue.suggestion}</div>
              <div style={{ color: "var(--text-muted)", marginTop: 4 }}>{issue.explanation}</div>
            </div>
          }
        >
          <span
            data-issue-idx={idx}
            style={{
              backgroundColor: `${CATEGORY_COLORS[issue.category]}20`,
              borderBottom: `2px solid ${CATEGORY_COLORS[issue.category]}`,
              cursor: "pointer",
              transition: "background 0.2s",
              borderRadius: 2,
              padding: "1px 0",
            }}
            onMouseEnter={() => setHoveredIssue(idx)}
            onMouseLeave={() => setHoveredIssue(null)}
          >
            {essayText.slice(issue.startOffset, issue.endOffset)}
          </span>
        </Tooltip>
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
    <div style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0, flex: 1, overflow: "auto" }}>
      {/* Header */}
      <div style={{ padding: "24px 24px 16px", borderBottom: "1px solid var(--border)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
          <EditOutlined style={{ fontSize: 22, color: "var(--accent)" }} />
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Chấm bài viết theo rubric</h1>
        </div>
        <p style={{ margin: 0, fontSize: 13, color: "var(--text-secondary)" }}>
          Nộp bài viết và nhận điểm chi tiết theo tiêu chí IELTS/TOEFL
        </p>
      </div>

      {/* Content */}
      <div style={{ flex: 1, padding: 24, maxWidth: 800, margin: "0 auto", width: "100%" }}>
        {/* Error */}
        {error && (
          <div style={{
            padding: "10px 16px", borderRadius: 8,
            background: "var(--error-bg)", color: "var(--error)",
            marginBottom: 16, fontSize: 13,
          }}>
            {error}
          </div>
        )}

        {/* Input */}
        {state === "input" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Exam selector */}
            <div>
              <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: "0 0 8px", fontWeight: 600 }}>Loại bài thi</p>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {EXAM_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setExam(opt.value)}
                    style={{
                      padding: "8px 16px", borderRadius: 8,
                      border: exam === opt.value ? "2px solid var(--accent)" : "1px solid var(--border)",
                      background: exam === opt.value ? "var(--accent-muted)" : "transparent",
                      color: exam === opt.value ? "var(--accent)" : "var(--text-secondary)",
                      fontWeight: exam === opt.value ? 600 : 400, cursor: "pointer", fontSize: 13,
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Prompt field */}
            <div>
              <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: "0 0 8px", fontWeight: 600 }}>
                Đề bài <span style={{ fontWeight: 400 }}>(không bắt buộc)</span>
              </p>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Dán đề bài vào đây để AI đánh giá Task Response chính xác hơn..."
                style={{
                  width: "100%", minHeight: 60, padding: 12, borderRadius: 10,
                  border: "1px solid var(--border)", background: "var(--card-bg)",
                  color: "var(--text)", fontSize: 13, resize: "vertical",
                  fontFamily: "inherit",
                }}
              />
            </div>

            {/* Essay textarea */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: 0, fontWeight: 600 }}>Bài viết</p>
                <span style={{
                  fontSize: 11,
                  color: wordCount < 150 ? "var(--error)" : wordCount > 2000 ? "var(--error)" : "var(--text-secondary)",
                  fontWeight: 500,
                }}>
                  {wordCount} từ {wordCount < 150 && "(cần ≥ 150)"}
                </span>
              </div>
              <textarea
                value={essayText}
                onChange={(e) => setEssayText(e.target.value)}
                placeholder="Viết hoặc dán bài viết của bạn vào đây..."
                style={{
                  width: "100%", minHeight: 280, padding: 16, borderRadius: 12,
                  border: "1px solid var(--border)", background: "var(--card-bg)",
                  color: "var(--text)", fontSize: 14, lineHeight: 1.8,
                  resize: "vertical", fontFamily: "inherit",
                }}
              />
            </div>

            <button
              onClick={submitEssay}
              disabled={wordCount < 150}
              style={{
                padding: "12px 32px", borderRadius: 10, border: "none",
                background: wordCount < 150 ? "var(--border)" : "var(--accent)",
                color: "var(--text-on-accent)", fontSize: 15, fontWeight: 600,
                cursor: wordCount < 150 ? "not-allowed" : "pointer",
                alignSelf: "center",
              }}
            >
              <EditOutlined /> Chấm bài
            </button>
          </div>
        )}

        {/* Scoring */}
        {state === "scoring" && (
          <div style={{ textAlign: "center", padding: 48 }}>
            <LoadingOutlined style={{ fontSize: 36, color: "var(--accent)" }} />
            <p style={{ color: "var(--text-secondary)", marginTop: 16, fontSize: 14 }}>
              Đang chấm bài viết ({wordCount} từ)...
            </p>
            <p style={{ color: "var(--text-secondary)", fontSize: 12 }}>
              Quá trình này có thể mất 10–20 giây
            </p>
          </div>
        )}

        {/* Result */}
        {state === "result" && result && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Overall score */}
            <div style={{
              padding: 24, borderRadius: 16,
              background: "var(--card-bg)", border: "1px solid var(--border)",
              textAlign: "center",
            }}>
              <Progress
                type="circle"
                percent={(result.overall / maxScore) * 100}
                size={100}
                strokeColor={scoreColor(result.overall)}
                format={() => (
                  <span style={{ fontSize: 22, fontWeight: 700 }}>
                    {result.overall}{isIelts ? "" : `/${maxScore}`}
                  </span>
                )}
              />
              <p style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 8 }}>
                {EXAM_OPTIONS.find((o) => o.value === exam)?.label} • {result.wordCount} từ
              </p>

              {/* Criteria scores */}
              <div style={{ display: "flex", justifyContent: "center", gap: 20, marginTop: 16, flexWrap: "wrap" }}>
                {([
                  { key: "taskResponse", label: "Task" },
                  { key: "coherence", label: "Coherence" },
                  { key: "lexical", label: "Lexical" },
                  { key: "grammar", label: "Grammar" },
                ] as const).map((c) => {
                  const s = result.criteria[c.key];
                  return (
                    <Tooltip key={c.key} title={s.feedback}>
                      <div style={{ cursor: "pointer" }}>
                        <p style={{ fontSize: 11, color: "var(--text-secondary)", margin: 0 }}>{c.label}</p>
                        <p style={{ fontSize: 18, fontWeight: 600, margin: 0, color: scoreColor(s.score) }}>
                          {s.score}
                        </p>
                      </div>
                    </Tooltip>
                  );
                })}
              </div>
            </div>

            {/* Criteria feedback */}
            {([
              { key: "taskResponse", label: <><FormOutlined /> Task Response</>, icon: null },
              { key: "coherence", label: <><LinkOutlined /> Coherence &amp; Cohesion</>, icon: null },
              { key: "lexical", label: <><BookOutlined /> Lexical Resource</>, icon: null },
              { key: "grammar", label: <><CalculatorOutlined /> Grammar</>, icon: null },
            ] as const).map((c) => {
              const s = result.criteria[c.key];
              return (
                <div key={c.key} style={{ padding: 16, borderRadius: 12, background: "var(--card-bg)", border: "1px solid var(--border)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: 0, fontWeight: 600 }}>{c.label}</p>
                    <Tag color={scoreColor(s.score)} style={{ fontSize: 12, fontWeight: 600 }}>{s.score}</Tag>
                  </div>
                  <p style={{ fontSize: 13, margin: 0, lineHeight: 1.6 }}>{s.feedback}</p>
                </div>
              );
            })}

            {/* Essay with inline highlights */}
            <div style={{ padding: 16, borderRadius: 12, background: "var(--card-bg)", border: "1px solid var(--border)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: 0, fontWeight: 600 }}>
                  <InfoCircleOutlined /> Bài viết (hover để xem gợi ý)
                </p>
                <div style={{ display: "flex", gap: 6 }}>
                  {Object.entries(CATEGORY_COLORS).map(([cat, color]) => (
                    <Tag key={cat} style={{ fontSize: 9, borderColor: color, color }} color="default">{cat}</Tag>
                  ))}
                </div>
              </div>
              <div style={{ fontSize: 14, lineHeight: 1.8, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                {highlightSegments ?? essayText}
              </div>
            </div>

            {/* Inline issues list */}
            {result.inlineIssues.length > 0 && (
              <div style={{ padding: 16, borderRadius: 12, background: "var(--card-bg)", border: "1px solid var(--border)" }}>
                <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: "0 0 8px", fontWeight: 600 }}>
                  <WarningOutlined /> Lỗi chi tiết ({result.inlineIssues.length})
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
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
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div style={{ padding: 16, borderRadius: 12, background: "var(--card-bg)", border: "1px solid var(--border)" }}>
                <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: "0 0 8px", fontWeight: 600 }}>
                  <CheckCircleOutlined style={{ color: "var(--success)" }} /> Điểm mạnh
                </p>
                <ul style={{ margin: 0, paddingLeft: 16, fontSize: 13, lineHeight: 1.8 }}>
                  {result.strengths.map((s, i) => <li key={i}>{s}</li>)}
                </ul>
              </div>
              <div style={{ padding: 16, borderRadius: 12, background: "var(--card-bg)", border: "1px solid var(--border)" }}>
                <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: "0 0 8px", fontWeight: 600 }}>
                  <AimOutlined /> Cần cải thiện
                </p>
                <ul style={{ margin: 0, paddingLeft: 16, fontSize: 13, lineHeight: 1.8 }}>
                  {result.nextSteps.map((s, i) => <li key={i}>{s}</li>)}
                </ul>
              </div>
            </div>

            {/* Actions */}
            <div style={{ textAlign: "center" }}>
              <button
                onClick={startNew}
                style={{
                  padding: "10px 24px", borderRadius: 8, border: "none",
                  background: "var(--accent)", color: "var(--text-on-accent)", fontSize: 14,
                  fontWeight: 600, cursor: "pointer",
                }}
              >
                <ReloadOutlined /> Chấm bài mới
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
