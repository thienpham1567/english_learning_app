"use client";

import { useState, useCallback, useMemo } from "react";
import { diffWords } from "diff";
import { Tag, Tooltip, Spin } from "antd";
import { CopyOutlined, CheckOutlined, EditOutlined, LoadingOutlined, HighlightOutlined } from "@ant-design/icons";

import { api } from "@/lib/api-client";

/* ── Types ──────────────────────────────────────────────── */

type RewriteChange = {
  original: string;
  replacement: string;
  reason: string;
};

type RewriteVariant = {
  level: "natural" | "formal" | "c1";
  rewrite: string;
  changes: RewriteChange[];
};

type RewriteResponse = {
  variants: RewriteVariant[];
};

/* ── Constants ──────────────────────────────────────────── */

const LEVEL_META: Record<string, { label: string; color: string; emoji: string }> = {
  natural: { label: "Natural", color: "var(--success)", emoji: "MessageOutlined" },
  formal:  { label: "Formal",  color: "var(--info)", emoji: "ContainerOutlined" },
  c1:      { label: "C1/Academic", color: "var(--accent)", emoji: "BookOutlined" },
};

const MAX_CHARS = 400;

/* ── Word diff renderer ─────────────────────────────────── */

function WordDiff({ original, rewritten }: { original: string; rewritten: string }) {
  const parts = useMemo(() => diffWords(original, rewritten), [original, rewritten]);

  return (
    <span style={{ fontSize: 14, lineHeight: 1.8 }}>
      {parts.map((part, i) => {
        if (part.added) {
          return (
            <span
              key={i}
              style={{
                color: "var(--success)",
                backgroundColor: "color-mix(in srgb, var(--success) 8%, var(--surface))",
                borderRadius: 3,
                padding: "1px 3px",
                fontWeight: 500,
              }}
            >
              {part.value}
            </span>
          );
        }
        if (part.removed) {
          return (
            <span
              key={i}
              style={{
                color: "var(--error)",
                textDecoration: "line-through",
                opacity: 0.6,
                padding: "1px 1px",
              }}
            >
              {part.value}
            </span>
          );
        }
        return <span key={i}>{part.value}</span>;
      })}
    </span>
  );
}

/* ── Copy button ────────────────────────────────────────── */

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const copy = useCallback(async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [text]);

  return (
    <button
      onClick={copy}
      title="Copy to clipboard"
      style={{
        border: "none",
        background: "transparent",
        cursor: "pointer",
        color: copied ? "var(--success)" : "var(--text-secondary)",
        fontSize: 14,
        padding: "2px 6px",
        borderRadius: 4,
        transition: "color 0.2s",
      }}
    >
      {copied ? <CheckOutlined /> : <CopyOutlined />}
    </button>
  );
}

/* ── Variant card ───────────────────────────────────────── */

function VariantCard({
  variant,
  original,
}: {
  variant: RewriteVariant;
  original: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const meta = LEVEL_META[variant.level] ?? { label: variant.level, color: "var(--text-muted)", emoji: "EditOutlined" };

  return (
    <div
      style={{
        borderRadius: 12,
        border: `1px solid ${meta.color}30`,
        background: "var(--card-bg)",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 14px",
          borderBottom: `1px solid ${meta.color}20`,
          background: `${meta.color}08`,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span>{meta.emoji}</span>
          <Tag color={meta.color} style={{ fontSize: 11, fontWeight: 600, margin: 0 }}>
            {meta.label}
          </Tag>
          <span style={{ fontSize: 11, color: "var(--text-secondary)" }}>
            {variant.changes.length} thay đổi
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <button
            onClick={() => setExpanded((p) => !p)}
            style={{
              border: "none",
              background: "transparent",
              cursor: "pointer",
              color: "var(--text-secondary)",
              fontSize: 11,
              padding: "2px 6px",
            }}
          >
            {expanded ? "Ẩn chi tiết" : "Xem thay đổi"}
          </button>
          <CopyButton text={variant.rewrite} />
        </div>
      </div>

      {/* Diff view */}
      <div style={{ padding: "12px 14px" }}>
        <WordDiff original={original} rewritten={variant.rewrite} />
      </div>

      {/* Changes breakdown */}
      {expanded && variant.changes.length > 0 && (
        <div
          style={{
            padding: "0 14px 12px",
            display: "flex",
            flexDirection: "column",
            gap: 6,
          }}
        >
          {variant.changes.map((change, i) => (
            <div
              key={i}
              style={{
                fontSize: 12,
                padding: "6px 10px",
                borderRadius: 8,
                background: "var(--surface)",
                borderLeft: `3px solid ${meta.color}`,
              }}
            >
              <span style={{ textDecoration: "line-through", color: "var(--text-muted)" }}>{change.original}</span>
              {" → "}
              <span style={{ color: meta.color, fontWeight: 500 }}>{change.replacement}</span>
              <span style={{ color: "var(--text-secondary)", marginLeft: 6 }}>— {change.reason}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── RewritePanel ───────────────────────────────────────── */

type Props = {
  /** Initial sentence to prefill (e.g. from inline issue quote) */
  initialSentence?: string;
  /** Compact mode — hide header, minimal padding */
  compact?: boolean;
};

export function RewritePanel({ initialSentence = "", compact = false }: Props) {
  const [sentence, setSentence] = useState(initialSentence);
  const [loading, setLoading] = useState(false);
  const [variants, setVariants] = useState<RewriteVariant[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const charCount = sentence.length;
  const overLimit = charCount > MAX_CHARS;

  const rewrite = useCallback(async () => {
    if (!sentence.trim() || overLimit) return;
    setError(null);
    setLoading(true);
    setVariants(null);

    try {
      const data = await api.post<RewriteResponse>("/writing/rewrite", {
        sentence: sentence.trim(),
      });
      setVariants(data.variants);
      if (data.variants.length === 0) {
        setError("Câu này đã tốt — không có cải tiến nào để đề xuất.");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Có lỗi xảy ra";
      if (msg.includes("Rate limit")) {
        setError("Bạn đã gửi quá nhiều yêu cầu. Vui lòng đợi 1 phút.");
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  }, [sentence, overLimit]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {/* Header */}
      {!compact && (
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <EditOutlined style={{ color: "var(--accent)" }} />
          <span style={{ fontWeight: 600, fontSize: 14 }}>Cải thiện câu văn</span>
          <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>
            — 3 phiên bản: tự nhiên, trang trọng, học thuật
          </span>
        </div>
      )}

      {/* Input */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
          <span style={{ fontSize: 12, color: "var(--text-secondary)", fontWeight: 500 }}>Câu gốc</span>
          <span
            style={{
              fontSize: 11,
              color: overLimit ? "var(--error)" : "var(--text-secondary)",
              fontWeight: overLimit ? 600 : 400,
            }}
          >
            {charCount}/{MAX_CHARS}
          </span>
        </div>
        <textarea
          value={sentence}
          onChange={(e) => { setSentence(e.target.value); setVariants(null); setError(null); }}
          placeholder="Nhập câu cần cải thiện..."
          style={{
            width: "100%",
            minHeight: 80,
            padding: 12,
            borderRadius: 10,
            border: overLimit ? "1px solid var(--error)" : "1px solid var(--border)",
            background: "var(--card-bg)",
            color: "var(--text)",
            fontSize: 14,
            lineHeight: 1.6,
            resize: "vertical",
            fontFamily: "inherit",
          }}
        />
      </div>

      {/* Submit */}
      <button
        onClick={rewrite}
        disabled={!sentence.trim() || overLimit || loading}
        style={{
          padding: "10px 24px",
          borderRadius: 8,
          border: "none",
          background: !sentence.trim() || overLimit || loading ? "var(--border)" : "var(--accent)",
          color: "var(--text-on-accent, #fff)",
          fontSize: 14,
          fontWeight: 600,
          cursor: !sentence.trim() || overLimit || loading ? "not-allowed" : "pointer",
          alignSelf: "flex-start",
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        {loading ? <><LoadingOutlined /> Đang viết lại...</> : <><HighlightOutlined /> Viết lại</>}
      </button>

      {/* Error */}
      {error && (
        <div style={{
          padding: "8px 14px",
          borderRadius: 8,
          background: "var(--error-bg)",
          color: "var(--error)",
          fontSize: 13,
        }}>
          {error}
        </div>
      )}

      {/* Results */}
      {variants && variants.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: 0, fontWeight: 500 }}>
            {variants.length} phiên bản được đề xuất
          </p>
          {variants.map((v) => (
            <VariantCard key={v.level} variant={v} original={sentence.trim()} />
          ))}
        </div>
      )}
    </div>
  );
}
