"use client";

import { useState, useCallback, useEffect } from "react";
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  LoadingOutlined,
  ReloadOutlined,
  BulbOutlined,
  TrophyOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import { Tag, Progress, Collapse, Empty, Badge } from "antd";

type ErrorEntry = {
  id: string;
  sourceModule: string;
  questionStem: string;
  options: string[] | null;
  userAnswer: string;
  correctAnswer: string;
  explanationEn: string | null;
  explanationVi: string | null;
  grammarTopic: string | null;
  reviewCount: number;
};

type ReviewState = "loading" | "quiz" | "results" | "empty";

export default function ReviewQuizPage() {
  const [state, setState] = useState<ReviewState>("loading");
  const [errors, setErrors] = useState<ErrorEntry[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number | null>>({});
  const [results, setResults] = useState<Array<{ errorId: string; correct: boolean }>>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<{ resolved: number; rescheduled: number } | null>(null);

  const currentError = errors[currentIdx] ?? null;

  // Fetch due errors
  const fetchDue = useCallback(async () => {
    setState("loading");
    try {
      const res = await fetch("/api/review-quiz/due");
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      if (data.dueCount === 0) {
        setState("empty");
      } else {
        setErrors(data.errors);
        setCurrentIdx(0);
        setAnswers({});
        setResults([]);
        setSubmitResult(null);
        setState("quiz");
      }
    } catch {
      setState("empty");
    }
  }, []);

  useEffect(() => { fetchDue(); }, [fetchDue]);

  // Select answer
  const selectAnswer = useCallback((optionIdx: number) => {
    setAnswers((prev) => ({ ...prev, [currentIdx]: optionIdx }));
  }, [currentIdx]);

  // Next question or submit
  const handleNext = useCallback(() => {
    if (currentIdx < errors.length - 1) {
      setCurrentIdx((prev) => prev + 1);
    } else {
      // Submit all
      submitReview();
    }
  }, [currentIdx, errors.length]);

  const submitReview = useCallback(async () => {
    setSubmitting(true);

    const reviewResults = errors.map((err, i) => {
      const selectedIdx = answers[i];
      // For errors with options, check if selected the correct one
      const correctIdx = err.options?.indexOf(err.correctAnswer) ?? -1;
      const correct = selectedIdx !== null && selectedIdx !== undefined && selectedIdx === correctIdx;
      return { errorId: err.id, correct };
    });

    setResults(reviewResults);

    try {
      const res = await fetch("/api/review-quiz/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ results: reviewResults }),
      });
      if (res.ok) {
        const data = await res.json();
        setSubmitResult(data);
      }
    } catch { /* ignore */ }

    setSubmitting(false);
    setState("results");
  }, [errors, answers]);

  // Loading
  if (state === "loading") {
    return (
      <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "auto" }}>
        <div style={{ padding: "24px 24px 16px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 10 }}>
          <BulbOutlined style={{ fontSize: 22, color: "var(--accent)" }} />
          <div>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Ôn tập lỗi sai</h1>
            <p style={{ margin: 0, fontSize: 13, color: "var(--text-secondary)" }}>SRS — Hệ thống ôn tập thông minh</p>
          </div>
        </div>
        <div style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center", flexDirection: "column", gap: 12 }}>
          <LoadingOutlined style={{ fontSize: 32, color: "var(--accent)" }} />
          <p style={{ color: "var(--text-secondary)" }}>Đang tải lỗi sai cần ôn...</p>
        </div>
      </div>
    );
  }

  // Empty
  if (state === "empty") {
    return (
      <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "auto" }}>
        <div style={{ padding: "24px 24px 16px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 10 }}>
          <BulbOutlined style={{ fontSize: 22, color: "var(--accent)" }} />
          <div>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Ôn tập lỗi sai</h1>
            <p style={{ margin: 0, fontSize: 13, color: "var(--text-secondary)" }}>SRS — Hệ thống ôn tập thông minh</p>
          </div>
        </div>
        <div style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center", padding: 32 }}>
          <Empty
            description={
              <div>
                <p style={{ fontSize: 16, fontWeight: 600, margin: "0 0 8px" }}>🎉 Không có lỗi nào cần ôn!</p>
                <p style={{ color: "var(--text-secondary)", margin: 0, fontSize: 13 }}>
                  Hãy luyện tập Grammar Quiz hoặc Mock Test để hệ thống ghi nhận lỗi sai.
                </p>
              </div>
            }
          />
        </div>
      </div>
    );
  }

  // Results
  if (state === "results") {
    const correctCount = results.filter((r) => r.correct).length;
    const percentage = Math.round((correctCount / results.length) * 100);

    return (
      <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "auto" }}>
        <div style={{ padding: "24px 24px 16px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 10 }}>
          <BulbOutlined style={{ fontSize: 22, color: "var(--accent)" }} />
          <div>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Kết quả ôn tập</h1>
            <p style={{ margin: 0, fontSize: 13, color: "var(--text-secondary)" }}>SRS — Hệ thống ôn tập thông minh</p>
          </div>
        </div>
        <div style={{ flex: 1, padding: 24, maxWidth: 640, margin: "0 auto", width: "100%" }}>
          {/* Score */}
          <div style={{ textAlign: "center", padding: 32, borderRadius: 16, background: "var(--card-bg)", border: "1px solid var(--border)", marginBottom: 20 }}>
            <Progress
              type="circle"
              percent={percentage}
              size={120}
              strokeColor={percentage >= 80 ? "#52c41a" : percentage >= 50 ? "#faad14" : "#ff4d4f"}
              format={() => (
                <div>
                  <div style={{ fontSize: 28, fontWeight: 700 }}>{correctCount}/{results.length}</div>
                  <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>{percentage}%</div>
                </div>
              )}
            />
            <h2 style={{ margin: "16px 0 4px" }}>
              {percentage >= 80 ? "Xuất sắc!" : percentage >= 50 ? "Khá tốt!" : "Cần ôn thêm!"}
            </h2>
            {submitResult && (
              <div style={{ color: "var(--text-secondary)", fontSize: 13, margin: "8px 0 16px" }}>
                <TrophyOutlined style={{ color: "#52c41a", marginRight: 4 }} />
                {submitResult.resolved > 0 && <span><strong>{submitResult.resolved}</strong> lỗi đã nắm vững! </span>}
                {submitResult.rescheduled > 0 && <span><strong>{submitResult.rescheduled}</strong> lỗi sẽ ôn lại sau.</span>}
              </div>
            )}
            <button
              onClick={fetchDue}
              style={{
                padding: "10px 24px",
                borderRadius: 8,
                border: "none",
                background: "var(--accent)",
                color: "#fff",
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              <ReloadOutlined /> Ôn tiếp
            </button>
          </div>

          {/* Detail */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {errors.map((err, i) => {
              const correct = results[i]?.correct ?? false;
              return (
                <div
                  key={err.id}
                  style={{
                    padding: 16,
                    borderRadius: 12,
                    border: `1px solid ${correct ? "#52c41a44" : "#ff4d4f44"}`,
                    background: "var(--card-bg)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    {correct ? <CheckCircleOutlined style={{ color: "#52c41a" }} /> : <CloseCircleOutlined style={{ color: "#ff4d4f" }} />}
                    <span style={{ fontSize: 13, fontWeight: 600 }}>Câu {i + 1}</span>
                    {err.grammarTopic && <Tag color="blue" style={{ fontSize: 10 }}>{err.grammarTopic}</Tag>}
                    <Badge count={`Ôn lần ${err.reviewCount + 1}`} style={{ backgroundColor: "var(--accent)", fontSize: 10 }} />
                  </div>
                  <p style={{ fontSize: 13, margin: "0 0 8px" }}>{err.questionStem}</p>
                  <div style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 8 }}>
                    Đáp án đúng: <strong style={{ color: "#52c41a" }}>{err.correctAnswer}</strong>
                  </div>
                  {(err.explanationEn || err.explanationVi) && (
                    <Collapse
                      size="small"
                      items={[{
                        key: `exp-${i}`,
                        label: <span style={{ fontSize: 12 }}><InfoCircleOutlined /> Giải thích</span>,
                        children: (
                          <div style={{ fontSize: 13 }}>
                            {err.explanationEn && <p style={{ margin: "0 0 4px" }}>{err.explanationEn}</p>}
                            {err.explanationVi && <p style={{ margin: 0, color: "var(--text-secondary)" }}>{err.explanationVi}</p>}
                          </div>
                        ),
                      }]}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // Quiz mode
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "auto" }}>
      {/* Header */}
      <div style={{ padding: "24px 24px 16px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 10 }}>
        <BulbOutlined style={{ fontSize: 22, color: "var(--accent)" }} />
        <div style={{ flex: 1 }}>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Ôn tập lỗi sai</h1>
          <p style={{ margin: 0, fontSize: 13, color: "var(--text-secondary)" }}>
            {errors.length} câu cần ôn — SRS interval
          </p>
        </div>
        <Tag color="orange" style={{ borderRadius: 99 }}>
          {currentIdx + 1}/{errors.length}
        </Tag>
      </div>

      <div style={{ flex: 1, padding: 24, maxWidth: 640, margin: "0 auto", width: "100%" }}>
        {/* Progress */}
        <Progress
          percent={((currentIdx + 1) / errors.length) * 100}
          size="small"
          showInfo={false}
          style={{ marginBottom: 16 }}
        />

        {currentError && (
          <div style={{ padding: 20, borderRadius: 14, background: "var(--card-bg)", border: "1px solid var(--border)" }}>
            {/* Topic tag */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <Tag color="default" style={{ fontSize: 12 }}>Câu {currentIdx + 1}</Tag>
              {currentError.grammarTopic && <Tag color="blue" style={{ fontSize: 11 }}>{currentError.grammarTopic}</Tag>}
              <Tag color="orange" style={{ fontSize: 10 }}>Ôn lần {currentError.reviewCount + 1}</Tag>
              <Tag color="default" style={{ fontSize: 10 }}>{currentError.sourceModule}</Tag>
            </div>

            {/* Question */}
            <p style={{ fontSize: 15, fontWeight: 500, margin: "0 0 16px", lineHeight: 1.5 }}>
              {currentError.questionStem}
            </p>

            {/* Options */}
            {currentError.options && currentError.options.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {currentError.options.map((opt, oi) => (
                  <button
                    key={oi}
                    onClick={() => selectAnswer(oi)}
                    style={{
                      padding: "10px 14px",
                      borderRadius: 8,
                      border: answers[currentIdx] === oi ? "2px solid var(--accent)" : "1px solid var(--border)",
                      background: answers[currentIdx] === oi ? "var(--accent-muted)" : "transparent",
                      color: answers[currentIdx] === oi ? "var(--accent)" : "var(--text)",
                      textAlign: "left",
                      cursor: "pointer",
                      fontSize: 14,
                      fontWeight: answers[currentIdx] === oi ? 600 : 400,
                    }}
                  >
                    {String.fromCharCode(65 + oi)}. {opt}
                  </button>
                ))}
              </div>
            ) : (
              <div style={{ padding: 12, background: "var(--bg-secondary, #f5f5f5)", borderRadius: 8, fontSize: 13 }}>
                Đáp án đúng là: <strong>{currentError.correctAnswer}</strong>
                <br />
                <span style={{ color: "var(--text-secondary)" }}>Bạn đã nhớ chưa?</span>
                <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                  <button
                    onClick={() => { setAnswers((prev) => ({ ...prev, [currentIdx]: 0 })); }}
                    style={{ padding: "6px 16px", borderRadius: 6, border: "1px solid #52c41a44", background: answers[currentIdx] === 0 ? "#52c41a22" : "transparent", cursor: "pointer", fontSize: 13, color: "#52c41a" }}
                  >
                    ✅ Đã nhớ
                  </button>
                  <button
                    onClick={() => { setAnswers((prev) => ({ ...prev, [currentIdx]: 1 })); }}
                    style={{ padding: "6px 16px", borderRadius: 6, border: "1px solid #ff4d4f44", background: answers[currentIdx] === 1 ? "#ff4d4f22" : "transparent", cursor: "pointer", fontSize: 13, color: "#ff4d4f" }}
                  >
                    ❌ Chưa nhớ
                  </button>
                </div>
              </div>
            )}

            {/* Next button */}
            <div style={{ marginTop: 16 }}>
              <button
                onClick={handleNext}
                disabled={answers[currentIdx] === null || answers[currentIdx] === undefined || submitting}
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: 10,
                  border: "none",
                  background: (answers[currentIdx] !== null && answers[currentIdx] !== undefined) ? "var(--accent)" : "var(--border)",
                  color: (answers[currentIdx] !== null && answers[currentIdx] !== undefined) ? "#fff" : "var(--text-secondary)",
                  fontSize: 15,
                  fontWeight: 600,
                  cursor: (answers[currentIdx] !== null && answers[currentIdx] !== undefined) ? "pointer" : "not-allowed",
                }}
              >
                {submitting ? <LoadingOutlined /> : currentIdx < errors.length - 1 ? "Câu tiếp →" : "Hoàn thành ✓"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
