// app/(app)/my-vocabulary/page.tsx
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useQueryState, useQueryStates, parseAsString, parseAsBoolean, parseAsArrayOf } from "nuqs";
import { BookMarked, Search, Trash2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { VocabularyStatsBar } from "@/components/app/my-vocabulary/VocabularyStatsBar";
import { VocabularyDetailSheet } from "@/components/app/my-vocabulary/VocabularyDetailSheet";
import { ToeicVocabularySection } from "@/components/app/my-vocabulary/ToeicVocabularySection";
import type { Vocabulary } from "@/lib/schemas/vocabulary";
import http from "@/lib/http";

export type VocabularyEntry = {
  id: string;
  query: string;
  saved: boolean;
  lookedUpAt: string;
  headword: string | null;
  level: string | null;
  entryType: Vocabulary["entryType"] | null;
};

const ENTRY_TYPE_LABELS: Record<Vocabulary["entryType"], string> = {
  word: "Từ / cụm từ",
  phrasal_verb: "Cụm ĐT",
  idiom: "Thành ngữ",
};

const LEVEL_COLORS: Record<string, string> = {
  A1: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
  A2: "bg-teal-50 text-teal-700 ring-1 ring-teal-200",
  B1: "bg-sky-50 text-sky-700 ring-1 ring-sky-200",
  B2: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
  C1: "bg-orange-50 text-orange-700 ring-1 ring-orange-200",
  C2: "bg-rose-50 text-rose-700 ring-1 ring-rose-200",
};

const CEFR_LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];
const ENTRY_TYPES: Vocabulary["entryType"][] = ["word", "phrasal_verb", "idiom"];
const ENTRY_TYPE_SET = new Set<Vocabulary["entryType"]>(ENTRY_TYPES);

function formatRelativeTime(dateStr: string): string {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return "Vừa xong";
  if (mins < 60) return `${mins} phút trước`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} giờ trước`;
  return `${Math.floor(hours / 24)} ngày trước`;
}

type PendingDelete = {
  entry: VocabularyEntry;
  index: number;
  timerId: ReturnType<typeof setTimeout>;
};

export default function MyVocabularyPage() {
  const [entries, setEntries] = useState<VocabularyEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selected, setSelected] = useQueryState("selected", parseAsString);
  const [filters, setFilters] = useQueryStates({
    search: parseAsString.withDefault(""),
    level: parseAsArrayOf(parseAsString, ",").withDefault([]),
    type: parseAsArrayOf(parseAsString, ",").withDefault([]),
    saved: parseAsBoolean.withDefault(false),
  });

  const { search, level: levelFilter, type: typeFilter, saved: savedOnly } = filters;
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(null);
  const pendingDeleteRef = useRef<PendingDelete | null>(null);
  const sanitizedTypeFilter = typeFilter.filter((type): type is Vocabulary["entryType"] =>
    ENTRY_TYPE_SET.has(type as Vocabulary["entryType"]),
  );

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const { data } = await http.get<VocabularyEntry[]>("/vocabulary");
        if (!cancelled) {
          setEntries(Array.isArray(data) ? data : []);
        }
      } catch {
        // Ignore load failures and keep the empty state.
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (sanitizedTypeFilter.length !== typeFilter.length) {
      void setFilters({ type: sanitizedTypeFilter.length > 0 ? sanitizedTypeFilter : null });
    }
  }, [sanitizedTypeFilter, setFilters, typeFilter.length]);

  useEffect(() => {
    pendingDeleteRef.current = pendingDelete;
  }, [pendingDelete]);

  // Fire pending delete on unmount
  useEffect(() => {
    return () => {
      const pd = pendingDeleteRef.current;
      if (pd) {
        clearTimeout(pd.timerId);
        void http.delete(`/vocabulary/${encodeURIComponent(pd.entry.query)}`).catch(() => {});
      }
    };
  }, []);

  const handleToggleSaved = async (entry: VocabularyEntry) => {
    const next = !entry.saved;
    setEntries((curr) =>
      curr.map((e) => (e.id === entry.id ? { ...e, saved: next } : e)),
    );
    try {
      await http.patch(`/vocabulary/${encodeURIComponent(entry.query)}/saved`, { saved: next });
    } catch {
      setEntries((curr) =>
        curr.map((e) => (e.id === entry.id ? { ...e, saved: !next } : e)),
      );
    }
  };

  const handleDelete = (entry: VocabularyEntry) => {
    if (selected === entry.query) void setSelected(null);

    if (pendingDelete) {
      clearTimeout(pendingDelete.timerId);
      void http.delete(`/vocabulary/${encodeURIComponent(pendingDelete.entry.query)}`).catch(() => {});
    }

    const index = entries.findIndex((e) => e.id === entry.id);
    setEntries((curr) => curr.filter((e) => e.id !== entry.id));

    const timerId = setTimeout(() => {
      void http.delete(`/vocabulary/${encodeURIComponent(entry.query)}`).catch(() => {});
      setPendingDelete(null);
    }, 5000);

    setPendingDelete({ entry, index, timerId });
  };

  const handleUndoDelete = () => {
    if (!pendingDelete) return;
    clearTimeout(pendingDelete.timerId);
    setEntries((curr) => {
      const next = [...curr];
      next.splice(pendingDelete.index, 0, pendingDelete.entry);
      return next;
    });
    setPendingDelete(null);
  };

  const toggleLevel = (level: string) => {
    const next = levelFilter.includes(level)
      ? levelFilter.filter((l) => l !== level)
      : [...levelFilter, level];
    void setFilters({ level: next.length > 0 ? next : null });
  };

  const toggleType = (type: string) => {
    const next = sanitizedTypeFilter.includes(type as Vocabulary["entryType"])
      ? sanitizedTypeFilter.filter((t) => t !== type)
      : [...sanitizedTypeFilter, type as Vocabulary["entryType"]];
    void setFilters({ type: next.length > 0 ? next : null });
  };

  const hasActiveFilter =
    !!search || levelFilter.length > 0 || sanitizedTypeFilter.length > 0 || savedOnly;

  const clearFilters = () => {
    void setFilters({ search: null, level: null, type: null, saved: null });
  };

  const visible = entries.filter((e) => {
    if (savedOnly && !e.saved) return false;
    if (levelFilter.length > 0 && !levelFilter.includes(e.level ?? "")) return false;
    if (sanitizedTypeFilter.length > 0) {
      if (!e.entryType) return false;
      if (!sanitizedTypeFilter.includes(e.entryType)) return false;
    }
    if (search) {
      const q = search.toLowerCase();
      const hw = (e.headword ?? e.query).toLowerCase();
      if (!hw.includes(q) && !e.query.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const selectedEntry = entries.find((e) => e.query === selected) ?? null;
  const handleCloseSheet = useCallback(() => { void setSelected(null); }, [setSelected]);

  return (
    <div className="min-h-full overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >

        {/* ── Page Header ── */}
        <header className="mb-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-(--accent)">
            Từ vựng của tôi
          </p>
          <div className="mt-2 flex items-end justify-between gap-4">
            <h1 className="[font-family:var(--font-display)] text-4xl italic text-(--ink) max-[720px]:text-3xl">
              Lịch sử tra cứu
            </h1>
            {!isLoading && entries.length > 0 && (
              <span className="mb-1 text-sm text-(--text-muted)">
                {visible.length !== entries.length
                  ? `${visible.length} / ${entries.length} từ`
                  : `${entries.length} từ`}
              </span>
            )}
          </div>
          <div className="mt-4 h-px bg-(--border)" />
        </header>

        {/* ── Stats bar ── */}
        {!isLoading && entries.length > 0 && (
          <>
            <VocabularyStatsBar entries={entries} />
            <div className="h-px bg-(--border)" />
          </>
        )}

        {/* ── TOEIC Vocabulary Categories ── */}
        <ToeicVocabularySection className="mt-6 mb-2" />

        <div className="h-px bg-(--border)" />

        {/* ── Search ── */}
        <div className="relative mt-6">
          <Search
            size={15}
            className="absolute left-1 top-1/2 -translate-y-1/2 text-(--text-muted)"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => void setFilters({ search: e.target.value || null })}
            placeholder="Tìm từ..."
            aria-label="Tìm kiếm từ vựng"
            className="w-full border-b border-(--border) bg-transparent pb-2.5 pl-7 pr-4 pt-1 text-sm text-(--text-primary) outline-none transition placeholder:text-(--text-muted) focus:border-(--accent)"
          />
        </div>

        {/* ── Filters ── */}
        <div className="mt-5 space-y-3">
          {/* CEFR + saved */}
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            {CEFR_LEVELS.map((level) => {
              const active = levelFilter.includes(level);
              return (
                <button
                  key={level}
                  onClick={() => toggleLevel(level)}
                  className={[
                    "relative pb-1 text-xs font-medium transition-colors",
                    active
                      ? "text-(--ink) after:absolute after:bottom-0 after:left-0 after:right-0 after:h-px after:bg-(--accent)"
                      : "text-(--text-muted) hover:text-(--text-secondary)",
                  ].join(" ")}
                >
                  {level}
                </button>
              );
            })}
            <span className="text-(--border-strong)">·</span>
            <button
              onClick={() => void setFilters({ saved: !savedOnly || null })}
              className={[
                "relative pb-1 text-xs font-medium transition-colors",
                savedOnly
                  ? "text-(--accent) after:absolute after:bottom-0 after:left-0 after:right-0 after:h-px after:bg-(--accent)"
                  : "text-(--text-muted) hover:text-(--text-secondary)",
              ].join(" ")}
            >
              Đã lưu
            </button>
          </div>

          {/* Entry types */}
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            {ENTRY_TYPES.map((type) => {
              const active = typeFilter.includes(type);
              return (
                <button
                  key={type}
                  onClick={() => toggleType(type)}
                  className={[
                    "relative pb-1 text-xs font-medium transition-colors",
                    active
                      ? "text-(--ink) after:absolute after:bottom-0 after:left-0 after:right-0 after:h-px after:bg-(--accent)"
                      : "text-(--text-muted) hover:text-(--text-secondary)",
                  ].join(" ")}
                >
                  {ENTRY_TYPE_LABELS[type]}
                </button>
              );
            })}
            {hasActiveFilter && (
              <button
                onClick={clearFilters}
                className="text-[11px] text-(--text-muted) italic transition hover:text-(--text-secondary)"
              >
                Xoá bộ lọc
              </button>
            )}
          </div>
        </div>

        {/* ── Entry list ── */}
        <div className="mt-6">
          {isLoading ? (
            // Skeleton rows
            <div className="space-y-0">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="border-b border-(--border) py-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="h-5 animate-pulse rounded bg-(--border)"
                      style={{ width: `${100 + i * 30}px` }}
                    />
                    <div className="h-4 w-8 animate-pulse rounded bg-(--border)" />
                  </div>
                  <div className="mt-1.5 h-3 w-20 animate-pulse rounded bg-(--border)" />
                </div>
              ))}
            </div>
          ) : visible.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-20 text-center">
              <BookMarked size={28} className="text-(--border-strong)" />
              <p className="[font-family:var(--font-display)] text-xl italic text-(--text-muted)">
                {hasActiveFilter
                  ? "Không có từ nào khớp."
                  : entries.length === 0
                    ? "Chưa tra từ nào."
                    : "Chưa lưu từ nào."}
              </p>
              {!hasActiveFilter && (
                <p className="text-xs text-(--text-muted)">
                  {entries.length === 0
                    ? "Hãy thử từ điển nhé!"
                    : "Nhấn dấu ★ khi tra từ nhé!"}
                </p>
              )}
            </div>
          ) : (
            <div>
              {visible.map((entry, idx) => (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.22, delay: idx * 0.04, ease: "easeOut" }}
                  onClick={() => void setSelected(entry.query)}
                  className="group relative flex cursor-pointer items-center gap-4 border-b border-(--border) py-4 transition-colors hover:bg-(--surface-hover)"
                >
                  {/* Left accent bar */}
                  <div className="absolute bottom-0 left-0 top-0 w-0.5 bg-(--accent) opacity-0 transition-opacity group-hover:opacity-100" />

                  <div className="min-w-0 flex-1 pl-3">
                    <div className="flex flex-wrap items-baseline gap-2">
                      <span className="[font-family:var(--font-display)] text-lg italic text-(--ink)">
                        {entry.headword ?? entry.query}
                      </span>
                      {entry.level && (
                        <span
                          className={`rounded px-1.5 py-px text-[10px] font-semibold ${LEVEL_COLORS[entry.level] ?? "bg-gray-50 text-gray-700 ring-1 ring-gray-200"}`}
                        >
                          {entry.level}
                        </span>
                      )}
                      {entry.entryType && (
                        <span className="text-[11px] text-(--text-muted)">
                          {ENTRY_TYPE_LABELS[entry.entryType] ?? entry.entryType}
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-[11px] tracking-wide text-(--text-muted)">
                      {formatRelativeTime(entry.lookedUpAt)}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-0.5 pr-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(entry);
                      }}
                      className="grid size-8 place-items-center rounded text-(--text-muted) opacity-0 transition hover:text-red-500 group-hover:opacity-100 max-[720px]:opacity-100"
                      aria-label={idx === 0 ? "Xoá từ này" : `Xoá ${entry.headword ?? entry.query}`}
                    >
                      <Trash2 size={14} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleSaved(entry);
                      }}
                      className="grid size-8 shrink-0 place-items-center rounded text-(--text-muted) transition hover:text-(--accent)"
                      aria-label={entry.saved ? "Bỏ lưu" : "Lưu từ này"}
                    >
                      <BookMarked
                        size={15}
                        className={entry.saved ? "text-(--accent)" : ""}
                      />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

      </motion.div>

      <VocabularyDetailSheet
        query={selected}
        onClose={handleCloseSheet}
        saved={selectedEntry?.saved ?? false}
        onToggleSaved={() => selectedEntry && handleToggleSaved(selectedEntry)}
      />

      {pendingDelete && (
        <AnimatePresence>
          <motion.div
            key="undo-toast"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-full bg-(--ink) px-5 py-2.5 text-sm text-white shadow-lg"
          >
            <span>Đã xoá</span>
            <span aria-hidden="true">·</span>
            <button onClick={handleUndoDelete} className="font-semibold underline">
              Hoàn tác
            </button>
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}
