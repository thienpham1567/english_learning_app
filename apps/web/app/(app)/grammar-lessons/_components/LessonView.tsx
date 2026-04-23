"use client";
import { api } from "@/lib/api-client";
import { useState, useCallback, useEffect } from "react";
import {
  isGrammarAnswerCorrect,
  type GrammarLessonAnswer,
  type GrammarLessonData,
  type GrammarLessonProgressItem,
} from "@/lib/grammar-lessons/schema";
import {
  ArrowLeftOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  LoadingOutlined,
  BulbOutlined,
  SoundOutlined,
  RightOutlined,
  ReloadOutlined,
  CalculatorOutlined,
  BookOutlined,
  MessageOutlined,
  WarningOutlined,
  TrophyOutlined,
  StarFilled,
} from "@ant-design/icons";
import { Tag, Progress } from "antd";

type LessonState = "loading" | "lesson" | "exercises" | "complete";

type CompleteResponse = {
  xpAwarded: number;
  alreadyCompleted: boolean;
  loggedErrors: number;
  progress: GrammarLessonProgressItem;
};

interface Props {
  topicId: string;
  topicTitle: string;
  level: string;
  examMode: string;
  onBack: () => void;
  onComplete: (topicId: string, progress: GrammarLessonProgressItem) => void;
}

export function LessonView({ topicId, topicTitle, level, examMode, onBack, onComplete }: Props) {
  const [state, setState] = useState<LessonState>("loading");
  const [lesson, setLesson] = useState<GrammarLessonData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [exerciseIdx, setExerciseIdx] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [typedAnswer, setTypedAnswer] = useState("");
  const [revealed, setRevealed] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [answers, setAnswers] = useState<GrammarLessonAnswer[]>([]);
  const [xpAwarded, setXpAwarded] = useState(0);
  const [loggedErrors, setLoggedErrors] = useState(0);
  const [alreadyCompleted, setAlreadyCompleted] = useState(false);
  const [startedAt, setStartedAt] = useState<number | null>(null);

  const loadLesson = useCallback(async (forceRefresh = false) => {
    return api.post<GrammarLessonData>("/grammar-lessons/generate", {
      topic: topicId, topicTitle, examMode, level, forceRefresh,
    });
  }, [examMode, level, topicId, topicTitle]);

  const generateLesson = useCallback(async (forceRefresh = true) => {
    setState("loading");
    setError(null);
    try {
      const data = await loadLesson(forceRefresh);
      setLesson(data);
      setState("lesson");
    } catch {
      setError("Không thể tạo bài học. Vui lòng thử lại.");
      setState("lesson");
    }
  }, [loadLesson]);

  // Auto-generate on mount
  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const data = await loadLesson();
        if (!cancelled) {
          setLesson(data);
          setError(null);
          setState("lesson");
        }
      } catch {
        if (!cancelled) {
          setError("Không thể tạo bài học. Vui lòng thử lại.");
          setState("lesson");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [loadLesson]);

  const currentExercise = lesson?.exercises?.[exerciseIdx] ?? null;

  const resetExerciseInput = () => {
    setSelected(null);
    setTypedAnswer("");
    setRevealed(false);
  };

  const recordAnswer = (userAnswer: string, correct: boolean) => {
    if (revealed || !currentExercise) return;

    setAnswers((prev) => [
      ...prev,
      {
        exerciseId: currentExercise.id,
        type: currentExercise.type,
        questionStem: currentExercise.sentence,
        options: currentExercise.type === "multiple_choice" ? currentExercise.options : undefined,
        userAnswer,
        correctAnswer: currentExercise.answer,
        explanationVi: currentExercise.explanation,
        correct,
      },
    ]);
    setRevealed(true);
    if (correct) {
      setCorrectCount((c) => c + 1);
    }
  };

  const handleAnswer = (option: string) => {
    if (revealed || !currentExercise || currentExercise.type !== "multiple_choice") return;
    setSelected(option);
    recordAnswer(option, option === currentExercise.answer);
  };

  const handleWrittenAnswer = () => {
    if (!currentExercise || currentExercise.type === "multiple_choice") return;
    const userAnswer = typedAnswer.trim();
    if (!userAnswer) return;
    recordAnswer(userAnswer, isGrammarAnswerCorrect(userAnswer, currentExercise.answer));
  };

  const nextExercise = async () => {
    if (!lesson) return;
    if (exerciseIdx < lesson.exercises.length - 1) {
      setExerciseIdx((i) => i + 1);
      resetExerciseInput();
    } else {
      const completedAt = new Date().toISOString();
      const scorePct = Math.round((correctCount / lesson.exercises.length) * 100);
      const fallbackProgress: GrammarLessonProgressItem = {
        topicId,
        status: "completed",
        correctCount,
        totalCount: lesson.exercises.length,
        scorePct,
        completedAt,
        lastStudiedAt: completedAt,
      };
      try {
        const data = await api.post<CompleteResponse>("/grammar-lessons/complete", {
          topic: topicId,
          topicTitle,
          examMode,
          level,
          correctCount,
          totalCount: lesson.exercises.length,
          durationMs: startedAt ? Date.now() - startedAt : 0,
          answers,
        });
        setXpAwarded(data.xpAwarded);
        setLoggedErrors(data.loggedErrors);
        setAlreadyCompleted(data.alreadyCompleted);
        onComplete(topicId, data.progress);
      } catch {
        onComplete(topicId, fallbackProgress);
      }
      setState("complete");
    }
  };

  const speakText = (text: string) => {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "en-US";
    u.rate = 0.85;
    speechSynthesis.speak(u);
  };

  return (
    <div style={{ maxWidth: 700, margin: "0 auto", width: "100%" }}>
      {/* Back button */}
      <button onClick={onBack} style={{
        display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 14px",
        border: "1px solid var(--border)", borderRadius: 10,
        background: "var(--card-bg)", color: "var(--accent)",
        cursor: "pointer", fontSize: 13, fontWeight: 600, marginBottom: 16,
        boxShadow: "var(--shadow-sm)", transition: "box-shadow 0.15s",
      }}>
        <ArrowLeftOutlined /> Danh sách chủ đề
      </button>

      {/* Loading */}
      {state === "loading" && (
        <div style={{
          textAlign: "center", padding: "60px 20px",
          borderRadius: 20, background: "var(--card-bg)",
          border: "1px solid var(--border)", boxShadow: "var(--shadow-md)",
        }}>
          <LoadingOutlined style={{ fontSize: 40, color: "var(--accent)" }} />
          <p style={{ color: "var(--text-secondary)", marginTop: 16, fontSize: 14 }}>
            Đang tạo bài học <strong>{topicTitle}</strong>...
          </p>
          <p style={{ color: "var(--text-muted)", fontSize: 12, margin: 0 }}>Vui lòng chờ vài giây</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{ padding: 16, borderRadius: 12, background: "var(--error-bg)", border: "1px solid color-mix(in srgb, var(--error) 25%, transparent)", color: "var(--error)", textAlign: "center" }}>
          <p>{error}</p>
          <button onClick={() => generateLesson(false)} style={{ padding: "8px 16px", borderRadius: 8, border: "none", background: "var(--error)", color: "#fff", cursor: "pointer", marginTop: 8 }}>
            Thử lại
          </button>
        </div>
      )}

      {/* Lesson content */}
      {state === "lesson" && lesson && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Title card */}
          <div style={{
            padding: "20px 22px", borderRadius: 18,
            background: "linear-gradient(135deg, var(--card-bg) 0%, color-mix(in srgb, var(--accent) 4%, var(--surface)) 100%)",
            border: "1px solid var(--border)", boxShadow: "var(--shadow-md)",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "var(--ink)", flex: 1 }}>{lesson.title}</h2>
              <Tag color="blue" style={{ margin: 0, fontWeight: 700, borderRadius: 8 }}>{level}</Tag>
              <button
                onClick={() => generateLesson(true)}
                style={{
                  border: "1px solid var(--border)", borderRadius: 8,
                  background: "var(--surface)", color: "var(--text-secondary)",
                  cursor: "pointer", fontSize: 12, padding: "5px 10px",
                  fontWeight: 600, transition: "background 0.15s",
                }}
              >
                <ReloadOutlined /> Tạo lại
              </button>
            </div>
            <p style={{ margin: 0, fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.5 }}>{lesson.titleVi}</p>
          </div>

          {/* Formula card */}
          <div style={{
            padding: "22px 24px", borderRadius: 16, textAlign: "center",
            background: "linear-gradient(135deg, var(--accent-muted), color-mix(in srgb, var(--secondary) 8%, var(--surface)))",
            border: "1px solid color-mix(in srgb, var(--accent) 20%, var(--border))",
            boxShadow: "0 4px 16px color-mix(in srgb, var(--accent) 8%, transparent)",
          }}>
            <p style={{ fontSize: 11, color: "var(--text-muted)", margin: "0 0 10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>
              <CalculatorOutlined style={{ marginRight: 5 }} /> Công thức
            </p>
            <p style={{ fontSize: 20, fontWeight: 800, color: "var(--accent)", margin: 0, fontFamily: "var(--font-mono)" }}>
              {lesson.formula}
            </p>
          </div>

          {/* Explanation */}
          <div style={{ padding: 16, borderRadius: 12, background: "var(--card-bg)", border: "1px solid var(--border)" }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", margin: "0 0 8px" }}><BookOutlined style={{ marginRight: 4 }} /> Giải thích</p>
            <p style={{ fontSize: 14, lineHeight: 1.7, color: "var(--text)", margin: 0 }}>{lesson.explanation}</p>
          </div>

          {/* Examples */}
          <div style={{ padding: 16, borderRadius: 12, background: "var(--card-bg)", border: "1px solid var(--border)" }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", margin: "0 0 12px" }}><MessageOutlined style={{ marginRight: 4 }} /> Ví dụ</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {lesson.examples.map((ex) => (
                <div key={ex.en} style={{ padding: 12, borderRadius: 8, background: "var(--surface)", border: "1px solid var(--border)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <p style={{ fontSize: 15, fontWeight: 500, margin: 0, flex: 1 }}>
                      {ex.en.split(ex.highlight).map((part, j, arr) => (
                        <span key={j}>
                          {part}
                          {j < arr.length - 1 && <strong style={{ color: "var(--accent)", textDecoration: "underline" }}>{ex.highlight}</strong>}
                        </span>
                      ))}
                    </p>
                    <button onClick={() => speakText(ex.en)} style={{ border: "none", background: "transparent", cursor: "pointer", color: "var(--accent)", padding: 4 }}>
                      <SoundOutlined />
                    </button>
                  </div>
                  <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: "4px 0 0", fontStyle: "italic" }}>{ex.vi}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Common Mistakes */}
          <div style={{ padding: 16, borderRadius: 12, background: "var(--card-bg)", border: "1px solid var(--border)" }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", margin: "0 0 12px" }}><WarningOutlined style={{ marginRight: 4, color: "var(--warning)" }} /> Lỗi thường gặp</p>
            {lesson.commonMistakes.map((m, i) => (
              <div key={m.wrong} style={{ padding: 10, borderRadius: 8, marginBottom: i < lesson.commonMistakes.length - 1 ? 8 : 0, background: "var(--error-bg)", border: "1px solid color-mix(in srgb, var(--error) 12%, transparent)" }}>
                <p style={{ margin: 0, fontSize: 13 }}>
                  <CloseCircleOutlined style={{ color: "var(--error)", marginRight: 4 }} />
                  <span style={{ textDecoration: "line-through", color: "var(--error)" }}>{m.wrong}</span>
                </p>
                <p style={{ margin: "4px 0 0", fontSize: 13 }}>
                  <CheckCircleOutlined style={{ color: "var(--success)", marginRight: 4 }} />
                  <span style={{ color: "var(--success)" }}>{m.correct}</span>
                </p>
                <p style={{ margin: "4px 0 0", fontSize: 12, color: "var(--text-secondary)" }}><BulbOutlined style={{ marginRight: 4, color: "var(--accent)" }} /> {m.note}</p>
              </div>
            ))}
          </div>

          {/* Start exercises button */}
          <button onClick={() => { setState("exercises"); setExerciseIdx(0); setCorrectCount(0); setAnswers([]); setStartedAt(Date.now()); resetExerciseInput(); }} style={{
            padding: "14px 24px", borderRadius: 12, border: "none",
            background: "var(--accent)", color: "var(--text-on-accent, #fff)", fontSize: 15, fontWeight: 600,
            cursor: "pointer", textAlign: "center",
          }}>
            Làm bài tập <RightOutlined />
          </button>
        </div>
      )}

      {/* Exercises */}
      {state === "exercises" && lesson && currentExercise && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--text-secondary)" }}>
            <span>Bài tập {exerciseIdx + 1}/{lesson.exercises.length}</span>
            <Progress percent={((exerciseIdx + 1) / lesson.exercises.length) * 100} size="small" showInfo={false} style={{ flex: 1 }} />
          </div>

          <div style={{ padding: 24, borderRadius: 16, background: "var(--card-bg)", border: "1px solid var(--border)" }}>
            <div style={{ marginBottom: 12 }}>
              <Tag color={currentExercise.type === "multiple_choice" ? "blue" : "purple"} style={{ margin: 0 }}>
                {currentExercise.type === "multiple_choice"
                  ? "Trắc nghiệm"
                  : currentExercise.type === "error_correction"
                  ? "Sửa lỗi"
                  : "Viết lại câu"}
              </Tag>
            </div>
            <p style={{ fontSize: 16, fontWeight: 500, lineHeight: 1.6, margin: "0 0 20px" }}>
              {currentExercise.sentence}
            </p>

            {currentExercise.type === "multiple_choice" ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {currentExercise.options.map((opt) => {
                  const isCorrect = opt === currentExercise.answer;
                  const isSelected = opt === selected;
                  let bg = "var(--surface)";
                  let border = "1px solid var(--border)";
                  let color = "var(--text)";

                  if (revealed) {
                    if (isCorrect) { bg = "color-mix(in srgb, var(--success) 8%, var(--surface))"; border = "1px solid var(--success)"; color = "var(--success)"; }
                    else if (isSelected) { bg = "color-mix(in srgb, var(--error) 8%, var(--surface))"; border = "1px solid var(--error)"; color = "var(--error)"; }
                  }

                  return (
                    <button key={opt} onClick={() => handleAnswer(opt)} disabled={revealed} style={{
                      padding: "12px 16px", borderRadius: 10, border, background: bg,
                      color, fontSize: 14, fontWeight: isSelected || (revealed && isCorrect) ? 600 : 400,
                      cursor: revealed ? "default" : "pointer", textAlign: "left",
                      transition: "background 0.2s, border-color 0.2s, color 0.2s",
                    }}>
                      {revealed && isCorrect && <CheckCircleOutlined style={{ marginRight: 8 }} />}
                      {revealed && isSelected && !isCorrect && <CloseCircleOutlined style={{ marginRight: 8 }} />}
                      {opt}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <textarea
                  value={typedAnswer}
                  onChange={(event) => setTypedAnswer(event.target.value)}
                  disabled={revealed}
                  rows={3}
                  placeholder={currentExercise.instructionVi ?? "Nhập câu trả lời của bạn"}
                  style={{
                    width: "100%",
                    resize: "vertical",
                    border: "1px solid var(--border)",
                    borderRadius: 10,
                    background: "var(--surface)",
                    color: "var(--text)",
                    fontSize: 14,
                    lineHeight: 1.5,
                    padding: "12px 14px",
                  }}
                />
                {!revealed && (
                  <button
                    onClick={handleWrittenAnswer}
                    disabled={!typedAnswer.trim()}
                    style={{
                      alignSelf: "flex-start",
                      border: "none",
                      borderRadius: 9,
                      background: typedAnswer.trim() ? "var(--accent)" : "var(--border)",
                      color: typedAnswer.trim() ? "var(--text-on-accent, #fff)" : "var(--text-muted)",
                      cursor: typedAnswer.trim() ? "pointer" : "default",
                      fontSize: 13,
                      fontWeight: 600,
                      padding: "9px 14px",
                    }}
                  >
                    Kiểm tra <CheckCircleOutlined />
                  </button>
                )}
              </div>
            )}

            {revealed && currentExercise.type !== "multiple_choice" && (
              <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ padding: 10, borderRadius: 8, background: selected === null && isGrammarAnswerCorrect(typedAnswer, currentExercise.answer) ? "color-mix(in srgb, var(--success) 8%, var(--surface))" : "var(--error-bg)", border: "1px solid var(--border)", fontSize: 13 }}>
                  <strong>Đáp án của bạn:</strong> {typedAnswer}
                </div>
                <div style={{ padding: 10, borderRadius: 8, background: "color-mix(in srgb, var(--success) 8%, var(--surface))", border: "1px solid var(--success)", color: "var(--success)", fontSize: 13 }}>
                  <CheckCircleOutlined style={{ marginRight: 4 }} />
                  {currentExercise.answer}
                </div>
              </div>
            )}

            {revealed && (
              <div style={{ marginTop: 16, padding: 12, borderRadius: 8, background: "var(--surface)", border: "1px solid var(--border)", fontSize: 13, color: "var(--text-secondary)" }}>
                <BulbOutlined style={{ marginRight: 4, color: "var(--accent)" }} />
                {currentExercise.explanation}
              </div>
            )}
          </div>

          {revealed && (
            <button onClick={nextExercise} style={{
              padding: "12px 24px", borderRadius: 10, border: "none",
              background: "var(--accent)", color: "var(--text-on-accent, #fff)", fontSize: 15, fontWeight: 600, cursor: "pointer",
            }}>
              {exerciseIdx < lesson.exercises.length - 1 ? <>Câu tiếp <RightOutlined /></> : <>Hoàn thành <CheckCircleOutlined /></>}
            </button>
          )}
        </div>
      )}

      {/* Completion */}
      {state === "complete" && lesson && (
        <div style={{
          textAlign: "center", padding: "40px 28px", borderRadius: 20,
          background: "linear-gradient(180deg, var(--card-bg) 0%, color-mix(in srgb, var(--success) 4%, var(--surface)) 100%)",
          border: "1px solid var(--border)", boxShadow: "var(--shadow-lg)",
        }}>
          <div style={{ position: "relative", display: "inline-block", marginBottom: 20 }}>
            <TrophyOutlined style={{ fontSize: 52, color: "var(--success)" }} />
            <StarFilled style={{
              position: "absolute", top: -6, right: -10,
              fontSize: 18, color: "var(--xp)",
              filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.15))",
            }} />
          </div>
          <h2 style={{ margin: "0 0 6px", fontSize: 22, fontWeight: 800, color: "var(--ink)" }}>Hoàn thành xuất sắc!</h2>
          <p style={{ color: "var(--text-secondary)", margin: "0 0 6px", fontSize: 14 }}>
            {lesson.title} — <strong style={{ color: correctCount === lesson.exercises.length ? "var(--success)" : "var(--text)" }}>{correctCount}/{lesson.exercises.length}</strong> câu đúng
          </p>
          {xpAwarded > 0 && (
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "8px 18px", borderRadius: 99,
              background: "color-mix(in srgb, var(--accent) 12%, var(--surface))",
              color: "var(--accent)", fontSize: 16, fontWeight: 800, margin: "12px 0 20px",
            }}>
              <StarFilled style={{ fontSize: 14 }} /> +{xpAwarded} XP
            </div>
          )}
          {alreadyCompleted && (
            <p style={{ color: "var(--text-muted)", fontSize: 12, margin: "8px 0 0" }}>
              Chủ đề này đã nhận XP trước đó. Điểm tốt nhất vẫn được cập nhật.
            </p>
          )}
          {loggedErrors > 0 && (
            <p style={{ color: "var(--warning)", fontSize: 13, fontWeight: 700, margin: "8px 0 20px" }}>
              <WarningOutlined style={{ marginRight: 4 }} /> {loggedErrors} lỗi đã được thêm vào ôn tập.
            </p>
          )}
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", marginTop: 8 }}>
            <button onClick={onBack} style={{
              padding: "11px 22px", borderRadius: 10, border: "1px solid var(--border)",
              background: "var(--surface)", color: "var(--text)", cursor: "pointer", fontSize: 13, fontWeight: 600,
              boxShadow: "var(--shadow-sm)",
            }}>
              <ArrowLeftOutlined /> Chủ đề khác
            </button>
            <button onClick={() => { window.location.href = "/grammar-quiz"; }} style={{
              padding: "11px 22px", borderRadius: 10, border: "none",
              background: "linear-gradient(135deg, var(--accent), var(--secondary))",
              color: "var(--text-on-accent, #fff)", cursor: "pointer", fontSize: 13, fontWeight: 700,
              boxShadow: "0 4px 12px color-mix(in srgb, var(--accent) 25%, transparent)",
            }}>
              <ReloadOutlined /> Luyện quiz ngữ pháp
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
