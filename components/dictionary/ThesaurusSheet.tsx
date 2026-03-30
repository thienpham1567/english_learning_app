"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import type { Vocabulary } from "@/lib/schemas/vocabulary";

type Props = {
  vocabulary: Vocabulary | null;
  isOpen: boolean;
  onClose: () => void;
  onWordClick: (word: string) => void;
};

export function ThesaurusSheet({ vocabulary, isOpen, onClose, onWordClick }: Props) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 720px)");
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const sheetMotionProps = isMobile
    ? { initial: { y: "100%" }, animate: { y: 0 }, exit: { y: "100%" } }
    : { initial: { x: "100%" }, animate: { x: 0 }, exit: { x: "100%" } };

  const sensesWithData = vocabulary?.senses.filter(
    (s) => (s.synonyms?.length ?? 0) > 0 || (s.antonyms?.length ?? 0) > 0,
  ) ?? [];

  function handleWordClick(word: string) {
    onWordClick(word);
    onClose();
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            key="thesaurus-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/30"
            onClick={onClose}
            aria-hidden="true"
          />

          <motion.div
            key="thesaurus-sheet"
            {...sheetMotionProps}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="fixed bottom-0 right-0 top-0 z-50 w-96 overflow-y-auto bg-[var(--bg-deep)] shadow-2xl max-[720px]:left-0 max-[720px]:top-auto max-[720px]:h-[80vh] max-[720px]:w-full max-[720px]:rounded-t-2xl"
            aria-label="Từ đồng & trái nghĩa"
            role="dialog"
          >
            <div className="sticky top-0 flex items-center justify-between border-b border-[var(--border)] bg-[var(--bg-deep)] px-5 py-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                  Từ đồng & trái nghĩa
                </p>
                {vocabulary && (
                  <p className="text-sm font-medium text-[var(--ink)]">
                    {vocabulary.headword}
                  </p>
                )}
              </div>
              <button
                onClick={onClose}
                className="grid size-8 place-items-center rounded-full text-[var(--text-muted)] transition hover:bg-[var(--surface-hover)]"
                aria-label="Đóng"
              >
                <X size={18} />
              </button>
            </div>

            <div className="px-5 py-5">
              {vocabulary && sensesWithData.length === 0 && (
                <p className="text-sm text-[var(--text-muted)]">
                  Chưa có dữ liệu đồng/trái nghĩa.
                </p>
              )}

              {vocabulary && sensesWithData.length > 0 && (
                <div className="space-y-6">
                  {sensesWithData.map((sense) => (
                    <div key={sense.id} className="space-y-4">
                      <p className="[font-family:var(--font-display)] italic text-sm text-[var(--accent)]">
                        {sense.label}
                      </p>

                      {(sense.synonyms?.length ?? 0) > 0 && (
                        <div className="space-y-2">
                          <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--text-muted)]">
                            Đồng nghĩa
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {sense.synonyms.map((word) => (
                              <button
                                key={word}
                                type="button"
                                onClick={() => handleWordClick(word)}
                                className="rounded-full bg-emerald-50 px-3 py-1 text-sm text-emerald-700 ring-1 ring-emerald-200 transition hover:bg-emerald-100"
                              >
                                {word}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {(sense.antonyms?.length ?? 0) > 0 && (
                        <div className="space-y-2">
                          <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--text-muted)]">
                            Trái nghĩa
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {sense.antonyms.map((word) => (
                              <button
                                key={word}
                                type="button"
                                onClick={() => handleWordClick(word)}
                                className="rounded-full bg-rose-50 px-3 py-1 text-sm text-rose-700 ring-1 ring-rose-200 transition hover:bg-rose-100"
                              >
                                {word}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
