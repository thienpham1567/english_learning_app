"use client";

import { useState, useCallback, useMemo } from "react";
import { diffWords } from "diff";

import { api } from "@/lib/api-client";
import type { ParaphraseResponse, ParaphraseMode } from "@/lib/writing-tools/schema";
import {
  ArrowLeftRight,
  Check,
  ChevronDown,
  ChevronRight,
  Copy,
  Loader2,
  Zap,
} from "lucide-react";

const MAX_WORDS = 500;

/* ── Mode definitions ─────────────────────────────────── */

type ModeInfo = {
  key: ParaphraseMode;
  label: string;
  description: string;
  emoji: string;
};

const MODES: ModeInfo[] = [
  { key: "standard", label: "Chuẩn", description: "Viết lại với từ vựng mới", emoji: "📝" },
  { key: "fluency", label: "Trôi chảy", description: "Cải thiện sự tự nhiên", emoji: "🌊" },
  { key: "formal", label: "Trang trọng", description: "Phong cách chuyên nghiệp", emoji: "👔" },
  { key: "simple", label: "Đơn giản", description: "Từ vựng dễ hiểu", emoji: "🎯" },
  { key: "creative", label: "Sáng tạo", description: "Diễn đạt sinh động", emoji: "✨" },
  { key: "expand", label: "Mở rộng", description: "Thêm chi tiết", emoji: "📖" },
  { key: "shorten", label: "Rút gọn", description: "Ngắn gọn, súc tích", emoji: "✂️" },
];

/* ── Mode-specific example prompts ────────────────────── */

const MODE_EXAMPLES: Record<string, { text: string; hint: string }[]> = {
  standard: [
    { text: "The students were very happy because they passed the difficult exam.", hint: "Câu đơn giản → paraphrase" },
    { text: "Technology has changed the way people communicate with each other.", hint: "Chủ đề phổ biến" },
  ],
  fluency: [
    { text: "The reason why I like this city is because it has many interesting places to visit.", hint: "Câu dài dòng → tự nhiên hơn" },
  ],
  formal: [
    { text: "Hey, I just wanted to let you know that the meeting is gonna be moved to next week.", hint: "Casual → professional" },
  ],
  simple: [
    { text: "The proliferation of digital technologies has fundamentally transformed contemporary pedagogical methodologies.", hint: "Phức tạp → dễ hiểu" },
  ],
  creative: [
    { text: "The sunset was beautiful. The sky had many colors.", hint: "Nhạt → sinh động" },
  ],
  expand: [
    { text: "Climate change is a serious problem.", hint: "Ngắn → chi tiết hơn" },
  ],
  shorten: [
    { text: "In my personal opinion, I believe that it is absolutely essential and critically important for students to develop strong reading habits.", hint: "Dài dòng → súc tích" },
  ],
};

/* ── Word diff renderer ───────────────────────────────── */

function WordDiff({ original, rewritten }: { original: string; rewritten: string }) {
  const parts = useMemo(() => diffWords(original, rewritten), [original, rewritten]);

  return (
    <span style={{ fontSize: 15, lineHeight: 1.8 }}>
      {parts.map((part, i) => {
        if (part.added) {
          return (
            <span
              key={i}
              style={{
                color: "var(--success)",
                backgroundColor: "color-mix(in srgb, var(--success) 10%, transparent)",
                borderRadius: 4,
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
                opacity: 0.5,
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

/* ── Copy button ──────────────────────────────────────── */

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
        display: "flex",
        alignItems: "center",
        gap: 4,
      }}
      title="Sao chép"
    >
      {copied ? <><Check /> Đã chép</> : <><Copy /> Sao chép</>}
    </button>
  );
}

/* ── Changes detail panel ─────────────────────────────── */

function ChangesPanel({
  changes,
}: {
  changes: ParaphraseResponse["changes"];
}) {
  const [expanded, setExpanded] = useState(false);
  if (changes.length === 0) return null;

  return (
    <div
      style={{
        borderRadius: 12,
        border: "1px solid var(--border)",
        background: "var(--card-bg)",
        overflow: "hidden",
      }}
    >
      <button
        onClick={() => setExpanded((p) => !p)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 14px",
          border: "none",
          background: "transparent",
          cursor: "pointer",
          color: "var(--text-secondary)",
          fontSize: 13,
          fontWeight: 500,
        }}
      >
        <span>
          📋 {changes.length} thay đổi từ vựng
        </span>
        <span style={{ fontSize: 10 }}>
          {expanded ? <ChevronDown /> : <ChevronRight />}
        </span>
      </button>

      {expanded && (
        <div
          style={{
            padding: "0 14px 12px",
            display: "flex",
            flexDirection: "column",
            gap: 6,
          }}
        >
          {changes.map((change, i) => (
            <div
              key={i}
              style={{
                fontSize: 13,
                padding: "8px 12px",
                borderRadius: 8,
                background: "var(--surface)",
                borderLeft: "3px solid var(--accent)",
                lineHeight: 1.6,
              }}
            >
              <div>
                <span
                  style={{ textDecoration: "line-through", color: "var(--text-muted)" }}
                >
                  {change.original}
                </span>
                {" → "}
                <span style={{ color: "var(--success)", fontWeight: 500 }}>
                  {change.replacement}
                </span>
              </div>
              <div style={{ color: "var(--text-secondary)", fontSize: 12, marginTop: 2 }}>
                {change.reason}
              </div>
              {change.definitionVi && (
                <div
                  style={{
                    color: "var(--accent)",
                    fontSize: 12,
                    marginTop: 2,
                    fontStyle: "italic",
                  }}
                >
                  🇻🇳 {change.definitionVi}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Main Paraphraser component ───────────────────────── */

export function Paraphraser() {
  const [text, setText] = useState("");
  const [mode, setMode] = useState<ParaphraseMode>("standard");
  const [synonymLevel, setSynonymLevel] = useState(50);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ParaphraseResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
  const overLimit = wordCount > MAX_WORDS;

  const paraphrase = useCallback(async () => {
    if (!text.trim() || overLimit) return;
    setError(null);
    setLoading(true);
    setResult(null);

    try {
      const data = await api.post<ParaphraseResponse>("/writing-tools/paraphrase", {
        text: text.trim(),
        mode,
        synonymLevel,
      });
      setResult(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Có lỗi xảy ra";
      setError(
        msg.includes("Rate limit") || msg.includes("429")
          ? "Bạn đã gửi quá nhiều yêu cầu. Vui lòng đợi 1 phút."
          : msg,
      );
    } finally {
      setLoading(false);
    }
  }, [text, mode, synonymLevel, overLimit]);

  // Keyboard handler — Ctrl/Cmd + Enter
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        paraphrase();
      }
    },
    [paraphrase],
  );

  const currentExamples = MODE_EXAMPLES[mode] ?? MODE_EXAMPLES.standard;

  const sliderLabel = synonymLevel <= 30 ? "Ít thay đổi" : synonymLevel <= 70 ? "Vừa phải" : "Nhiều thay đổi";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Mode pills */}
      <div>
        <span
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: "var(--text-secondary)",
            marginBottom: 8,
            display: "block",
          }}
        >
          Chế độ viết lại
        </span>
        <div
          style={{
            display: "flex",
            gap: 6,
            overflowX: "auto",
            paddingBottom: 4,
            WebkitOverflowScrolling: "touch",
          }}
        >
          {MODES.map((m) => {
            const active = mode === m.key;
            return (
              <button
                key={m.key}
                onClick={() => {
                  setMode(m.key);
                  setResult(null);
                }}
                title={m.description}
                style={{
                  padding: "7px 14px",
                  borderRadius: 20,
                  border: active ? "2px solid var(--accent)" : "1px solid var(--border)",
                  background: active
                    ? "color-mix(in srgb, var(--accent) 12%, var(--card-bg))"
                    : "var(--card-bg)",
                  color: active ? "var(--accent)" : "var(--text-secondary)",
                  fontSize: 13,
                  fontWeight: active ? 600 : 400,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  transition: "all 0.2s",
                  flexShrink: 0,
                }}
              >
                <span>{m.emoji}</span>
                {m.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Synonym slider */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "10px 16px",
          borderRadius: 12,
          background: "var(--card-bg)",
          border: "1px solid var(--border)",
        }}
      >
        <span style={{ fontSize: 12, color: "var(--text-secondary)", whiteSpace: "nowrap" }}>
          Mức thay đổi từ vựng:
        </span>
        <span style={{ fontSize: 11, color: "var(--text-muted)", minWidth: 30 }}>Ít</span>
        <input
          type="range"
          min={0}
          max={100}
          value={synonymLevel}
          onChange={(e) => {
            setSynonymLevel(Number(e.target.value));
            setResult(null);
          }}
          style={{
            flex: 1,
            accentColor: "var(--accent)",
            cursor: "pointer",
          }}
        />
        <span style={{ fontSize: 11, color: "var(--text-muted)", minWidth: 40 }}>Nhiều</span>
        <span
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: "var(--accent)",
            padding: "2px 10px",
            borderRadius: 10,
            background: "color-mix(in srgb, var(--accent) 10%, transparent)",
            whiteSpace: "nowrap",
          }}
        >
          {sliderLabel}
        </span>
      </div>

      {/* Split panels */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 16,
        }}
        className="paraphraser-panels"
      >
        {/* Left: Input */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)" }}>
              Văn bản gốc
            </span>
            <span
              style={{
                fontSize: 11,
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
            onKeyDown={handleKeyDown}
            placeholder="Type or paste your English text here..."
            className={`app-textarea ${overLimit ? "border-error" : ""}`}
            style={{
              width: "100%",
              minHeight: 220,
              padding: 16,
              fontSize: 15,
              lineHeight: 1.7,
              resize: "vertical",
              fontFamily: "inherit",
            }}
          />

          {/* Example prompts — show when empty */}
          {!text.trim() && !result && (
            <div style={{ marginTop: 8 }}>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.12em",
                  color: "var(--text-muted)",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  marginBottom: 6,
                }}
              >
                <Zap size={10} />
                Thử ngay
              </span>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {currentExamples.map((ex, i) => (
                  <button
                    key={i}
                    onClick={() => setText(ex.text)}
                    style={{
                      textAlign: "left",
                      padding: "8px 12px",
                      borderRadius: 8,
                      border: "1px solid var(--border)",
                      borderLeft: "3px solid var(--accent)",
                      background: "var(--card-bg)",
                      cursor: "pointer",
                      transition: "all 0.15s",
                      flex: "1 1 200px",
                      maxWidth: 360,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = "var(--accent)";
                      e.currentTarget.style.transform = "translateY(-1px)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "var(--border)";
                      e.currentTarget.style.borderLeftColor = "var(--accent)";
                      e.currentTarget.style.transform = "none";
                    }}
                  >
                    <span style={{ fontSize: 11, fontWeight: 600, color: "var(--accent)" }}>
                      {ex.hint}
                    </span>
                    <span
                      style={{
                        display: "block",
                        marginTop: 3,
                        fontSize: 12,
                        color: "var(--text-secondary)",
                        lineHeight: 1.45,
                        fontStyle: "italic",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {ex.text}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Output */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)" }}>
              Kết quả viết lại
            </span>
            {result && <CopyButton text={result.result} />}
          </div>
          <div
            style={{
              minHeight: 220,
              padding: 16,
              borderRadius: 12,
              border: "1px solid var(--border)",
              background: result
                ? "color-mix(in srgb, var(--success) 3%, var(--card-bg))"
                : "var(--surface)",
              fontSize: 15,
              lineHeight: 1.7,
              color: result ? "var(--text-primary)" : "var(--text-muted)",
              whiteSpace: "pre-wrap",
              overflow: "auto",
            }}
          >
            {loading ? (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  height: "100%",
                  minHeight: 180,
                  gap: 8,
                  color: "var(--text-muted)",
                }}
              >
                <Loader2 className="animate-spin" size={18} />
                <span>Đang viết lại...</span>
              </div>
            ) : result ? (
              <WordDiff original={text.trim()} rewritten={result.result} />
            ) : (
              <span style={{ fontStyle: "italic" }}>
                Kết quả viết lại sẽ hiển thị ở đây...
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Mobile responsive style */}
      <style>{`
        @media (max-width: 768px) {
          .paraphraser-panels {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      {/* Action bar */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <button
          onClick={paraphrase}
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
              <Loader2 className="animate-spin" /> Đang xử lý...
            </>
          ) : (
            <>
              <ArrowLeftRight /> Viết lại
            </>
          )}
        </button>

        {result && (
          <span className="text-[var(--text-muted)]" style={{ fontSize: 12 }}>
            {MODES.find((m) => m.key === mode)?.emoji}{" "}
            {MODES.find((m) => m.key === mode)?.label} · Mức thay đổi: {synonymLevel}%
          </span>
        )}

        {/* Keyboard shortcut hint */}
        {text.trim() && !result && (
          <span style={{ fontSize: 11, color: "var(--text-muted)", fontStyle: "italic" }}>
            ⌘/Ctrl + Enter
          </span>
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

      {/* Changes detail */}
      {result && <ChangesPanel changes={result.changes} />}
    </div>
  );
}
