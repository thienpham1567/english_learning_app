"use client";
import { api } from "@/lib/api-client";
import { useRouter } from "next/navigation";
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
  FireOutlined,
  EyeOutlined,
  TranslationOutlined,
} from "@ant-design/icons";

const OPTION_LABELS = ["A", "B", "C", "D"] as const;
const TIER_LABELS: Record<string, { label: string; color: string }> = {
  recognition: { label: "Nhận diện", color: "blue" },
  application: { label: "Ứng dụng", color: "cyan" },
  production: { label: "Tạo câu", color: "purple" },
  context: { label: "Ngữ cảnh", color: "volcano" },
};
import { Tag, Progress } from "antd";
import { useTextToSpeech } from "@/hooks/useTextToSpeech";

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
  const router = useRouter();
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
  const [combo, setCombo] = useState(0);
  const [hintUsed, setHintUsed] = useState(false);
  const [explLang, setExplLang] = useState<"vi" | "en">("vi");
  const [showReview, setShowReview] = useState(false);
  const { speak: speakTts, isSpeaking, isLoading: isTtsLoading } = useTextToSpeech();

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
    setHintUsed(false);
    setExplLang("vi");
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
        explanationEn: currentExercise.explanationEn,
        correct,
      },
    ]);
    setRevealed(true);
    if (correct) {
      setCorrectCount((c) => c + 1);
      setCombo((c) => c + 1);
    } else {
      setCombo(0);
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
    recordAnswer(userAnswer, isGrammarAnswerCorrect(userAnswer, currentExercise.answer, currentExercise.acceptedAnswers));
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
    speakTts(text);
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
          <button onClick={() => generateLesson(false)} style={{ padding: "8px 16px", borderRadius: 8, border: "none", background: "var(--error)", color: "var(--text-on-accent)", cursor: "pointer", marginTop: 8 }}>
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

          {/* Explanation — Bilingual */}
          <div style={{ padding: 16, borderRadius: 12, background: "var(--card-bg)", border: "1px solid var(--border)" }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", margin: "0 0 10px" }}><BookOutlined style={{ marginRight: 4 }} /> Explanation</p>
            <p style={{ fontSize: 14, lineHeight: 1.7, color: "var(--text)", margin: 0 }}>{lesson.explanationEn ?? lesson.explanation}</p>
            <div style={{
              marginTop: 12, padding: "10px 14px", borderRadius: 8,
              background: "color-mix(in srgb, var(--accent) 4%, var(--surface))",
              borderLeft: "3px solid var(--accent)",
            }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "var(--accent)", letterSpacing: "0.04em" }}>🇻🇳 Giải thích tiếng Việt</span>
              <p style={{ margin: "6px 0 0", fontSize: 13, lineHeight: 1.65, color: "var(--text-secondary)" }}>{lesson.explanation}</p>
            </div>
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
                    <button onClick={() => speakText(ex.en)} disabled={isSpeaking || isTtsLoading} style={{ border: "none", background: "transparent", cursor: isSpeaking || isTtsLoading ? "not-allowed" : "pointer", color: "var(--accent)", padding: 4, opacity: isSpeaking || isTtsLoading ? 0.5 : 1 }}>
                      {isTtsLoading ? <LoadingOutlined spin /> : <SoundOutlined />}
                    </button>
                  </div>
                  <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: "4px 0 0", fontStyle: "italic" }}>{ex.vi}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Common Mistakes — Bilingual */}
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
                {m.noteEn && (
                  <p style={{ margin: "6px 0 0", fontSize: 12, color: "var(--text)" }}>
                    <TranslationOutlined style={{ marginRight: 4, color: "var(--info)" }} /> {m.noteEn}
                  </p>
                )}
                <p style={{ margin: "4px 0 0", fontSize: 12, color: "var(--text-secondary)" }}><BulbOutlined style={{ marginRight: 4, color: "var(--accent)" }} /> {m.note}</p>
              </div>
            ))}
          </div>

          {/* Start exercises button */}
          <button onClick={() => { setState("exercises"); setExerciseIdx(0); setCorrectCount(0); setCombo(0); setAnswers([]); setStartedAt(Date.now()); resetExerciseInput(); }} style={{
            padding: "14px 24px", borderRadius: 12, border: "none",
            background: "linear-gradient(135deg, var(--accent), color-mix(in srgb, var(--accent) 78%, black))",
            color: "var(--text-on-accent)", fontSize: 15, fontWeight: 700,
            cursor: "pointer", textAlign: "center", width: "100%",
            boxShadow: "0 4px 12px color-mix(in srgb, var(--accent) 25%, transparent)",
          }}>
            Làm bài tập · {lesson.exercises.length} câu <RightOutlined />
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

          {/* Combo badge */}
          {combo >= 2 && (
            <div key={`combo-${combo}`} className="anim-pop-in" style={{ display: "flex", justifyContent: "center" }}>
              <span style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                borderRadius: 999, background: "linear-gradient(135deg, var(--xp), var(--error))",
                padding: "6px 16px", fontSize: 14, fontWeight: 700,
                color: "var(--text-on-accent)",
                boxShadow: "0 2px 12px color-mix(in srgb, var(--xp) 35%, transparent)",
              }}>
                <FireOutlined /> x{combo} Combo!
              </span>
            </div>
          )}

          <div style={{ padding: 24, borderRadius: 16, background: "var(--card-bg)", border: "1px solid var(--border)", borderTop: "3px solid var(--accent)" }}>
            {/* Exercise tags */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
              <Tag color={currentExercise.type === "multiple_choice" ? "blue" : "purple"} style={{ margin: 0 }}>
                {currentExercise.type === "multiple_choice"
                  ? "Trắc nghiệm"
                  : currentExercise.type === "error_correction"
                  ? "Sửa lỗi"
                  : "Viết lại câu"}
              </Tag>
              {currentExercise.tier && TIER_LABELS[currentExercise.tier] && (
                <Tag color={TIER_LABELS[currentExercise.tier].color} style={{ margin: 0, fontSize: 11 }}>
                  {TIER_LABELS[currentExercise.tier].label}
                </Tag>
              )}
            </div>

            {/* Question stem */}
            <p style={{ fontSize: 16, fontWeight: 500, lineHeight: 1.65, margin: "0 0 16px", color: "var(--ink)" }}>
              {currentExercise.sentence}
            </p>

            {/* Hint button */}
            {currentExercise.hint && !revealed && !hintUsed && (
              <button
                onClick={() => setHintUsed(true)}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 5,
                  padding: "6px 12px", borderRadius: 8, marginBottom: 14,
                  border: "1px solid color-mix(in srgb, var(--warning) 30%, var(--border))",
                  background: "color-mix(in srgb, var(--warning) 6%, var(--surface))",
                  color: "var(--warning)", fontSize: 12, fontWeight: 600, cursor: "pointer",
                }}
              >
                <EyeOutlined /> Xem gợi ý
              </button>
            )}
            {hintUsed && currentExercise.hint && !revealed && (
              <div className="anim-fade-up" style={{
                padding: "8px 12px", borderRadius: 8, marginBottom: 14,
                background: "color-mix(in srgb, var(--warning) 6%, var(--surface))",
                border: "1px solid color-mix(in srgb, var(--warning) 20%, var(--border))",
                fontSize: 13, color: "var(--text-secondary)",
              }}>
                <BulbOutlined style={{ color: "var(--warning)", marginRight: 6 }} />
                {currentExercise.hint}
              </div>
            )}

            {/* MCQ options with labels */}
            {currentExercise.type === "multiple_choice" ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {currentExercise.options.map((opt, i) => {
                  const isCorrect = opt === currentExercise.answer;
                  const isSelected = opt === selected;
                  let bg = "var(--surface)";
                  let border = "1px solid var(--border)";
                  let color = "var(--text)";
                  let opacity = 1;

                  if (revealed) {
                    if (isCorrect) { bg = "color-mix(in srgb, var(--success) 8%, var(--surface))"; border = "1px solid var(--success)"; color = "var(--success)"; }
                    else if (isSelected) { bg = "color-mix(in srgb, var(--error) 8%, var(--surface))"; border = "1px solid var(--error)"; color = "var(--error)"; }
                    else { opacity = 0.5; }
                  }

                  return (
                    <button key={opt} onClick={() => handleAnswer(opt)} disabled={revealed} style={{
                      display: "flex", width: "100%", alignItems: "center", gap: 12,
                      padding: "12px 16px", borderRadius: 10, border, background: bg,
                      color, fontSize: 14, fontWeight: isSelected || (revealed && isCorrect) ? 600 : 400,
                      cursor: revealed ? "default" : "pointer", textAlign: "left", opacity,
                      transition: "all 0.2s",
                    }}>
                      <span style={{
                        display: "flex", width: 30, height: 30, flexShrink: 0,
                        alignItems: "center", justifyContent: "center", borderRadius: 8,
                        background: revealed && isCorrect ? "var(--success)" : revealed && isSelected && !isCorrect ? "var(--error)" : isSelected ? "var(--accent)" : "var(--bg-deep)",
                        fontSize: 12, fontWeight: 800,
                        color: (revealed && (isCorrect || (isSelected && !isCorrect))) || isSelected ? "var(--text-on-accent)" : "var(--text-secondary)",
                        transition: "all 0.2s",
                      }}>
                        {revealed && isCorrect ? <CheckCircleOutlined style={{ fontSize: 13 }} /> : revealed && isSelected && !isCorrect ? <CloseCircleOutlined style={{ fontSize: 13 }} /> : OPTION_LABELS[i]}
                      </span>
                      <span style={{ flex: 1 }}>{opt}</span>
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
                    width: "100%", resize: "vertical",
                    border: "1px solid var(--border)", borderRadius: 10,
                    background: "var(--surface)", color: "var(--text)",
                    fontSize: 14, lineHeight: 1.5, padding: "12px 14px",
                  }}
                />
                {!revealed && (
                  <button onClick={handleWrittenAnswer} disabled={!typedAnswer.trim()} style={{
                    alignSelf: "flex-start", border: "none", borderRadius: 9,
                    background: typedAnswer.trim() ? "var(--accent)" : "var(--border)",
                    color: typedAnswer.trim() ? "var(--text-on-accent)" : "var(--text-muted)",
                    cursor: typedAnswer.trim() ? "pointer" : "default",
                    fontSize: 13, fontWeight: 600, padding: "9px 14px",
                  }}>
                    Kiểm tra <CheckCircleOutlined />
                  </button>
                )}
              </div>
            )}

            {/* Written answer comparison */}
            {revealed && currentExercise.type !== "multiple_choice" && (
              <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ padding: 10, borderRadius: 8, background: isGrammarAnswerCorrect(typedAnswer, currentExercise.answer, currentExercise.acceptedAnswers) ? "color-mix(in srgb, var(--success) 8%, var(--surface))" : "var(--error-bg)", border: "1px solid var(--border)", fontSize: 13 }}>
                  <strong>Đáp án của bạn:</strong> {typedAnswer}
                </div>
                <div style={{ padding: 10, borderRadius: 8, background: "color-mix(in srgb, var(--success) 8%, var(--surface))", border: "1px solid var(--success)", color: "var(--success)", fontSize: 13 }}>
                  <CheckCircleOutlined style={{ marginRight: 4 }} />
                  {currentExercise.answer}
                </div>
              </div>
            )}

            {/* Bilingual explanation with VN/EN toggle */}
            {revealed && (
              <div style={{ marginTop: 16, borderRadius: 10, border: "1px solid color-mix(in srgb, var(--accent) 20%, var(--border))", background: "color-mix(in srgb, var(--accent) 4%, var(--surface))", padding: 14 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    <BulbOutlined style={{ marginRight: 4 }} /> Giải thích
                  </span>
                  <div style={{ display: "flex", overflow: "hidden", borderRadius: 6, border: "1px solid color-mix(in srgb, var(--accent) 30%, var(--border))" }}>
                    {(["vi", "en"] as const).map((l) => (
                      <button key={l} onClick={() => setExplLang(l)} style={{
                        padding: "2px 10px", fontSize: 11, fontWeight: 600, border: "none", cursor: "pointer",
                        background: explLang === l ? "var(--accent)" : "color-mix(in srgb, var(--accent) 6%, var(--surface))",
                        color: explLang === l ? "var(--text-on-accent)" : "var(--accent)",
                      }}>
                        {l === "vi" ? "VN" : "EN"}
                      </button>
                    ))}
                  </div>
                </div>
                <p style={{ margin: 0, fontSize: 13, lineHeight: 1.65, color: "var(--text-secondary)" }}>
                  {explLang === "en" ? (currentExercise.explanationEn ?? currentExercise.explanation) : currentExercise.explanation}
                </p>
              </div>
            )}
          </div>

          {revealed && (
            <button onClick={nextExercise} style={{
              padding: "12px 24px", borderRadius: 10, border: "none",
              background: "linear-gradient(135deg, var(--accent), var(--accent-hover, var(--accent)))",
              color: "var(--text-on-accent)", fontSize: 15, fontWeight: 600, cursor: "pointer",
              width: "100%",
            }}>
              {exerciseIdx < lesson.exercises.length - 1 ? <>Câu tiếp <RightOutlined /></> : <>Hoàn thành <CheckCircleOutlined /></>}
            </button>
          )}
        </div>
      )}

      {/* Completion */}
      {state === "complete" && lesson && (() => {
        const scorePct = Math.round((correctCount / lesson.exercises.length) * 100);
        const wrongAnswers = answers.filter((a) => !a.correct);
        const medal = scorePct >= 90 ? "🥇" : scorePct >= 70 ? "🥈" : scorePct >= 50 ? "🥉" : "";
        return (
        <div style={{
          padding: "40px 28px", borderRadius: 20,
          background: "linear-gradient(180deg, var(--card-bg) 0%, color-mix(in srgb, var(--success) 4%, var(--surface)) 100%)",
          border: "1px solid var(--border)", boxShadow: "var(--shadow-lg)",
        }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ position: "relative", display: "inline-block", marginBottom: 20 }}>
              <TrophyOutlined style={{ fontSize: 52, color: "var(--success)" }} />
              <StarFilled style={{ position: "absolute", top: -6, right: -10, fontSize: 18, color: "var(--xp)", filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.15))" }} />
            </div>
            <h2 style={{ margin: "0 0 6px", fontSize: 22, fontWeight: 800, color: "var(--ink)" }}>
              {medal} Hoàn thành{scorePct >= 80 ? " xuất sắc" : ""}!
            </h2>
            <p style={{ color: "var(--text-secondary)", margin: "0 0 6px", fontSize: 14 }}>
              {lesson.title} — <strong style={{ color: scorePct >= 80 ? "var(--success)" : "var(--text)" }}>{correctCount}/{lesson.exercises.length}</strong> câu đúng ({scorePct}%)
            </p>
            {xpAwarded > 0 && (
              <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 18px", borderRadius: 99, background: "color-mix(in srgb, var(--accent) 12%, var(--surface))", color: "var(--accent)", fontSize: 16, fontWeight: 800, margin: "12px 0 20px" }}>
                <StarFilled style={{ fontSize: 14 }} /> +{xpAwarded} XP
              </div>
            )}
            {alreadyCompleted && (
              <p style={{ color: "var(--text-muted)", fontSize: 12, margin: "8px 0 0" }}>
                Chủ đề này đã nhận XP trước đó. Điểm tốt nhất vẫn được cập nhật.
              </p>
            )}
          </div>

          {/* Mistake review */}
          {wrongAnswers.length > 0 && (
            <div style={{ marginTop: 20 }}>
              <button onClick={() => setShowReview((v) => !v)} style={{
                display: "flex", alignItems: "center", gap: 6, width: "100%",
                padding: "10px 14px", borderRadius: 10,
                border: "1px solid color-mix(in srgb, var(--error) 20%, var(--border))",
                background: "color-mix(in srgb, var(--error) 4%, var(--surface))",
                cursor: "pointer", fontSize: 13, fontWeight: 600, color: "var(--error)",
              }}>
                <WarningOutlined /> {wrongAnswers.length} câu sai · {showReview ? "Ẩn chi tiết" : "Xem chi tiết"}
              </button>
              {showReview && (
                <div className="anim-fade-up" style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 10 }}>
                  {wrongAnswers.map((a, i) => (
                    <div key={i} style={{ padding: 12, borderRadius: 10, background: "var(--surface)", border: "1px solid var(--border)", textAlign: "left", fontSize: 13 }}>
                      <p style={{ margin: "0 0 6px", fontWeight: 600, color: "var(--text)" }}>{a.questionStem}</p>
                      <p style={{ margin: "0 0 3px", color: "var(--error)" }}>
                        <CloseCircleOutlined style={{ marginRight: 4 }} /> {a.userAnswer}
                      </p>
                      <p style={{ margin: "0 0 6px", color: "var(--success)" }}>
                        <CheckCircleOutlined style={{ marginRight: 4 }} /> {a.correctAnswer}
                      </p>
                      {a.explanationVi && (
                        <p style={{ margin: 0, fontSize: 12, color: "var(--text-muted)" }}>
                          <BulbOutlined style={{ marginRight: 4, color: "var(--accent)" }} /> {a.explanationVi}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Action buttons */}
          <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap", marginTop: 20 }}>
            <button onClick={onBack} style={{
              padding: "11px 22px", borderRadius: 10, border: "1px solid var(--border)",
              background: "var(--surface)", color: "var(--text)", cursor: "pointer", fontSize: 13, fontWeight: 600,
            }}>
              <ArrowLeftOutlined /> Chủ đề khác
            </button>
            <button onClick={() => { setState("exercises"); setExerciseIdx(0); setCorrectCount(0); setCombo(0); setAnswers([]); setStartedAt(Date.now()); resetExerciseInput(); setShowReview(false); }} style={{
              padding: "11px 22px", borderRadius: 10, border: "1px solid var(--accent)",
              background: "color-mix(in srgb, var(--accent) 8%, var(--surface))",
              color: "var(--accent)", cursor: "pointer", fontSize: 13, fontWeight: 700,
            }}>
              <ReloadOutlined /> Làm lại
            </button>
            <button onClick={() => { router.push("/grammar-quiz"); }} style={{
              padding: "11px 22px", borderRadius: 10, border: "none",
              background: "linear-gradient(135deg, var(--accent), var(--secondary))",
              color: "var(--text-on-accent)", cursor: "pointer", fontSize: 13, fontWeight: 700,
              boxShadow: "0 4px 12px color-mix(in srgb, var(--accent) 25%, transparent)",
            }}>
              Quiz ngữ pháp
            </button>
          </div>
        </div>
        );
      })()}
    </div>
  );
}
