"use client";
import { useState, useCallback } from "react";
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  LoadingOutlined,
  ThunderboltOutlined,
} from "@ant-design/icons";
import { api } from "@/lib/api-client";

type PracticeData = {
  questionStem: string;
  options: string[];
  correctIndex: number;
  explanation: string;
};

type Props = {
  errorId: string;
  onResolved?: () => void;
};

export function InlinePractice({ errorId, onResolved }: Props) {
  const [data, setData] = useState<PracticeData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const generate = useCallback(async () => {
    setLoading(true);
    setError(null);
    setData(null);
    setSelected(null);
    setSubmitted(false);

    try {
      const res = await api.post<{ practice: PracticeData }>(`/errors/${errorId}/practice`, {});
      setData(res.practice);
    } catch {
      setError("Không thể tạo bài tập. Thử lại sau.");
    } finally {
      setLoading(false);
    }
  }, [errorId]);

  const handleSubmit = useCallback(() => {
    if (selected === null || !data) return;
    setSubmitted(true);
    if (selected === data.correctIndex) {
      onResolved?.();
    }
  }, [selected, data, onResolved]);

  // Not started yet — show trigger button
  if (!data && !loading && !error) {
    return (
      <button
        type="button"
        onClick={generate}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          padding: "7px 14px",
          borderRadius: 10,
          border: "1px solid color-mix(in srgb, var(--accent) 25%, var(--border))",
          background: "var(--card-bg)",
          cursor: "pointer",
          fontSize: 12,
          fontWeight: 600,
          color: "var(--accent)",
          transition: "all 0.2s",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "color-mix(in srgb, var(--accent) 8%, var(--surface))";
          e.currentTarget.style.borderColor = "var(--accent)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "var(--card-bg)";
          e.currentTarget.style.borderColor = "color-mix(in srgb, var(--accent) 25%, var(--border))";
        }}
      >
        <ThunderboltOutlined /> Luyện lại
      </button>
    );
  }

  // Loading
  if (loading) {
    return (
      <div style={{ padding: "16px 0", textAlign: "center" }}>
        <LoadingOutlined style={{ fontSize: 18, color: "var(--accent)" }} />
        <span style={{ marginLeft: 8, fontSize: 12, color: "var(--text-muted)" }}>Đang tạo bài tập...</span>
      </div>
    );
  }

  // Error
  if (error) {
    return (
      <div style={{ fontSize: 12, color: "var(--error)", padding: "8px 0" }}>
        {error}{" "}
        <button
          type="button"
          onClick={generate}
          style={{ border: "none", background: "none", color: "var(--accent)", cursor: "pointer", fontSize: 12, fontWeight: 600, textDecoration: "underline" }}
        >
          Thử lại
        </button>
      </div>
    );
  }

  if (!data) return null;

  const isCorrect = submitted && selected === data.correctIndex;

  return (
    <div
      className="anim-fade-up"
      style={{
        marginTop: 10,
        padding: "14px 16px",
        borderRadius: 12,
        border: `1.5px solid ${submitted ? (isCorrect ? "var(--success)" : "var(--error)") : "color-mix(in srgb, var(--accent) 20%, var(--border))"}`,
        background: submitted
          ? isCorrect
            ? "color-mix(in srgb, var(--success) 4%, var(--surface))"
            : "color-mix(in srgb, var(--error) 4%, var(--surface))"
          : "var(--card-bg)",
        transition: "all 0.2s",
      }}
    >
      {/* Question */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
        <ThunderboltOutlined style={{ color: "var(--accent)", fontSize: 13 }} />
        <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--accent)" }}>
          Bài tập luyện lại
        </span>
      </div>
      <p style={{ fontSize: 14, fontWeight: 500, margin: "0 0 12px", lineHeight: 1.5, color: "var(--ink)" }}>
        {data.questionStem}
      </p>

      {/* Options */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {data.options.map((opt, i) => {
          let borderColor = "var(--border)";
          let bg = "transparent";
          let textColor = "var(--text)";

          if (submitted) {
            if (i === data.correctIndex) {
              borderColor = "var(--success)";
              bg = "color-mix(in srgb, var(--success) 8%, transparent)";
              textColor = "var(--success)";
            } else if (i === selected && i !== data.correctIndex) {
              borderColor = "var(--error)";
              bg = "color-mix(in srgb, var(--error) 8%, transparent)";
              textColor = "var(--error)";
            }
          } else if (selected === i) {
            borderColor = "var(--accent)";
            bg = "var(--accent-muted)";
            textColor = "var(--accent)";
          }

          return (
            <button
              key={i}
              onClick={() => !submitted && setSelected(i)}
              disabled={submitted}
              style={{
                padding: "9px 12px",
                borderRadius: 8,
                border: `1.5px solid ${borderColor}`,
                background: bg,
                color: textColor,
                textAlign: "left",
                cursor: submitted ? "default" : "pointer",
                fontSize: 13,
                fontWeight: selected === i || (submitted && i === data.correctIndex) ? 600 : 400,
                transition: "all 0.15s",
              }}
            >
              {String.fromCharCode(65 + i)}. {opt}
            </button>
          );
        })}
      </div>

      {/* Submit / Result */}
      {!submitted ? (
        <button
          onClick={handleSubmit}
          disabled={selected === null}
          style={{
            width: "100%",
            marginTop: 10,
            padding: "10px",
            borderRadius: 8,
            border: "none",
            background: selected !== null ? "var(--accent)" : "var(--border)",
            color: selected !== null ? "var(--text-on-accent)" : "var(--text-muted)",
            fontSize: 13,
            fontWeight: 600,
            cursor: selected !== null ? "pointer" : "not-allowed",
          }}
        >
          Kiểm tra
        </button>
      ) : (
        <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 8 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 12px",
              borderRadius: 8,
              background: isCorrect ? "color-mix(in srgb, var(--success) 8%, transparent)" : "color-mix(in srgb, var(--error) 8%, transparent)",
              fontSize: 13,
              fontWeight: 600,
              color: isCorrect ? "var(--success)" : "var(--error)",
            }}
          >
            {isCorrect ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
            {isCorrect ? "Chính xác! 🎉" : "Sai rồi!"}
          </div>
          <p style={{ margin: 0, fontSize: 12, lineHeight: 1.6, color: "var(--text-secondary)", fontStyle: "italic" }}>
            {data.explanation}
          </p>
          <button
            onClick={generate}
            style={{
              alignSelf: "flex-start",
              padding: "6px 14px",
              borderRadius: 8,
              border: "1px solid var(--border)",
              background: "var(--card-bg)",
              cursor: "pointer",
              fontSize: 12,
              fontWeight: 600,
              color: "var(--accent)",
            }}
          >
            Làm câu khác →
          </button>
        </div>
      )}
    </div>
  );
}
