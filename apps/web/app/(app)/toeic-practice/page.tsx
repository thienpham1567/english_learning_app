"use client";

import { useState, useRef } from "react";
import {
  BookOutlined,
  TrophyOutlined,
  HistoryOutlined,
  RocketOutlined,
  CheckCircleFilled,
  CloseCircleFilled,
  ReloadOutlined,
  ArrowLeftOutlined,
  ClockCircleOutlined,
  StarFilled,
  SoundOutlined,
  FileImageOutlined,
} from "@ant-design/icons";
import { Button, Tag, Drawer, Segmented } from "antd";
import { ModuleHeader } from "@/components/shared/ModuleHeader";
import { useToeicPractice, type ToeicPartFilter } from "@/hooks/useToeicPractice";

const PARTS: { value: ToeicPartFilter; label: string }[] = [
  { value: "all", label: "Tất cả" },
  { value: "listening", label: "🎧 Listening" },
  { value: "reading", label: "📖 Reading" },
  { value: "3", label: "Part 3" },
  { value: "4", label: "Part 4" },
  { value: "5", label: "Part 5" },
  { value: "6", label: "Part 6" },
  { value: "7", label: "Part 7" },
];

const EXAMS = [
  { value: "random", label: "🎲 Ngẫu nhiên" },
  { value: "Test 1 ETS 2021", label: "ETS 2021 · Test 1" },
  { value: "Test 2 ETS 2021", label: "ETS 2021 · Test 2" },
  { value: "Test 3 ETS 2021", label: "ETS 2021 · Test 3" },
  { value: "Test 4 ETS 2021", label: "ETS 2021 · Test 4" },
  { value: "Test 5 ETS 2021", label: "ETS 2021 · Test 5" },
  { value: "Test 1 ETS 2020", label: "ETS 2020 · Test 1" },
  { value: "Test 2 ETS 2020", label: "ETS 2020 · Test 2" },
  { value: "Test 3 ETS 2020", label: "ETS 2020 · Test 3" },
];

const COUNTS = [10, 15, 20, 30];

export default function ToeicPracticePage() {
  const tp = useToeicPractice();
  const { state, questions, currentIndex, currentQuestion, answers, selectedAnswer,
    isRevealed, score, error, selectedExam, setSelectedExam, selectedPart, setSelectedPart,
    questionCount, setQuestionCount, history, startTime, endTime,
    startPractice, answerQuestion, nextQuestion, resetPractice, retryWrong } = tp;
  const audioRef = useRef<HTMLAudioElement>(null);

  const [historyOpen, setHistoryOpen] = useState(false);

  const formatTime = (ms: number) => {
    const s = Math.floor(ms / 1000);
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0, flex: 1, overflow: "auto" }}>
      <ModuleHeader
        icon={<BookOutlined />}
        gradient="linear-gradient(135deg, #1a2332 0%, #2d3748 40%, #4a5568 100%)"
        title="TOEIC Practice"
        subtitle="Luyện đề ETS thật · Part 3–7 · 1,320 câu"
        action={
          <Button
            type="text"
            icon={<HistoryOutlined style={{ fontSize: 16 }} />}
            onClick={() => setHistoryOpen(true)}
            title="Lịch sử"
            style={{
              width: 36, height: 36, borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.2)",
              color: "rgba(255,255,255,0.8)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          />
        }
      />

      <div style={{ flex: 1, padding: "24px 16px", display: "flex", justifyContent: "center" }}>
        {/* ═══ IDLE ═══ */}
        {(state === "idle" || state === "loading") && (
          <div className="anim-fade-up" style={{ maxWidth: 560, width: "100%" }}>
            <div
              style={{
                borderRadius: 24,
                border: "1px solid var(--border)",
                background: "var(--surface)",
                boxShadow: "var(--shadow-md)",
                padding: "36px 28px",
                position: "relative",
                overflow: "hidden",
              }}
            >
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "linear-gradient(90deg, #2d3748, #4a5568, #718096)" }} />

              {/* Icon */}
              <div style={{ textAlign: "center" }}>
                <div style={{
                  width: 72, height: 72, borderRadius: 20, margin: "0 auto 20px",
                  background: "linear-gradient(135deg, rgba(45,55,72,0.1), rgba(74,85,104,0.15))",
                  display: "grid", placeItems: "center",
                  border: "1px solid var(--border)",
                }}>
                  <BookOutlined style={{ fontSize: 32, color: "var(--ink)" }} />
                </div>

                <h2 style={{ margin: "0 0 6px", fontFamily: "var(--font-display)", fontStyle: "italic", color: "var(--ink)" }}>
                  Luyện đề TOEIC thật
                </h2>
                <p style={{ color: "var(--text-secondary)", margin: "0 0 24px", fontSize: 13 }}>
                  1,320 câu Part 3–7 từ bộ đề ETS 2020–2021 chính hãng
                </p>
              </div>

              {/* Part filter */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-muted)", display: "block", marginBottom: 8 }}>
                  Chọn phần thi
                </label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "center" }}>
                  {PARTS.map((p) => (
                    <button
                      key={p.value}
                      onClick={() => setSelectedPart(p.value)}
                      style={{
                        padding: "7px 14px", borderRadius: 10,
                        border: `1.5px solid ${selectedPart === p.value ? "var(--accent)" : "var(--border)"}`,
                        background: selectedPart === p.value ? "var(--accent)" : "var(--surface)",
                        color: selectedPart === p.value ? "var(--text-on-accent)" : "var(--text-secondary)",
                        fontSize: 12, fontWeight: selectedPart === p.value ? 700 : 500,
                        cursor: "pointer", transition: "all 0.15s",
                      }}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Exam select */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-muted)", display: "block", marginBottom: 8 }}>
                  Chọn đề thi
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6 }}>
                  {EXAMS.map((exam) => (
                    <button
                      key={exam.value}
                      onClick={() => setSelectedExam(exam.value)}
                      style={{
                        padding: "10px 8px",
                        borderRadius: 12,
                        border: `1.5px solid ${selectedExam === exam.value ? "var(--accent)" : "var(--border)"}`,
                        background: selectedExam === exam.value ? "color-mix(in srgb, var(--accent) 8%, var(--surface))" : "var(--surface)",
                        color: selectedExam === exam.value ? "var(--accent)" : "var(--text-secondary)",
                        fontSize: 12,
                        fontWeight: selectedExam === exam.value ? 700 : 500,
                        cursor: "pointer",
                        transition: "all 0.15s",
                        textAlign: "center",
                        lineHeight: 1.3,
                      }}
                    >
                      {exam.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Question count */}
              <div style={{ marginBottom: 28 }}>
                <label style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-muted)", display: "block", marginBottom: 8 }}>
                  Số câu hỏi
                </label>
                <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
                  {COUNTS.map((n) => (
                    <button
                      key={n}
                      onClick={() => setQuestionCount(n)}
                      style={{
                        width: 56, height: 40, borderRadius: 10,
                        border: `1.5px solid ${questionCount === n ? "var(--accent)" : "var(--border)"}`,
                        background: questionCount === n ? "var(--accent)" : "var(--surface)",
                        color: questionCount === n ? "var(--text-on-accent)" : "var(--text-secondary)",
                        fontWeight: 700, fontSize: 14, cursor: "pointer",
                        transition: "all 0.15s",
                      }}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              {error && (
                <div style={{ color: "var(--error)", fontSize: 13, marginBottom: 16, textAlign: "center" }}>{error}</div>
              )}

              {/* Start button */}
              <div style={{ textAlign: "center" }}>
                <Button
                  type="primary"
                  size="large"
                  onClick={startPractice}
                  loading={state === "loading"}
                  style={{ borderRadius: 999, paddingInline: 48 }}
                >
                  {state === "loading" ? "Đang tải..." : <><RocketOutlined style={{ marginRight: 6 }} /> Bắt đầu</>}
                </Button>
              </div>

              {/* Quick stats */}
              {history.length > 0 && (
                <div style={{
                  marginTop: 24, padding: "14px 16px", borderRadius: 14,
                  background: "var(--bg-deep)", border: "1px solid var(--border)",
                  display: "flex", justifyContent: "space-around", textAlign: "center",
                }}>
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: "var(--accent)", fontVariantNumeric: "tabular-nums" }}>
                      {history.length}
                    </div>
                    <div style={{ fontSize: 9, fontWeight: 600, textTransform: "uppercase", color: "var(--text-muted)" }}>Lần thi</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: "var(--success)", fontVariantNumeric: "tabular-nums" }}>
                      {Math.round(history.reduce((s, h) => s + (h.score / h.total) * 100, 0) / history.length)}%
                    </div>
                    <div style={{ fontSize: 9, fontWeight: 600, textTransform: "uppercase", color: "var(--text-muted)" }}>TB đúng</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: "var(--xp)", fontVariantNumeric: "tabular-nums" }}>
                      {Math.max(...history.map(h => Math.round((h.score / h.total) * 100)))}%
                    </div>
                    <div style={{ fontSize: 9, fontWeight: 600, textTransform: "uppercase", color: "var(--text-muted)" }}>Cao nhất</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═══ ACTIVE ═══ */}
        {state === "active" && currentQuestion && (
          <div className="anim-slide-in-left" key={`q-${currentIndex}`} style={{ maxWidth: 640, width: "100%" }}>
            {/* Progress bar */}
            <div style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 12 }}>
              <button onClick={resetPractice} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: 14 }}>
                <ArrowLeftOutlined />
              </button>
              <div style={{ flex: 1, height: 4, borderRadius: 2, background: "var(--border)" }}>
                <div style={{
                  width: `${((currentIndex + 1) / questions.length) * 100}%`,
                  height: "100%", borderRadius: 2,
                  background: "linear-gradient(90deg, var(--accent), var(--secondary))",
                  transition: "width 0.3s ease",
                }} />
              </div>
              <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", fontVariantNumeric: "tabular-nums", minWidth: 48, textAlign: "right" }}>
                {currentIndex + 1}/{questions.length}
              </span>
            </div>

            {/* Question card */}
            <div style={{
              borderRadius: 20, border: "1px solid var(--border)",
              background: "var(--surface)", boxShadow: "var(--shadow-md)",
              padding: "28px 24px",
            }}>
              {/* Source badge */}
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
                <Tag color="blue" style={{ margin: 0, borderRadius: 6, fontSize: 10, fontWeight: 700 }}>
                  Part {currentQuestion.part}
                </Tag>
                {currentQuestion.examName && (
                  <Tag color="default" style={{ margin: 0, borderRadius: 6, fontSize: 10, fontWeight: 600 }}>
                    {currentQuestion.examName} · Q{currentQuestion.number}
                  </Tag>
                )}
              </div>

              {/* Audio player for listening parts */}
              {currentQuestion.audio && (
                <div style={{
                  marginBottom: 16, padding: "12px 16px", borderRadius: 12,
                  background: "var(--bg-deep)", border: "1px solid var(--border)",
                  display: "flex", alignItems: "center", gap: 12,
                }}>
                  <SoundOutlined style={{ fontSize: 18, color: "var(--accent)" }} />
                  <audio ref={audioRef} controls src={currentQuestion.audio} style={{ flex: 1, height: 36 }} />
                </div>
              )}

              {/* Passage image for reading parts */}
              {currentQuestion.images && currentQuestion.images.length > 0 && (
                <div style={{ marginBottom: 16, borderRadius: 12, overflow: "hidden", border: "1px solid var(--border)" }}>
                  {currentQuestion.images.map((img, idx) => (
                    <img key={idx} src={img.image_path} alt={`Passage ${idx + 1}`}
                      style={{ width: "100%", display: "block" }} />
                  ))}
                </div>
              )}

              {/* Stem */}
              {currentQuestion.content && (
              <p style={{
                fontSize: 16, lineHeight: 1.7, color: "var(--ink)",
                fontWeight: 500, margin: "0 0 24px",
              }}>
                {currentQuestion.content.replace(/_+/g, " _______ ")}
              </p>
              )}

              {/* Options */}
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {currentQuestion.options.map((opt, i) => {
                  const letter = ["A", "B", "C", "D"][i];
                  const isCorrect = i === currentQuestion.correctIndex;
                  const isSelected = selectedAnswer === i;
                  let bg = "var(--surface)";
                  let border = "1px solid var(--border)";
                  let color = "var(--ink)";
                  if (isRevealed) {
                    if (isCorrect) { bg = "color-mix(in srgb, var(--success) 10%, var(--surface))"; border = "1.5px solid var(--success)"; color = "var(--success)"; }
                    else if (isSelected) { bg = "color-mix(in srgb, var(--error) 8%, var(--surface))"; border = "1.5px solid var(--error)"; color = "var(--error)"; }
                  } else if (isSelected) {
                    bg = "color-mix(in srgb, var(--accent) 10%, var(--surface))"; border = "1.5px solid var(--accent)"; color = "var(--accent)";
                  }

                  return (
                    <button
                      key={i}
                      onClick={() => answerQuestion(i)}
                      disabled={isRevealed}
                      style={{
                        display: "flex", alignItems: "center", gap: 12,
                        padding: "14px 16px", borderRadius: 14,
                        background: bg, border, color,
                        cursor: isRevealed ? "default" : "pointer",
                        fontSize: 14, fontWeight: isSelected || (isRevealed && isCorrect) ? 600 : 400,
                        textAlign: "left",
                        transition: "all 0.15s",
                      }}
                    >
                      <span style={{
                        width: 28, height: 28, borderRadius: 8,
                        display: "grid", placeItems: "center",
                        background: isRevealed && isCorrect ? "var(--success)" : isRevealed && isSelected ? "var(--error)" : "var(--bg-deep)",
                        color: isRevealed && (isCorrect || isSelected) ? "#fff" : "var(--text-muted)",
                        fontSize: 12, fontWeight: 700, flexShrink: 0,
                      }}>
                        {isRevealed && isCorrect ? <CheckCircleFilled /> : isRevealed && isSelected ? <CloseCircleFilled /> : letter}
                      </span>
                      {opt}
                    </button>
                  );
                })}
              </div>

              {/* Explanation */}
              {isRevealed && (
                <div className="anim-fade-in" style={{
                  marginTop: 20, padding: "16px 18px", borderRadius: 14,
                  background: "var(--bg-deep)", border: "1px solid var(--border)",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                    <StarFilled style={{ fontSize: 11, color: "var(--accent)" }} />
                    <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--accent)" }}>
                      {currentQuestion.topic}
                    </span>
                  </div>
                  <p style={{ fontSize: 13, lineHeight: 1.6, color: "var(--ink)", margin: "0 0 6px" }}>
                    {currentQuestion.explanationEn}
                  </p>
                  <p style={{ fontSize: 12, lineHeight: 1.5, color: "var(--text-secondary)", margin: 0 }}>
                    {currentQuestion.explanationVi}
                  </p>
                </div>
              )}

              {/* Next button */}
              {isRevealed && (
                <div style={{ marginTop: 20, textAlign: "center" }}>
                  <Button
                    type="primary"
                    size="large"
                    onClick={nextQuestion}
                    style={{ borderRadius: 999, paddingInline: 40 }}
                  >
                    {currentIndex + 1 >= questions.length ? (
                      <><TrophyOutlined style={{ marginRight: 6 }} /> Xem kết quả</>
                    ) : (
                      <>Câu tiếp theo →</>
                    )}
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═══ REVIEW ═══ */}
        {state === "review" && (
          <div className="anim-fade-up" style={{ maxWidth: 640, width: "100%" }}>
            {/* Score hero */}
            <div style={{
              borderRadius: 24, padding: "32px 24px",
              background: score / questions.length >= 0.8
                ? "linear-gradient(145deg, color-mix(in srgb, var(--accent) 85%, #000), var(--accent), color-mix(in srgb, var(--secondary) 90%, var(--accent)))"
                : "var(--surface)",
              border: score / questions.length >= 0.8 ? "none" : "1px solid var(--border)",
              boxShadow: score / questions.length >= 0.8
                ? "0 8px 32px color-mix(in srgb, var(--accent) 25%, transparent)"
                : "var(--shadow-md)",
              textAlign: "center", position: "relative", overflow: "hidden",
            }}>
              {score / questions.length >= 0.8 && (
                <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 80% 60% at 80% 0%, rgba(255,255,255,0.12) 0%, transparent 70%)", pointerEvents: "none" }} />
              )}
              <div style={{
                fontSize: 48, fontWeight: 800, fontVariantNumeric: "tabular-nums",
                color: score / questions.length >= 0.8 ? "var(--text-on-accent)" : "var(--accent)",
              }}>
                {score}/{questions.length}
              </div>
              <div style={{
                fontSize: 14, fontWeight: 600,
                color: score / questions.length >= 0.8 ? "rgba(255,255,255,0.7)" : "var(--text-secondary)",
                marginBottom: 8,
              }}>
                {Math.round((score / questions.length) * 100)}% chính xác
              </div>
              <div style={{
                fontSize: 12,
                color: score / questions.length >= 0.8 ? "rgba(255,255,255,0.5)" : "var(--text-muted)",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
              }}>
                <ClockCircleOutlined style={{ fontSize: 11 }} />
                {formatTime(endTime - startTime)}
              </div>

              {/* Action buttons */}
              <div style={{ marginTop: 20, display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
                <Button
                  onClick={resetPractice}
                  style={{
                    borderRadius: 12,
                    background: score / questions.length >= 0.8 ? "rgba(255,255,255,0.15)" : undefined,
                    borderColor: score / questions.length >= 0.8 ? "rgba(255,255,255,0.3)" : undefined,
                    color: score / questions.length >= 0.8 ? "#fff" : undefined,
                  }}
                  icon={<ReloadOutlined />}
                >
                  Làm đề mới
                </Button>
                {score < questions.length && (
                  <Button onClick={retryWrong} style={{ borderRadius: 12 }}>
                    Làm lại câu sai ({questions.length - score})
                  </Button>
                )}
              </div>
            </div>

            {/* Answer review */}
            <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <StarFilled style={{ fontSize: 12, color: "var(--accent)" }} />
                <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--accent)" }}>
                  Chi tiết từng câu
                </span>
                <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
              </div>
              {questions.map((q, i) => {
                const userAns = answers[i];
                const correct = userAns === q.correctIndex;
                return (
                  <div
                    key={i}
                    className={`anim-fade-up anim-delay-${Math.min(i + 1, 8)}`}
                    style={{
                      padding: "14px 16px", borderRadius: 14,
                      border: `1px solid ${correct ? "color-mix(in srgb, var(--success) 25%, transparent)" : "color-mix(in srgb, var(--error) 20%, transparent)"}`,
                      background: correct
                        ? "color-mix(in srgb, var(--success) 5%, var(--surface))"
                        : "color-mix(in srgb, var(--error) 5%, var(--surface))",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                      <div style={{
                        width: 28, height: 28, borderRadius: 9, display: "grid", placeItems: "center",
                        background: correct ? "color-mix(in srgb, var(--success) 12%, transparent)" : "color-mix(in srgb, var(--error) 12%, transparent)",
                        flexShrink: 0, marginTop: 2,
                      }}>
                        {correct ? <CheckCircleFilled style={{ color: "var(--success)", fontSize: 13 }} /> : <CloseCircleFilled style={{ color: "var(--error)", fontSize: 13 }} />}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>
                            Câu {i + 1}
                          </span>
                          <Tag color={correct ? "success" : "error"} style={{ margin: 0, borderRadius: 6, fontSize: 10 }}>
                            {correct ? "Đúng" : "Sai"}
                          </Tag>
                          <Tag color="blue" style={{ margin: 0, borderRadius: 4, fontSize: 9 }}>P{q.part}</Tag>
                          {q.examName && (
                            <span style={{ fontSize: 10, color: "var(--text-muted)" }}>{q.examName}</span>
                          )}
                        </div>
                        <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: "0 0 4px", lineHeight: 1.5 }}>
                          {(q.content || "").replace(/_+/g, " ___ ")}
                        </p>
                        {!correct && (
                          <div style={{ fontSize: 11, color: "var(--text-muted)", lineHeight: 1.4 }}>
                            <span style={{ color: "var(--error)" }}>Bạn chọn: {q.options[userAns ?? 0]}</span>
                            {" · "}
                            <span style={{ color: "var(--success)" }}>Đáp án: {q.options[q.correctIndex]}</span>
                            <p style={{ margin: "4px 0 0", color: "var(--text-secondary)" }}>{q.explanationVi}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* History drawer */}
      <Drawer
        title="Lịch sử làm bài"
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        width={360}
        styles={{ body: { padding: "16px" } }}
      >
        {history.length === 0 ? (
          <p style={{ color: "var(--text-muted)", textAlign: "center", marginTop: 40 }}>Chưa có lịch sử</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {history.map((h, i) => (
              <div key={i} style={{
                padding: "12px 14px", borderRadius: 12,
                border: "1px solid var(--border)",
                background: "var(--surface)",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>
                    {h.examName}
                  </span>
                  <Tag
                    color={h.score / h.total >= 0.8 ? "success" : h.score / h.total >= 0.5 ? "warning" : "error"}
                    style={{ margin: 0, borderRadius: 6, fontWeight: 700 }}
                  >
                    {h.score}/{h.total}
                  </Tag>
                </div>
                <div style={{ display: "flex", gap: 12, marginTop: 4, fontSize: 11, color: "var(--text-muted)" }}>
                  <span><ClockCircleOutlined style={{ marginRight: 3 }} />{formatTime(h.timeMs)}</span>
                  <span>{new Date(h.date).toLocaleDateString("vi-VN")}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Drawer>
    </div>
  );
}
