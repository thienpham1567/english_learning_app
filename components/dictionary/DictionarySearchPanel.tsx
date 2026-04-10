"use client";

import { useEffect, useRef, useState } from "react";
import { ReadOutlined, StarOutlined, CloseOutlined } from "@ant-design/icons";

import http from "@/lib/http";

type DictionarySearchPanelProps = {
  initialValue: string;
  onSubmit: (word: string) => void;
  isLoading: boolean;
};

const HELPER_TIPS = [
  "Bạn có thể nhập từ đơn, phrasal verb hoặc idiom.",
  "Nhấn Enter để tra cứu nhanh mà không cần bấm nút.",
  "Mỗi nghĩa sẽ có giải thích song ngữ và ví dụ chỉ bằng tiếng Việt.",
];

function HighlightMatch({ text, query }: { text: string; query: string }) {
  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();
  const idx = query ? lowerText.indexOf(lowerQuery) : -1;
  if (idx === -1) {
    return <span>{text}</span>;
  }
  return (
    <span>
      {text.slice(0, idx)}
      <strong>{text.slice(idx, idx + query.length)}</strong>
      {text.slice(idx + query.length)}
    </span>
  );
}

export function DictionarySearchPanel({
  initialValue,
  onSubmit,
  isLoading,
}: DictionarySearchPanelProps) {
  const [draft, setDraft] = useState(initialValue);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [showTips, setShowTips] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setDraft(initialValue);
  }, [initialValue]);

  useEffect(() => {
    if (draft.length < 2) {
      setSuggestions([]);
      setHighlightedIndex(-1);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const { data } = await http.get<{ suggestions: string[] }>("/dictionary/suggestions", {
          params: { q: draft },
        });
        setSuggestions(data.suggestions ?? []);
        setHighlightedIndex(-1);
      } catch {
        setSuggestions([]);
      }
    }, 150);
    return () => clearTimeout(timer);
  }, [draft]);

  useEffect(() => {
    function handleMouseDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setSuggestions([]);
        setHighlightedIndex(-1);
      }
    }
    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, []);

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((i) => Math.max(i - 1, -1));
    } else if (e.key === "Enter") {
      if (highlightedIndex >= 0 && suggestions[highlightedIndex]) {
        const word = suggestions[highlightedIndex];
        setDraft(word);
        setSuggestions([]);
        setHighlightedIndex(-1);
        onSubmit(word);
      } else if (!isLoading) {
        onSubmit(draft);
      }
    } else if (e.key === "Escape") {
      setSuggestions([]);
      setHighlightedIndex(-1);
    }
  }

  function selectSuggestion(s: string) {
    setDraft(s);
    setSuggestions([]);
    setHighlightedIndex(-1);
    onSubmit(s);
  }

  return (
    <section style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div
        className="anim-fade-left"
        style={{
          position: "relative",
          borderRadius: "var(--radius-lg)",
          background: "linear-gradient(135deg, var(--surface), var(--bg))",
          boxShadow: "var(--shadow-lg)",
          padding: 24,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontSize: 12,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.18em",
              color: "var(--accent)",
            }}
          >
            <StarOutlined style={{ fontSize: 14 }} />
            <span>Tra cứu có cấu trúc</span>
          </div>
          <button
            type="button"
            onClick={() => setShowTips((v) => !v)}
            style={{
              display: "grid",
              width: 32,
              height: 32,
              placeItems: "center",
              borderRadius: "50%",
              border: "none",
              cursor: "pointer",
              transition: "background 0.2s, color 0.2s",
              background: showTips ? "var(--accent)" : "transparent",
              color: showTips ? "#fff" : "var(--text-muted)",
            }}
            aria-label="Mẹo sử dụng"
          >
            {showTips ? (
              <CloseOutlined style={{ fontSize: 14 }} />
            ) : (
              <ReadOutlined style={{ fontSize: 15 }} />
            )}
          </button>
        </div>

        {/* Tips dropdown */}
        {showTips && (
          <div
            className="anim-fade-in"
            style={{
              marginTop: 16,
              overflow: "hidden",
              borderRadius: "var(--radius)",
              border: "1px solid var(--border)",
              background: "var(--bg)",
              padding: 16,
              boxShadow: "var(--shadow-sm)",
            }}
          >
            <p
              style={{
                marginBottom: 12,
                fontSize: 12,
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                color: "var(--ink)",
                margin: "0 0 12px",
              }}
            >
              💡 Mẹo sử dụng
            </p>
            <ul
              style={{
                listStyle: "none",
                padding: 0,
                margin: 0,
                display: "flex",
                flexDirection: "column",
                gap: 10,
              }}
            >
              {HELPER_TIPS.map((tip, i) => (
                <li
                  key={tip}
                  className={`anim-fade-left anim-delay-${i + 1}`}
                  style={{
                    borderLeft: "2px solid rgba(154,177,122,0.3)",
                    paddingLeft: 12,
                    fontSize: 14,
                    lineHeight: 1.6,
                    color: "var(--text-secondary)",
                  }}
                >
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        )}

        <h2
          style={{
            marginTop: 16,
            fontSize: 24,
            fontStyle: "italic",
            fontFamily: "var(--font-display)",
            color: "var(--ink)",
          }}
        >
          Nhập mục từ cần tra cứu
        </h2>
        <p style={{ marginTop: 12, fontSize: 14, lineHeight: 1.6, color: "var(--text-secondary)" }}>
          Công cụ này hỗ trợ từ đơn, phrasal verb và idiom để bạn học theo ngữ cảnh rõ ràng hơn.
        </p>

        <div ref={containerRef} style={{ position: "relative", marginTop: 20 }}>
          <input
            type="text"
            style={{
              width: "100%",
              borderBottom: "1px solid var(--border)",
              background: "transparent",
              padding: "12px 4px",
              fontSize: 15,
              color: "var(--text-primary)",
              outline: "none",
              transition: "border-color 0.2s",
              border: "none",
              borderBottomWidth: 1,
              borderBottomStyle: "solid",
              borderBottomColor: "var(--border)",
            }}
            placeholder="Ví dụ: take off"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            aria-label="Nhập từ cần tra cứu"
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            maxLength={80}
            autoComplete="off"
            onFocus={(e) => {
              e.currentTarget.style.borderBottomColor = "var(--accent)";
              e.currentTarget.style.borderBottomWidth = "2px";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderBottomColor = "var(--border)";
              e.currentTarget.style.borderBottomWidth = "1px";
            }}
          />

          {suggestions.length > 0 && (
            <ul
              role="listbox"
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                top: "100%",
                zIndex: 10,
                marginTop: 4,
                overflow: "hidden",
                borderRadius: "var(--radius)",
                border: "1px solid var(--border)",
                background: "var(--surface)",
                boxShadow: "var(--shadow-lg)",
                listStyle: "none",
                padding: 0,
                margin: 0,
              }}
            >
              {suggestions.map((s, i) => (
                <li
                  key={s}
                  role="option"
                  aria-selected={i === highlightedIndex}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    selectSuggestion(s);
                  }}
                  style={{
                    cursor: "pointer",
                    padding: "10px 16px",
                    fontSize: 14,
                    color: "var(--text-primary)",
                    transition: "background 0.15s",
                    background: i === highlightedIndex ? "var(--surface-hover)" : "transparent",
                  }}
                >
                  <HighlightMatch text={s} query={draft} />
                </li>
              ))}
            </ul>
          )}
        </div>

        <button
          type="button"
          onClick={() => onSubmit(draft)}
          disabled={isLoading}
          style={{
            marginTop: 20,
            width: "100%",
            borderRadius: 999,
            background: "var(--accent)",
            padding: "10px 0",
            fontSize: 14,
            fontWeight: 600,
            color: "#fff",
            border: "none",
            cursor: isLoading ? "not-allowed" : "pointer",
            opacity: isLoading ? 0.5 : 1,
            transition: "opacity 0.2s",
          }}
        >
          {isLoading ? "Đang tra cứu..." : "Tra cứu"}
        </button>

        <p style={{ marginTop: 16, fontSize: 14, color: "var(--text-muted)" }}>
          Hỗ trợ tối đa 80 ký tự, bao gồm khoảng trắng và dấu nháy hợp lệ.
        </p>
      </div>
    </section>
  );
}
