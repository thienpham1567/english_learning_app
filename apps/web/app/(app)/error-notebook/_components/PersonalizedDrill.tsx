"use client";

import { useState, useCallback } from "react";
import {
  ThunderboltOutlined,
  LoadingOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  BulbOutlined,
  TrophyOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import * as m from "motion/react-client";
import { api } from "@/lib/api-client";

type DrillExercise = {
  type: string;
  instruction: string;
  data: Record<string, unknown>;
  targetWeakness: string;
  tip: string;
};

type DrillData = {
  exercises: DrillExercise[];
  summary: string;
  errorCount: number;
  topTopics: string[];
};

export function PersonalizedDrill() {
  const [drill, setDrill] = useState<DrillData | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, { selected: number; correct: boolean }>>({});
  const [showResults, setShowResults] = useState(false);

  const generateDrill = useCallback(async () => {
    setLoading(true);
    setDrill(null);
    setCurrentIndex(0);
    setAnswers({});
    setShowResults(false);
    try {
      const data = await api.post<DrillData>("/errors/drill", {});
      setDrill(data);
    } catch {
      // ignore
    }
    setLoading(false);
  }, []);

  const handleAnswer = useCallback(
    (exerciseIdx: number, selectedIdx: number) => {
      if (!drill) return;
      const ex = drill.exercises[exerciseIdx];
      const correctIdx = (ex.data as { correctIndex?: number }).correctIndex ?? 0;
      setAnswers((prev) => ({
        ...prev,
        [exerciseIdx]: { selected: selectedIdx, correct: selectedIdx === correctIdx },
      }));
    },
    [drill],
  );

  const handleNext = useCallback(() => {
    if (!drill) return;
    if (currentIndex < drill.exercises.length - 1) {
      setCurrentIndex((i) => i + 1);
    } else {
      setShowResults(true);
    }
  }, [drill, currentIndex]);

  const correctCount = Object.values(answers).filter((a) => a.correct).length;
  const totalAnswered = Object.keys(answers).length;

  // Not started yet — show CTA
  if (!drill && !loading) {
    return (
      <m.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          padding: "20px",
          borderRadius: 16,
          background: "linear-gradient(135deg, color-mix(in srgb, var(--accent) 6%, var(--surface)), color-mix(in srgb, var(--secondary) 4%, var(--surface)))",
          border: "1px solid color-mix(in srgb, var(--accent) 15%, var(--border))",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
          <ThunderboltOutlined style={{ fontSize: 16, color: "var(--accent)" }} />
          <span style={{ fontSize: 15, fontWeight: 700, color: "var(--ink)", fontFamily: "var(--font-display)" }}>
            AI Drill — Luyện điểm yếu
          </span>
        </div>
        <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: "0 0 14px", lineHeight: 1.6 }}>
          AI sẽ phân tích lỗi sai của bạn và tạo bài tập tập trung vào những điểm yếu nhất.
        </p>
        <button
          type="button"
          onClick={generateDrill}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 22px",
            borderRadius: 12,
            border: "none",
            background: "var(--accent)",
            color: "var(--text-on-accent)",
            cursor: "pointer",
            fontSize: 14,
            fontWeight: 700,
            transition: "opacity 0.2s",
          }}
        >
          <ThunderboltOutlined /> Tạo bài luyện tập
        </button>
      </m.div>
    );
  }

  // Loading
  if (loading) {
    return (
      <div
        style={{
          padding: "32px 20px",
          borderRadius: 16,
          background: "var(--surface)",
          border: "1px solid var(--border)",
          textAlign: "center",
        }}
      >
        <LoadingOutlined spin style={{ fontSize: 28, color: "var(--accent)", marginBottom: 12 }} />
        <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>
          Đang phân tích lỗi sai...
        </div>
        <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>
          AI đang tạo bài tập cá nhân hóa cho bạn
        </div>
      </div>
    );
  }

  if (!drill) return null;

  // Results view
  if (showResults) {
    const pct = drill.exercises.length > 0 ? Math.round((correctCount / drill.exercises.length) * 100) : 0;
    return (
      <m.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        style={{
          padding: "24px 20px",
          borderRadius: 16,
          background: "var(--surface)",
          border: "1px solid var(--border)",
          textAlign: "center",
        }}
      >
        <TrophyOutlined style={{ fontSize: 36, color: pct >= 80 ? "var(--success)" : "var(--accent)", marginBottom: 12 }} />
        <div style={{ fontSize: 36, fontWeight: 900, color: "var(--ink)", fontFamily: "var(--font-display)" }}>
          {correctCount}/{drill.exercises.length}
        </div>
        <div style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 4 }}>
          {pct >= 80 ? "Xuất sắc! Bạn đã cải thiện rõ rệt!" : pct >= 50 ? "Khá tốt! Tiếp tục ôn tập nhé." : "Cần ôn thêm. Đừng bỏ cuộc!"}
        </div>
        <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 16 }}>Chính xác {pct}%</div>
        <button
          type="button"
          onClick={generateDrill}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "9px 20px",
            borderRadius: 99,
            border: "1.5px solid var(--accent)",
            background: "var(--accent)",
            color: "var(--text-on-accent)",
            cursor: "pointer",
            fontSize: 13,
            fontWeight: 700,
          }}
        >
          <ReloadOutlined /> Tạo drill mới
        </button>
      </m.div>
    );
  }

  // Active exercise
  const exercise = drill.exercises[currentIndex];
  if (!exercise) return null;

  const data = exercise.data as { sentence?: string; options?: string[]; correctIndex?: number };
  const answered = answers[currentIndex];

  return (
    <m.div
      key={currentIndex}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.25 }}
      style={{
        borderRadius: 16,
        background: "var(--surface)",
        border: "1px solid var(--border)",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 16px",
          background: "color-mix(in srgb, var(--accent) 5%, var(--bg))",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <ThunderboltOutlined style={{ color: "var(--accent)", fontSize: 13 }} />
          <span style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)" }}>
            Câu {currentIndex + 1}/{drill.exercises.length}
          </span>
        </div>
        <span
          style={{
            fontSize: 10,
            fontWeight: 600,
            padding: "3px 10px",
            borderRadius: 99,
            background: "color-mix(in srgb, var(--accent) 10%, var(--surface))",
            color: "var(--accent)",
          }}
        >
          {exercise.targetWeakness}
        </span>
      </div>

      {/* Body */}
      <div style={{ padding: "18px 16px" }}>
        <p style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 600, marginBottom: 8 }}>
          {exercise.instruction}
        </p>
        {data.sentence && (
          <p style={{ fontSize: 15, fontWeight: 500, color: "var(--text-primary)", lineHeight: 1.65, marginBottom: 16 }}>
            {data.sentence}
          </p>
        )}

        {/* Options */}
        {data.options && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {data.options.map((opt, i) => {
              const isSelected = answered?.selected === i;
              const isCorrect = data.correctIndex === i;
              let bg = "var(--surface)";
              let borderColor = "var(--border)";
              let color = "var(--text-primary)";

              if (answered) {
                if (isCorrect) {
                  bg = "var(--success-bg)";
                  borderColor = "var(--success)";
                  color = "var(--success)";
                } else if (isSelected && !answered.correct) {
                  bg = "var(--error-bg)";
                  borderColor = "var(--error)";
                  color = "var(--error)";
                }
              }

              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => !answered && handleAnswer(currentIndex, i)}
                  disabled={!!answered}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "12px 16px",
                    borderRadius: 12,
                    border: `1.5px solid ${borderColor}`,
                    background: bg,
                    color,
                    cursor: answered ? "default" : "pointer",
                    fontSize: 14,
                    fontWeight: isSelected || isCorrect ? 700 : 500,
                    transition: "all 0.2s",
                    textAlign: "left",
                  }}
                >
                  <span
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 11,
                      fontWeight: 800,
                      background: answered
                        ? isCorrect
                          ? "var(--success)"
                          : isSelected
                          ? "var(--error)"
                          : "var(--border)"
                        : "var(--border)",
                      color: answered && (isCorrect || isSelected) ? "#fff" : "var(--text-muted)",
                      flexShrink: 0,
                    }}
                  >
                    {answered ? (
                      isCorrect ? <CheckCircleOutlined /> : isSelected ? <CloseCircleOutlined /> : String.fromCharCode(65 + i)
                    ) : (
                      String.fromCharCode(65 + i)
                    )}
                  </span>
                  {opt}
                </button>
              );
            })}
          </div>
        )}

        {/* Tip (shown after answer) */}
        {answered && exercise.tip && (
          <m.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              marginTop: 14,
              padding: "10px 14px",
              borderRadius: 10,
              background: "color-mix(in srgb, var(--accent) 5%, var(--surface))",
              border: "1px solid color-mix(in srgb, var(--accent) 12%, var(--border))",
              display: "flex",
              gap: 8,
              alignItems: "flex-start",
            }}
          >
            <BulbOutlined style={{ color: "var(--accent)", fontSize: 13, marginTop: 2, flexShrink: 0 }} />
            <p style={{ fontSize: 12, lineHeight: 1.65, color: "var(--text-secondary)", margin: 0 }}>
              {exercise.tip}
            </p>
          </m.div>
        )}

        {/* Next button */}
        {answered && (
          <m.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ marginTop: 14, textAlign: "right" }}>
            <button
              type="button"
              onClick={handleNext}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "9px 20px",
                borderRadius: 99,
                border: "none",
                background: "var(--accent)",
                color: "var(--text-on-accent)",
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 700,
              }}
            >
              {currentIndex < drill.exercises.length - 1 ? "Câu tiếp →" : "Xem kết quả"}
            </button>
          </m.div>
        )}
      </div>
    </m.div>
  );
}
