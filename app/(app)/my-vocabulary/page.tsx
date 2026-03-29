// app/(app)/my-vocabulary/page.tsx
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { BookMarked, Trash2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { VocabularyStatsBar } from "@/components/app/VocabularyStatsBar";
import { VocabularyDetailSheet } from "@/components/app/VocabularyDetailSheet";

export type VocabularyEntry = {
  id: string;
  query: string;
  saved: boolean;
  lookedUpAt: string;
  headword: string | null;
  level: string | null;
  entryType: string | null;
};

const ENTRY_TYPE_LABELS: Record<string, string> = {
  word: "Từ đơn",
  collocation: "Cụm từ cố định",
  phrasal_verb: "Cụm động từ",
  idiom: "Thành ngữ",
};

const LEVEL_COLORS: Record<string, string> = {
  A1: "bg-green-100 text-green-800",
  A2: "bg-cyan-100 text-cyan-800",
  B1: "bg-blue-100 text-blue-800",
  B2: "bg-yellow-100 text-yellow-800",
  C1: "bg-orange-100 text-orange-800",
  C2: "bg-red-100 text-red-800",
};

const CEFR_LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];
const ENTRY_TYPES = ["word", "collocation", "phrasal_verb", "idiom"];

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
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState<string[]>([]);
  const [typeFilter, setTypeFilter] = useState<string[]>([]);
  const [savedOnly, setSavedOnly] = useState(false);
  const [selectedQuery, setSelectedQuery] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(null);
  const pendingDeleteRef = useRef<PendingDelete | null>(null);

  useEffect(() => {
    fetch("/api/vocabulary")
      .then((r) => r.json())
      .then((data) => setEntries(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    pendingDeleteRef.current = pendingDelete;
  }, [pendingDelete]);

  // Fire pending delete on unmount
  useEffect(() => {
    return () => {
      const pd = pendingDeleteRef.current;
      if (pd) {
        clearTimeout(pd.timerId);
        fetch(`/api/vocabulary/${encodeURIComponent(pd.entry.query)}`, {
          method: "DELETE",
        }).catch(() => {});
      }
    };
  }, []);

  const handleToggleSaved = async (entry: VocabularyEntry) => {
    const next = !entry.saved;
    setEntries((curr) =>
      curr.map((e) => (e.id === entry.id ? { ...e, saved: next } : e)),
    );
    try {
      await fetch(`/api/vocabulary/${encodeURIComponent(entry.query)}/saved`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ saved: next }),
      });
    } catch {
      setEntries((curr) =>
        curr.map((e) => (e.id === entry.id ? { ...e, saved: !next } : e)),
      );
    }
  };

  const handleDelete = (entry: VocabularyEntry) => {
    if (selectedQuery === entry.query) setSelectedQuery(null);

    // Immediately fire any pre-existing pending delete
    if (pendingDelete) {
      clearTimeout(pendingDelete.timerId);
      fetch(`/api/vocabulary/${encodeURIComponent(pendingDelete.entry.query)}`, {
        method: "DELETE",
      }).catch(() => {});
    }

    const index = entries.findIndex((e) => e.id === entry.id);
    setEntries((curr) => curr.filter((e) => e.id !== entry.id));

    const timerId = setTimeout(() => {
      fetch(`/api/vocabulary/${encodeURIComponent(entry.query)}`, {
        method: "DELETE",
      }).catch(() => {});
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

  const toggleLevel = (level: string) =>
    setLevelFilter((curr) =>
      curr.includes(level) ? curr.filter((l) => l !== level) : [...curr, level],
    );

  const toggleType = (type: string) =>
    setTypeFilter((curr) =>
      curr.includes(type) ? curr.filter((t) => t !== type) : [...curr, type],
    );

  const hasActiveFilter =
    !!search || levelFilter.length > 0 || typeFilter.length > 0 || savedOnly;

  const clearFilters = () => {
    setSearch("");
    setLevelFilter([]);
    setTypeFilter([]);
    setSavedOnly(false);
  };

  const visible = entries.filter((e) => {
    if (savedOnly && !e.saved) return false;
    if (levelFilter.length > 0 && !levelFilter.includes(e.level ?? "")) return false;
    if (typeFilter.length > 0 && !typeFilter.includes(e.entryType ?? "")) return false;
    if (search) {
      const q = search.toLowerCase();
      const hw = (e.headword ?? e.query).toLowerCase();
      if (!hw.includes(q) && !e.query.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const selectedEntry = entries.find((e) => e.query === selectedQuery) ?? null;

  const handleCloseSheet = useCallback(() => setSelectedQuery(null), []);

  return (
    <div className="min-h-full overflow-y-auto px-8 pb-12 pt-9 max-[720px]:px-4 max-[720px]:pb-8 max-[720px]:pt-5">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        <div className="mb-5">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
            Từ vựng của tôi
          </p>
          <h1 className="mt-2 text-3xl [font-family:var(--font-display)] text-[var(--ink)]">
            Lịch sử tra cứu
          </h1>
        </div>

        {!isLoading && entries.length > 0 && (
          <VocabularyStatsBar entries={entries} />
        )}

        {/* Search + Filters */}
        <div className="mb-5 mt-4 space-y-3">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm từ..."
            aria-label="Tìm kiếm từ vựng"
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-sm text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-muted)] focus:border-[var(--accent)]"
          />
          <div className="flex flex-wrap items-center gap-2">
            {CEFR_LEVELS.map((level) => (
              <button
                key={level}
                onClick={() => toggleLevel(level)}
                className={[
                  "rounded-full px-3 py-1 text-xs font-semibold transition",
                  levelFilter.includes(level)
                    ? (LEVEL_COLORS[level] ?? "bg-gray-100 text-gray-700")
                    : "bg-[var(--surface)] text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]",
                ].join(" ")}
              >
                {level}
              </button>
            ))}
            <button
              onClick={() => setSavedOnly((v) => !v)}
              className={[
                "rounded-full px-3 py-1 text-xs font-semibold transition",
                savedOnly
                  ? "bg-[var(--accent-light)] text-[var(--accent)]"
                  : "bg-[var(--surface)] text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]",
              ].join(" ")}
            >
              Đã lưu
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {ENTRY_TYPES.map((type) => (
              <button
                key={type}
                onClick={() => toggleType(type)}
                className={[
                  "rounded-full px-3 py-1 text-xs font-medium transition",
                  typeFilter.includes(type)
                    ? "bg-[var(--accent-light)] text-[var(--accent)]"
                    : "bg-[var(--surface)] text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]",
                ].join(" ")}
              >
                {ENTRY_TYPE_LABELS[type]}
              </button>
            ))}
            {hasActiveFilter && (
              <button
                onClick={clearFilters}
                className="text-xs text-[var(--text-muted)] underline"
              >
                Xoá bộ lọc
              </button>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-[var(--text-muted)]">
            Đang tải...
          </div>
        ) : visible.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
            <div className="grid size-14 place-items-center rounded-full bg-[var(--accent-light)] text-[var(--accent)]">
              <BookMarked size={24} />
            </div>
            <p className="text-[var(--text-secondary)]">
              {hasActiveFilter
                ? "Không có từ nào khớp với bộ lọc."
                : entries.length === 0
                  ? "Chưa tra từ nào. Hãy thử từ điển nhé!"
                  : "Chưa lưu từ nào. Hãy nhấn dấu ★ khi tra từ nhé!"}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {visible.map((entry, idx) => (
              <div
                key={entry.id}
                onClick={() => setSelectedQuery(entry.query)}
                className="group flex cursor-pointer items-center gap-4 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] px-5 py-4 shadow-[var(--shadow-sm)] transition hover:bg-[var(--surface-hover)]"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-base font-semibold text-[var(--ink)]">
                      {entry.headword ?? entry.query}
                    </span>
                    {entry.level && (
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${LEVEL_COLORS[entry.level] ?? "bg-gray-100 text-gray-700"}`}
                      >
                        {entry.level}
                      </span>
                    )}
                    {entry.entryType && (
                      <span className="rounded-full bg-[var(--bg-deep)] px-2 py-0.5 text-[11px] text-[var(--text-muted)]">
                        {ENTRY_TYPE_LABELS[entry.entryType] ?? entry.entryType}
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                    {formatRelativeTime(entry.lookedUpAt)}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(entry);
                    }}
                    className="grid size-8 place-items-center rounded-full text-[var(--text-muted)] opacity-0 transition hover:bg-[var(--surface-hover)] hover:text-red-500 group-hover:opacity-100 max-[720px]:opacity-100"
                    aria-label={idx === 0 ? "Xoá từ này" : `Xoá ${entry.headword ?? entry.query}`}
                  >
                    <Trash2 size={15} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleSaved(entry);
                    }}
                    className="grid size-8 shrink-0 place-items-center rounded-full text-[var(--text-muted)] transition hover:bg-[var(--surface-hover)] hover:text-[var(--accent)]"
                    aria-label={entry.saved ? "Bỏ lưu" : "Lưu từ này"}
                  >
                    {entry.saved ? (
                      <BookMarked size={17} className="text-[var(--accent)]" />
                    ) : (
                      <BookMarked size={17} />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      <VocabularyDetailSheet
        query={selectedQuery}
        onClose={handleCloseSheet}
        saved={selectedEntry?.saved ?? false}
        onToggleSaved={() =>
          selectedEntry && handleToggleSaved(selectedEntry)
        }
      />

      {pendingDelete && (
        <AnimatePresence>
          <motion.div
            key="undo-toast"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-full bg-[var(--ink)] px-5 py-2.5 text-sm text-white shadow-lg"
          >
            <span>Đã xoá</span>
            <span aria-hidden="true">·</span>
            <button
              onClick={handleUndoDelete}
              className="font-semibold underline"
            >
              Hoàn tác
            </button>
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}
