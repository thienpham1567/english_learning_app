"use client";
import { useState, useCallback } from "react";
import {
  BulbOutlined,
  CloseCircleOutlined,
  CheckCircleOutlined,
  ThunderboltOutlined,
  BookOutlined,
  LoadingOutlined,
  ExperimentOutlined,
} from "@ant-design/icons";
import { api } from "@/lib/api-client";

type DeepExplanationData = {
  whyWrong: string;
  whyCorrect: string;
  grammarRule: string;
  examples: string[];
  tip: string;
};

type Props = {
  errorId: string;
  cached: DeepExplanationData | null;
  /** Fallback plain explanation */
  fallbackEn?: string | null;
  fallbackVi?: string | null;
};

export function DeepExplanation({ errorId, cached, fallbackEn, fallbackVi }: Props) {
  const [data, setData] = useState<DeepExplanationData | null>(cached);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  const generate = useCallback(async () => {
    if (data) {
      setExpanded(true);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await api.post<{ explanation: DeepExplanationData }>(`/errors/${errorId}/explain`, {});
      setData(result.explanation);
      setExpanded(true);
    } catch {
      setError("Không thể tạo giải thích. Thử lại sau.");
    } finally {
      setLoading(false);
    }
  }, [data, errorId]);

  // If data already loaded, just toggle
  const toggle = useCallback(() => {
    if (data) {
      setExpanded((prev) => !prev);
    } else {
      generate();
    }
  }, [data, generate]);

  return (
    <div style={{ marginTop: 10 }}>
      {/* Toggle button */}
      <button
        type="button"
        onClick={toggle}
        disabled={loading}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          width: "100%",
          padding: "10px 14px",
          borderRadius: 10,
          border: "1px solid color-mix(in srgb, var(--accent) 20%, var(--border))",
          background: expanded
            ? "color-mix(in srgb, var(--accent) 6%, var(--surface))"
            : "var(--card-bg)",
          cursor: loading ? "wait" : "pointer",
          fontSize: 13,
          fontWeight: 600,
          color: "var(--accent)",
          transition: "all 0.2s",
          textAlign: "left",
        }}
      >
        {loading ? (
          <LoadingOutlined style={{ fontSize: 15 }} />
        ) : (
          <BulbOutlined style={{ fontSize: 15 }} />
        )}
        <span style={{ flex: 1 }}>
          {loading
            ? "Đang phân tích lỗi sai..."
            : data
              ? expanded
                ? "Ẩn giải thích chi tiết"
                : "Xem giải thích chi tiết"
              : "Phân tích lỗi sai với AI"}
        </span>
        {data && (
          <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 400 }}>
            {expanded ? "▲" : "▼"}
          </span>
        )}
      </button>

      {/* Error state */}
      {error && (
        <div
          style={{
            marginTop: 8,
            padding: "8px 12px",
            borderRadius: 8,
            background: "color-mix(in srgb, var(--error) 6%, var(--surface))",
            color: "var(--error)",
            fontSize: 12,
          }}
        >
          {error}
          <button
            type="button"
            onClick={generate}
            style={{
              marginLeft: 8,
              border: "none",
              background: "none",
              color: "var(--accent)",
              cursor: "pointer",
              fontSize: 12,
              fontWeight: 600,
              textDecoration: "underline",
            }}
          >
            Thử lại
          </button>
        </div>
      )}

      {/* Expanded content */}
      {expanded && data && (
        <div
          className="anim-fade-up"
          style={{
            marginTop: 10,
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          {/* Why Wrong */}
          <div
            style={{
              padding: "12px 14px",
              borderRadius: 10,
              background: "color-mix(in srgb, var(--error) 4%, var(--surface))",
              borderLeft: "3px solid var(--error)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                marginBottom: 6,
                fontSize: 12,
                fontWeight: 700,
                color: "var(--error)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              <CloseCircleOutlined /> Tại sao đáp án bạn chọn sai
            </div>
            <p style={{ margin: 0, fontSize: 13, lineHeight: 1.7, color: "var(--text)" }}>
              {data.whyWrong}
            </p>
          </div>

          {/* Why Correct */}
          <div
            style={{
              padding: "12px 14px",
              borderRadius: 10,
              background: "color-mix(in srgb, var(--success) 4%, var(--surface))",
              borderLeft: "3px solid var(--success)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                marginBottom: 6,
                fontSize: 12,
                fontWeight: 700,
                color: "var(--success)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              <CheckCircleOutlined /> Tại sao đáp án đúng là đúng
            </div>
            <p style={{ margin: 0, fontSize: 13, lineHeight: 1.7, color: "var(--text)" }}>
              {data.whyCorrect}
            </p>
          </div>

          {/* Grammar Rule — Formula Card */}
          <div
            style={{
              padding: "12px 14px",
              borderRadius: 10,
              background: "linear-gradient(135deg, color-mix(in srgb, var(--accent) 8%, var(--surface)), color-mix(in srgb, var(--secondary) 6%, var(--surface)))",
              border: "1px solid color-mix(in srgb, var(--accent) 15%, var(--border))",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                marginBottom: 8,
                fontSize: 12,
                fontWeight: 700,
                color: "var(--accent)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              <BookOutlined /> Quy tắc ngữ pháp
            </div>
            <div
              style={{
                padding: "10px 14px",
                borderRadius: 8,
                background: "color-mix(in srgb, var(--accent) 6%, var(--surface))",
                fontFamily: "var(--font-mono, 'Fira Code', monospace)",
                fontSize: 13,
                fontWeight: 600,
                lineHeight: 1.6,
                color: "var(--ink)",
                letterSpacing: "0.02em",
              }}
            >
              {data.grammarRule}
            </div>
          </div>

          {/* Examples */}
          <div
            style={{
              padding: "12px 14px",
              borderRadius: 10,
              background: "var(--card-bg)",
              border: "1px solid var(--border)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                marginBottom: 8,
                fontSize: 12,
                fontWeight: 700,
                color: "var(--secondary)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              <ExperimentOutlined /> Ví dụ tương tự
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {data.examples.map((ex, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 8,
                    fontSize: 13,
                    lineHeight: 1.6,
                    color: "var(--text)",
                  }}
                >
                  <span
                    style={{
                      flexShrink: 0,
                      width: 20,
                      height: 20,
                      borderRadius: "50%",
                      background: "color-mix(in srgb, var(--secondary) 12%, var(--surface))",
                      display: "grid",
                      placeItems: "center",
                      fontSize: 10,
                      fontWeight: 700,
                      color: "var(--secondary)",
                      marginTop: 2,
                    }}
                  >
                    {i + 1}
                  </span>
                  <span>{ex}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Tip */}
          <div
            style={{
              padding: "10px 14px",
              borderRadius: 10,
              background: "linear-gradient(135deg, color-mix(in srgb, var(--warning) 8%, var(--surface)), color-mix(in srgb, var(--xp) 6%, var(--surface)))",
              border: "1px solid color-mix(in srgb, var(--warning) 15%, var(--border))",
              display: "flex",
              alignItems: "flex-start",
              gap: 10,
            }}
          >
            <ThunderboltOutlined
              style={{
                fontSize: 16,
                color: "var(--warning)",
                marginTop: 2,
                flexShrink: 0,
              }}
            />
            <div>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "var(--warning)",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  marginBottom: 3,
                }}
              >
                Mẹo ghi nhớ
              </div>
              <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6, color: "var(--text)" }}>
                {data.tip}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Fallback: show old explanation if no deep data and not expanded */}
      {!data && !expanded && !loading && (fallbackEn || fallbackVi) && (
        <div
          style={{
            marginTop: 8,
            padding: "10px 14px",
            borderRadius: 8,
            background: "var(--card-bg)",
            border: "1px solid var(--border)",
            fontSize: 13,
            lineHeight: 1.6,
          }}
        >
          {fallbackVi && (
            <p style={{ margin: 0, color: "var(--text-secondary)", fontStyle: "italic" }}>
              {fallbackVi}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
