"use client";

import { useState } from "react";
import { CheckOutlined, CloseOutlined } from "@ant-design/icons";
import type { GrammarQuestion } from "@/lib/grammar-quiz/types";

const OPTION_LABELS = ["A", "B", "C", "D"] as const;

type Props = {
  question: GrammarQuestion;
  questionNumber: number;
  total: number;
  selectedAnswer: number | null;
  isRevealed: boolean;
  onAnswer: (index: number) => void;
  onNext: () => void;
};

export function QuestionCard({
  question,
  questionNumber,
  total,
  selectedAnswer,
  isRevealed,
  onAnswer,
  onNext,
}: Props) {
  const isLastQuestion = questionNumber === total;
  const [lang, setLang] = useState<"en" | "vi">("vi");

  return (
    <div style={{ margin: "0 auto", width: "100%", maxWidth: 580 }}>
      {/* Progress */}
      <div
        style={{
          marginBottom: 16,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span style={{ fontSize: 12, fontWeight: 500, color: "var(--text-muted)" }}>
          Câu {questionNumber} / {total}
        </span>
        <span
          style={{
            borderRadius: 999,
            background: "var(--bg-deep)",
            padding: "2px 10px",
            fontSize: 11,
            fontWeight: 500,
            color: "var(--text-secondary)",
          }}
        >
          {question.grammarTopic}
        </span>
      </div>

      {/* Stem */}
      <div
        style={{
          borderRadius: "var(--radius-lg)",
          border: "1px solid var(--border)",
          background: "var(--surface)",
          padding: 24,
          boxShadow: "var(--shadow-sm)",
        }}
      >
        <p style={{ fontSize: 16, lineHeight: 1.6, color: "var(--ink)" }}>
          {renderStem(question.stem)}
        </p>

        {/* Options */}
        <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 10 }}>
          {question.options.map((option, i) => {
            const isSelected = selectedAnswer === i;
            const isCorrect = i === question.correctIndex;

            let bg = "var(--surface)";
            let borderColor = "var(--border)";
            let color = "inherit";
            let opacity = 1;

            if (isRevealed) {
              if (isCorrect) {
                bg = "#ecfdf5";
                borderColor = "#34d399";
                color = "#065f46";
              } else if (isSelected && !isCorrect) {
                bg = "#fef2f2";
                borderColor = "#f87171";
                color = "#991b1b";
              } else {
                opacity = 0.5;
                bg = "var(--bg-deep)";
              }
            } else if (isSelected) {
              bg = "var(--accent-muted)";
              borderColor = "var(--accent)";
            }

            return (
              <button
                key={i}
                style={{
                  display: "flex",
                  width: "100%",
                  alignItems: "center",
                  gap: 12,
                  borderRadius: "var(--radius)",
                  border: `1px solid ${borderColor}`,
                  padding: "12px 16px",
                  textAlign: "left",
                  fontSize: 14,
                  background: bg,
                  color,
                  opacity,
                  cursor: isRevealed ? "default" : "pointer",
                  transition: "all 0.2s",
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
                    borderRadius: "var(--radius-sm)",
                    background: "var(--bg-deep)",
                    fontSize: 12,
                    fontWeight: 700,
                    color: "var(--text-secondary)",
                  }}
                >
                  {isRevealed && isCorrect ? (
                    <CheckOutlined style={{ fontSize: 14, color: "#059669" }} />
                  ) : isRevealed && isSelected && !isCorrect ? (
                    <CloseOutlined style={{ fontSize: 14, color: "#dc2626" }} />
                  ) : (
                    OPTION_LABELS[i]
                  )}
                </span>
                <span style={{ flex: 1 }}>{option}</span>
              </button>
            );
          })}
        </div>

        {/* Explanation */}
        {isRevealed && (
          <div
            className="anim-fade-up"
            style={{
              marginTop: 20,
              borderRadius: "var(--radius)",
              border: "1px solid #fcd34d",
              background: "rgba(254,243,199,0.6)",
              padding: 16,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <p
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  color: "#b45309",
                  margin: 0,
                }}
              >
                Giải thích
              </p>
              <div
                style={{
                  display: "flex",
                  overflow: "hidden",
                  borderRadius: 6,
                  border: "1px solid #fcd34d",
                }}
              >
                {(["vi", "en"] as const).map((l) => (
                  <button
                    key={l}
                    onClick={() => setLang(l)}
                    style={{
                      padding: "2px 10px",
                      fontSize: 11,
                      fontWeight: 600,
                      border: "none",
                      cursor: "pointer",
                      background: lang === l ? "#7a9660" : "#fffbeb",
                      color: lang === l ? "#fff" : "#b45309",
                    }}
                  >
                    {l === "vi" ? "VN" : "EN"}
                  </button>
                ))}
              </div>
            </div>
            <p
              style={{
                marginTop: 8,
                whiteSpace: "pre-line",
                fontSize: 14,
                lineHeight: 1.6,
                color: "#78350f",
              }}
            >
              {lang === "en" ? question.explanationEn : question.explanationVi}
            </p>
            <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 4 }}>
              <p
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  color: "#7a9660",
                  margin: 0,
                }}
              >
                Ví dụ
              </p>
              {question.examples.map((ex, i) => (
                <p
                  key={i}
                  style={{ fontSize: 14, fontStyle: "italic", color: "#92400e", margin: 0 }}
                >
                  {i + 1}. {ex}
                </p>
              ))}
            </div>
          </div>
        )}

        {/* Next button */}
        {isRevealed && (
          <button
            className="anim-fade-in"
            onClick={onNext}
            style={{
              marginTop: 16,
              width: "100%",
              borderRadius: "var(--radius)",
              background: "linear-gradient(135deg, var(--accent), #7a9660)",
              padding: "12px 0",
              fontSize: 14,
              fontWeight: 600,
              color: "#fff",
              border: "none",
              boxShadow: "var(--shadow-sm)",
              cursor: "pointer",
            }}
          >
            {isLastQuestion ? "Xem kết quả" : "Tiếp theo →"}
          </button>
        )}
      </div>
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
          borderRadius: 4,
          background: "var(--accent-muted)",
          padding: "2px 8px",
          fontWeight: 600,
          color: "var(--accent)",
        }}
      >
        _____
      </span>
      {parts[1]}
    </>
  );
}
