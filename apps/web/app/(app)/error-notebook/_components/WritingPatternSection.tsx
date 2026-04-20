"use client";

import { useState, useEffect, useCallback } from "react";
import { Tag, Tooltip, Progress } from "antd";
import {
  EditOutlined,
  LoadingOutlined,
  CheckCircleOutlined,
  ThunderboltOutlined,
} from "@ant-design/icons";

import { api } from "@/lib/api-client";
import { ERROR_TAG_LABELS, ERROR_TAG_DESCRIPTIONS, type ErrorTag } from "@/lib/writing/error-tags";

/* ── Types ──────────────────────────────────────────────── */

type ErrorPattern = {
  id: string;
  tag: string;
  count: number;
  lastSeenAt: string;
  quizGeneratedAt: string | null;
};

type QuizItem = {
  questionStem: string;
  options: string[];
  correctAnswer: string;
  explanationEn: string;
  explanationVi: string;
};

type QuizState = "idle" | "generating" | "active" | "done";

/* ── Sub-component: inline quiz player ──────────────────── */

function InlineQuiz({ items, errorLogIds, onDone }: { items: QuizItem[]; errorLogIds: string[]; onDone: (answers: Array<{ errorLogId: string; userAnswer: string; isCorrect: boolean }>) => void }) {
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [results, setResults] = useState<boolean[]>([]);
  const [answers, setAnswers] = useState<Array<{ errorLogId: string; userAnswer: string; isCorrect: boolean }>>([]); 

  const item = items[current];
  const isAnswered = selected !== null;
  const isCorrect = selected === item.correctAnswer;
  const isDone = current >= items.length;

  const handleSelect = (opt: string) => {
    if (isAnswered) return;
    setSelected(opt);
    const correct = opt === item.correctAnswer;
    setResults((prev) => [...prev, correct]);
    if (errorLogIds[current]) {
      setAnswers((prev) => [...prev, {
        errorLogId: errorLogIds[current],
        userAnswer: opt,
        isCorrect: correct,
      }]);
    }
  };

  const handleNext = () => {
    setSelected(null);
    setCurrent((c) => c + 1);
  };

  if (isDone) {
    const score = results.filter(Boolean).length;
    return (
      <div style={{ textAlign: "center", padding: 24 }}>
        <Progress
          type="circle"
          percent={Math.round((score / items.length) * 100)}
          size={80}
          strokeColor={score === items.length ? "#52c41a" : "#faad14"}
          format={() => `${score}/${items.length}`}
        />
        <p style={{ marginTop: 12, fontSize: 14, fontWeight: 600 }}>
          {score === items.length ? "🎉 Hoàn hảo!" : score >= items.length / 2 ? "👍 Tốt!" : "💪 Cần ôn thêm!"}
        </p>
        <button
          onClick={() => onDone(answers)}
          style={{
            marginTop: 8, padding: "8px 20px", borderRadius: 8, border: "none",
            background: "var(--accent)", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer",
          }}
        >
          Xong
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--text-secondary)" }}>
        <span>Câu {current + 1}/{items.length}</span>
        <span>{results.filter(Boolean).length} đúng</span>
      </div>

      <p style={{ fontSize: 14, fontWeight: 500, margin: 0, lineHeight: 1.6 }}>{item.questionStem}</p>

      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {item.options.map((opt) => {
          let bg = "var(--surface)";
          let border = "1px solid var(--border)";
          let color = "var(--text)";
          if (isAnswered) {
            if (opt === item.correctAnswer) { bg = "#f6ffed"; border = "1px solid #52c41a"; color = "#52c41a"; }
            else if (opt === selected) { bg = "#fff2f0"; border = "1px solid #ff4d4f"; color = "#ff4d4f"; }
          }
          return (
            <button
              key={opt}
              onClick={() => handleSelect(opt)}
              disabled={isAnswered}
              style={{
                padding: "8px 12px", borderRadius: 8, border, background: bg, color,
                textAlign: "left", fontSize: 13, cursor: isAnswered ? "default" : "pointer",
                fontWeight: opt === item.correctAnswer && isAnswered ? 600 : 400,
              }}
            >
              {opt}
            </button>
          );
        })}
      </div>

      {isAnswered && (
        <div style={{
          padding: "8px 12px", borderRadius: 8,
          background: isCorrect ? "#f6ffed" : "#fff2f0",
          border: `1px solid ${isCorrect ? "#52c41a" : "#ff4d4f"}44`,
          fontSize: 12, color: "var(--text)",
        }}>
          <p style={{ margin: "0 0 4px", fontWeight: 600 }}>{isCorrect ? "✓ Đúng!" : "✗ Sai"}</p>
          <p style={{ margin: "0 0 2px" }}>{item.explanationEn}</p>
          <p style={{ margin: 0, color: "var(--text-secondary)" }}>{item.explanationVi}</p>
        </div>
      )}

      {isAnswered && (
        <button
          onClick={handleNext}
          style={{
            padding: "8px 20px", borderRadius: 8, border: "none", alignSelf: "flex-end",
            background: "var(--accent)", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer",
          }}
        >
          {current + 1 < items.length ? "Câu tiếp →" : "Xem kết quả"}
        </button>
      )}
    </div>
  );
}

/* ── Main component ──────────────────────────────────────── */

export function WritingPatternSection() {
  const [patterns, setPatterns] = useState<ErrorPattern[]>([]);
  const [loading, setLoading] = useState(true);
  const [quizState, setQuizState] = useState<Record<string, QuizState>>({});
  const [quizItems, setQuizItems] = useState<Record<string, QuizItem[]>>({});
  const [quizIds, setQuizIds] = useState<Record<string, string[]>>({});

  const fetchPatterns = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get<{ patterns: ErrorPattern[] }>("/writing/pattern-quiz");
      setPatterns(data?.patterns ?? []);
    } catch {
      // silent — section just won't show
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPatterns();
  }, [fetchPatterns]);

  const generateQuiz = useCallback(async (tag: string) => {
    setQuizState((prev) => ({ ...prev, [tag]: "generating" }));
    try {
      const data = await api.post<{ items: QuizItem[]; insertedIds: string[] }>("/writing/pattern-quiz", {
        tag,
        exampleSentences: [], // AC6: no essay content sent
      });
      setQuizItems((prev) => ({ ...prev, [tag]: data.items }));
      setQuizIds((prev) => ({ ...prev, [tag]: data.insertedIds ?? [] }));
      setQuizState((prev) => ({ ...prev, [tag]: "active" }));
    } catch (err) {
      console.error(err);
      setQuizState((prev) => ({ ...prev, [tag]: "idle" }));
    }
  }, []);

  const finishQuiz = useCallback(async (tag: string, answers: Array<{ errorLogId: string; userAnswer: string; isCorrect: boolean }>) => {
    setQuizState((prev) => ({ ...prev, [tag]: "done" }));
    // Submit answers to update error_log records (AC5)
    if (answers.length > 0) {
      try {
        await api.patch("/writing/pattern-quiz", { answers });
      } catch (err) {
        console.error("Failed to submit quiz answers:", err);
      }
    }
  }, []);

  if (loading) return null; // Don't show while loading
  if (patterns.length === 0) return null; // Don't show if no patterns

  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <EditOutlined style={{ color: "#9AB17A", fontSize: 16 }} />
        <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>Lỗi viết lặp lại</h2>
        <Tag color="orange" style={{ borderRadius: 99, fontSize: 11 }}>
          {patterns.length} mẫu
        </Tag>
      </div>
      <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: "0 0 12px" }}>
        Các lỗi ngữ pháp bạn mắc ≥3 lần trong 14 ngày qua — luyện tập để khắc phục.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {patterns.map((p) => {
          const label = ERROR_TAG_LABELS[p.tag as ErrorTag] ?? p.tag;
          const desc = ERROR_TAG_DESCRIPTIONS[p.tag as ErrorTag] ?? "";
          const state = quizState[p.tag] ?? "idle";

          return (
            <div
              key={p.id}
              style={{
                borderRadius: 12,
                border: "1px solid var(--border)",
                background: "var(--card-bg)",
                overflow: "hidden",
              }}
            >
              {/* Pattern header */}
              <div style={{ padding: "12px 16px", display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                    <Tag color="red" style={{ fontSize: 11, borderRadius: 99 }}>
                      {p.count}×
                    </Tag>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{label}</span>
                    {p.quizGeneratedAt && (
                      <Tooltip title={`Quiz đã tạo: ${new Date(p.quizGeneratedAt).toLocaleDateString("vi-VN")}`}>
                        <CheckCircleOutlined style={{ fontSize: 12, color: "#52c41a" }} />
                      </Tooltip>
                    )}
                  </div>
                  <p style={{ margin: 0, fontSize: 11, color: "var(--text-secondary)" }}>{desc}</p>
                </div>

                {state === "idle" && (
                  <button
                    onClick={() => generateQuiz(p.tag)}
                    style={{
                      padding: "6px 14px", borderRadius: 8, border: "none",
                      background: "#9AB17A22", color: "#5a7a45",
                      fontSize: 12, fontWeight: 600, cursor: "pointer",
                      display: "flex", alignItems: "center", gap: 4, flexShrink: 0,
                    }}
                  >
                    <ThunderboltOutlined /> Luyện tập
                  </button>
                )}

                {state === "generating" && (
                  <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                    <LoadingOutlined /> Đang tạo...
                  </span>
                )}

                {state === "done" && (
                  <button
                    onClick={() => generateQuiz(p.tag)}
                    style={{
                      padding: "6px 14px", borderRadius: 8, border: "1px solid var(--border)",
                      background: "transparent", color: "var(--text-secondary)",
                      fontSize: 12, cursor: "pointer", flexShrink: 0,
                    }}
                  >
                    Làm lại
                  </button>
                )}
              </div>

              {/* Inline quiz */}
              {state === "active" && quizItems[p.tag] && (
                <div style={{
                  padding: "0 16px 16px",
                  borderTop: "1px solid var(--border)",
                  paddingTop: 14,
                }}>
                  <InlineQuiz items={quizItems[p.tag]} errorLogIds={quizIds[p.tag] ?? []} onDone={(answers) => finishQuiz(p.tag, answers)} />
                </div>
              )}

              {state === "done" && (
                <div style={{
                  padding: "8px 16px",
                  borderTop: "1px solid var(--border)",
                  background: "#f6ffed",
                  fontSize: 12, color: "#52c41a", fontWeight: 500,
                }}>
                  <CheckCircleOutlined /> Quiz đã hoàn thành — câu hỏi đã được lưu vào sổ lỗi sai để ôn tập sau.
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
