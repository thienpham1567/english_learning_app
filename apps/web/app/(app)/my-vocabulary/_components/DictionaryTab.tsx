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
import { useCallback, useEffect, useRef, useState } from "react";
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

const MASTERY_CONFIG: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
  new: {
    icon: <Star style={{ color: "var(--warning)" }} />,
    label: "Mới",
    color: "var(--warning)",
  },
  learning: {
    icon: <RefreshCw className="text-accent" />,
    label: "Đang học",
    color: "var(--accent)",
  },
  mastered: {
    icon: <CircleCheckBig className="text-emerald-500" />,
    label: "Thành thạo",
    color: "var(--success)",
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

  // Saved words list
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
      const msg = (err as { message?: string })?.message ?? "Không thể tra cứu";
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
      // Refresh saved list
      if (next) {
        // Add to saved
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
    <div className="w-[1100px] mx-auto w-full">
      {/* Two-column layout on desktop */}
      <div
        className="dictionary-grid grid items-start"
        style={{ gridTemplateColumns: "minmax(280px, 340px) minmax(0, 1fr)", gap: 28 }}
      >
        {/* Left: Search + Recent */}
        <div className="flex flex-col gap-4">
          <DictionarySearchPanel
            initialValue={query}
            onSubmit={doSearch}
            isLoading={isLoading}
            recentWords={recentWords}
            onSelectRecent={doSearch}
          />
        </div>

        {/* Right: Result */}
        <div>
          {error && (
            <div
              className="py-3 px-4 rounded-xl text-destructive text-sm mb-4"
              style={{
                border: "1px solid color-mix(in srgb, var(--error) 30%, transparent)",
                background: "var(--error-bg)",
              }}
            >
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
      <div className="mt-8" style={{ paddingTop: 24, borderTop: "1px solid var(--border)" }}>
        <div className="flex items-center gap-2.5 mb-4">
          <Star className="text-accent text-base" />
          <span
            className="text-[13px] font-extrabold uppercase text-accent"
            style={{ letterSpacing: "0.12em" }}
          >
            Từ đã lưu ({savedWords.length})
          </span>
        </div>

        {savedLoading ? (
          <div className="flex justify-center p-6">
            <Loader2 className="animate-spin text-accent" size={20} />
          </div>
        ) : savedWords.length === 0 ? (
          <div
            className="text-center text-text-muted text-sm flex items-center justify-center gap-1.5"
            style={{ padding: "24px 16px", borderRadius: 14, border: "1px dashed var(--border)" }}
          >
            Chưa có từ nào được lưu. Tra từ và nhấn{" "}
            <Star size={14} className="inline text-accent" fill="currentColor" /> để lưu!
          </div>
        ) : (
          <div
            className="grid gap-1.5"
            style={{ gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))" }}
          >
            {savedWords.map((w) => {
              const mastery = MASTERY_CONFIG[w.mastery] ?? MASTERY_CONFIG.new;
              return (
                <div
                  key={w.id}
                  onClick={() => doSearch(w.query)}
                  onKeyDown={() => {}}
                  role="button"
                  tabIndex={0}
                  className="rounded-xl border-2 border-border bg-(--surface) flex items-center gap-2.5 cursor-pointer"
                  style={{ padding: "12px 14px", transition: "border-color 0.2s" }}
                >
                  <div
                    className="w-[24px] h-[24px] rounded-md grid shrink-0 text-[11px]"
                    style={{
                      placeItems: "center",
                      background: `color-mix(in srgb, ${mastery.color} 10%, var(--surface))`,
                      color: mastery.color,
                    }}
                  >
                    {mastery.icon}
                  </div>
                  <div className="flex-1 w-[0px]">
                    <div
                      className="text-sm font-semibold text-ink overflow-hidden"
                      style={{ textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                    >
                      {w.headword ?? w.query}
                    </div>
                    {w.level && (
                      <span className="text-[10px] text-text-muted font-semibold">{w.level}</span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeSavedWord(w);
                    }}
                    className="w-[24px] h-[24px] rounded-md border-none bg-transparent cursor-pointer text-text-muted text-xs grid"
                    style={{ placeItems: "center" }}
                  >
                    <Trash2 />
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

      <style>{`
        @media (max-width: 768px) {
          .dictionary-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
