"use client";

import {
  CircleCheckBig,
  Clock,
  Loader2,
  RefreshCw,
  Search,
  Star,
  Trash2,
  Undo,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { DictionaryResultCard } from "@/app/(app)/dictionary/_components/DictionaryResultCard";
import { DictionarySearchPanel } from "@/app/(app)/dictionary/_components/DictionarySearchPanel";
import { ThesaurusSheet } from "@/app/(app)/dictionary/_components/ThesaurusSheet";
import { api } from "@/lib/api-client";
import type { VocabularyWithNearby } from "@/lib/schemas/vocabulary";

const STORAGE_KEY = "dict_recent_searches";
const MAX_RECENT = 15;

type SavedWord = {
  id: string;
  query: string;
  saved: boolean;
  lookedUpAt: string;
  headword: string | null;
  level: string | null;
  mastery: "new" | "learning" | "mastered";
};

const MASTERY_CONFIG: Record<string, { icon: React.ReactNode; label: string; colorClass: string }> = {
  new: {
    icon: <Star size={11} className="fill-current text-amber-500" />,
    label: "New",
    colorClass: "bg-amber-500/10 border-amber-500/20 text-amber-500",
  },
  learning: {
    icon: <RefreshCw size={11} className="text-accent" />,
    label: "Learning",
    colorClass: "bg-accent/10 border-accent/20 text-accent",
  },
  mastered: {
    icon: <CircleCheckBig size={11} className="text-emerald-500" />,
    label: "Mastered",
    colorClass: "bg-emerald-500/10 border-emerald-500/20 text-emerald-500",
  },
};

function getRecentSearches(): string[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function addRecentSearch(word: string) {
  const recent = getRecentSearches().filter((w) => w !== word);
  recent.unshift(word);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(recent.slice(0, MAX_RECENT)));
}

export function DictionaryTab() {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<VocabularyWithNearby | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [saved, setSaved] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [recentWords, setRecentWords] = useState<string[]>([]);
  const [thesaurusOpen, setThesaurusOpen] = useState(false);

  const [savedWords, setSavedWords] = useState<SavedWord[]>([]);
  const [savedLoading, setSavedLoading] = useState(true);

  // Load recent from localStorage
  useEffect(() => {
    setRecentWords(getRecentSearches());
  }, []);

  // Load saved words from API
  useEffect(() => {
    let cancelled = false;
    api
      .get<SavedWord[]>("/vocabulary")
      .then((data) => {
        if (!cancelled) {
          setSavedWords((Array.isArray(data) ? data : []).filter((w) => w.saved));
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setSavedLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const doSearch = useCallback(async (word: string) => {
    if (!word.trim()) return;
    const trimmed = word.trim();
    setQuery(trimmed);
    setIsLoading(true);
    setHasSearched(true);
    setError(null);
    setResult(null);
    setSaved(null);

    addRecentSearch(trimmed);
    setRecentWords(getRecentSearches());

    try {
      const res = await api.post<{ data: VocabularyWithNearby; saved: boolean }>("/dictionary", {
        word: trimmed,
      });
      setResult(res.data);
      setSaved(res.saved);
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message ?? "Unable to look up word";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const toggleSaved = async () => {
    if (saved === null || !query) return;
    const next = !saved;
    setSaved(next);
    try {
      await api.patch(`/vocabulary/${encodeURIComponent(query)}/saved`, { saved: next });
      if (next) {
        setSavedWords((prev) => {
          if (prev.some((w) => w.query === query)) return prev;
          return [
            {
              id: query,
              query,
              saved: true,
              lookedUpAt: new Date().toISOString(),
              headword: result?.headword ?? query,
              level: result?.level ?? null,
              mastery: "new" as const,
            },
            ...prev,
          ];
        });
      } else {
        setSavedWords((prev) => prev.filter((w) => w.query !== query));
      }
    } catch {
      setSaved(!next);
    }
  };

  const removeSavedWord = async (word: SavedWord) => {
    setSavedWords((prev) => prev.filter((w) => w.id !== word.id));
    try {
      await api.patch(`/vocabulary/${encodeURIComponent(word.query)}/saved`, { saved: false });
    } catch {
      setSavedWords((prev) => [...prev, word]);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col gap-5 px-1">
      {/* Two-column layout on desktop */}
      <div className="grid grid-cols-1 md:grid-cols-[320px_1fr] items-start gap-6 w-full">
        {/* Left: Search + Recent */}
        <div className="flex flex-col gap-4 w-full">
          <DictionarySearchPanel
            initialValue={query}
            onSubmit={doSearch}
            isLoading={isLoading}
            recentWords={recentWords}
            onSelectRecent={doSearch}
          />
        </div>

        {/* Right: Result */}
        <div className="w-full">
          {error && (
            <div className="py-3 px-4 rounded-xl border-2 border-error/25 bg-error-bg text-error text-xs font-semibold mb-4 shadow-(--shadow-sm)">
              {error}
            </div>
          )}
          <DictionaryResultCard
            vocabulary={result}
            hasSearched={hasSearched}
            isLoading={isLoading}
            saved={saved}
            onToggleSaved={toggleSaved}
            onOpenThesaurus={() => setThesaurusOpen(true)}
            onSearch={doSearch}
          />
        </div>
      </div>

      {/* Saved words section */}
      <div className="mt-6 pt-5 border-t-2 border-dashed border-border/40 w-full">
        <div className="flex items-center gap-2 mb-4.5">
          <Star className="text-accent h-4.5 w-4.5 fill-current animate-pulse shrink-0" />
          <span className="text-[10px] font-extrabold uppercase text-accent tracking-widest font-display">
            Saved Words ({savedWords.length})
          </span>
        </div>

        {savedLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="animate-spin text-accent" size={20} />
          </div>
        ) : savedWords.length === 0 ? (
          <div className="text-center text-text-muted text-xs font-bold bg-surface border-2 border-dashed border-border/60 rounded-2xl py-8 px-4 flex flex-col items-center justify-center gap-2 max-w-md mx-auto shadow-(--shadow-sm)">
            <Star size={18} className="text-accent fill-current" />
            <p className="m-0 leading-relaxed font-semibold">No words saved yet.</p>
            <p className="m-0 text-[10px] text-text-secondary leading-normal">
              Search a word in the dictionary above and click save to start building your notebook!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 w-full">
            {savedWords.map((w) => {
              const mastery = MASTERY_CONFIG[w.mastery] ?? MASTERY_CONFIG.new;
              return (
                <div
                  key={w.id}
                  onClick={() => doSearch(w.query)}
                  onKeyDown={() => {}}
                  role="button"
                  tabIndex={0}
                  className="rounded-xl border-2 border-border bg-surface flex items-center gap-2.5 cursor-pointer p-3 shadow-(--shadow-sm) hover:translate-y-[-2px] hover:translate-x-[-1px] hover:shadow-(--shadow) transition-all duration-100 group text-left min-w-0"
                >
                  <div
                    className={`w-7 h-7 rounded-lg border-2 grid shrink-0 place-items-center text-[10px] shadow-(--shadow-sm) ${mastery.colorClass}`}
                  >
                    {mastery.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-black text-text-primary truncate leading-tight group-hover:text-accent transition-colors">
                      {w.headword ?? w.query}
                    </div>
                    {w.level && (
                      <span className="text-[9px] text-text-muted font-bold font-mono tracking-wide block mt-1 leading-none">{w.level}</span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeSavedWord(w);
                    }}
                    className="w-7 h-7 rounded-lg hover:bg-error/10 hover:text-error border-none bg-transparent cursor-pointer text-text-muted text-xs flex items-center justify-center shrink-0 ml-auto transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Thesaurus sheet */}
      {thesaurusOpen && result && (
        <ThesaurusSheet
          vocabulary={result}
          isOpen={thesaurusOpen}
          onClose={() => setThesaurusOpen(false)}
          onWordClick={doSearch}
        />
      )}
    </div>
  );
}
