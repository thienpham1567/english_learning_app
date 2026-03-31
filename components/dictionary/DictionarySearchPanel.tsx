"use client";

import { useEffect, useRef, useState } from "react";
import { BookOpenText, Sparkles, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

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

  // Sync draft when initialValue changes (e.g. URL param update)
  useEffect(() => {
    setDraft(initialValue);
  }, [initialValue]);

  // Debounced fetch
  useEffect(() => {
    if (draft.length < 2) {
      setSuggestions([]);
      setHighlightedIndex(-1);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const { data } = await http.get<{ suggestions: string[] }>(
          "/dictionary/suggestions",
          {
            params: { q: draft },
          },
        );
        setSuggestions(data.suggestions ?? []);
        setHighlightedIndex(-1);
      } catch {
        setSuggestions([]);
      }
    }, 150);
    return () => clearTimeout(timer);
  }, [draft]);

  // Outside click dismiss
  useEffect(() => {
    function handleMouseDown(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
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
    <section className="space-y-5">
      <div className="relative rounded-2xl bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(253,243,235,0.9))] shadow-(--shadow-lg) p-6 min-[1121px]:sticky min-[1121px]:top-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-(--accent)">
            <Sparkles size={14} />
            <span>Tra cứu có cấu trúc</span>
          </div>
          <button
            type="button"
            onClick={() => setShowTips((v) => !v)}
            className={[
              "grid size-8 place-items-center rounded-full transition",
              showTips
                ? "bg-(--accent) text-white shadow-(--shadow-sm)"
                : "text-(--text-muted) hover:bg-(--surface-hover) hover:text-(--accent)",
            ].join(" ")}
            aria-label="Mẹo sử dụng"
          >
            {showTips ? (
              <X size={14} strokeWidth={2.5} />
            ) : (
              <BookOpenText size={15} strokeWidth={2} />
            )}
          </button>
        </div>

        {/* Tips dropdown */}
        <AnimatePresence>
          {showTips && (
            <motion.div
              className="mt-4 overflow-hidden rounded-xl border border-(--border) bg-(--bg) p-4 shadow-(--shadow-sm)"
              initial={{ opacity: 0, height: 0, marginTop: 0 }}
              animate={{ opacity: 1, height: "auto", marginTop: 16 }}
              exit={{ opacity: 0, height: 0, marginTop: 0 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
            >
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-(--ink)">
                💡 Mẹo sử dụng
              </p>
              <ul className="space-y-2.5">
                {HELPER_TIPS.map((tip, i) => (
                  <motion.li
                    key={tip}
                    className="border-l-2 border-[rgba(196,109,46,0.3)] pl-3 text-sm leading-6 text-(--text-secondary)"
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.06, duration: 0.2 }}
                  >
                    {tip}
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          )}
        </AnimatePresence>

        <h2 className="mt-4 text-2xl italic [font-family:var(--font-display)] text-(--ink)">
          Nhập mục từ cần tra cứu
        </h2>
        <p className="mt-3 text-sm leading-6 text-(--text-secondary)">
          Công cụ này hỗ trợ từ đơn, phrasal verb và idiom để bạn học theo ngữ
          cảnh rõ ràng hơn.
        </p>

        <div ref={containerRef} className="relative mt-5">
          <input
            type="text"
            className="w-full border-b border-(--border) bg-transparent px-1 py-3 text-[15px] text-(--text-primary) outline-none transition-colors placeholder:text-(--text-muted) focus:border-b-2 focus:border-(--accent) disabled:cursor-not-allowed"
            placeholder="Ví dụ: take off"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            aria-label="Nhập từ cần tra cứu"
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            maxLength={80}
            autoComplete="off"
          />

          {suggestions.length > 0 && (
            <ul
              role="listbox"
              className="absolute left-0 right-0 top-full z-10 mt-1 overflow-hidden rounded-xl border border-(--border) bg-(--surface) shadow-(--shadow-lg)"
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
                    "cursor-pointer px-4 py-2.5 text-sm text-(--text-primary) transition",
                    i === highlightedIndex
                      ? "bg-(--surface-hover)"
                      : "hover:bg-(--surface-hover)",
                  ].join(" ")}
                >
                  <HighlightMatch text={s} query={draft} />
                </li>
              ))}
            </ul>
          )}
        </div>

        <motion.button
          type="button"
          onClick={() => onSubmit(draft)}
          disabled={isLoading}
          whileTap={{ scale: 0.97 }}
          className="mt-5 w-full rounded-full bg-(--accent) py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--accent)"
        >
          {isLoading ? "Đang tra cứu..." : "Tra cứu"}
        </motion.button>

        <p className="mt-4 text-sm text-(--text-muted)">
          Hỗ trợ tối đa 80 ký tự, bao gồm khoảng trắng và dấu nháy hợp lệ.
        </p>
      </div>
    </section>
  );
}
