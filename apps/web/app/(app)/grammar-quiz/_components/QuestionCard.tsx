"use client";

import { useState } from "react";
import { CheckOutlined, CloseOutlined, FireOutlined, CheckCircleOutlined, CloseCircleOutlined, BulbOutlined, TranslationOutlined } from "@ant-design/icons";
import type { GrammarQuestion } from "@/lib/grammar-quiz/types";
import * as m from "motion/react-client";

const OPTION_LABELS = ["A", "B", "C", "D"] as const;

type Props = {
  question: GrammarQuestion;
  questionNumber: number;
  total: number;
  selectedAnswer: number | null;
  isRevealed: boolean;
  combo: number;
  onAnswer: (index: number) => void;
  onNext: () => void;
};

export function QuestionCard({
  question,
  questionNumber,
  total,
  selectedAnswer,
  isRevealed,
  combo,
  onAnswer,
  onNext,
}: Props) {
  const isLastQuestion = questionNumber === total;
  const [lang, setLang] = useState<"en" | "vi">("vi");
  const [showExplanation, setShowExplanation] = useState(false);

  return (
    <div style={{ margin: "0 auto", width: "100%", maxWidth: 580 }}>
      {/* Progress track */}
      <div style={{ marginBottom: 16 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 8,
          }}
        >
          <span style={{ fontSize: 12.5, fontWeight: 700, color: "var(--text-secondary)" }}>
            Câu hỏi {questionNumber} / {total}
          </span>
          <span
            style={{
              borderRadius: 6,
              background: "var(--surface-alt)",
              border: "1px solid var(--border)",
              padding: "3px 8px",
              fontSize: 11.5,
              fontWeight: 700,
              color: "var(--accent)",
            }}
          >
            {question.grammarTopic}
          </span>
        </div>
        {/* Visual progress track */}
        <div
          style={{
            height: 6,
            borderRadius: 99,
            background: "var(--border)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <m.div
            initial={{ width: 0 }}
            animate={{ width: `${(questionNumber / total) * 100}%` }}
            transition={{ type: "spring", stiffness: 80, damping: 15 }}
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              bottom: 0,
              background: "linear-gradient(90deg, var(--accent), var(--secondary))",
              borderRadius: 99,
            }}
          />
        </div>
      </div>

      {/* Combo badge */}
      {combo >= 2 && (
        <m.div
          key={`combo-${combo}`}
          initial={{ scale: 0.5, y: -10 }}
          animate={{ scale: [1, 1.1, 1], y: 0 }}
          style={{
            marginBottom: 14,
            display: "flex",
            justifyContent: "center",
          }}
        >
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              borderRadius: 999,
              background: "linear-gradient(135deg, var(--fire), var(--xp))",
              padding: "6px 18px",
              fontSize: 13.5,
              fontWeight: 900,
              color: "var(--text-on-accent)",
              boxShadow: "0 4px 14px rgba(245, 158, 11, 0.35)",
            }}
          >
            <FireOutlined /> {combo} COMBO! 🔥
          </span>
        </m.div>
      )}

      {/* Stem Card */}
      <div
        style={{
          borderRadius: "var(--radius-xl)",
          border: "1px solid var(--border)",
          background: "var(--surface)",
          padding: 24,
          boxShadow: "var(--shadow-sm)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 4, background: "var(--accent)" }} />

        <p style={{ fontSize: 16.5, lineHeight: 1.65, color: "var(--text-primary)", fontWeight: 700, margin: 0 }}>
          {renderStem(question.stem)}
        </p>

        {/* MCQ Options */}
        <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 8 }}>
          {question.options.map((option, i) => {
            const isSelected = selectedAnswer === i;
            const isCorrect = i === question.correctIndex;

            let bg = "var(--surface)";
            let borderColor = "var(--border)";
            let color = "var(--text-primary)";
            let opacity = 1;

            if (isRevealed) {
              if (isCorrect) {
                bg = "rgba(16, 185, 129, 0.08)";
                borderColor = "var(--success)";
                color = "var(--success)";
              } else if (isSelected && !isCorrect) {
                bg = "rgba(239, 68, 68, 0.08)";
                borderColor = "var(--error)";
                color = "var(--error)";
              } else {
                opacity = 0.4;
                bg = "var(--surface-alt)";
              }
            } else if (isSelected) {
              bg = "var(--accent-light)";
              borderColor = "var(--accent)";
              color = "var(--accent)";
            }

            return (
              <m.button
                key={i}
                whileHover={isRevealed ? {} : { scale: 1.005, x: 2 }}
                whileTap={isRevealed ? {} : { scale: 0.995 }}
                style={{
                  display: "flex",
                  width: "100%",
                  alignItems: "center",
                  gap: 12,
                  borderRadius: "var(--radius-lg)",
                  border: `1.5px solid ${borderColor}`,
                  padding: "12px 16px",
                  textAlign: "left",
                  fontSize: 14,
                  fontWeight: isSelected || (isRevealed && isCorrect) ? 800 : 500,
                  background: bg,
                  color,
                  opacity,
                  cursor: isRevealed ? "default" : "pointer",
                  boxShadow: "var(--shadow-sm)",
                  transition: "all 0.15s",
                }}
                onClick={() => onAnswer(i)}
                disabled={isRevealed}
              >
                <span
                  style={{
                    display: "flex",
                    width: 28,
                    height: 28,
                    flexShrink: 0,
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: 8,
                    background: isRevealed && isCorrect
                      ? "var(--success)"
                      : isRevealed && isSelected && !isCorrect
                      ? "var(--error)"
                      : isSelected
                      ? "var(--accent)"
                      : "var(--surface-alt)",
                    fontSize: 11.5,
                    fontWeight: 800,
                    color: (isRevealed && (isCorrect || (isSelected && !isCorrect))) || isSelected
                      ? "var(--text-on-accent)"
                      : "var(--text-secondary)",
                    transition: "all 0.2s",
                  }}
                >
                  {isRevealed && isCorrect ? (
                    <CheckOutlined style={{ fontSize: 12 }} />
                  ) : isRevealed && isSelected && !isCorrect ? (
                    <CloseOutlined style={{ fontSize: 12 }} />
                  ) : (
                    OPTION_LABELS[i]
                  )}
                </span>
                <span style={{ flex: 1 }}>{option}</span>
              </m.button>
            );
          })}
        </div>

        {/* Collapsible explanations */}
        {isRevealed && (
          <div className="anim-fade-up" style={{ marginTop: 20 }}>
            {/* Result Header Tag */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                borderRadius: "var(--radius-lg)",
                border: `1px solid ${selectedAnswer === question.correctIndex ? "var(--success)" : "var(--error)"}`,
                background: selectedAnswer === question.correctIndex ? "rgba(16, 185, 129, 0.08)" : "rgba(239, 68, 68, 0.08)",
                padding: "10px 16px",
              }}
            >
              <span style={{ fontSize: 16, display: "flex" }}>
                {selectedAnswer === question.correctIndex ? <CheckCircleOutlined style={{ color: "var(--success)" }} /> : <CloseCircleOutlined style={{ color: "var(--error)" }} />}
              </span>
              <span
                style={{
                  fontSize: 14,
                  fontWeight: 800,
                  color: selectedAnswer === question.correctIndex ? "var(--success)" : "var(--error)",
                }}
              >
                {selectedAnswer === question.correctIndex ? "Đúng chính xác!" : "Chưa chính xác!"} Đáp án đúng:{" "}
                <span style={{ textDecoration: "underline" }}>
                  {OPTION_LABELS[question.correctIndex]} — {question.options[question.correctIndex]}
                </span>
              </span>
            </div>

            {/* Toggle button */}
            <button
              type="button"
              onClick={() => setShowExplanation((v) => !v)}
              style={{
                marginTop: 10,
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                background: "none",
                border: "none",
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 700,
                color: "var(--accent)",
                padding: "4px 0",
              }}
            >
              {showExplanation ? "▾ Ẩn lời giải thích" : "▸ Xem lời giải thích chi tiết"}
            </button>

            {/* Explanations block */}
            {showExplanation && (
              <m.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  marginTop: 6,
                  borderRadius: "var(--radius-lg)",
                  border: "1px solid color-mix(in srgb, var(--accent) 15%, var(--border))",
                  background: "var(--surface-alt)",
                  padding: 16,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 800,
                      textTransform: "uppercase",
                      letterSpacing: "0.1em",
                      color: "var(--accent)",
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    <BulbOutlined /> Lý do đáp án
                  </span>
                  <div
                    style={{
                      display: "flex",
                      overflow: "hidden",
                      borderRadius: 6,
                      border: "1px solid var(--border)",
                    }}
                  >
                    {(["vi", "en"] as const).map((l) => (
                      <button
                        key={l}
                        onClick={() => setLang(l)}
                        style={{
                          padding: "2px 10px",
                          fontSize: 10.5,
                          fontWeight: 800,
                          border: "none",
                          cursor: "pointer",
                          background: lang === l ? "var(--accent)" : "var(--surface)",
                          color: lang === l ? "var(--text-on-accent)" : "var(--accent)",
                        }}
                      >
                        {l === "vi" ? "VIE" : "ENG"}
                      </button>
                    ))}
                  </div>
                </div>
                
                <p
                  style={{
                    marginTop: 10,
                    marginBottom: 0,
                    fontSize: 13.5,
                    lineHeight: 1.65,
                    color: "var(--text-secondary)",
                    fontWeight: 500,
                  }}
                >
                  {lang === "en" ? question.explanationEn : question.explanationVi}
                </p>

                {question.examples && question.examples.length > 0 && (
                  <div style={{ marginTop: 14, borderTop: "1.5px dashed var(--border)", paddingTop: 12 }}>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 800,
                        textTransform: "uppercase",
                        letterSpacing: "0.1em",
                        color: "var(--text-muted)",
                        display: "block",
                        marginBottom: 6,
                      }}
                    >
                      Ví dụ thực tế
                    </span>
                    {question.examples.map((ex, idx) => (
                      <p
                        key={idx}
                        style={{ fontSize: 13, fontStyle: "italic", color: "var(--text-secondary)", margin: "4px 0 0", fontWeight: 500 }}
                      >
                        • {ex}
                      </p>
                    ))}
                  </div>
                )}
              </m.div>
            )}
          </div>
        )}
      </div>

      {/* Next button */}
      {isRevealed && (
        <m.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={onNext}
          style={{
            marginTop: 16,
            width: "100%",
            borderRadius: "var(--radius-xl)",
            background: "linear-gradient(135deg, var(--accent), var(--accent-hover, var(--accent)))",
            padding: "12px 0",
            fontSize: 14.5,
            fontWeight: 800,
            color: "var(--text-on-accent)",
            border: "none",
            boxShadow: "0 4px 12px var(--accent-muted)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
          }}
        >
          {isLastQuestion ? "Hoàn thành và xem kết quả" : "Câu tiếp theo →"}
        </m.button>
      )}
    </div>
  );
}

function renderStem(stem: string) {
  const parts = stem.split("_____");
  if (parts.length < 2) return stem;
  return (
    <>
      {parts[0]}
      <span
        style={{
          display: "inline-block",
          borderRadius: 6,
          background: "var(--accent-light)",
          padding: "2px 10px",
          fontWeight: 800,
          color: "var(--accent)",
        }}
      >
        _____
      </span>
      {parts[1]}
    </>
  );
}
