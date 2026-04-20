"use client";

import { useState, useCallback, useRef } from "react";
import { Tag, Tooltip, Progress } from "antd";
import {
  BulbOutlined,
  LoadingOutlined,
  ReloadOutlined,
  SendOutlined,
  BookOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";

import { api } from "@/lib/api-client";
import { useExamMode } from "@/components/shared/ExamModeProvider";

/* ── Types ──────────────────────────────────────────────── */

type VocabBankItem = {
  term: string;
  meaning: string;
  example: string;
};

type GuidedPromptData = {
  prompt: string;
  outline: string[];
  vocabBank: VocabBankItem[];
  topicCategory: string;
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
  inlineIssues: Array<{
    quote: string;
    startOffset: number;
    endOffset: number;
    category: string;
    suggestion: string;
    explanation: string;
  }>;
  strengths: string[];
  nextSteps: string[];
  wordCount: number;
};

type ExamType = "ielts-task2" | "ielts-task1" | "toefl-independent";
type GuidedState = "setup" | "loading-prompt" | "writing" | "scoring" | "result";

const TOPIC_CATEGORIES = [
  { key: "education", label: "🎓 Giáo dục", color: "#1890ff" },
  { key: "technology", label: "💻 Công nghệ", color: "#722ed1" },
  { key: "environment", label: "🌍 Môi trường", color: "#52c41a" },
  { key: "health", label: "🏥 Sức khỏe", color: "#eb2f96" },
  { key: "society", label: "🏛️ Xã hội", color: "#fa8c16" },
  { key: "work", label: "💼 Công việc", color: "#13c2c2" },
];

const EXAM_OPTIONS: { value: ExamType; label: string }[] = [
  { value: "ielts-task2", label: "IELTS Task 2" },
  { value: "ielts-task1", label: "IELTS Task 1" },
  { value: "toefl-independent", label: "TOEFL Independent" },
];

/* ── Component ──────────────────────────────────────────── */

export function GuidedWritingPanel() {
  const { examMode } = useExamMode();

  const [state, setState] = useState<GuidedState>("setup");
  const [exam, setExam] = useState<ExamType>(examMode === "toefl" ? "toefl-independent" : "ielts-task2");
  const [category, setCategory] = useState<string | null>(null);
  const [guided, setGuided] = useState<GuidedPromptData | null>(null);
  const [essayText, setEssayText] = useState("");
  const [scoreResult, setScoreResult] = useState<ScoreResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const wordCount = essayText.trim().split(/\s+/).filter(Boolean).length;
  const isIelts = exam.startsWith("ielts");
  const maxScore = isIelts ? 9 : 30;

  /* ── Generate prompt ────────────────────── */

  const generatePrompt = useCallback(async (topicCategory?: string) => {
    setError(null);
    setState("loading-prompt");

    try {
      const data = await api.post<GuidedPromptData>("/writing/guided-prompt", {
        exam,
        topicCategory: topicCategory ?? category,
      });
      setGuided(data);
      setCategory(data.topicCategory);
      setEssayText("");
      setScoreResult(null);
      setState("writing");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Có lỗi xảy ra");
      setState("setup");
    }
  }, [exam, category]); // exam included to avoid stale closure

  /* ── Insert vocab at cursor ─────────────── */

  const insertVocab = useCallback((term: string) => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const before = essayText.slice(0, start);
    const after = essayText.slice(end);
    const newText = `${before}${term}${after}`;
    setEssayText(newText);
    // Restore cursor after insert
    requestAnimationFrame(() => {
      ta.focus();
      ta.selectionStart = ta.selectionEnd = start + term.length;
    });
  }, [essayText]);

  /* ── Submit for scoring ─────────────────── */

  const submitForScoring = useCallback(async () => {
    if (wordCount < 150 || !guided) return;
    setError(null);
    setState("scoring");

    try {
      const data = await api.post<ScoreResult>("/writing/score", {
        text: essayText,
        exam,
        prompt: guided.prompt,
        vocabBank: guided.vocabBank,
        guidedPromptJson: {
          prompt: guided.prompt,
          outline: guided.outline,
          vocabBank: guided.vocabBank,
          topicCategory: guided.topicCategory,
        },
      });
      setScoreResult(data);
      setState("result");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Có lỗi xảy ra");
      setState("writing");
    }
  }, [essayText, exam, guided, wordCount]);

  /* ── Score color helper ─────────────────── */

  const scoreColor = (s: number) => {
    const pct = s / maxScore;
    return pct >= 0.75 ? "#52c41a" : pct >= 0.5 ? "#faad14" : "#ff4d4f";
  };

  /* ── Render ─────────────────────────────── */

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Error */}
      {error && (
        <div style={{
          padding: "8px 14px", borderRadius: 8,
          background: "var(--error-bg, #fff2f0)", color: "var(--error, #ff4d4f)", fontSize: 13,
        }}>
          {error}
        </div>
      )}

      {/* ═══ SETUP ═══ */}
      {state === "setup" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <BulbOutlined style={{ color: "var(--accent)", fontSize: 18 }} />
            <span style={{ fontWeight: 600, fontSize: 15 }}>Viết có hướng dẫn</span>
          </div>
          <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: 0 }}>
            Chọn loại bài thi và chủ đề — AI sẽ tạo đề bài, dàn ý, và ngân hàng từ vựng cho bạn.
          </p>

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

          {/* Category selector (AC4) */}
          <div>
            <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: "0 0 8px", fontWeight: 600 }}>
              Chủ đề <span style={{ fontWeight: 400 }}>(bỏ trống = ngẫu nhiên)</span>
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
              {TOPIC_CATEGORIES.map((cat) => (
                <button
                  key={cat.key}
                  onClick={() => setCategory(category === cat.key ? null : cat.key)}
                  style={{
                    padding: "10px 12px", borderRadius: 10,
                    border: category === cat.key ? `2px solid ${cat.color}` : "1px solid var(--border)",
                    background: category === cat.key ? `${cat.color}10` : "transparent",
                    color: category === cat.key ? cat.color : "var(--text-secondary)",
                    fontWeight: category === cat.key ? 600 : 400,
                    cursor: "pointer", fontSize: 13, textAlign: "center",
                  }}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => generatePrompt()}
            style={{
              padding: "12px 32px", borderRadius: 10, border: "none",
              background: "var(--accent)", color: "#fff", fontSize: 15,
              fontWeight: 600, cursor: "pointer", alignSelf: "center",
            }}
          >
            🎯 Tạo đề bài
          </button>
        </div>
      )}

      {/* ═══ LOADING ═══ */}
      {state === "loading-prompt" && (
        <div style={{ textAlign: "center", padding: 48 }}>
          <LoadingOutlined style={{ fontSize: 36, color: "var(--accent)" }} />
          <p style={{ color: "var(--text-secondary)", marginTop: 16, fontSize: 14 }}>
            Đang tạo đề bài và từ vựng...
          </p>
        </div>
      )}

      {/* ═══ WRITING ═══ */}
      {(state === "writing" || state === "scoring") && guided && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Prompt */}
          <div style={{
            padding: 16, borderRadius: 12,
            background: "var(--card-bg)", border: "1px solid var(--border)",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: 0, fontWeight: 600 }}>
                📝 Đề bài
              </p>
              <div style={{ display: "flex", gap: 6 }}>
                {/* Shuffle (AC4) */}
                <Tooltip title="Đổi đề cùng chủ đề">
                  <button
                    onClick={() => generatePrompt(category ?? undefined)}
                    style={{ border: "none", background: "transparent", cursor: "pointer", color: "var(--text-secondary)", fontSize: 13 }}
                  >
                    <ReloadOutlined /> Đổi đề
                  </button>
                </Tooltip>
                {/* New category (AC4) */}
                <Tooltip title="Chọn chủ đề mới">
                  <button
                    onClick={() => { setState("setup"); setGuided(null); }}
                    style={{ border: "none", background: "transparent", cursor: "pointer", color: "var(--text-secondary)", fontSize: 13 }}
                  >
                    Chủ đề khác
                  </button>
                </Tooltip>
              </div>
            </div>
            <p style={{ fontSize: 14, margin: 0, lineHeight: 1.7 }}>{guided.prompt}</p>
          </div>

          {/* Outline + Vocab — side by side */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {/* Outline */}
            <div style={{
              padding: 14, borderRadius: 12,
              background: "var(--card-bg)", border: "1px solid var(--border)",
            }}>
              <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: "0 0 8px", fontWeight: 600 }}>
                📋 Dàn ý gợi ý
              </p>
              <ol style={{ margin: 0, paddingLeft: 18, fontSize: 13, lineHeight: 1.8 }}>
                {guided.outline.map((item, i) => (
                  <li key={i} style={{ color: "var(--text)" }}>{item}</li>
                ))}
              </ol>
            </div>

            {/* Vocab Bank */}
            <div style={{
              padding: 14, borderRadius: 12,
              background: "var(--card-bg)", border: "1px solid var(--border)",
            }}>
              <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: "0 0 8px", fontWeight: 600 }}>
                <BookOutlined /> Ngân hàng từ vựng <span style={{ fontWeight: 400 }}>(click để chèn)</span>
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {guided.vocabBank.map((v, i) => {
                  const isUsed = essayText.toLowerCase().includes(v.term.toLowerCase());
                  return (
                    <Tooltip
                      key={i}
                      title={
                        <div style={{ fontSize: 12 }}>
                          <div style={{ fontWeight: 600 }}>{v.meaning}</div>
                          <div style={{ color: "#aaa", marginTop: 4, fontStyle: "italic" }}>{v.example}</div>
                        </div>
                      }
                    >
                      <button
                        onClick={() => insertVocab(v.term)}
                        style={{
                          display: "flex", alignItems: "center", gap: 6,
                          padding: "4px 8px", borderRadius: 6, fontSize: 12,
                          border: isUsed ? "1px solid #52c41a" : "1px solid var(--border)",
                          background: isUsed ? "#f6ffed" : "transparent",
                          color: isUsed ? "#52c41a" : "var(--text)",
                          cursor: "pointer", textAlign: "left",
                          fontWeight: isUsed ? 600 : 400,
                        }}
                      >
                        {isUsed && <CheckCircleOutlined style={{ fontSize: 10 }} />}
                        {v.term}
                      </button>
                    </Tooltip>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Essay textarea */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: 0, fontWeight: 600 }}>Bài viết</p>
              <span style={{
                fontSize: 11,
                color: wordCount < 150 ? "#ff4d4f" : "var(--text-secondary)",
                fontWeight: 500,
              }}>
                {wordCount} từ {wordCount < 150 && "(cần ≥ 150)"}
              </span>
            </div>
            <textarea
              ref={textareaRef}
              value={essayText}
              onChange={(e) => setEssayText(e.target.value)}
              placeholder="Viết bài viết của bạn ở đây. Click vào từ vựng bên phải để chèn..."
              disabled={state === "scoring"}
              style={{
                width: "100%", minHeight: 280, padding: 16, borderRadius: 12,
                border: "1px solid var(--border)", background: "var(--card-bg)",
                color: "var(--text)", fontSize: 14, lineHeight: 1.8,
                resize: "vertical", fontFamily: "inherit",
                opacity: state === "scoring" ? 0.6 : 1,
              }}
            />
          </div>

          {/* Submit */}
          <button
            onClick={submitForScoring}
            disabled={wordCount < 150 || state === "scoring"}
            style={{
              padding: "12px 32px", borderRadius: 10, border: "none",
              background: wordCount < 150 || state === "scoring" ? "var(--border)" : "var(--accent)",
              color: "#fff", fontSize: 15, fontWeight: 600,
              cursor: wordCount < 150 || state === "scoring" ? "not-allowed" : "pointer",
              alignSelf: "center",
              display: "flex", alignItems: "center", gap: 8,
            }}
          >
            {state === "scoring" ? (
              <><LoadingOutlined /> Đang chấm bài...</>
            ) : (
              <><SendOutlined /> Nộp bài & chấm điểm</>
            )}
          </button>
        </div>
      )}

      {/* ═══ RESULT ═══ */}
      {state === "result" && scoreResult && guided && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Overall score */}
          <div style={{
            padding: 24, borderRadius: 16,
            background: "var(--card-bg)", border: "1px solid var(--border)",
            textAlign: "center",
          }}>
            <Progress
              type="circle"
              percent={(scoreResult.overall / maxScore) * 100}
              size={100}
              strokeColor={scoreColor(scoreResult.overall)}
              format={() => (
                <span style={{ fontSize: 22, fontWeight: 700 }}>
                  {scoreResult.overall}{isIelts ? "" : `/${maxScore}`}
                </span>
              )}
            />
            <p style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 8 }}>
              {EXAM_OPTIONS.find((o) => o.value === exam)?.label} • {scoreResult.wordCount} từ
            </p>

            {/* Criteria scores */}
            <div style={{ display: "flex", justifyContent: "center", gap: 20, marginTop: 16, flexWrap: "wrap" }}>
              {([
                { key: "taskResponse", label: "Task" },
                { key: "coherence", label: "Coherence" },
                { key: "lexical", label: "Lexical" },
                { key: "grammar", label: "Grammar" },
              ] as const).map((c) => {
                const s = scoreResult.criteria[c.key];
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

          {/* Vocab usage summary */}
          <div style={{
            padding: 14, borderRadius: 12,
            background: "var(--card-bg)", border: "1px solid var(--border)",
          }}>
            <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: "0 0 8px", fontWeight: 600 }}>
              <BookOutlined /> Từ vựng đã sử dụng
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {guided.vocabBank.map((v, i) => {
                const isUsed = essayText.toLowerCase().includes(v.term.toLowerCase());
                return (
                  <Tag
                    key={i}
                    color={isUsed ? "#52c41a" : "default"}
                    style={{ fontSize: 12 }}
                  >
                    {isUsed ? "✓" : "✗"} {v.term}
                  </Tag>
                );
              })}
            </div>
          </div>

          {/* Criteria feedback */}
          {([
            { key: "taskResponse", label: "📝 Task Response" },
            { key: "coherence", label: "🔗 Coherence & Cohesion" },
            { key: "lexical", label: "📚 Lexical Resource" },
            { key: "grammar", label: "📐 Grammar" },
          ] as const).map((c) => {
            const s = scoreResult.criteria[c.key];
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

          {/* Strengths & Next Steps */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div style={{ padding: 16, borderRadius: 12, background: "var(--card-bg)", border: "1px solid var(--border)" }}>
              <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: "0 0 8px", fontWeight: 600 }}>
                <CheckCircleOutlined style={{ color: "#52c41a" }} /> Điểm mạnh
              </p>
              <ul style={{ margin: 0, paddingLeft: 16, fontSize: 13, lineHeight: 1.8 }}>
                {scoreResult.strengths.map((s, i) => <li key={i}>{s}</li>)}
              </ul>
            </div>
            <div style={{ padding: 16, borderRadius: 12, background: "var(--card-bg)", border: "1px solid var(--border)" }}>
              <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: "0 0 8px", fontWeight: 600 }}>
                🎯 Cần cải thiện
              </p>
              <ul style={{ margin: 0, paddingLeft: 16, fontSize: 13, lineHeight: 1.8 }}>
                {scoreResult.nextSteps.map((s, i) => <li key={i}>{s}</li>)}
              </ul>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: "flex", justifyContent: "center", gap: 12 }}>
            <button
              onClick={() => { setState("setup"); setGuided(null); setEssayText(""); setScoreResult(null); }}
              style={{
                padding: "10px 24px", borderRadius: 8, border: "none",
                background: "var(--accent)", color: "#fff", fontSize: 14,
                fontWeight: 600, cursor: "pointer",
              }}
            >
              <ReloadOutlined /> Bài mới
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
