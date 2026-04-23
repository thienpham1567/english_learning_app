"use client";
import { api } from "@/lib/api-client";
import { useState, useCallback, useEffect } from "react";
import {
  ArrowLeftOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  LoadingOutlined,
  BulbOutlined,
  SoundOutlined,
  RightOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import { Tag, Progress } from "antd";

type Example = { en: string; vi: string; highlight: string };
type Mistake = { wrong: string; correct: string; note: string };
type Exercise = { id: string; sentence: string; answer: string; options: string[]; explanation: string };

export type LessonData = {
  title: string;
  titleVi: string;
  formula: string;
  explanation: string;
  examples: Example[];
  commonMistakes: Mistake[];
  exercises: Exercise[];
};

type LessonState = "loading" | "lesson" | "exercises" | "complete";

interface Props {
  topicId: string;
  topicTitle: string;
  level: string;
  examMode: string;
  onBack: () => void;
  onComplete: (topicId: string) => void;
}

export function LessonView({ topicId, topicTitle, level, examMode, onBack, onComplete }: Props) {
  const [state, setState] = useState<LessonState>("loading");
  const [lesson, setLesson] = useState<LessonData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [exerciseIdx, setExerciseIdx] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [xpAwarded, setXpAwarded] = useState(0);

  const loadLesson = useCallback(async () => {
    return api.post<LessonData>("/grammar-lessons/generate", {
      topic: topicId, topicTitle, examMode, level,
    });
  }, [examMode, level, topicId, topicTitle]);

  const generateLesson = useCallback(async () => {
    setState("loading");
    setError(null);
    try {
      const data = await loadLesson();
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

  const handleAnswer = (option: string) => {
    if (revealed || !currentExercise) return;
    setSelected(option);
    setRevealed(true);
    if (option === currentExercise.answer) {
      setCorrectCount((c) => c + 1);
    }
  };

  const nextExercise = async () => {
    if (!lesson) return;
    if (exerciseIdx < lesson.exercises.length - 1) {
      setExerciseIdx((i) => i + 1);
      setSelected(null);
      setRevealed(false);
    } else {
      // Complete
      try {
        const data = await api.post<{ xpAwarded: number }>("/grammar-lessons/complete", {
          topic: topicId, correctCount, totalCount: lesson.exercises.length,
        });
        setXpAwarded(data.xpAwarded);
      } catch { /* continue */ }
      onComplete(topicId);
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
        display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 0",
        border: "none", background: "transparent", color: "var(--accent)",
        cursor: "pointer", fontSize: 14, fontWeight: 500, marginBottom: 16,
      }}>
        <ArrowLeftOutlined /> Danh sách chủ đề
      </button>

      {/* Loading */}
      {state === "loading" && (
        <div style={{ textAlign: "center", padding: 60 }}>
          <LoadingOutlined style={{ fontSize: 36, color: "var(--accent)" }} />
          <p style={{ color: "var(--text-secondary)", marginTop: 12 }}>Đang tạo bài học {topicTitle}...</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{ padding: 16, borderRadius: 12, background: "var(--error-bg)", border: "1px solid color-mix(in srgb, var(--error) 25%, transparent)", color: "var(--error)", textAlign: "center" }}>
          <p>{error}</p>
          <button onClick={generateLesson} style={{ padding: "8px 16px", borderRadius: 8, border: "none", background: "var(--error)", color: "#fff", cursor: "pointer", marginTop: 8 }}>
            Thử lại
          </button>
        </div>
      )}

      {/* Lesson content */}
      {state === "lesson" && lesson && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Title */}
          <div style={{ padding: 20, borderRadius: 16, background: "var(--card-bg)", border: "1px solid var(--border)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>{lesson.title}</h2>
              <Tag color="blue" style={{ margin: 0 }}>{level}</Tag>
            </div>
            <p style={{ margin: 0, fontSize: 14, color: "var(--text-secondary)" }}>{lesson.titleVi}</p>
          </div>

          {/* Formula */}
          <div style={{
            padding: 20, borderRadius: 12, textAlign: "center",
            background: "linear-gradient(135deg, var(--accent-muted), color-mix(in srgb, var(--secondary) 6%, var(--surface)))",
            border: "1px solid var(--border)",
          }}>
            <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: "0 0 8px", fontWeight: 600 }}>📐 Công thức</p>
            <p style={{ fontSize: 18, fontWeight: 700, color: "var(--accent)", margin: 0, fontFamily: "monospace" }}>
              {lesson.formula}
            </p>
          </div>

          {/* Explanation */}
          <div style={{ padding: 16, borderRadius: 12, background: "var(--card-bg)", border: "1px solid var(--border)" }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", margin: "0 0 8px" }}>📖 Giải thích</p>
            <p style={{ fontSize: 14, lineHeight: 1.7, color: "var(--text)", margin: 0 }}>{lesson.explanation}</p>
          </div>

          {/* Examples */}
          <div style={{ padding: 16, borderRadius: 12, background: "var(--card-bg)", border: "1px solid var(--border)" }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", margin: "0 0 12px" }}>💬 Ví dụ</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {lesson.examples.map((ex, i) => (
                <div key={i} style={{ padding: 12, borderRadius: 8, background: "var(--surface)", border: "1px solid var(--border)" }}>
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
            <p style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", margin: "0 0 12px" }}>⚠️ Lỗi thường gặp</p>
            {lesson.commonMistakes.map((m, i) => (
              <div key={i} style={{ padding: 10, borderRadius: 8, marginBottom: i < lesson.commonMistakes.length - 1 ? 8 : 0, background: "var(--error-bg)", border: "1px solid color-mix(in srgb, var(--error) 12%, transparent)" }}>
                <p style={{ margin: 0, fontSize: 13 }}>
                  <CloseCircleOutlined style={{ color: "var(--error)", marginRight: 4 }} />
                  <span style={{ textDecoration: "line-through", color: "var(--error)" }}>{m.wrong}</span>
                </p>
                <p style={{ margin: "4px 0 0", fontSize: 13 }}>
                  <CheckCircleOutlined style={{ color: "var(--success)", marginRight: 4 }} />
                  <span style={{ color: "var(--success)" }}>{m.correct}</span>
                </p>
                <p style={{ margin: "4px 0 0", fontSize: 12, color: "var(--text-secondary)" }}>💡 {m.note}</p>
              </div>
            ))}
          </div>

          {/* Start exercises button */}
          <button onClick={() => { setState("exercises"); setExerciseIdx(0); setCorrectCount(0); setSelected(null); setRevealed(false); }} style={{
            padding: "14px 24px", borderRadius: 12, border: "none",
            background: "var(--accent)", color: "#fff", fontSize: 15, fontWeight: 600,
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
            <p style={{ fontSize: 16, fontWeight: 500, lineHeight: 1.6, margin: "0 0 20px" }}>
              {currentExercise.sentence}
            </p>

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
                    transition: "all 0.2s",
                  }}>
                    {revealed && isCorrect && <CheckCircleOutlined style={{ marginRight: 8 }} />}
                    {revealed && isSelected && !isCorrect && <CloseCircleOutlined style={{ marginRight: 8 }} />}
                    {opt}
                  </button>
                );
              })}
            </div>

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
              background: "var(--accent)", color: "#fff", fontSize: 15, fontWeight: 600, cursor: "pointer",
            }}>
              {exerciseIdx < lesson.exercises.length - 1 ? <>Câu tiếp <RightOutlined /></> : <>Hoàn thành <CheckCircleOutlined /></>}
            </button>
          )}
        </div>
      )}

      {/* Completion */}
      {state === "complete" && lesson && (
        <div style={{ textAlign: "center", padding: 32, borderRadius: 16, background: "var(--card-bg)", border: "1px solid var(--border)" }}>
          <CheckCircleOutlined style={{ fontSize: 48, color: "var(--success)", marginBottom: 16 }} />
          <h2 style={{ margin: "0 0 8px" }}>Bài học hoàn thành!</h2>
          <p style={{ color: "var(--text-secondary)", margin: "0 0 4px" }}>
            {lesson.title} — {correctCount}/{lesson.exercises.length} câu đúng
          </p>
          {xpAwarded > 0 && (
            <p style={{ color: "var(--accent)", fontSize: 15, fontWeight: 600, margin: "8px 0 20px" }}>+{xpAwarded} XP</p>
          )}
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <button onClick={onBack} style={{
              padding: "10px 20px", borderRadius: 8, border: "1px solid var(--border)",
              background: "transparent", color: "var(--text)", cursor: "pointer", fontSize: 13, fontWeight: 500,
            }}>
              <ArrowLeftOutlined /> Chủ đề khác
            </button>
            <button onClick={() => { window.location.href = "/grammar-quiz"; }} style={{
              padding: "10px 20px", borderRadius: 8, border: "none",
              background: "var(--accent)", color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 600,
            }}>
              <ReloadOutlined /> Luyện quiz ngữ pháp
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
