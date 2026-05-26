"use client";

import { diffWords } from "diff";
import { ArrowLeftRight, Check, ChevronDown, ChevronRight, Copy, Loader2, Zap } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { api } from "@/lib/api-client";
import type { ParaphraseMode, ParaphraseResponse } from "@/lib/writing-tools/schema";

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
    {
      text: "The students were very happy because they passed the difficult exam.",
      hint: "Câu đơn giản → paraphrase",
    },
    {
      text: "Technology has changed the way people communicate with each other.",
      hint: "Chủ đề phổ biến",
    },
  ],
  fluency: [
    {
      text: "The reason why I like this city is because it has many interesting places to visit.",
      hint: "Câu dài dòng → tự nhiên hơn",
    },
  ],
  formal: [
    {
      text: "Hey, I just wanted to let you know that the meeting is gonna be moved to next week.",
      hint: "Casual → professional",
    },
  ],
  simple: [
    {
      text: "The proliferation of digital technologies has fundamentally transformed contemporary pedagogical methodologies.",
      hint: "Phức tạp → dễ hiểu",
    },
  ],
  creative: [
    { text: "The sunset was beautiful. The sky had many colors.", hint: "Nhạt → sinh động" },
  ],
  expand: [{ text: "Climate change is a serious problem.", hint: "Ngắn → chi tiết hơn" }],
  shorten: [
    {
      text: "In my personal opinion, I believe that it is absolutely essential and critically important for students to develop strong reading habits.",
      hint: "Dài dòng → súc tích",
    },
  ],
};

/* ── Word diff renderer ───────────────────────────────── */

function WordDiff({ original, rewritten }: { original: string; rewritten: string }) {
  const parts = useMemo(() => diffWords(original, rewritten), [original, rewritten]);

  return (
    <span className="text-[15px]" style={{ lineHeight: 1.8 }}>
      {parts.map((part, i) => {
        if (part.added) {
          return (
            <span
              key={i}
              className="text-emerald-500 rounded font-medium"
              style={{
                backgroundColor: "color-mix(in srgb, var(--success) 10%, transparent)",
                padding: "1px 3px",
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
              className="text-destructive"
              style={{ textDecoration: "line-through", opacity: 0.5, padding: "1px 1px" }}
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
      title="Sao chép"
      className="border-none bg-transparent cursor-pointer text-[13px] py-1 px-2 rounded-md flex items-center gap-1"
      style={{ color: copied ? "var(--success)" : "var(--text-secondary)" }}
    >
      {copied ? (
        <>
          <Check /> Đã chép
        </>
      ) : (
        <>
          <Copy /> Sao chép
        </>
      )}
    </button>
  );
}

/* ── Changes detail panel ─────────────────────────────── */

function ChangesPanel({ changes }: { changes: ParaphraseResponse["changes"] }) {
  const [expanded, setExpanded] = useState(false);
  if (changes.length === 0) return null;

  return (
    <div
      className="rounded-xl border-2 border-border overflow-hidden"
      style={{ background: "var(--card-bg)" }}
    >
      <button
        onClick={() => setExpanded((p) => !p)}
        className="w-full flex items-center justify-between border-none bg-transparent cursor-pointer text-text-secondary text-[13px] font-medium"
        style={{ padding: "10px 14px" }}
      >
        <span>📋 {changes.length} thay đổi từ vựng</span>
        <span className="text-[10px]">{expanded ? <ChevronDown /> : <ChevronRight />}</span>
      </button>

      {expanded && (
        <div className="flex flex-col gap-1.5" style={{ padding: "0 14px 12px" }}>
          {changes.map((change, i) => (
            <div
              key={i}
              className="text-[13px] py-2 px-3 rounded-lg bg-(--surface) leading-relaxed"
              style={{ borderLeft: "3px solid var(--accent)" }}
            >
              <div>
                <span className="text-text-muted" style={{ textDecoration: "line-through" }}>
                  {change.original}
                </span>
                {" → "}
                <span className="text-emerald-500 font-medium">{change.replacement}</span>
              </div>
              <div className="text-text-secondary text-xs" style={{ marginTop: 2 }}>
                {change.reason}
              </div>
              {change.definitionVi && (
                <div className="text-accent text-xs italic" style={{ marginTop: 2 }}>
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

  const sliderLabel =
    synonymLevel <= 30 ? "Ít thay đổi" : synonymLevel <= 70 ? "Vừa phải" : "Nhiều thay đổi";

  return (
    <div className="flex flex-col gap-4">
      {/* Mode pills */}
      <div>
        <span className="text-xs font-semibold text-text-secondary mb-2 block">
          Chế độ viết lại
        </span>
        <div
          className="flex gap-1.5 pb-1"
          style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}
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
                className="text-[13px] cursor-pointer flex items-center gap-1 shrink-0"
                style={{
                  padding: "7px 14px",
                  borderRadius: 20,
                  border: active ? "2px solid var(--accent)" : "1px solid var(--border)",
                  background: active
                    ? "color-mix(in srgb, var(--accent) 12%, var(--card-bg))"
                    : "var(--card-bg)",
                  color: active ? "var(--accent)" : "var(--text-secondary)",
                  fontWeight: active ? 600 : 400,
                  whiteSpace: "nowrap",
                  transition: "all 0.2s",
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
        className="flex items-center gap-3 py-2.5 px-4 rounded-xl border-2 border-border"
        style={{ background: "var(--card-bg)" }}
      >
        <span className="text-xs text-text-secondary" style={{ whiteSpace: "nowrap" }}>
          Mức thay đổi từ vựng:
        </span>
        <span className="text-[11px] text-text-muted w-[30px]">Ít</span>
        <input
          type="range"
          min={0}
          max={100}
          value={synonymLevel}
          onChange={(e) => {
            setSynonymLevel(Number(e.target.value));
            setResult(null);
          }}
          className="flex-1 cursor-pointer"
          style={{ accentColor: "var(--accent)" }}
        />
        <span className="text-[11px] text-text-muted w-[40px]">Nhiều</span>
        <span
          className="text-xs font-semibold text-accent"
          style={{
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
      <div className="paraphraser-panels grid gap-4" style={{ gridTemplateColumns: "1fr 1fr" }}>
        {/* Left: Input */}
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold text-text-secondary">Văn bản gốc</span>
            <span
              className="text-[11px]"
              style={{
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
            className={`app-textarea ${overLimit ? "border-error" : ""} w-full h-[220px] p-4 text-[15px]`}
            style={{ lineHeight: 1.7, resize: "vertical", fontFamily: "inherit" }}
          />

          {/* Example prompts — show when empty */}
          {!text.trim() && !result && (
            <div className="mt-2">
              <span
                className="text-[11px] font-bold uppercase text-text-muted flex items-center gap-1.5 mb-1.5"
                style={{ letterSpacing: "0.12em" }}
              >
                <Zap size={10} />
                Thử ngay
              </span>
              <div className="flex gap-1.5 flex-wrap">
                {currentExamples.map((ex, i) => (
                  <button
                    key={i}
                    onClick={() => setText(ex.text)}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = "var(--accent)";
                      e.currentTarget.style.transform = "translateY(-1px)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "var(--border)";
                      e.currentTarget.style.borderLeftColor = "var(--accent)";
                      e.currentTarget.style.transform = "none";
                    }}
                    className="text-left py-2 px-3 rounded-lg border-2 border-border cursor-pointer w-[360px]"
                    style={{
                      borderLeft: "3px solid var(--accent)",
                      background: "var(--card-bg)",
                      transition: "all 0.15s",
                      flex: "1 1 200px",
                    }}
                  >
                    <span className="text-[11px] font-semibold text-accent">{ex.hint}</span>
                    <span
                      className="block text-xs text-text-secondary italic overflow-hidden"
                      style={{
                        marginTop: 3,
                        lineHeight: 1.45,
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
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold text-text-secondary">Kết quả viết lại</span>
            {result && <CopyButton text={result.result} />}
          </div>
          <div
            className="h-[220px] p-4 rounded-xl border-2 border-border text-[15px] overflow-auto"
            style={{
              background: result
                ? "color-mix(in srgb, var(--success) 3%, var(--card-bg))"
                : "var(--surface)",
              lineHeight: 1.7,
              color: result ? "var(--text-primary)" : "var(--text-muted)",
              whiteSpace: "pre-wrap",
            }}
          >
            {loading ? (
              <div className="flex items-center justify-center h-full h-[180px] gap-2 text-text-muted">
                <Loader2 className="animate-spin" size={18} />
                <span>Đang viết lại...</span>
              </div>
            ) : result ? (
              <WordDiff original={text.trim()} rewritten={result.result} />
            ) : (
              <span className="italic">Kết quả viết lại sẽ hiển thị ở đây...</span>
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
      <div className="flex items-center gap-2.5">
        <button
          onClick={paraphrase}
          disabled={!text.trim() || overLimit || loading}
          className="border-none text-sm font-semibold flex items-center gap-1.5"
          style={{
            padding: "10px 24px",
            borderRadius: 10,
            background: !text.trim() || overLimit || loading ? "var(--border)" : "var(--accent)",
            color: "var(--text-on-accent)",
            cursor: !text.trim() || overLimit || loading ? "not-allowed" : "pointer",
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
          <span className="text-text-muted text-xs">
            {MODES.find((m) => m.key === mode)?.emoji} {MODES.find((m) => m.key === mode)?.label} ·
            Mức thay đổi: {synonymLevel}%
          </span>
        )}

        {/* Keyboard shortcut hint */}
        {text.trim() && !result && (
          <span className="text-[11px] text-text-muted italic">⌘/Ctrl + Enter</span>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div
          className="py-2.5 px-4 text-destructive text-[13px]"
          style={{ borderRadius: 10, background: "var(--error-bg)" }}
        >
          {error}
        </div>
      )}

      {/* Changes detail */}
      {result && <ChangesPanel changes={result.changes} />}
    </div>
  );
}
