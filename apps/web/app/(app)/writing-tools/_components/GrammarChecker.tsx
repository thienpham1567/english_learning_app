"use client";

import { useState, useCallback } from "react";
import {
  CheckCircleOutlined,
  LoadingOutlined,
  CopyOutlined,
  CheckOutlined,
  WarningOutlined,
  BugOutlined,
  BulbOutlined,
  DownOutlined,
  RightOutlined,
} from "@ant-design/icons";
import { api } from "@/lib/api-client";
import type { GrammarCheckResponse, GrammarError } from "@/lib/writing-tools/schema";

const MAX_WORDS = 500;

const TYPE_META: Record<string, { label: string; labelVi: string; color: string; icon: React.ReactNode }> = {
  grammar: { label: "Grammar", labelVi: "Ngữ pháp", color: "var(--error)", icon: <BugOutlined /> },
  spelling: { label: "Spelling", labelVi: "Chính tả", color: "var(--warning, #e8a838)", icon: <WarningOutlined /> },
  style: { label: "Style", labelVi: "Phong cách", color: "var(--info, #5b8def)", icon: <BulbOutlined /> },
};

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      style={{
        border: "none",
        background: "transparent",
        cursor: "pointer",
        color: copied ? "var(--success)" : "var(--text-secondary)",
        fontSize: 13,
        padding: "4px 8px",
        borderRadius: 6,
      }}
      title="Sao chép"
    >
      {copied ? <CheckOutlined /> : <CopyOutlined />}
    </button>
  );
}

function ErrorCard({
  error,
  onApply,
}: {
  error: GrammarError;
  onApply: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const meta = TYPE_META[error.type] ?? TYPE_META.grammar;

  return (
    <div
      style={{
        borderRadius: 12,
        border: "1px solid var(--border)",
        background: "var(--card-bg)",
        overflow: "hidden",
        transition: "box-shadow 0.2s",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 14px",
          borderLeft: `4px solid ${meta.color}`,
          cursor: "pointer",
        }}
        onClick={() => setExpanded((p) => !p)}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ color: meta.color, fontSize: 13 }}>{meta.icon}</span>
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: meta.color,
              padding: "2px 8px",
              borderRadius: 10,
              background: `color-mix(in srgb, ${meta.color} 10%, transparent)`,
            }}
          >
            {meta.labelVi}
          </span>
          <span style={{ fontSize: 13, color: "var(--text-muted)", textDecoration: "line-through" }}>
            {error.original}
          </span>
          <span style={{ fontSize: 13, color: "var(--text-primary)" }}>→</span>
          <span style={{ fontSize: 13, color: "var(--success)", fontWeight: 500 }}>
            {error.correction}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 10, color: "var(--text-muted)" }}>
            {expanded ? <DownOutlined /> : <RightOutlined />}
          </span>
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div
          style={{
            padding: "0 14px 12px 22px",
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          {/* Rule tag */}
          <span
            style={{
              fontSize: 11,
              color: "var(--text-secondary)",
              fontStyle: "italic",
            }}
          >
            Rule: {error.rule}
          </span>

          {/* Vietnamese explanation */}
          <div
            style={{
              padding: "8px 12px",
              borderRadius: 8,
              background: "var(--surface)",
              fontSize: 13,
              lineHeight: 1.6,
            }}
          >
            <span style={{ fontWeight: 600, color: "var(--text-secondary)", fontSize: 11 }}>
              🇻🇳 Giải thích:
            </span>
            <p style={{ margin: "4px 0 0", color: "var(--text-primary)" }}>
              {error.explanationVi}
            </p>
          </div>

          {/* English explanation */}
          <div
            style={{
              padding: "8px 12px",
              borderRadius: 8,
              background: "var(--surface)",
              fontSize: 13,
              lineHeight: 1.6,
            }}
          >
            <span style={{ fontWeight: 600, color: "var(--text-secondary)", fontSize: 11 }}>
              🇬🇧 Explanation:
            </span>
            <p style={{ margin: "4px 0 0", color: "var(--text-primary)" }}>
              {error.explanationEn}
            </p>
          </div>

          {/* Apply button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onApply();
            }}
            style={{
              alignSelf: "flex-start",
              padding: "6px 14px",
              borderRadius: 8,
              border: "none",
              background: "var(--accent)",
              color: "var(--text-on-accent)",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <CheckCircleOutlined /> Áp dụng sửa lỗi
          </button>
        </div>
      )}
    </div>
  );
}

export function GrammarChecker() {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GrammarCheckResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
  const overLimit = wordCount > MAX_WORDS;

  const check = useCallback(async () => {
    if (!text.trim() || overLimit) return;
    setError(null);
    setLoading(true);
    setResult(null);

    try {
      const data = await api.post<GrammarCheckResponse>("/writing-tools/grammar-check", {
        text: text.trim(),
      });
      setResult(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Có lỗi xảy ra";
      setError(msg.includes("Rate limit") || msg.includes("429")
        ? "Bạn đã gửi quá nhiều yêu cầu. Vui lòng đợi 1 phút."
        : msg);
    } finally {
      setLoading(false);
    }
  }, [text, overLimit]);

  const applyFix = useCallback(
    (err: GrammarError) => {
      const before = text.slice(0, err.offset);
      const after = text.slice(err.offset + err.length);
      const newText = before + err.correction + after;
      setText(newText);

      // Recalculate remaining errors with adjusted offsets
      if (result) {
        const lengthDiff = err.correction.length - err.original.length;
        const updatedErrors = result.errors
          .filter((e) => e !== err)
          .map((e) => ({
            ...e,
            offset: e.offset > err.offset ? e.offset + lengthDiff : e.offset,
          }));
        setResult({
          ...result,
          errors: updatedErrors,
          stats: {
            grammar: updatedErrors.filter((e) => e.type === "grammar").length,
            spelling: updatedErrors.filter((e) => e.type === "spelling").length,
            style: updatedErrors.filter((e) => e.type === "style").length,
          },
        });
      }
    },
    [text, result],
  );

  const applyAll = useCallback(() => {
    if (!result) return;
    setText(result.correctedText);
    setResult({ ...result, errors: [], stats: { grammar: 0, spelling: 0, style: 0 } });
  }, [result]);

  const totalErrors = result ? result.errors.length : 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Input area */}
      <div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 8,
          }}
        >
          <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text-secondary)" }}>
            Nhập hoặc dán văn bản cần kiểm tra
          </span>
          <span
            style={{
              fontSize: 12,
              color: overLimit ? "var(--error)" : "var(--text-muted)",
              fontWeight: overLimit ? 600 : 400,
            }}
          >
            {wordCount}/{MAX_WORDS} từ
          </span>
        </div>

        <textarea
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            setResult(null);
            setError(null);
          }}
          placeholder="Type or paste your English text here..."
          style={{
            width: "100%",
            minHeight: 180,
            padding: 16,
            borderRadius: 12,
            border: overLimit ? "1px solid var(--error)" : "1px solid var(--border)",
            background: "var(--card-bg)",
            color: "var(--text-primary)",
            fontSize: 15,
            lineHeight: 1.7,
            resize: "vertical",
            fontFamily: "inherit",
            transition: "border-color 0.2s",
          }}
        />
      </div>

      {/* Action bar */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <button
          onClick={check}
          disabled={!text.trim() || overLimit || loading}
          style={{
            padding: "10px 24px",
            borderRadius: 10,
            border: "none",
            background:
              !text.trim() || overLimit || loading ? "var(--border)" : "var(--accent)",
            color: "var(--text-on-accent)",
            fontSize: 14,
            fontWeight: 600,
            cursor: !text.trim() || overLimit || loading ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            gap: 6,
            transition: "background 0.2s",
          }}
        >
          {loading ? (
            <>
              <LoadingOutlined /> Đang kiểm tra...
            </>
          ) : (
            <>
              <CheckCircleOutlined /> Kiểm tra ngữ pháp
            </>
          )}
        </button>

        {result && totalErrors > 0 && (
          <button
            onClick={applyAll}
            style={{
              padding: "10px 20px",
              borderRadius: 10,
              border: "1px solid var(--success)",
              background: "transparent",
              color: "var(--success)",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <CheckCircleOutlined /> Sửa tất cả ({totalErrors})
          </button>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div
          style={{
            padding: "10px 16px",
            borderRadius: 10,
            background: "var(--error-bg)",
            color: "var(--error)",
            fontSize: 13,
          }}
        >
          {error}
        </div>
      )}

      {/* Results */}
      {result && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {/* Stats bar */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              padding: "12px 16px",
              borderRadius: 12,
              background:
                totalErrors === 0
                  ? "color-mix(in srgb, var(--success) 8%, var(--card-bg))"
                  : "var(--card-bg)",
              border: totalErrors === 0 ? "1px solid var(--success)" : "1px solid var(--border)",
            }}
          >
            {totalErrors === 0 ? (
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <CheckCircleOutlined style={{ color: "var(--success)", fontSize: 18 }} />
                <span style={{ fontSize: 14, fontWeight: 600, color: "var(--success)" }}>
                  Tuyệt vời! Không phát hiện lỗi nào.
                </span>
              </div>
            ) : (
              <>
                <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>
                  Phát hiện {totalErrors} lỗi:
                </span>
                {result.stats.grammar > 0 && (
                  <span style={{ fontSize: 12, color: "var(--error)", fontWeight: 500 }}>
                    {result.stats.grammar} ngữ pháp
                  </span>
                )}
                {result.stats.spelling > 0 && (
                  <span style={{ fontSize: 12, color: "var(--warning, #e8a838)", fontWeight: 500 }}>
                    {result.stats.spelling} chính tả
                  </span>
                )}
                {result.stats.style > 0 && (
                  <span style={{ fontSize: 12, color: "var(--info, #5b8def)", fontWeight: 500 }}>
                    {result.stats.style} phong cách
                  </span>
                )}
              </>
            )}
          </div>

          {/* Error cards */}
          {result.errors.map((err, i) => (
            <ErrorCard key={`${err.offset}-${i}`} error={err} onApply={() => applyFix(err)} />
          ))}

          {/* Corrected text */}
          {totalErrors > 0 && (
            <div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 6,
                }}
              >
                <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)" }}>
                  Văn bản đã sửa
                </span>
                <CopyButton text={result.correctedText} />
              </div>
              <div
                style={{
                  padding: 16,
                  borderRadius: 12,
                  background: "color-mix(in srgb, var(--success) 5%, var(--card-bg))",
                  border: "1px solid color-mix(in srgb, var(--success) 20%, var(--border))",
                  fontSize: 14,
                  lineHeight: 1.7,
                  color: "var(--text-primary)",
                  whiteSpace: "pre-wrap",
                }}
              >
                {result.correctedText}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
