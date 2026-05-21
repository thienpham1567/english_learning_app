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
import { Tag } from "antd";
import { useTextToSpeech } from "@/hooks/useTextToSpeech";
import * as m from "motion/react-client";

const OPTION_LABELS = ["A", "B", "C", "D"] as const;
const TIER_LABELS: Record<string, { label: string; color: string }> = {
  recognition: { label: "Nhận diện", color: "blue" },
  application: { label: "Ứng dụng", color: "cyan" },
  production: { label: "Tạo câu", color: "purple" },
  context: { label: "Ngữ cảnh", color: "volcano" },
};

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
      <m.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onBack}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          padding: "8px 16px",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-lg)",
          background: "var(--surface)",
          color: "var(--accent)",
          cursor: "pointer",
          fontSize: 13,
          fontWeight: 700,
          marginBottom: 16,
          boxShadow: "var(--shadow-sm)",
          transition: "all 0.15s",
        }}
      >
        <ArrowLeftOutlined /> Danh sách bài học
      </m.button>

      {/* Loading state */}
      {state === "loading" && (
        <div
          style={{
            textAlign: "center",
            padding: "72px 24px",
            borderRadius: "var(--radius-xl)",
            background: "var(--surface)",
            border: "1px solid var(--border)",
            boxShadow: "var(--shadow-md)",
          }}
        >
          <LoadingOutlined style={{ fontSize: 38, color: "var(--accent)" }} />
          <p style={{ color: "var(--text-secondary)", marginTop: 20, fontSize: 14.5, fontWeight: 700 }}>
            Đang biên soạn bài học: <strong style={{ color: "var(--accent)" }}>{topicTitle}</strong>
          </p>
          <p style={{ color: "var(--text-muted)", fontSize: 12.5, margin: 0, fontWeight: 500 }}>
            AI đang phân tích kiến thức và biên soạn bài tập...
          </p>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div
          style={{
            padding: 24,
            borderRadius: "var(--radius-xl)",
            background: "var(--error-bg)",
            border: "1px solid color-mix(in srgb, var(--error) 25%, transparent)",
            color: "var(--error)",
            textAlign: "center",
          }}
        >
          <p style={{ fontWeight: 700, fontSize: 14 }}>{error}</p>
          <m.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => generateLesson(false)}
            style={{
              padding: "9px 18px",
              borderRadius: "var(--radius-lg)",
              border: "none",
              background: "var(--error)",
              color: "var(--text-on-accent)",
              cursor: "pointer",
              marginTop: 12,
              fontWeight: 800,
            }}
          >
            Thử lại
          </m.button>
        </div>
      )}

      {/* Lesson content */}
      {state === "lesson" && lesson && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          
          {/* Title Card */}
          <div
            style={{
              padding: "24px",
              borderRadius: "var(--radius-xl)",
              background: "linear-gradient(135deg, color-mix(in srgb, var(--accent) 5%, var(--surface)), var(--surface))",
              border: "1px solid var(--border)",
              boxShadow: "var(--shadow-sm)",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div style={{ position: "absolute", left: "0%", top: "0%", width: "100%", height: 3, background: "linear-gradient(90deg, var(--accent), var(--secondary))" }} />
            
            <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 12 }}>
              <div style={{ flex: 1 }}>
                <h2 style={{ margin: 0, fontSize: 20, fontWeight: 900, color: "var(--text-primary)", fontFamily: "var(--font-display)" }}>
                  {lesson.title}
                </h2>
                <p style={{ margin: "4px 0 0", fontSize: 13.5, color: "var(--text-secondary)", fontWeight: 500, lineHeight: 1.5 }}>
                  {lesson.titleVi}
                </p>
              </div>
              <div style={{ display: "flex", gap: 6, flexShrink: 0, alignItems: "center" }}>
                <span style={{ fontSize: 11, fontWeight: 800, color: "var(--accent)", border: "1px solid var(--accent)", background: "var(--surface)", padding: "2px 8px", borderRadius: 99 }}>
                  {level}
                </span>
                <m.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => generateLesson(true)}
                  style={{
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius-lg)",
                    background: "var(--surface)",
                    color: "var(--text-secondary)",
                    cursor: "pointer",
                    fontSize: 12,
                    padding: "6px 12px",
                    fontWeight: 700,
                    boxShadow: "var(--shadow-sm)",
                  }}
                >
                  <ReloadOutlined /> Tạo lại
                </m.button>
              </div>
            </div>
          </div>

          {/* Formula Card */}
          {lesson.formula && (
            <div
              style={{
                padding: "20px 24px",
                borderRadius: "var(--radius-xl)",
                textAlign: "center",
                background: "linear-gradient(135deg, var(--accent-light), color-mix(in srgb, var(--secondary) 8%, var(--surface)))",
                border: "1px solid color-mix(in srgb, var(--accent) 15%, var(--border))",
                boxShadow: "var(--shadow-sm)",
              }}
            >
              <span style={{ fontSize: 11, color: "var(--accent)", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginBottom: 8 }}>
                <CalculatorOutlined /> Cấu trúc cốt lõi
              </span>
              <p style={{ fontSize: 18, fontWeight: 900, color: "var(--accent)", margin: 0, fontFamily: "var(--font-mono)", wordBreak: "break-all" }}>
                {lesson.formula}
              </p>
            </div>
          )}

          {/* Explanation Card */}
          <div
            style={{
              padding: 20,
              borderRadius: "var(--radius-xl)",
              background: "var(--surface)",
              border: "1px solid var(--border)",
              boxShadow: "var(--shadow-sm)",
            }}
          >
            <span style={{ fontSize: 11.5, fontWeight: 800, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.08em", display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
              <BookOutlined /> Phân tích lý thuyết
            </span>
            <p style={{ fontSize: 14.5, lineHeight: 1.7, color: "var(--text-primary)", margin: 0, fontWeight: 500 }}>
              {lesson.explanationEn ?? lesson.explanation}
            </p>
            <div
              style={{
                marginTop: 14,
                padding: "12px 16px",
                borderRadius: "var(--radius-lg)",
                background: "var(--surface-alt)",
                borderLeft: "3.5px solid var(--accent)",
              }}
            >
              <span style={{ fontSize: 11.5, fontWeight: 800, color: "var(--accent)" }}>
                🇻🇳 Diễn giải tiếng Việt
              </span>
              <p style={{ margin: "6px 0 0", fontSize: 13.5, lineHeight: 1.65, color: "var(--text-secondary)", fontWeight: 500 }}>
                {lesson.explanation}
              </p>
            </div>
          </div>

          {/* Usage Notes Card */}
          {lesson.usageNotes && lesson.usageNotes.length > 0 && (
            <div
              style={{
                padding: 20,
                borderRadius: "var(--radius-xl)",
                background: "var(--surface)",
                border: "1px solid var(--border)",
                boxShadow: "var(--shadow-sm)",
              }}
            >
              <span style={{ fontSize: 11.5, fontWeight: 800, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.08em", display: "flex", alignItems: "center", gap: 6, marginBottom: 14 }}>
                📌 Cách dùng chi tiết
              </span>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {lesson.usageNotes.map((note, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: "flex",
                      gap: 12,
                      padding: "12px 14px",
                      borderRadius: "var(--radius-lg)",
                      background: "var(--surface-alt)",
                      border: "1px solid var(--border)",
                      alignItems: "flex-start",
                    }}
                  >
                    <div style={{
                      width: 26,
                      height: 26,
                      borderRadius: 8,
                      background: "var(--accent-light)",
                      color: "var(--accent)",
                      display: "grid",
                      placeItems: "center",
                      fontSize: 12,
                      fontWeight: 900,
                      flexShrink: 0,
                    }}>
                      {idx + 1}
                    </div>
                    <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.6, color: "var(--text-primary)", fontWeight: 500 }}>
                      {note}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TOEIC Tips Card */}
          {lesson.toeicTips && lesson.toeicTips.length > 0 && (
            <div
              style={{
                padding: 20,
                borderRadius: "var(--radius-xl)",
                background: "linear-gradient(135deg, rgba(245, 158, 11, 0.04), rgba(239, 68, 68, 0.02))",
                border: "1px solid rgba(245, 158, 11, 0.15)",
                boxShadow: "var(--shadow-sm)",
              }}
            >
              <span style={{ fontSize: 11.5, fontWeight: 800, color: "var(--warning)", textTransform: "uppercase", letterSpacing: "0.08em", display: "flex", alignItems: "center", gap: 6, marginBottom: 14 }}>
                🎯 Mẹo thi TOEIC — Kinh nghiệm 900 điểm
              </span>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {lesson.toeicTips.map((tip, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: "flex",
                      gap: 10,
                      padding: "12px 14px",
                      borderRadius: "var(--radius-lg)",
                      background: "var(--surface)",
                      border: "1px solid var(--border)",
                      alignItems: "flex-start",
                    }}
                  >
                    <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>💡</span>
                    <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.6, color: "var(--text-primary)", fontWeight: 600 }}>
                      {tip}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Time Signals Card */}
          {lesson.timeSignals && lesson.timeSignals.length > 0 && (
            <div
              style={{
                padding: 20,
                borderRadius: "var(--radius-xl)",
                background: "var(--surface)",
                border: "1px solid var(--border)",
                boxShadow: "var(--shadow-sm)",
              }}
            >
              <span style={{ fontSize: 11.5, fontWeight: 800, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.08em", display: "flex", alignItems: "center", gap: 6, marginBottom: 14 }}>
                ⏰ Dấu hiệu nhận biết (Time Signals / Keywords)
              </span>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {lesson.timeSignals.map((signal, idx) => (
                  <Tag
                    key={idx}
                    color="blue"
                    style={{
                      padding: "4px 14px",
                      fontSize: 13,
                      fontWeight: 700,
                      borderRadius: 8,
                      margin: 0,
                    }}
                  >
                    {signal}
                  </Tag>
                ))}
              </div>
            </div>
          )}

          {/* Confusion Pairs Card */}
          {lesson.confusionPairs && lesson.confusionPairs.length > 0 && (
            <div
              style={{
                padding: 20,
                borderRadius: "var(--radius-xl)",
                background: "var(--surface)",
                border: "1px solid var(--border)",
                boxShadow: "var(--shadow-sm)",
              }}
            >
              <span style={{ fontSize: 11.5, fontWeight: 800, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.08em", display: "flex", alignItems: "center", gap: 6, marginBottom: 14 }}>
                ⚡ Phân biệt cấu trúc dễ nhầm
              </span>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {lesson.confusionPairs.map((pair, idx) => (
                  <div
                    key={idx}
                    style={{
                      borderRadius: "var(--radius-lg)",
                      border: "1px solid var(--border)",
                      overflow: "hidden",
                    }}
                  >
                    {/* Pair header */}
                    <div style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 0,
                    }}>
                      <div style={{ padding: "10px 14px", background: "rgba(59, 130, 246, 0.06)", borderRight: "1px solid var(--border)" }}>
                        <div style={{ fontSize: 12, fontWeight: 800, color: "var(--info)", marginBottom: 4 }}>
                          {pair.structureA}
                        </div>
                        <p style={{ margin: 0, fontSize: 12.5, color: "var(--text-primary)", fontWeight: 500, lineHeight: 1.5, fontStyle: "italic" }}>
                          {pair.exampleA}
                        </p>
                      </div>
                      <div style={{ padding: "10px 14px", background: "rgba(139, 92, 246, 0.06)" }}>
                        <div style={{ fontSize: 12, fontWeight: 800, color: "var(--accent)", marginBottom: 4 }}>
                          {pair.structureB}
                        </div>
                        <p style={{ margin: 0, fontSize: 12.5, color: "var(--text-primary)", fontWeight: 500, lineHeight: 1.5, fontStyle: "italic" }}>
                          {pair.exampleB}
                        </p>
                      </div>
                    </div>
                    {/* Difference explanation */}
                    <div style={{ padding: "10px 14px", background: "var(--surface-alt)", borderTop: "1px solid var(--border)" }}>
                      <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6, color: "var(--text-secondary)", fontWeight: 500 }}>
                        <BulbOutlined style={{ color: "var(--warning)", marginRight: 6 }} />
                        {pair.difference}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Examples Card */}
          {lesson.examples && lesson.examples.length > 0 && (
            <div
              style={{
                padding: 20,
                borderRadius: "var(--radius-xl)",
                background: "var(--surface)",
                border: "1px solid var(--border)",
                boxShadow: "var(--shadow-sm)",
              }}
            >
              <span style={{ fontSize: 11.5, fontWeight: 800, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.08em", display: "flex", alignItems: "center", gap: 6, marginBottom: 14 }}>
                <MessageOutlined /> Ví dụ minh họa
              </span>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {lesson.examples.map((ex, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: 14,
                      borderRadius: "var(--radius-lg)",
                      background: "var(--surface-alt)",
                      border: "1px solid var(--border)",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                      <p style={{ fontSize: 14.5, fontWeight: 700, margin: 0, flex: 1, color: "var(--text-primary)", lineHeight: 1.5 }}>
                        {ex.en.split(ex.highlight).map((part, j, arr) => (
                          <span key={j}>
                            {part}
                            {j < arr.length - 1 && <strong style={{ color: "var(--accent)", borderBottom: "1.5px solid var(--accent)" }}>{ex.highlight}</strong>}
                          </span>
                        ))}
                      </p>
                      <m.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => speakText(ex.en)}
                        disabled={isSpeaking || isTtsLoading}
                        style={{
                          border: "none",
                          background: "var(--surface)",
                          borderRadius: 8,
                          width: 28,
                          height: 28,
                          display: "grid",
                          placeItems: "center",
                          cursor: isSpeaking || isTtsLoading ? "not-allowed" : "pointer",
                          color: "var(--accent)",
                          boxShadow: "var(--shadow-sm)",
                          opacity: isSpeaking || isTtsLoading ? 0.5 : 1,
                        }}
                      >
                        {isTtsLoading ? <LoadingOutlined spin /> : <SoundOutlined />}
                      </m.button>
                    </div>
                    <p style={{ fontSize: 13, color: "var(--text-muted)", margin: "6px 0 0", fontWeight: 600 }}>
                      {ex.vi}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Common Mistakes Card */}
          {lesson.commonMistakes && lesson.commonMistakes.length > 0 && (
            <div
              style={{
                padding: 20,
                borderRadius: "var(--radius-xl)",
                background: "var(--surface)",
                border: "1px solid var(--border)",
                boxShadow: "var(--shadow-sm)",
              }}
            >
              <span style={{ fontSize: 11.5, fontWeight: 800, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.08em", display: "flex", alignItems: "center", gap: 6, marginBottom: 14 }}>
                <WarningOutlined style={{ color: "var(--warning)" }} /> Lưu ý tránh lỗi sai
              </span>
              {lesson.commonMistakes.map((mItem, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: 14,
                    borderRadius: "var(--radius-lg)",
                    background: "rgba(239, 68, 68, 0.03)",
                    border: "1px solid color-mix(in srgb, var(--error) 15%, var(--border))",
                    marginBottom: idx < lesson.commonMistakes.length - 1 ? 10 : 0,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 6, fontSize: 13.5, fontWeight: 700, color: "var(--error)" }}>
                    <CloseCircleOutlined style={{ marginTop: 3 }} />
                    <span style={{ textDecoration: "line-through" }}>{mItem.wrong}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 6, fontSize: 13.5, fontWeight: 700, color: "var(--success)", marginTop: 6 }}>
                    <CheckCircleOutlined style={{ marginTop: 3 }} />
                    <span>{mItem.correct}</span>
                  </div>
                  
                  {mItem.noteEn && (
                    <div style={{ marginTop: 10, fontSize: 12.5, color: "var(--text-primary)", fontWeight: 500, display: "flex", alignItems: "flex-start", gap: 6 }}>
                      <TranslationOutlined style={{ color: "var(--accent)", marginTop: 3 }} />
                      <span>{mItem.noteEn}</span>
                    </div>
                  )}
                  
                  <div style={{ marginTop: 6, fontSize: 12.5, color: "var(--text-muted)", fontWeight: 500, display: "flex", alignItems: "flex-start", gap: 6 }}>
                    <BulbOutlined style={{ color: "var(--warning)", marginTop: 3 }} />
                    <span>{mItem.note}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Start Exercises Button */}
          <m.button
            whileHover={{ scale: 1.01, y: -1 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => {
              setState("exercises");
              setExerciseIdx(0);
              setCorrectCount(0);
              setCombo(0);
              setAnswers([]);
              setStartedAt(Date.now());
              resetExerciseInput();
            }}
            style={{
              padding: "14px 24px",
              borderRadius: "var(--radius-xl)",
              border: "none",
              background: "linear-gradient(135deg, var(--accent), var(--secondary))",
              color: "var(--text-on-accent)",
              fontSize: 15,
              fontWeight: 800,
              cursor: "pointer",
              textAlign: "center",
              width: "100%",
              boxShadow: "0 4px 14px var(--accent-muted)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            Luyện tập ngay ({lesson.exercises.length} câu) <RightOutlined />
          </m.button>
        </div>
      )}

      {/* Exercises Mode */}
      {state === "exercises" && lesson && currentExercise && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          
          {/* Header Progress */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ display: "flex", justifySelf: "stretch", justifyContent: "space-between", fontSize: 12.5, fontWeight: 700, color: "var(--text-secondary)" }}>
              <span>Câu hỏi {exerciseIdx + 1} / {lesson.exercises.length}</span>
              <span style={{ color: "var(--accent)" }}>{Math.round(((exerciseIdx + 1) / lesson.exercises.length) * 100)}%</span>
            </div>
            
            <div style={{ height: 6, background: "var(--border)", borderRadius: 99, position: "relative", overflow: "hidden" }}>
              <m.div
                initial={{ width: 0 }}
                animate={{ width: `${((exerciseIdx + 1) / lesson.exercises.length) * 100}%` }}
                transition={{ type: "spring", stiffness: 80, damping: 15 }}
                style={{ position: "absolute", left: 0, top: 0, bottom: 0, background: "linear-gradient(90deg, var(--accent), var(--xp))", borderRadius: 99 }}
              />
            </div>
          </div>

          {/* Combo badge */}
          {combo >= 2 && (
            <m.div
              key={`combo-${combo}`}
              initial={{ scale: 0.5, y: -10 }}
              animate={{ scale: [1, 1.1, 1], y: 0 }}
              style={{ display: "flex", justifyContent: "center" }}
            >
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  borderRadius: 999,
                  background: "linear-gradient(135deg, var(--fire), var(--xp))",
                  padding: "6px 18px",
                  fontSize: 14,
                  fontWeight: 900,
                  color: "var(--text-on-accent)",
                  boxShadow: "0 4px 14px rgba(245, 158, 11, 0.35)",
                }}
              >
                <FireOutlined /> {combo} COMBO! 🔥
              </span>
            </m.div>
          )}

          {/* Main Question Box */}
          <div
            style={{
              padding: 24,
              borderRadius: "var(--radius-xl)",
              background: "var(--surface)",
              border: "1px solid var(--border)",
              boxShadow: "var(--shadow-sm)",
              position: "relative",
            }}
          >
            <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 4, background: "var(--accent)", borderRadius: "4px 0 0 4px" }} />

            {/* Tags */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
              <span
                style={{
                  fontSize: 10.5,
                  fontWeight: 800,
                  color: "var(--accent)",
                  background: "var(--accent-light)",
                  padding: "2px 8px",
                  borderRadius: 6,
                }}
              >
                {currentExercise.type === "multiple_choice"
                  ? "Trắc nghiệm"
                  : currentExercise.type === "error_correction"
                  ? "Sửa lỗi"
                  : "Viết lại câu"}
              </span>
              
              {currentExercise.tier && TIER_LABELS[currentExercise.tier] && (
                <span
                  style={{
                    fontSize: 10.5,
                    fontWeight: 800,
                    color: `var(--${TIER_LABELS[currentExercise.tier].color})`,
                    background: `color-mix(in srgb, var(--${TIER_LABELS[currentExercise.tier].color}) 8%, transparent)`,
                    padding: "2px 8px",
                    borderRadius: 6,
                  }}
                >
                  {TIER_LABELS[currentExercise.tier].label}
                </span>
              )}
            </div>

            {/* Question sentence */}
            <p style={{ fontSize: 16.5, fontWeight: 700, lineHeight: 1.6, margin: "0 0 16px", color: "var(--text-primary)" }}>
              {currentExercise.sentence}
            </p>

            {/* Hint toggler */}
            {currentExercise.hint && !revealed && !hintUsed && (
              <m.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setHintUsed(true)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "6px 12px",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid color-mix(in srgb, var(--warning) 30%, var(--border))",
                  background: "rgba(245, 158, 11, 0.05)",
                  color: "var(--warning)",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                  marginBottom: 16,
                }}
              >
                <EyeOutlined /> Xem gợi ý học tập
              </m.button>
            )}

            {hintUsed && currentExercise.hint && !revealed && (
              <m.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  padding: "10px 14px",
                  borderRadius: "var(--radius-lg)",
                  marginBottom: 16,
                  background: "rgba(245, 158, 11, 0.05)",
                  border: "1px solid color-mix(in srgb, var(--warning) 20%, var(--border))",
                  fontSize: 13,
                  color: "var(--text-secondary)",
                  fontWeight: 500,
                }}
              >
                <BulbOutlined style={{ color: "var(--warning)", marginRight: 6 }} />
                {currentExercise.hint}
              </m.div>
            )}

            {/* MCQs Option items */}
            {currentExercise.type === "multiple_choice" ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {currentExercise.options.map((opt, idx) => {
                  const isCorrect = opt === currentExercise.answer;
                  const isSelected = opt === selected;
                  let bg = "var(--surface)";
                  let border = "1.5px solid var(--border)";
                  let color = "var(--text-primary)";
                  let opacity = 1;

                  if (revealed) {
                    if (isCorrect) {
                      bg = "rgba(16, 185, 129, 0.08)";
                      border = "1.5px solid var(--success)";
                      color = "var(--success)";
                    } else if (isSelected) {
                      bg = "rgba(239, 68, 68, 0.08)";
                      border = "1.5px solid var(--error)";
                      color = "var(--error)";
                    } else {
                      opacity = 0.4;
                    }
                  } else if (isSelected) {
                    bg = "var(--accent-light)";
                    border = "1.5px solid var(--accent)";
                    color = "var(--accent)";
                  }

                  return (
                    <m.button
                      key={opt}
                      onClick={() => handleAnswer(opt)}
                      disabled={revealed}
                      whileHover={revealed ? {} : { scale: 1.005, x: 2 }}
                      whileTap={revealed ? {} : { scale: 0.995 }}
                      style={{
                        display: "flex",
                        width: "100%",
                        alignItems: "center",
                        gap: 12,
                        padding: "12px 16px",
                        borderRadius: "var(--radius-lg)",
                        border,
                        background: bg,
                        color,
                        fontSize: 14,
                        fontWeight: isSelected || (revealed && isCorrect) ? 800 : 500,
                        cursor: revealed ? "default" : "pointer",
                        textAlign: "left",
                        opacity,
                        boxShadow: "var(--shadow-sm)",
                        transition: "all 0.15s",
                      }}
                    >
                      <span
                        style={{
                          display: "flex",
                          width: 28,
                          height: 28,
                          alignItems: "center",
                          justifyContent: "center",
                          borderRadius: 8,
                          background: revealed && isCorrect ? "var(--success)" : revealed && isSelected && !isCorrect ? "var(--error)" : isSelected ? "var(--accent)" : "var(--surface-alt)",
                          fontSize: 11.5,
                          fontWeight: 800,
                          color: (revealed && (isCorrect || (isSelected && !isCorrect))) || isSelected ? "var(--text-on-accent)" : "var(--text-secondary)",
                          flexShrink: 0,
                        }}
                      >
                        {revealed && isCorrect ? (
                          <CheckCircleOutlined />
                        ) : revealed && isSelected && !isCorrect ? (
                          <CloseCircleOutlined />
                        ) : (
                          OPTION_LABELS[idx]
                        )}
                      </span>
                      <span style={{ flex: 1 }}>{opt}</span>
                    </m.button>
                  );
                })}
              </div>
            ) : (
              // Structured Input Area
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <textarea
                  value={typedAnswer}
                  onChange={(e) => setTypedAnswer(e.target.value)}
                  disabled={revealed}
                  rows={3}
                  placeholder={currentExercise.instructionVi ?? "Nhập câu trả lời viết lại của bạn vào đây..."}
                  style={{
                    width: "100%",
                    border: "1.5px solid var(--border)",
                    borderRadius: "var(--radius-lg)",
                    background: "var(--surface)",
                    color: "var(--text-primary)",
                    fontSize: 14.5,
                    lineHeight: 1.5,
                    padding: "12px 16px",
                    outline: "none",
                    transition: "border-color 0.2s",
                  }}
                  onFocus={(e) => { e.target.style.borderColor = "var(--accent)"; }}
                  onBlur={(e) => { e.target.style.borderColor = "var(--border)"; }}
                />
                {!revealed && (
                  <m.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={handleWrittenAnswer}
                    disabled={!typedAnswer.trim()}
                    style={{
                      alignSelf: "flex-end",
                      border: "none",
                      borderRadius: 99,
                      background: typedAnswer.trim() ? "var(--accent)" : "var(--border)",
                      color: typedAnswer.trim() ? "var(--text-on-accent)" : "var(--text-muted)",
                      cursor: typedAnswer.trim() ? "pointer" : "default",
                      fontSize: 13,
                      fontWeight: 800,
                      padding: "8px 20px",
                      boxShadow: typedAnswer.trim() ? "0 2px 8px var(--accent-muted)" : "none",
                    }}
                  >
                    Nộp câu trả lời <CheckCircleOutlined />
                  </m.button>
                )}
              </div>
            )}

            {/* Written response results comparison */}
            {revealed && currentExercise.type !== "multiple_choice" && (
              <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ padding: "12px 14px", borderRadius: "var(--radius-lg)", background: isGrammarAnswerCorrect(typedAnswer, currentExercise.answer, currentExercise.acceptedAnswers) ? "rgba(16, 185, 129, 0.06)" : "rgba(239, 68, 68, 0.06)", border: "1px solid var(--border)", fontSize: 13.5, fontWeight: 500 }}>
                  <strong style={{ color: "var(--text-secondary)" }}>Đáp án của bạn:</strong> {typedAnswer}
                </div>
                <div style={{ padding: "12px 14px", borderRadius: "var(--radius-lg)", background: "rgba(16, 185, 129, 0.08)", border: "1px solid var(--success)", color: "var(--success)", fontSize: 13.5, fontWeight: 700 }}>
                  <CheckCircleOutlined style={{ marginRight: 6 }} />
                  {currentExercise.answer}
                </div>
              </div>
            )}

            {/* Explanations block */}
            {revealed && (
              <m.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  marginTop: 16,
                  borderRadius: "var(--radius-lg)",
                  border: "1px solid color-mix(in srgb, var(--accent) 15%, var(--border))",
                  background: "var(--surface-alt)",
                  padding: 16,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{ fontSize: 11.5, fontWeight: 800, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    <BulbOutlined /> Lý do chọn đáp án
                  </span>
                  <div style={{ display: "flex", overflow: "hidden", borderRadius: 6, border: "1px solid var(--border)" }}>
                    {(["vi", "en"] as const).map((langOpt) => (
                      <button
                        key={langOpt}
                        onClick={() => setExplLang(langOpt)}
                        style={{
                          padding: "3px 10px",
                          fontSize: 10.5,
                          fontWeight: 800,
                          border: "none",
                          cursor: "pointer",
                          background: explLang === langOpt ? "var(--accent)" : "var(--surface)",
                          color: explLang === langOpt ? "var(--text-on-accent)" : "var(--text-secondary)",
                        }}
                      >
                        {langOpt === "vi" ? "VIE" : "ENG"}
                      </button>
                    ))}
                  </div>
                </div>
                <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.65, color: "var(--text-secondary)", fontWeight: 500 }}>
                  {explLang === "en" ? (currentExercise.explanationEn ?? currentExercise.explanation) : currentExercise.explanation}
                </p>
              </m.div>
            )}
          </div>

          {/* Action button */}
          {revealed && (
            <m.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={nextExercise}
              style={{
                padding: "12px 24px",
                borderRadius: "var(--radius-xl)",
                border: "none",
                background: "linear-gradient(135deg, var(--accent), var(--accent-hover, var(--accent)))",
                color: "var(--text-on-accent)",
                fontSize: 15,
                fontWeight: 800,
                cursor: "pointer",
                width: "100%",
                boxShadow: "0 4px 14px var(--accent-muted)",
              }}
            >
              {exerciseIdx < lesson.exercises.length - 1 ? (
                <>Câu tiếp theo <RightOutlined /></>
              ) : (
                <>Xem kết quả bài học <CheckCircleOutlined /></>
              )}
            </m.button>
          )}
        </div>
      )}

      {/* Completion page summary */}
      {state === "complete" && lesson && (() => {
        const scorePct = Math.round((correctCount / lesson.exercises.length) * 100);
        const wrongAnswers = answers.filter((a) => !a.correct);
        const medal = scorePct >= 90 ? "🥇" : scorePct >= 70 ? "🥈" : scorePct >= 50 ? "🥉" : "🎓";
        return (
          <m.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{
              padding: "40px 24px",
              borderRadius: "var(--radius-xl)",
              background: "var(--surface)",
              border: "1px solid var(--border)",
              boxShadow: "var(--shadow-lg)",
              textAlign: "center",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* Background glowing circle */}
            <div style={{ position: "absolute", left: "50%", top: "25%", transform: "translate(-50%, -50%)", width: 220, height: 220, borderRadius: "50%", background: "radial-gradient(circle, var(--success) 10%, transparent 70%)", pointerEvents: "none" }} />

            <div style={{ position: "relative", display: "inline-block", marginBottom: 20 }}>
              <TrophyOutlined style={{ fontSize: 58, color: "var(--success)" }} />
              <StarFilled style={{ position: "absolute", top: -4, right: -12, fontSize: 20, color: "var(--xp)", filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.15))" }} />
            </div>

            <h2 style={{ margin: "0 0 8px", fontSize: 22, fontWeight: 900, color: "var(--text-primary)", fontFamily: "var(--font-display)" }}>
              {medal} Hoàn thành bài học!
            </h2>
            <p style={{ color: "var(--text-secondary)", margin: "0 0 16px", fontSize: 14.5, fontWeight: 500, lineHeight: 1.5 }}>
              Chủ đề: <span style={{ color: "var(--accent)", fontWeight: 700 }}>{lesson.title}</span>
              <br />
              Đạt điểm chính xác: <strong style={{ color: "var(--success)" }}>{correctCount}/{lesson.exercises.length}</strong> ({scorePct}%)
            </p>

            {xpAwarded > 0 && (
              <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 20px", borderRadius: 99, background: "var(--accent-light)", color: "var(--accent)", fontSize: 16, fontWeight: 900, marginBottom: 24, boxShadow: "var(--shadow-sm)" }}>
                <StarFilled /> +{xpAwarded} XP nhận được
              </div>
            )}
            
            {alreadyCompleted && (
              <p style={{ color: "var(--text-muted)", fontSize: 12, margin: "-12px 0 24px", fontWeight: 600 }}>
                Bạn đã nhận thưởng XP cho bài học này trước đó.
              </p>
            )}

            {/* Error review logs */}
            {wrongAnswers.length > 0 && (
              <div style={{ marginTop: 8, marginBottom: 24, textAlign: "left" }}>
                <button
                  onClick={() => setShowReview((v) => !v)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    width: "100%",
                    padding: "12px 16px",
                    borderRadius: "var(--radius-lg)",
                    border: "1.5px solid color-mix(in srgb, var(--error) 20%, var(--border))",
                    background: "rgba(239, 68, 68, 0.04)",
                    cursor: "pointer",
                    fontSize: 13,
                    fontWeight: 800,
                    color: "var(--error)",
                  }}
                >
                  <WarningOutlined /> Xem {wrongAnswers.length} lỗi sai đã lưu sổ lỗi · {showReview ? "Thu gọn" : "Xem chi tiết"}
                </button>
                {showReview && (
                  <m.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8, overflow: "hidden" }}
                  >
                    {wrongAnswers.map((wItem, idx) => (
                      <div
                        key={idx}
                        style={{
                          padding: 14,
                          borderRadius: "var(--radius-lg)",
                          background: "var(--surface-alt)",
                          border: "1px solid var(--border)",
                        }}
                      >
                        <p style={{ margin: "0 0 8px", fontWeight: 700, color: "var(--text-primary)", fontSize: 13.5 }}>
                          {wItem.questionStem}
                        </p>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--error)", fontSize: 12.5, fontWeight: 700 }}>
                          <CloseCircleOutlined /> Bạn đã chọn: {wItem.userAnswer}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--success)", fontSize: 12.5, fontWeight: 700, marginTop: 4 }}>
                          <CheckCircleOutlined /> Đáp án đúng: {wItem.correctAnswer}
                        </div>
                        {wItem.explanationVi && (
                          <div style={{ marginTop: 8, padding: 8, background: "var(--surface)", borderRadius: 6, fontSize: 12, color: "var(--text-muted)", fontWeight: 500 }}>
                            <BulbOutlined style={{ color: "var(--accent)", marginRight: 4 }} />
                            {wItem.explanationVi}
                          </div>
                        )}
                      </div>
                    ))}
                  </m.div>
                )}
              </div>
            )}

            {/* Actions button */}
            <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
              <m.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onBack}
                style={{
                  padding: "11px 22px",
                  borderRadius: "var(--radius-lg)",
                  border: "1.5px solid var(--border)",
                  background: "var(--surface)",
                  color: "var(--text-primary)",
                  cursor: "pointer",
                  fontSize: 13.5,
                  fontWeight: 800,
                  boxShadow: "var(--shadow-sm)",
                }}
              >
                <ArrowLeftOutlined /> Quay lại
              </m.button>
              
              <m.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setState("exercises");
                  setExerciseIdx(0);
                  setCorrectCount(0);
                  setCombo(0);
                  setAnswers([]);
                  setStartedAt(Date.now());
                  resetExerciseInput();
                  setShowReview(false);
                }}
                style={{
                  padding: "11px 22px",
                  borderRadius: "var(--radius-lg)",
                  border: "1.5px solid var(--accent)",
                  background: "var(--accent-light)",
                  color: "var(--accent)",
                  cursor: "pointer",
                  fontSize: 13.5,
                  fontWeight: 800,
                  boxShadow: "var(--shadow-sm)",
                }}
              >
                <ReloadOutlined /> Làm lại bài tập
              </m.button>

              <m.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => router.push("/grammar-quiz")}
                style={{
                  padding: "11px 22px",
                  borderRadius: "var(--radius-lg)",
                  border: "none",
                  background: "linear-gradient(135deg, var(--accent), var(--secondary))",
                  color: "var(--text-on-accent)",
                  cursor: "pointer",
                  fontSize: 13.5,
                  fontWeight: 800,
                  boxShadow: "0 2px 8px var(--accent-muted)",
                }}
              >
                Quiz tổng hợp
              </m.button>
            </div>
          </m.div>
        );
      })()}
    </div>
  );
}
