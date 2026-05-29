"use client";

import { ArrowRight, Link as LinkIcon, Star, Volume2, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/lib/api-client";
import type { Vocabulary } from "@/lib/schemas/vocabulary";

type Props = {
  query: string | null;
  onClose: () => void;
  saved: boolean;
  onToggleSaved: () => void;
};

type Status = "idle" | "loading" | "ok" | "error";

import { CEFR_BADGE_CLASSES } from "@/lib/constants/cefr";

function getTypeLabel(data: Vocabulary): string {
  if (data.entryType === "idiom") return "idiom";
  if (data.entryType === "phrasal_verb") return "phrasal verb";
  return data.partOfSpeech ?? "word";
}

export function VocabularyDetailSheet({ query, onClose, saved, onToggleSaved }: Props) {
  const router = useRouter();
  const [data, setData] = useState<Vocabulary | null>(null);
  const [status, setStatus] = useState<Status>("idle");

  useEffect(() => {
    if (!query) return;

    let cancelled = false;

    (async () => {
      try {
        setData(null);
        setStatus("loading");
        const payload = await api.get<{ data: Vocabulary }>(
          `/vocabulary/${encodeURIComponent(query)}`,
        );
        if (!cancelled) {
          setData(payload.data);
          setStatus("ok");
        }
      } catch {
        if (!cancelled) setStatus("error");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [query]);

  const levelStyle = data?.level ? CEFR_BADGE_CLASSES[data.level] : null;

  return (
    <AnimatePresence>
      {query !== null && (
        <>
          {/* Backdrop overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 z-50 cursor-pointer"
          />

          {/* Drawer Sheet */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 220 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-[400px] bg-surface border-l-2 border-border shadow-[var(--shadow-xl)] z-50 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4.5 border-b-2 border-border bg-surface shrink-0">
              <span className="text-base font-black text-text-primary font-display">
                Vocabulary Details
              </span>
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-lg border-2 border-border bg-surface hover:bg-surface-hover text-text-secondary cursor-pointer flex items-center justify-center shadow-sm transition-colors shrink-0"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Actions Bar */}
            <div className="flex gap-2 px-6 py-3 border-b-2 border-dashed border-border/40 bg-surface-alt shrink-0">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={onToggleSaved}
                className={`items-center gap-1.5 rounded-xl border-2 border-border text-xs font-black cursor-pointer px-4 py-2 flex shadow-sm transition-all ${
                  saved ? "bg-accent text-ink" : "bg-surface text-text-secondary"
                }`}
              >
                <Star className={`h-4 w-4 shrink-0 ${saved ? "fill-current animate-pulse" : ""}`} />
                <span>{saved ? "Saved" : "Save"}</span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => router.push(`/dictionary?q=${encodeURIComponent(query ?? "")}`)}
                className="items-center gap-1.5 rounded-xl border-2 border-border bg-surface text-text-secondary text-xs font-black cursor-pointer px-4 py-2 flex shadow-sm transition-all"
              >
                <LinkIcon className="h-4 w-4 shrink-0" />
                <span>Search</span>
              </motion.button>
            </div>

            {/* Body Content */}
            <div className="flex-1 overflow-y-auto p-6 flex flex-col">
              {status === "loading" && (
                <div className="space-y-4 animate-pulse py-4">
                  <div className="h-6 bg-bg-deep border border-border/20 rounded-md w-3/4" />
                  <div className="h-4 bg-bg-deep border border-border/20 rounded-md w-1/2" />
                  <div className="space-y-3 mt-8">
                    <div className="h-4 bg-bg-deep border border-border/20 rounded-md w-full" />
                    <div className="h-4 bg-bg-deep border border-border/20 rounded-md w-5/6" />
                    <div className="h-4 bg-bg-deep border border-border/20 rounded-md w-2/3" />
                  </div>
                </div>
              )}

              {status === "error" && (
                <div className="flex flex-col gap-3.5 py-4 max-w-sm">
                  <p className="text-xs md:text-sm text-text-secondary font-semibold m-0 leading-relaxed">
                    Definition no longer cached or failed to load.
                  </p>
                  <p className="text-xs text-text-muted m-0 font-bold">
                    Please search this word in the dictionary to view details.
                  </p>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => router.push(`/dictionary?q=${encodeURIComponent(query ?? "")}`)}
                    className="mt-2.5 h-[40px] rounded-xl border-2 border-border font-black text-xs cursor-pointer flex items-center justify-center gap-2 bg-accent text-ink shadow-sm hover:translate-y-[-1px] hover:shadow transition-all"
                  >
                    <LinkIcon className="h-4 w-4" />
                    <span>Search Again</span>
                  </motion.button>
                </div>
              )}

              {status === "ok" && data && (
                <div className="flex flex-col gap-5.5">
                  <div>
                    <h3 className="font-black font-display text-text-primary text-2xl m-0 leading-none">
                      {data.headword}
                    </h3>
                    {data.partOfSpeech && (
                      <span className="italic text-text-muted font-bold text-xs font-mono mt-2 block">
                        ({data.partOfSpeech})
                      </span>
                    )}
                  </div>

                  {(data.phoneticsUs || data.phoneticsUk) && (
                    <div className="flex gap-3.5 bg-surface-alt rounded-xl border-2 border-border p-3.5 shadow-sm">
                      {data.phoneticsUs && (
                        <div className="flex items-center gap-1.5 text-xs text-text-secondary font-bold">
                          <span className="px-1.5 py-0.5 rounded bg-surface border border-border/60 text-[9px] text-text-muted font-black">
                            US
                          </span>
                          <span className="font-mono">/{data.phoneticsUs}/</span>
                        </div>
                      )}
                      {data.phoneticsUk && (
                        <div className="flex items-center gap-1.5 text-xs text-text-secondary font-bold">
                          <span className="px-1.5 py-0.5 rounded bg-surface border border-border/60 text-[9px] text-text-muted font-black">
                            UK
                          </span>
                          <span className="font-mono">/{data.phoneticsUk}/</span>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex gap-2 flex-wrap">
                    {levelStyle && (
                      <span
                        className={`text-[10px] font-black rounded-lg border px-3 py-1 shadow-sm ${levelStyle}`}
                      >
                        Level: {data.level}
                      </span>
                    )}
                    <span className="text-[10px] font-black rounded-lg bg-surface-alt text-text-secondary border-2 border-border px-3 py-1 shadow-sm">
                      {getTypeLabel(data)}
                    </span>
                  </div>

                  <div className="flex flex-col gap-5.5 border-t-2 border-dashed border-border/40 pt-5">
                    {data.senses.map((sense) => (
                      <div key={sense.id} className="flex flex-col gap-2">
                        <span className="text-[9px] font-extrabold uppercase tracking-wider text-text-secondary font-display">
                          {sense.label || "Definition"}
                        </span>

                        <p className="text-text-primary font-black m-0 text-sm leading-relaxed">
                          {sense.definitionEn}
                        </p>
                        {sense.shortMeaningsVi && sense.shortMeaningsVi.length > 0 && (
                          <p className="text-text-secondary font-bold text-xs leading-normal mt-0.5">
                            {sense.shortMeaningsVi.join(", ")}
                          </p>
                        )}

                        {sense.examples.slice(0, 3).map((ex, i) => (
                          <div
                            key={i}
                            className="mt-1.5 flex flex-col gap-1 border-l-2 border-accent/50 pl-3.5"
                          >
                            <span className="text-xs italic text-text-secondary font-semibold leading-relaxed">
                              &ldquo;{ex.en}&rdquo;
                            </span>
                            {ex.vi && (
                              <span className="text-[11px] text-text-muted font-bold leading-normal">
                                → {ex.vi}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => router.push(`/dictionary?q=${encodeURIComponent(query ?? "")}`)}
                    className="h-[42px] rounded-xl border-2 border-border font-black cursor-pointer flex items-center justify-center gap-1.5 bg-accent text-ink shadow mt-4 mb-2"
                  >
                    <span>View in Dictionary</span>
                    <ArrowRight className="h-4 w-4 shrink-0" />
                  </motion.button>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
