"use client";

import { useEffect, useState } from "react";
import { BookMarked } from "lucide-react";
import { motion } from "motion/react";

type VocabularyEntry = {
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

function formatRelativeTime(dateStr: string): string {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return "Vừa xong";
  if (mins < 60) return `${mins} phút trước`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} giờ trước`;
  return `${Math.floor(hours / 24)} ngày trước`;
}

export default function MyVocabularyPage() {
  const [entries, setEntries] = useState<VocabularyEntry[]>([]);
  const [filter, setFilter] = useState<"all" | "saved">("all");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/vocabulary")
      .then((r) => r.json())
      .then((data) => setEntries(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setIsLoading(false));
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

  const visible = filter === "saved" ? entries.filter((e) => e.saved) : entries;

  return (
    <div className="min-h-full overflow-y-auto px-8 pb-12 pt-9 max-[720px]:px-4 max-[720px]:pb-8 max-[720px]:pt-5">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        <div className="mb-7 flex items-end justify-between gap-4 max-[560px]:flex-col max-[560px]:items-start">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
              Từ vựng của tôi
            </p>
            <h1 className="mt-2 text-3xl [font-family:var(--font-display)] text-[var(--ink)]">
              Lịch sử tra cứu
            </h1>
          </div>
          <div className="flex gap-2">
            {(["all", "saved"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={[
                  "rounded-full px-4 py-1.5 text-sm font-medium transition",
                  filter === f
                    ? "bg-[var(--accent-light)] text-[var(--accent)]"
                    : "text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--ink)]",
                ].join(" ")}
              >
                {f === "all" ? "Tất cả" : "Đã lưu"}
              </button>
            ))}
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
              {filter === "saved"
                ? "Chưa lưu từ nào. Hãy nhấn dấu ★ khi tra từ nhé!"
                : "Chưa tra từ nào. Hãy thử từ điển nhé!"}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {visible.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center gap-4 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] px-5 py-4 shadow-[var(--shadow-sm)]"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-base font-semibold text-[var(--ink)]">
                      {entry.headword ?? entry.query}
                    </span>
                    {entry.level && (
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${LEVEL_COLORS[entry.level] ?? "bg-gray-100 text-gray-700"}`}>
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
                <button
                  onClick={() => handleToggleSaved(entry)}
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
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
