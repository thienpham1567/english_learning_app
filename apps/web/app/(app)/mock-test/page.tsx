"use client";
import { api } from "@/lib/api-client";
import { useState, useCallback, useRef, useEffect } from "react";
import {
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  LoadingOutlined,
  LeftOutlined,
  RightOutlined,
  FileSearchOutlined,
  ReloadOutlined,
  TrophyOutlined,
  BarChartOutlined,
  InfoCircleOutlined,
  FlagOutlined,
  ReadOutlined,
} from "@ant-design/icons";
import { Progress, Tag, Tooltip, Collapse } from "antd";
import { ModuleHeader } from "@/components/shared/ModuleHeader";

import { useExamMode } from "@/components/shared/ExamModeProvider";

type MockQuestion = {
  type: string;
  passage?: string | null;
  stem: string;
  options: string[] | null;
  correctIndex: number | null;
  correctAnswer?: string | null;
  explanationEn: string;
  explanationVi: string;
  topic: string;
};

type TestState = "idle" | "loading" | "active" | "review";

export default function MockTestPage() {
  const { examMode, label: modeLabel } = useExamMode();
  const [state, setState] = useState<TestState>("idle");
  const [questions, setQuestions] = useState<MockQuestion[]>([]);
  const [passage, setPassage] = useState<string | null>(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<(number | string | null)[]>([]);
  const [flagged, setFlagged] = useState<Set<number>>(new Set());
  const [timeLeft, setTimeLeft] = useState(0);
  const [timeLimit, setTimeLimit] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [questionCount, setQuestionCount] = useState(15);
  const [fillBlankInputs, setFillBlankInputs] = useState<Record<number, string>>({});
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const currentQuestion = questions[currentIdx] ?? null;

  // ─── Timer ───
  useEffect(() => {
    if (state !== "active") return;
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          setState("review");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current!);
  }, [state]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  // ─── Generate test ───
  const startTest = useCallback(async () => {
    setState("loading");
    setError(null);

    try {
      const data = await api.post<{ questions: MockQuestion[]; passage?: string; timeLimit: number }>("/mock-test/generate", {
        examMode, questionCount,
      });
      setQuestions(data.questions);
      setPassage(data.passage ?? null);
      setAnswers(new Array(data.questions.length).fill(null));
      setFillBlankInputs({});
      setFlagged(new Set());
      setCurrentIdx(0);
      setTimeLimit(data.timeLimit);
      setTimeLeft(data.timeLimit);
      setState("active");
    } catch {
      setError("Không thể tạo đề thi. Vui lòng thử lại.");
      setState("idle");
    }
  }, [examMode, questionCount]);

  // ─── Answer ───
  const selectAnswer = useCallback((idx: number, value: number | string) => {
    setAnswers((prev) => {
      const next = [...prev];
      next[idx] = value;
      return next;
    });
  }, []);

  const toggleFlag = useCallback((idx: number) => {
    setFlagged((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  }, []);

  // ─── Submit ───
  const submitTest = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setState("review");

    // Log wrong answers to Error Notebook (fire-and-forget)
    const wrongAnswers = questions
      .map((q, i) => {
        const isFillBlank = q.type === "fill-blank" || q.type === "fill_blank";
        const userAns = isFillBlank
          ? (fillBlankInputs[i] ?? "").trim()
          : (q.options?.[answers[i] as number] ?? "(không trả lời)");
        const correctAns = isFillBlank
          ? (q.correctAnswer ?? "")
          : (q.options?.[q.correctIndex ?? -1] ?? "");

        const correct = isFillBlank
          ? userAns.toLowerCase() === correctAns.toLowerCase()
          : answers[i] === q.correctIndex;

        if (correct) return null;

        return {
          sourceModule: "mock-test",
          questionStem: q.stem,
          options: q.options,
          userAnswer: userAns || "(không trả lời)",
          correctAnswer: correctAns,
          explanationEn: q.explanationEn,
          explanationVi: q.explanationVi,
          grammarTopic: q.topic,
        };
      })
      .filter(Boolean);

    if (wrongAnswers.length > 0) {
      api.post("/errors", { errors: wrongAnswers }).catch(() => {/* fire-and-forget */});
    }
  }, [questions, answers, fillBlankInputs]);

  // ─── Scoring ───
  const getScore = () => {
    let correct = 0;
    questions.forEach((q, i) => {
      if (q.type === "fill-blank" || q.type === "fill_blank") {
        const userAns = (fillBlankInputs[i] ?? "").trim().toLowerCase();
        const correctAns = (q.correctAnswer ?? "").trim().toLowerCase();
        if (userAns === correctAns) correct++;
      } else {
        if (answers[i] === q.correctIndex) correct++;
      }
    });
    return correct;
  };

  const isCorrect = (idx: number): boolean => {
    const q = questions[idx];
    if (q.type === "fill-blank" || q.type === "fill_blank") {
      return (fillBlankInputs[idx] ?? "").trim().toLowerCase() === (q.correctAnswer ?? "").trim().toLowerCase();
    }
    return answers[idx] === q.correctIndex;
  };

  const score = state === "review" ? getScore() : 0;
  const percentage = questions.length > 0 ? Math.round((score / questions.length) * 100) : 0;
  const answeredCount = questions.reduce((count, q, i) => {
    if (q.type === "fill-blank" || q.type === "fill_blank") {
      return count + (fillBlankInputs[i]?.trim().length > 0 ? 1 : 0);
    }
    return count + (answers[i] !== null ? 1 : 0);
  }, 0);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        minHeight: 0,
        flex: 1,
        overflow: "auto",
      }}
    >
      {/* Header */}
      <ModuleHeader
        icon={<FileSearchOutlined />}
        gradient="linear-gradient(135deg, #c07a70, #D9A299)"
        title="Mini Mock Test"
        subtitle={`Thi thử ${modeLabel} — luyện tập dưới áp lực thời gian`}
        action={
          <Tag
            color={examMode === "toeic" ? "blue" : "purple"}
            style={{ borderRadius: 99, margin: 0 }}
          >
            {examMode === "toeic" ? <BarChartOutlined /> : <TrophyOutlined />} {modeLabel}
          </Tag>
        }
      />

      <div style={{ flex: 1, padding: 24, maxWidth: 720, margin: "0 auto", width: "100%" }}>
        {/* Error */}
        {error && (
          <div
            style={{
              padding: "10px 16px",
              borderRadius: 8,
              background: "var(--error-bg, #fff2f0)",
              color: "var(--error, #ff4d4f)",
              marginBottom: 16,
              fontSize: 13,
            }}
          >
            {error}
          </div>
        )}

        {/* IDLE: Start screen */}
        {state === "idle" && (
          <div
            style={{
              textAlign: "center",
              padding: 32,
              border: "1px solid var(--border)",
              borderRadius: 16,
              background: "var(--card-bg)",
            }}
          >
            <FileSearchOutlined style={{ fontSize: 48, color: "var(--accent)", marginBottom: 16 }} />
            <h2 style={{ margin: "0 0 8px" }}>Sẵn sàng thi thử?</h2>
            <p style={{ color: "var(--text-secondary)", margin: "0 0 24px", fontSize: 13 }}>
              {examMode === "toeic"
                ? "Bài thi TOEIC Reading: Part 5 + Part 6"
                : "Bài thi IELTS Academic Reading"}
            </p>

            {/* Question count */}
            <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 24 }}>
              {[10, 15, 20].map((n) => (
                <button
                  key={n}
                  onClick={() => setQuestionCount(n)}
                  style={{
                    padding: "8px 16px",
                    borderRadius: 8,
                    border: questionCount === n ? "2px solid var(--accent)" : "1px solid var(--border)",
                    background: questionCount === n ? "var(--accent-muted)" : "transparent",
                    color: questionCount === n ? "var(--accent)" : "var(--text-secondary)",
                    fontWeight: questionCount === n ? 600 : 400,
                    cursor: "pointer",
                    fontSize: 13,
                  }}
                >
                  {n} câu
                </button>
              ))}
            </div>

            <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: "0 0 20px" }}>
              <ClockCircleOutlined /> Thời gian: ~{examMode === "toeic" ? Math.round(questionCount * 40 / 60) : questionCount} phút
            </p>

            <button
              onClick={startTest}
              style={{
                padding: "12px 32px",
                borderRadius: 10,
                border: "none",
                background: "var(--accent)",
                color: "#fff",
                fontSize: 15,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Bắt đầu thi
            </button>
          </div>
        )}

        {/* LOADING */}
        {state === "loading" && (
          <div style={{ textAlign: "center", padding: 40 }}>
            <LoadingOutlined style={{ fontSize: 32, color: "var(--accent)" }} />
            <p style={{ color: "var(--text-secondary)", marginTop: 12 }}>
              Đang tạo đề thi {modeLabel}...
            </p>
          </div>
        )}

        {/* ACTIVE: Test in progress */}
        {state === "active" && currentQuestion && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Timer + progress bar */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "10px 16px",
                borderRadius: 10,
                background: "var(--card-bg)",
                border: "1px solid var(--border)",
              }}
            >
              <ClockCircleOutlined
                style={{
                  fontSize: 16,
                  color: timeLeft < 60 ? "#ff4d4f" : "var(--text-secondary)",
                }}
              />
              <span
                style={{
                  fontSize: 16,
                  fontWeight: 600,
                  fontVariantNumeric: "tabular-nums",
                  color: timeLeft < 60 ? "#ff4d4f" : "var(--text)",
                }}
              >
                {formatTime(timeLeft)}
              </span>
              <Progress
                percent={(answeredCount / questions.length) * 100}
                size="small"
                showInfo={false}
                style={{ flex: 1 }}
              />
              <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                {answeredCount}/{questions.length}
              </span>
            </div>

            {/* IELTS passage */}
            {passage && (
              <Collapse
                items={[{
                  key: "passage",
                  label: <span><ReadOutlined /> Đọc bài đọc (nhấn để mở/đóng)</span>,
                  children: (
                    <p style={{ whiteSpace: "pre-wrap", fontSize: 14, lineHeight: 1.7, margin: 0 }}>
                      {passage}
                    </p>
                  ),
                }]}
                defaultActiveKey={["passage"]}
                style={{ marginBottom: 0 }}
              />
            )}

            {/* Question card */}
            <div
              style={{
                padding: 20,
                borderRadius: 14,
                background: "var(--card-bg)",
                border: flagged.has(currentIdx) ? "2px solid #faad14" : "1px solid var(--border)",
              }}
            >
              {/* Question header */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <Tag color="default" style={{ fontSize: 12 }}>
                  Câu {currentIdx + 1}/{questions.length}
                </Tag>
                <Tag color="blue" style={{ fontSize: 11 }}>
                  {currentQuestion.type.replace(/-|_/g, " ").toUpperCase()}
                </Tag>
                <Tag color="default" style={{ fontSize: 11 }}>
                  {currentQuestion.topic}
                </Tag>
                <Tooltip title={flagged.has(currentIdx) ? "Bỏ đánh dấu" : "Đánh dấu để xem lại"}>
                  <button
                    onClick={() => toggleFlag(currentIdx)}
                    style={{
                      marginLeft: "auto",
                      border: "none",
                      background: "none",
                      cursor: "pointer",
                      color: flagged.has(currentIdx) ? "#faad14" : "var(--text-secondary)",
                      fontSize: 16,
                    }}
                    aria-label="Đánh dấu câu hỏi"
                  >
                    <FlagOutlined />
                  </button>
                </Tooltip>
              </div>

              {/* Part 6 passage context */}
              {currentQuestion.passage && (
                <div
                  style={{
                    padding: 12,
                    borderRadius: 8,
                    background: "var(--bg-secondary, #f5f5f5)",
                    marginBottom: 12,
                    fontSize: 13,
                    lineHeight: 1.6,
                    fontStyle: "italic",
                  }}
                >
                  {currentQuestion.passage}
                </div>
              )}

              {/* Question stem */}
              <p style={{ fontSize: 15, fontWeight: 500, margin: "0 0 16px", lineHeight: 1.5 }}>
                {currentQuestion.stem}
              </p>

              {/* Options (MCQ / TFNG) */}
              {currentQuestion.options && (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {currentQuestion.options.map((opt, oi) => (
                    <button
                      key={oi}
                      onClick={() => selectAnswer(currentIdx, oi)}
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
              )}

              {/* Fill blank input */}
              {(currentQuestion.type === "fill-blank" || currentQuestion.type === "fill_blank") && !currentQuestion.options && (
                <input
                  type="text"
                  value={fillBlankInputs[currentIdx] ?? ""}
                  onChange={(e) => {
                    setFillBlankInputs((prev) => ({ ...prev, [currentIdx]: e.target.value }));
                    selectAnswer(currentIdx, e.target.value);
                  }}
                  placeholder="Nhập câu trả lời..."
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: 8,
                    border: "1px solid var(--border)",
                    background: "transparent",
                    color: "var(--text)",
                    fontSize: 14,
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              )}
            </div>

            {/* Navigation */}
            <div style={{ display: "flex", gap: 10, justifyContent: "space-between" }}>
              <button
                onClick={() => setCurrentIdx((prev) => Math.max(0, prev - 1))}
                disabled={currentIdx === 0}
                style={{
                  padding: "10px 16px",
                  borderRadius: 8,
                  border: "1px solid var(--border)",
                  background: "transparent",
                  color: currentIdx === 0 ? "var(--text-disabled, #ccc)" : "var(--text)",
                  cursor: currentIdx === 0 ? "not-allowed" : "pointer",
                  fontSize: 13,
                }}
              >
                <LeftOutlined /> Trước
              </button>

              {/* Question dots */}
              <div style={{ display: "flex", gap: 4, alignItems: "center", flexWrap: "wrap", justifyContent: "center", flex: 1 }}>
                {questions.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentIdx(i)}
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 4,
                      border: i === currentIdx ? "2px solid var(--accent)" : "1px solid var(--border)",
                      background:
                        flagged.has(i) ? "#faad1433" :
                        answers[i] !== null || (fillBlankInputs[i]?.trim()) ? "var(--accent-muted)" :
                        "transparent",
                      color: i === currentIdx ? "var(--accent)" : "var(--text-secondary)",
                      cursor: "pointer",
                      fontSize: 10,
                      fontWeight: i === currentIdx ? 700 : 400,
                    }}
                    aria-label={`Câu ${i + 1}`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>

              {currentIdx < questions.length - 1 ? (
                <button
                  onClick={() => setCurrentIdx((prev) => prev + 1)}
                  style={{
                    padding: "10px 16px",
                    borderRadius: 8,
                    border: "1px solid var(--border)",
                    background: "transparent",
                    color: "var(--text)",
                    cursor: "pointer",
                    fontSize: 13,
                  }}
                >
                  Sau <RightOutlined />
                </button>
              ) : (
                <button
                  onClick={submitTest}
                  style={{
                    padding: "10px 16px",
                    borderRadius: 8,
                    border: "none",
                    background: "var(--accent)",
                    color: "#fff",
                    cursor: "pointer",
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                >
                  Nộp bài <CheckCircleOutlined />
                </button>
              )}
            </div>
          </div>
        )}

        {/* REVIEW: Results */}
        {state === "review" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Score card */}
            <div
              style={{
                textAlign: "center",
                padding: 32,
                borderRadius: 16,
                background: "var(--card-bg)",
                border: "1px solid var(--border)",
              }}
            >
              <Progress
                type="circle"
                percent={percentage}
                size={120}
                strokeColor={percentage >= 80 ? "#52c41a" : percentage >= 50 ? "#faad14" : "#ff4d4f"}
                format={() => (
                  <div>
                    <div style={{ fontSize: 28, fontWeight: 700 }}>{score}/{questions.length}</div>
                    <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>{percentage}%</div>
                  </div>
                )}
              />
              <h2 style={{ margin: "16px 0 4px" }}>
                {percentage >= 80 ? "Xuất sắc!" : percentage >= 60 ? "Khá tốt!" : percentage >= 40 ? "Cần cải thiện" : "Cố gắng thêm!"}
              </h2>
              <p style={{ color: "var(--text-secondary)", margin: "0 0 16px", fontSize: 13 }}>
                Thời gian: {formatTime(timeLimit - timeLeft)} / {formatTime(timeLimit)}
              </p>
              <button
                onClick={() => {
                  setState("idle");
                  setQuestions([]);
                  setPassage(null);
                  setAnswers([]);
                  setFillBlankInputs({});
                }}
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
                <ReloadOutlined /> Thi lại
              </button>
            </div>

            {/* IELTS passage in review */}
            {passage && (
              <Collapse
                items={[{
                  key: "passage-review",
                  label: <span><ReadOutlined /> Bài đọc gốc</span>,
                  children: (
                    <p style={{ whiteSpace: "pre-wrap", fontSize: 14, lineHeight: 1.7, margin: 0 }}>
                      {passage}
                    </p>
                  ),
                }]}
                style={{ marginBottom: 0 }}
              />
            )}

            {/* Question review */}
            <h3 style={{ margin: "0 0 4px" }}>Chi tiết đáp án</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {questions.map((q, i) => {
                const correct = isCorrect(i);
                return (
                  <div
                    key={i}
                    style={{
                      padding: 16,
                      borderRadius: 12,
                      border: `1px solid ${correct ? "#52c41a44" : "#ff4d4f44"}`,
                      background: "var(--card-bg)",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                      {correct ? (
                        <CheckCircleOutlined style={{ color: "#52c41a" }} />
                      ) : (
                        <CloseCircleOutlined style={{ color: "#ff4d4f" }} />
                      )}
                      <span style={{ fontSize: 13, fontWeight: 600 }}>Câu {i + 1}</span>
                      <Tag color="blue" style={{ fontSize: 10 }}>{q.topic}</Tag>
                      {flagged.has(i) && <FlagOutlined style={{ color: "#faad14" }} />}
                    </div>

                    <p style={{ fontSize: 13, margin: "0 0 8px" }}>{q.stem}</p>

                    {q.options && (
                      <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 8 }}>
                        {q.options.map((opt, oi) => {
                          const isUserAnswer = answers[i] === oi;
                          const isCorrectOpt = oi === q.correctIndex;
                          return (
                            <div
                              key={oi}
                              style={{
                                padding: "6px 10px",
                                borderRadius: 6,
                                fontSize: 13,
                                background: isCorrectOpt ? "#52c41a11" : isUserAnswer && !isCorrectOpt ? "#ff4d4f11" : "transparent",
                                border: isCorrectOpt ? "1px solid #52c41a44" : isUserAnswer ? "1px solid #ff4d4f44" : "1px solid transparent",
                                color: "var(--text)",
                              }}
                            >
                              {isCorrectOpt && <CheckCircleOutlined style={{ color: "#52c41a", marginRight: 4 }} />}
                              {isUserAnswer && !isCorrectOpt && <CloseCircleOutlined style={{ color: "#ff4d4f", marginRight: 4 }} />}
                              {String.fromCharCode(65 + oi)}. {opt}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Fill blank answer display */}
                    {(q.type === "fill-blank" || q.type === "fill_blank") && !q.options && (
                      <div style={{ fontSize: 13, marginBottom: 8 }}>
                        <span>Bạn trả lời: </span>
                        <strong style={{ color: correct ? "#52c41a" : "#ff4d4f" }}>
                          {fillBlankInputs[i]?.trim() || "(không trả lời)"}
                        </strong>
                        {!correct && (
                          <span> → Đáp án: <strong style={{ color: "#52c41a" }}>{q.correctAnswer}</strong></span>
                        )}
                      </div>
                    )}

                    {/* Explanation */}
                    <Collapse
                      size="small"
                      items={[{
                        key: `exp-${i}`,
                        label: <span style={{ fontSize: 12 }}><InfoCircleOutlined /> Giải thích</span>,
                        children: (
                          <div style={{ fontSize: 13 }}>
                            <p style={{ margin: "0 0 4px" }}>{q.explanationEn}</p>
                            <p style={{ margin: 0, color: "var(--text-secondary)" }}>{q.explanationVi}</p>
                          </div>
                        ),
                      }]}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
