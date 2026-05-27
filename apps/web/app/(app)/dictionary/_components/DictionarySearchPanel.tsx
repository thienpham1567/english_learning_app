"use client";

import { BookOpen, Lightbulb, Star, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { ExamWordLists } from "@/app/(app)/dictionary/_components/ExamWordLists";
import { RecentLookups } from "@/app/(app)/dictionary/_components/RecentLookups";
import { WordOfTheDay } from "@/app/(app)/dictionary/_components/WordOfTheDay";

import { api } from "@/lib/api-client";

type DictionarySearchPanelProps = {
  initialValue: string;
  onSubmit: (word: string) => void;
  isLoading: boolean;
  recentWords?: string[];
  onSelectRecent?: (word: string) => void;
};

const EMPTY_WORDS: string[] = [];

const HELPER_TIPS = [
  "You can enter a single word, phrasal verb, or idiom.",
  "Press Enter to quick search without clicking the button.",
  "Each meaning includes English definitions, bilingual examples, and practical collocations.",
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
  recentWords = EMPTY_WORDS,
  onSelectRecent,
}: DictionarySearchPanelProps) {
  const [draft, setDraft] = useState(initialValue);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [showTips, setShowTips] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (draft.length < 2) {
      setSuggestions([]);
      setHighlightedIndex(-1);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const data = await api.get<{ suggestions: string[] }>("/dictionary/suggestions", {
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
      e.preventDefault();
      setSuggestions([]);
      setHighlightedIndex(-1);
      if (highlightedIndex >= 0 && suggestions[highlightedIndex]) {
        const word = suggestions[highlightedIndex];
        setDraft(word);
        onSubmit(word);
      } else if (!isLoading && draft.trim()) {
        onSubmit(draft.trim());
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
    <section className="flex flex-col gap-5">
      {/* Word of the Day */}
      <WordOfTheDay onSelect={onSubmit} />
      <div className="anim-fade-left dictionary-search-panel relative rounded-lg bg-gradient-to-br from-surface to-background border-2 border-border shadow-md overflow-hidden min-w-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-text-secondary">
            <Star className="h-3.5 w-3.5 fill-current text-accent-hover" />
            <span>Structured Lookup</span>
          </div>
          <button
            type="button"
            onClick={() => setShowTips((v) => !v)}
            className={`grid w-8 h-8 place-items-center rounded-full border cursor-pointer transition-all duration-200 ${
              showTips
                ? "bg-accent border-border text-ink"
                : "bg-transparent border-transparent text-text-muted hover:text-ink hover:border-border/60"
            }`}
            aria-label="Usage Tips"
          >
            {showTips ? <X className="h-3.5 w-3.5" /> : <BookOpen className="h-4 w-4" />}
          </button>
        </div>

        {/* Tips dropdown */}
        {showTips && (
          <div className="anim-fade-in mt-4 overflow-hidden rounded-lg border-2 border-border bg-background p-4 shadow-sm">
            <p className="mb-3 text-xs font-bold uppercase tracking-wider text-ink m-0">
              <Lightbulb className="h-3 w-3 inline mr-1 text-accent" /> Usage Tips
            </p>
            <ul className="list-none p-0 m-0 flex flex-col gap-2.5">
              {HELPER_TIPS.map((tip, i) => (
                <li
                  key={tip}
                  className={`anim-fade-left anim-delay-${i + 1} border-l-2 border-l-accent pl-3 text-sm leading-relaxed text-text-secondary font-semibold`}
                >
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        )}

        <h2 className="mt-4 text-2xl italic font-display text-ink">Search Dictionary</h2>
        <p className="mt-3 text-[13px] leading-relaxed text-text-secondary break-words">
          Search for words, phrasal verbs, and idioms to learn them in context.
        </p>

        <div ref={containerRef} className="relative mt-5">
          <input
            type="text"
            className="w-full border-none border-b border-b-border bg-transparent px-1 py-3 text-[15px] text-text-primary outline-none transition-colors duration-200 focus:border-b-accent focus:border-b-2"
            placeholder="Example: take off"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            aria-label="Enter word to search"
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            maxLength={80}
            autoComplete="off"
          />

          {suggestions.length > 0 && (
            <ul
              role="listbox"
              className="absolute left-0 right-0 top-full z-10 mt-1 overflow-hidden rounded-lg border-2 border-border bg-surface shadow-lg list-none p-0 m-0"
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
                  className={`cursor-pointer px-4 py-2.5 text-sm text-text-primary transition-colors duration-150 ${
                    i === highlightedIndex
                      ? "bg-surface-hover"
                      : "bg-transparent hover:bg-surface-hover"
                  }`}
                >
                  <HighlightMatch text={s} query={draft} />
                </li>
              ))}
            </ul>
          )}
        </div>

        <button
          type="button"
          onClick={() => {
            setSuggestions([]);
            setHighlightedIndex(-1);
            onSubmit(draft.trim());
          }}
          disabled={isLoading}
          className="mt-5 w-full rounded-xl bg-accent py-2.5 text-sm font-black text-ink border-2 border-border cursor-pointer transition-all duration-150 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-accent-hover active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? "Searching..." : "Search"}
        </button>

        <p className="mt-4 text-xs text-text-muted break-words">
          Supports up to 80 characters, including spaces and apostrophes.
        </p>

        {recentWords.length > 0 && onSelectRecent && (
          <div className="mt-5 pt-4 border-t-2 border-border">
            <RecentLookups words={recentWords} onSelect={onSelectRecent} />
          </div>
        )}
      </div>
    </section>
  );
}
