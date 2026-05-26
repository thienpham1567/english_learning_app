"use client";

import { X } from "lucide-react";
import * as m from "motion/react-client";
import { AnimatePresence } from "motion/react";
import type { Vocabulary } from "@/lib/schemas/vocabulary";

type Props = {
  vocabulary: Vocabulary | null;
  isOpen: boolean;
  onClose: () => void;
  onWordClick: (word: string) => void;
};

export function ThesaurusSheet({ vocabulary, isOpen, onClose, onWordClick }: Props) {
  const sensesWithData =
    vocabulary?.senses.filter(
      (s) => (s.synonyms?.length ?? 0) > 0 || (s.antonyms?.length ?? 0) > 0,
    ) ?? [];

  function handleWordClick(word: string) {
    onWordClick(word);
    onClose();
  }

  return (
    <>
      {/* Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[900] bg-black/30 backdrop-blur-xs"
          />
        )}
      </AnimatePresence>

      {/* Panel */}
      <AnimatePresence>
        {isOpen && (
          <m.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed top-0 right-0 bottom-0 w-[min(384px,90vw)] z-[901] bg-(--bg) border-l-2 border-border shadow-[-8px_0_30px_rgba(0,0,0,0.1)] flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b-2 border-border bg-surface shrink-0">
              <div>
                <p className="text-[10px] uppercase tracking-[0.18em] text-text-muted m-0">
                  Từ đồng &amp; trái nghĩa
                </p>
                {vocabulary && (
                  <p className="text-[15px] font-semibold italic font-display text-ink m-0">
                    {vocabulary.headword}
                  </p>
                )}
              </div>
              <button
                onClick={onClose}
                className="grid place-items-center w-8 h-8 rounded-lg border-2 border-border bg-transparent text-text-muted cursor-pointer transition-all hover:bg-surface-alt"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-5">
              {vocabulary && sensesWithData.length === 0 && (
                <p className="text-sm text-text-muted">Chưa có dữ liệu đồng/trái nghĩa.</p>
              )}

              {vocabulary && sensesWithData.length > 0 && (
                <div className="flex flex-col gap-7">
                  {sensesWithData.map((sense) => (
                    <div key={sense.id} className="flex flex-col gap-3.5">
                      {/* Sense label */}
                      <p className="text-[13px] italic font-display text-accent m-0 pb-2.5 border-b-2 border-border">
                        {sense.label}
                      </p>

                      {/* Synonyms */}
                      {(sense.synonyms?.length ?? 0) > 0 && (
                        <div className="flex flex-col gap-2">
                          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-(--success) m-0">Đồng nghĩa</p>
                          <div className="flex flex-wrap gap-1.5">
                            {sense.synonyms.map((word) => (
                              <button
                                key={word}
                                type="button"
                                onClick={() => handleWordClick(word)}
                                className="rounded-full bg-accent-light px-3 py-1 text-[13px] font-medium text-(--success) border border-(--success) cursor-pointer transition-all duration-150 hover:bg-(--success)/10"
                              >
                                {word}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Antonyms */}
                      {(sense.antonyms?.length ?? 0) > 0 && (
                        <div className="flex flex-col gap-2">
                          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-(--warning) m-0">Trái nghĩa</p>
                          <div className="flex flex-wrap gap-1.5">
                            {sense.antonyms.map((word) => (
                              <button
                                key={word}
                                type="button"
                                onClick={() => handleWordClick(word)}
                                className="rounded-full bg-(--warm) px-3 py-1 text-[13px] font-medium text-(--warning) border border-dashed border-(--warning) cursor-pointer transition-all duration-150 hover:bg-(--warning)/10"
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
          </m.div>
        )}
      </AnimatePresence>
    </>
  );
}
