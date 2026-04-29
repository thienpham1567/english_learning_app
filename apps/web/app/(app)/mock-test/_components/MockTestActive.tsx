"use client";

import {
  ClockCircleOutlined,
  CheckCircleOutlined,
  LeftOutlined,
  RightOutlined,
  FlagOutlined,
  ReadOutlined,
} from "@ant-design/icons";
import { Progress, Tooltip, Collapse } from "antd";
import type { MockQuestion } from "./types";
import { formatTime, isFillBlank } from "./types";

type Props = {
  questions: MockQuestion[];
  passage: string | null;
  currentIdx: number;
  setCurrentIdx: (idx: number | ((prev: number) => number)) => void;
  answers: (number | string | null)[];
  fillBlankInputs: Record<number, string>;
  flagged: Set<number>;
  timeLeft: number;
  onSelectAnswer: (idx: number, value: number | string) => void;
  onToggleFlag: (idx: number) => void;
  onSetFillBlankInput: (idx: number, value: string) => void;
  onSubmit: () => void;
};

export function MockTestActive({
  questions, passage, currentIdx, setCurrentIdx,
  answers, fillBlankInputs, flagged, timeLeft,
  onSelectAnswer, onToggleFlag, onSetFillBlankInput, onSubmit,
}: Props) {
  const currentQuestion = questions[currentIdx];
  if (!currentQuestion) return null;

  const answeredCount = questions.reduce((count, q, i) => {
    if (isFillBlank(q.type)) return count + (fillBlankInputs[i]?.trim().length > 0 ? 1 : 0);
    return count + (answers[i] !== null ? 1 : 0);
  }, 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Timer + progress bar */}
      <div
        style={{
          display: "flex", alignItems: "center", gap: 12,
          padding: "12px 20px", borderRadius: 16,
          background: "var(--surface)", border: "1px solid var(--border)",
          boxShadow: "var(--shadow-sm)",
        }}
      >
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          padding: "4px 14px", borderRadius: 999,
          background: timeLeft < 60 ? "var(--error-bg)" : "var(--accent-muted)",
        }}>
          <ClockCircleOutlined style={{ fontSize: 13, color: timeLeft < 60 ? "var(--error)" : "var(--accent)" }} />
          <span style={{ fontSize: 15, fontWeight: 700, fontVariantNumeric: "tabular-nums", color: timeLeft < 60 ? "var(--error)" : "var(--accent)" }}>
            {formatTime(timeLeft)}
          </span>
        </div>
        <Progress percent={(answeredCount / questions.length) * 100} size="small" showInfo={false} style={{ flex: 1 }} />
        <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", fontVariantNumeric: "tabular-nums" }}>
          {answeredCount}/{questions.length}
        </span>
      </div>

      {/* IELTS passage */}
      {passage && (
        <Collapse
          items={[{
            key: "passage",
            label: <span><ReadOutlined /> Đọc bài đọc (nhấn để mở/đóng)</span>,
            children: <p style={{ whiteSpace: "pre-wrap", fontSize: 14, lineHeight: 1.7, margin: 0 }}>{passage}</p>,
          }]}
          defaultActiveKey={["passage"]}
          style={{ marginBottom: 0 }}
        />
      )}

      {/* Question card */}
      <div
        style={{
          padding: "24px 22px", borderRadius: 20,
          background: "var(--surface)",
          border: flagged.has(currentIdx) ? "2px solid var(--warning)" : "1px solid var(--border)",
          boxShadow: "var(--shadow-md)", position: "relative", overflow: "hidden",
        }}
      >
        {/* Accent top bar */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: flagged.has(currentIdx) ? "var(--warning)" : "linear-gradient(90deg, var(--accent), var(--secondary))" }} />

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: "var(--accent)", padding: "3px 12px", borderRadius: 999, background: "var(--accent-muted)" }}>
            Câu {currentIdx + 1}/{questions.length}
          </span>
          <span style={{ fontSize: 10, fontWeight: 700, color: "var(--text-on-accent)", padding: "3px 10px", borderRadius: 999, background: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            {currentQuestion.type.replace(/-|_/g, " ")}
          </span>
          <span style={{ fontSize: 11, fontWeight: 500, color: "var(--text-secondary)", padding: "3px 10px", borderRadius: 999, background: "var(--bg-secondary)" }}>
            {currentQuestion.topic}
          </span>
          <Tooltip title={flagged.has(currentIdx) ? "Bỏ đánh dấu" : "Đánh dấu để xem lại"}>
            <button
              onClick={() => onToggleFlag(currentIdx)}
              style={{
                marginLeft: "auto", width: 32, height: 32, borderRadius: 10,
                border: "none", display: "grid", placeItems: "center",
                background: flagged.has(currentIdx) ? "var(--warning-bg)" : "var(--bg-secondary)",
                cursor: "pointer", color: flagged.has(currentIdx) ? "var(--warning)" : "var(--text-muted)",
                transition: "all 0.15s ease",
              }}
              aria-label="Đánh dấu câu hỏi"
            >
              <FlagOutlined style={{ fontSize: 14 }} />
            </button>
          </Tooltip>
        </div>

        {/* Part 6 passage context */}
        {currentQuestion.passage && (
          <div style={{
            padding: "14px 16px", borderRadius: 12,
            borderLeft: "4px solid var(--accent)",
            background: "color-mix(in srgb, var(--accent) 5%, var(--surface))",
            marginBottom: 16, fontSize: 13, lineHeight: 1.7,
            fontStyle: "italic", color: "var(--text-secondary)",
          }}>
            {currentQuestion.passage}
          </div>
        )}

        {/* Question stem */}
        <p style={{ fontSize: 16, fontWeight: 500, margin: "0 0 20px", lineHeight: 1.6, color: "var(--ink)" }}>
          {currentQuestion.stem}
        </p>

        {/* MCQ Options */}
        {currentQuestion.options && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {currentQuestion.options.map((opt, oi) => {
              const isSelected = answers[currentIdx] === oi;
              return (
                <button
                  key={oi}
                  onClick={() => onSelectAnswer(currentIdx, oi)}
                  style={{
                    display: "flex", alignItems: "center", gap: 12,
                    padding: "12px 16px", borderRadius: 14,
                    border: isSelected ? "2px solid var(--accent)" : "1px solid var(--border)",
                    background: isSelected ? "color-mix(in srgb, var(--accent) 8%, var(--surface))" : "var(--surface)",
                    color: "var(--ink)", textAlign: "left", cursor: "pointer",
                    fontSize: 14, fontWeight: isSelected ? 600 : 400,
                    transition: "all 0.15s ease",
                  }}
                >
                  <span style={{
                    width: 28, height: 28, borderRadius: 99, display: "grid", placeItems: "center",
                    flexShrink: 0, fontSize: 12, fontWeight: 700,
                    background: isSelected ? "var(--accent)" : "var(--border)",
                    color: isSelected ? "var(--text-on-accent)" : "var(--text-muted)",
                    transition: "all 0.15s ease",
                  }}>
                    {String.fromCharCode(65 + oi)}
                  </span>
                  {opt}
                </button>
              );
            })}
          </div>
        )}

        {/* Fill blank input */}
        {isFillBlank(currentQuestion.type) && !currentQuestion.options && (
          <input
            type="text"
            value={fillBlankInputs[currentIdx] ?? ""}
            onChange={(e) => {
              onSetFillBlankInput(currentIdx, e.target.value);
              onSelectAnswer(currentIdx, e.target.value);
            }}
            placeholder="Nhập câu trả lời..."
            style={{
              width: "100%", padding: "12px 16px", borderRadius: 12,
              border: "1.5px solid var(--border)", background: "var(--surface)",
              color: "var(--ink)", fontSize: 14, outline: "none", boxSizing: "border-box",
              transition: "border-color 0.15s ease",
            }}
            onFocus={(e) => { e.currentTarget.style.borderColor = "var(--accent)"; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = "var(--border)"; }}
          />
        )}
      </div>

      {/* Navigation */}
      <div style={{ display: "flex", gap: 10, justifyContent: "space-between", alignItems: "center" }}>
        <button
          onClick={() => setCurrentIdx((prev: number) => Math.max(0, prev - 1))}
          disabled={currentIdx === 0}
          style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "10px 18px", borderRadius: 12,
            border: "1px solid var(--border)", background: "var(--surface)",
            color: currentIdx === 0 ? "var(--text-disabled)" : "var(--ink)",
            cursor: currentIdx === 0 ? "not-allowed" : "pointer",
            fontSize: 13, fontWeight: 500, transition: "all 0.15s ease",
          }}
        >
          <LeftOutlined style={{ fontSize: 11 }} /> Trước
        </button>

        {/* Question dots */}
        <div style={{ display: "flex", gap: 5, alignItems: "center", flexWrap: "wrap", justifyContent: "center", flex: 1 }}>
          {questions.map((_, i) => {
            const isCurrent = i === currentIdx;
            const isAnswered = answers[i] !== null || !!fillBlankInputs[i]?.trim();
            const isFlagged = flagged.has(i);
            return (
              <button
                key={i}
                onClick={() => setCurrentIdx(i)}
                style={{
                  width: isCurrent ? 32 : 26, height: 26, borderRadius: 8,
                  border: isCurrent ? "2px solid var(--accent)" : "1px solid var(--border)",
                  background: isFlagged ? "var(--warning-bg)" : isAnswered ? "var(--accent-muted)" : "var(--surface)",
                  color: isCurrent ? "var(--accent)" : "var(--text-muted)",
                  cursor: "pointer", fontSize: 10, fontWeight: isCurrent ? 800 : 500,
                  transition: "all 0.15s ease",
                }}
                aria-label={`Câu ${i + 1}`}
              >
                {i + 1}
              </button>
            );
          })}
        </div>

        {currentIdx < questions.length - 1 ? (
          <button
            onClick={() => setCurrentIdx((prev: number) => prev + 1)}
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "10px 18px", borderRadius: 12,
              border: "1px solid var(--border)", background: "var(--surface)",
              color: "var(--ink)", cursor: "pointer", fontSize: 13, fontWeight: 500,
              transition: "all 0.15s ease",
            }}
          >
            Sau <RightOutlined style={{ fontSize: 11 }} />
          </button>
        ) : (
          <button
            onClick={onSubmit}
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "10px 20px", borderRadius: 12,
              border: "none", background: "linear-gradient(135deg, var(--accent), var(--accent-hover))",
              color: "var(--text-on-accent)", cursor: "pointer", fontSize: 13, fontWeight: 700,
              boxShadow: "0 3px 12px color-mix(in srgb, var(--accent) 30%, transparent)",
              transition: "all 0.15s ease",
            }}
          >
            Nộp bài <CheckCircleOutlined />
          </button>
        )}
      </div>
    </div>
  );
}
