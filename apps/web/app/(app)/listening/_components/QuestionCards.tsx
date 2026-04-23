"use client";

import { CheckCircleOutlined, SendOutlined, LoadingOutlined, FormOutlined } from "@ant-design/icons";

type Question = {
  question: string;
  options: string[];
};

type Props = {
  questions: Question[];
  selectedAnswers: (number | null)[];
  onSelectAnswer: (questionIndex: number, optionIndex: number) => void;
  onSubmit: () => void;
  allAnswered: boolean;
  isSubmitting: boolean;
};

export function QuestionCards({ questions, selectedAnswers, onSelectAnswer, onSubmit, allAnswered, isSubmitting }: Props) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 1 }}>
        <FormOutlined style={{ marginRight: 6 }} /> Câu hỏi ({questions.length})
      </div>

      {questions.map((q, qi) => (
        <div
          key={qi}
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-md)",
            padding: 16,
          }}
        >
          <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", marginBottom: 12 }}>
            {qi + 1}. {q.question}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {q.options.map((opt, oi) => {
              const isSelected = selectedAnswers[qi] === oi;
              return (
                <button
                  key={oi}
                  onClick={() => onSelectAnswer(qi, oi)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "10px 14px",
                    borderRadius: "var(--radius-sm)",
                    border: isSelected ? "2px solid var(--accent)" : "1px solid var(--border)",
                    background: isSelected ? "var(--accent-surface)" : "transparent",
                    color: "var(--text)",
                    cursor: "pointer",
                    fontSize: 13,
                    textAlign: "left",
                    transition: "all 0.15s ease",
                    width: "100%",
                  }}
                >
                  <span
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: "50%",
                      border: isSelected ? "2px solid var(--accent)" : "1px solid var(--border)",
                      background: isSelected ? "var(--accent)" : "transparent",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 11,
                      color: isSelected ? "var(--text-on-accent, #fff)" : "var(--text-muted)",
                      fontWeight: 700,
                      flexShrink: 0,
                    }}
                  >
                    {isSelected ? <CheckCircleOutlined /> : String.fromCharCode(65 + oi)}
                  </span>
                  {opt}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {/* Submit button */}
      <button
        onClick={onSubmit}
        disabled={!allAnswered || isSubmitting}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 10,
          padding: "14px 24px",
          borderRadius: "var(--radius-md)",
          border: "none",
          background: allAnswered ? "linear-gradient(135deg, var(--accent), var(--accent-hover))" : "var(--border)",
          color: allAnswered ? "var(--text-on-accent, #fff)" : "var(--text-muted)",
          fontSize: 15,
          fontWeight: 700,
          cursor: allAnswered && !isSubmitting ? "pointer" : "not-allowed",
          transition: "all 0.2s ease",
          opacity: isSubmitting ? 0.7 : 1,
        }}
      >
        {isSubmitting ? <LoadingOutlined spin /> : <SendOutlined />}
        {isSubmitting ? "Đang chấm điểm..." : "Nộp bài"}
      </button>
    </div>
  );
}
