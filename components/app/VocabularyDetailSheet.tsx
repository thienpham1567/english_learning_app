// components/app/VocabularyDetailSheet.tsx
"use client";

import { useEffect, useState } from "react";
import { X, BookMarked, ExternalLink } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import type { Vocabulary } from "@/lib/schemas/vocabulary";

type Props = {
  query: string | null;
  onClose: () => void;
  saved: boolean;
  onToggleSaved: () => void;
};

type Status = "idle" | "loading" | "ok" | "error";

const LEVEL_COLORS: Record<string, string> = {
  A1: "bg-green-100 text-green-800",
  A2: "bg-cyan-100 text-cyan-800",
  B1: "bg-blue-100 text-blue-800",
  B2: "bg-yellow-100 text-yellow-800",
  C1: "bg-orange-100 text-orange-800",
  C2: "bg-red-100 text-red-800",
};

const ENTRY_TYPE_LABELS: Record<string, string> = {
  word: "Từ đơn",
  collocation: "Cụm từ cố định",
  phrasal_verb: "Cụm động từ",
  idiom: "Thành ngữ",
};

export function VocabularyDetailSheet({
  query,
  onClose,
  saved,
  onToggleSaved,
}: Props) {
  const [data, setData] = useState<Vocabulary | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 720px)");
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    if (!query) {
      setData(null);
      setStatus("idle");
      return;
    }
    setStatus("loading");
    setData(null);
    fetch(`/api/vocabulary/${encodeURIComponent(query)}/detail`)
      .then(async (res) => {
        if (!res.ok) throw new Error("not_found");
        return res.json() as Promise<Vocabulary>;
      })
      .then((d) => {
        setData(d);
        setStatus("ok");
      })
      .catch(() => setStatus("error"));
  }, [query]);

  useEffect(() => {
    if (!query) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [query, onClose]);

  const sheetMotionProps = isMobile
    ? { initial: { y: "100%" }, animate: { y: 0 }, exit: { y: "100%" } }
    : { initial: { x: "100%" }, animate: { x: 0 }, exit: { x: "100%" } };

  return (
    <AnimatePresence>
      {query !== null && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/30"
            onClick={onClose}
            aria-hidden="true"
          />

          <motion.div
            key="sheet"
            {...sheetMotionProps}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="fixed bottom-0 right-0 top-0 z-50 w-96 overflow-y-auto bg-[var(--surface)] shadow-2xl max-[720px]:left-0 max-[720px]:top-auto max-[720px]:h-[80vh] max-[720px]:w-full max-[720px]:rounded-t-2xl"
            aria-label="Chi tiết từ vựng"
            role="dialog"
          >
            <div className="sticky top-0 flex items-center justify-between border-b border-[var(--border)] bg-[var(--surface)] px-5 py-3">
              <button
                onClick={onToggleSaved}
                className="flex items-center gap-1.5 text-sm text-[var(--text-secondary)] transition hover:text-[var(--accent)]"
                aria-label={saved ? "Bỏ lưu" : "Lưu từ này"}
              >
                <BookMarked
                  size={16}
                  className={saved ? "text-[var(--accent)]" : ""}
                />
                {saved ? "Đã lưu" : "Lưu"}
              </button>
              <button
                onClick={onClose}
                className="grid size-8 place-items-center rounded-full text-[var(--text-muted)] transition hover:bg-[var(--surface-hover)]"
                aria-label="Đóng"
              >
                <X size={18} />
              </button>
            </div>

            <div className="px-5 py-5">
              {status === "loading" && (
                <div
                  className="animate-pulse space-y-3"
                  aria-label="Đang tải..."
                >
                  <div className="h-7 w-48 rounded bg-[var(--surface-hover)]" />
                  <div className="h-4 w-32 rounded bg-[var(--surface-hover)]" />
                  <div className="h-4 w-full rounded bg-[var(--surface-hover)]" />
                  <div className="h-4 w-3/4 rounded bg-[var(--surface-hover)]" />
                </div>
              )}

              {status === "error" && (
                <div className="space-y-3 text-sm text-[var(--text-secondary)]">
                  <p>Định nghĩa không còn trong bộ nhớ đệm.</p>
                  <p>Hãy tra lại từ này để xem đầy đủ.</p>
                  <a
                    href={`/co-lanh-dictionary?q=${encodeURIComponent(query ?? "")}`}
                    className="inline-flex items-center gap-1 text-[var(--accent)] underline"
                  >
                    Tra lại <ExternalLink size={13} />
                  </a>
                </div>
              )}

              {status === "ok" && data && (
                <div className="space-y-5">
                  <div>
                    <h2 className="text-2xl font-bold text-[var(--ink)]">
                      {data.headword}
                    </h2>
                    {data.partOfSpeech && (
                      <span className="mt-1 inline-block text-sm italic text-[var(--text-muted)]">
                        {data.partOfSpeech}
                      </span>
                    )}
                  </div>

                  {(data.phoneticsUs || data.phoneticsUk) && (
                    <div className="flex flex-wrap gap-3 text-sm text-[var(--text-muted)]">
                      {data.phoneticsUs && <span>🇺🇸 {data.phoneticsUs}</span>}
                      {data.phoneticsUk && <span>🇬🇧 {data.phoneticsUk}</span>}
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2">
                    {data.level && (
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${LEVEL_COLORS[data.level] ?? "bg-gray-100 text-gray-700"}`}
                      >
                        {data.level}
                      </span>
                    )}
                    <span className="rounded-full bg-[var(--bg-deep)] px-2 py-0.5 text-[11px] text-[var(--text-muted)]">
                      {ENTRY_TYPE_LABELS[data.entryType] ?? data.entryType}
                    </span>
                  </div>

                  <p className="text-sm leading-6 text-[var(--text-secondary)]">
                    {data.overviewVi}
                  </p>
                  <p className="text-sm leading-6 text-[var(--text-muted)]">
                    {data.overviewEn}
                  </p>

                  <div className="space-y-5 border-t border-[var(--border)] pt-4">
                    {data.senses.map((sense) => (
                      <div key={sense.id} className="space-y-2">
                        <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--accent)]">
                          {sense.label}
                        </p>
                        <p className="text-sm font-medium text-[var(--ink)]">
                          {sense.definitionVi}
                        </p>
                        <p className="text-sm text-[var(--text-muted)]">
                          {sense.definitionEn}
                        </p>
                        {sense.examples.slice(0, 3).map((ex, i) => (
                          <div
                            key={i}
                            className="border-l-2 border-[rgba(196,109,46,0.3)] pl-3 text-sm"
                          >
                            <p className="text-[var(--text-secondary)]">
                              {ex.en}
                            </p>
                            <p className="text-[var(--text-muted)]">{ex.vi}</p>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
