"use client";

import { useEffect, useRef, useState } from "react";
import { BookOpenText, Sparkles } from "lucide-react";
import { motion } from "motion/react";

type DictionarySearchPanelProps = {
  value: string;
  onChange: (value: string) => void;
  onSearch: () => void;
  isLoading: boolean;
};

const HELPER_TIPS = [
  "Bạn có thể nhập từ đơn, collocation, phrasal verb hoặc idiom.",
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
  value,
  onChange,
  onSearch,
  isLoading,
}: DictionarySearchPanelProps) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  // Debounced fetch
  useEffect(() => {
    if (value.length < 2) {
      setSuggestions([]);
      setHighlightedIndex(-1);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/dictionary/suggestions?q=${encodeURIComponent(value)}`,
        );
        const data = (await res.json()) as { suggestions: string[] };
        setSuggestions(data.suggestions ?? []);
        setHighlightedIndex(-1);
      } catch {
        setSuggestions([]);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [value]);

  // Outside click dismiss
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
        onChange(suggestions[highlightedIndex]);
        setSuggestions([]);
        setHighlightedIndex(-1);
        onSearch();
      } else if (!isLoading) {
        onSearch();
      }
    } else if (e.key === "Escape") {
      setSuggestions([]);
      setHighlightedIndex(-1);
    }
  }

  function selectSuggestion(s: string) {
    onChange(s);
    setSuggestions([]);
    setHighlightedIndex(-1);
    onSearch();
  }

  return (
    <section className="space-y-5">
      <div className="rounded-2xl bg-[var(--surface)] shadow-[var(--shadow-lg)] p-6 min-[1121px]:sticky min-[1121px]:top-6">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
          <Sparkles size={14} />
          <span>Tra cứu có cấu trúc</span>
        </div>

        <h2 className="mt-4 text-3xl italic [font-family:var(--font-display)] text-(--ink)">
          Nhập mục từ cần tra cứu
        </h2>
        <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">
          Công cụ này hỗ trợ từ đơn, collocation, phrasal verb và idiom để bạn học theo ngữ cảnh rõ ràng hơn.
        </p>

        <div ref={containerRef} className="relative mt-5">
          <input
            type="text"
            className="w-full border-b border-(--border) bg-transparent px-1 py-3 text-[15px] text-(--text-primary) outline-none transition-colors placeholder:text-(--text-muted) focus:border-b-2 focus:border-(--accent) disabled:cursor-not-allowed"
            placeholder="Ví dụ: take off"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            aria-label="Nhập từ cần tra cứu"
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            maxLength={80}
            autoComplete="off"
          />

          {suggestions.length > 0 && (
            <ul
              role="listbox"
              className="absolute left-0 right-0 top-full z-10 mt-1 overflow-hidden rounded-xl border border-(--border) bg-[var(--surface)] shadow-[var(--shadow-lg)]"
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
                  className={[
                    "cursor-pointer px-4 py-2.5 text-sm text-[var(--text-primary)] transition",
                    i === highlightedIndex
                      ? "bg-[var(--surface-hover)]"
                      : "hover:bg-[var(--surface-hover)]",
                  ].join(" ")}
                >
                  <HighlightMatch text={s} query={value} />
                </li>
              ))}
            </ul>
          )}
        </div>

        <motion.button
          type="button"
          onClick={onSearch}
          disabled={isLoading}
          whileTap={{ scale: 0.97 }}
          className="mt-5 w-full rounded-full bg-(--accent) py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--accent)"
        >
          {isLoading ? "Đang tra cứu..." : "Tra cứu"}
        </motion.button>

        <p className="mt-4 text-sm text-[var(--text-muted)]">
          Hỗ trợ tối đa 80 ký tự, bao gồm khoảng trắng và dấu nháy hợp lệ.
        </p>
      </div>

      <div className="rounded-2xl bg-[var(--surface)] shadow-[var(--shadow-lg)] p-6">
        <div className="flex items-center gap-2 text-sm font-semibold text-[var(--ink)]">
          <BookOpenText size={16} />
          <span>Mẹo sử dụng</span>
        </div>
        <ul className="mt-4 space-y-3">
          {HELPER_TIPS.map((tip, i) => (
            <motion.li
              key={tip}
              className="border-l-2 border-[rgba(196,109,46,0.3)] pl-4 text-sm leading-6 text-[var(--text-secondary)]"
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + i * 0.08, duration: 0.3 }}
            >
              {tip}
            </motion.li>
          ))}
        </ul>
      </div>
    </section>
  );
}
