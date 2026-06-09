"use client";

import { AppError } from "@repo/shared";
import { ArrowRight, BookOpen, Loader2, Search, X } from "lucide-react";
import { AnimatePresence } from "motion/react";
import * as m from "motion/react-client";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { DictionaryResultCard } from "@/app/(app)/dictionary/_components/DictionaryResultCard";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { api } from "@/lib/api-client";
import { normalizeDictionaryQuery } from "@/lib/dictionary/normalize-query";
import type { Vocabulary } from "@/lib/schemas/vocabulary";

const QUERY_PATTERN = /^[A-Za-z][A-Za-z\s'-]{0,79}$/;

/** Trigger dictionary lookup from anywhere in the app */
export function lookupWord(word: string) {
  window.dispatchEvent(
    new CustomEvent("dictionary:lookup", { detail: { word } }),
  );
}

function useIsMobile(bp = 768) {
  const [m, setM] = useState(() =>
    typeof window === "undefined" ? false : window.innerWidth <= bp,
  );
  useEffect(() => {
    const h = () => setM(window.innerWidth <= bp);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, [bp]);
  return m;
}

export function FloatingDictionaryWidget() {
  const pathname = usePathname();
  const router = useRouter();
  const isMobile = useIsMobile();

  const [expanded, setExpanded] = useState(false);
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [result, setResult] = useState<Vocabulary | null>(null);
  const [saved, setSaved] = useState<boolean | null>(null);
  const [currentQuery, setCurrentQuery] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const reqIdRef = useRef(0);

  const handleExpand = () => {
    setExpanded(true);
    setTimeout(() => inputRef.current?.focus(), 80);
  };

  const handleCollapse = () => {
    setExpanded(false);
    setQuery("");
    setErrorMsg(null);
  };

  const search = useCallback(async (word: string) => {
    const { normalized, cacheKey } = normalizeDictionaryQuery(word);
    if (!normalized) return;
    if (!QUERY_PATTERN.test(normalized)) {
      setErrorMsg("Only English words are supported.");
      return;
    }

    setErrorMsg(null);
    setIsSearching(true);
    setResult(null);
    setSaved(null);
    setCurrentQuery(null);

    const reqId = ++reqIdRef.current;

    try {
      const payload = await api.post<{ data: Vocabulary; saved: boolean }>(
        "/dictionary",
        { word: normalized },
      );
      if (reqId !== reqIdRef.current) return;
      setResult(payload.data);
      setSaved(payload.saved);
      setCurrentQuery(cacheKey);
      setModalOpen(true);
      setExpanded(false);
      setQuery("");
    } catch (err) {
      if (reqId !== reqIdRef.current) return;
      if (err instanceof AppError && err.message) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg("Word not found.");
      }
    } finally {
      if (reqId === reqIdRef.current) setIsSearching(false);
    }
  }, []);

  // Listen for programmatic lookup events from other components
  useEffect(() => {
    const handler = (e: Event) => {
      const word = (e as CustomEvent<{ word: string }>).detail?.word;
      if (word) search(word);
    };
    window.addEventListener("dictionary:lookup", handler);
    return () => window.removeEventListener("dictionary:lookup", handler);
  }, [search]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) search(query.trim());
  };

  const handleToggleSaved = async () => {
    if (currentQuery === null || saved === null) return;
    const next = !saved;
    setSaved(next);
    try {
      await api.patch(`/vocabulary/${encodeURIComponent(currentQuery)}/saved`, { saved: next });
    } catch {
      setSaved(!next);
    }
  };

  const handleSearchInModal = (word: string) => {
    setModalOpen(false);
    setTimeout(() => search(word), 100);
  };

  const handleOpenFullPage = () => {
    setModalOpen(false);
    if (result) {
      router.push(`/dictionary?q=${encodeURIComponent(result.headword)}`);
    }
  };

  if (pathname?.startsWith("/dictionary")) return null;

  const bottomOffset = isMobile ? 90 : 24;
  // Position above the chat widget (52px button + 10px gap)
  const dictBottom = bottomOffset + 52 + 10;

  return (
    <>
      {/* ─── Floating button / expanded input ─── */}
      <div className="fixed flex items-center z-[900]" style={{ bottom: dictBottom, right: 20 }}>
        <AnimatePresence mode="wait">
          {expanded ? (
            <m.form
              key="search-bar"
              onSubmit={handleSubmit}
              initial={{ opacity: 0, scale: 0.85, x: 20 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.85, x: 20 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className="flex items-center gap-1.5 bg-surface rounded-2xl py-1.5 pl-4 pr-1.5 border-2 border-border shadow-lg origin-right backdrop-blur-sm focus-within:border-accent/50 transition-all duration-200"
            >
              <Search className="text-accent shrink-0" size={15} />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setErrorMsg(null);
                }}
                placeholder="Look up a word..."
                className="border-none bg-transparent text-sm font-body text-ink w-[160px] outline-none shadow-none tracking-tight placeholder:text-text-muted"
              />
              {isSearching ? (
                <div className="w-8 h-8 grid place-items-center shrink-0">
                  <Loader2 className="animate-spin text-accent" size={15} />
                </div>
              ) : (
                <m.button
                  type="submit"
                  disabled={!query.trim()}
                  whileHover={query.trim() ? { scale: 1.08 } : {}}
                  whileTap={query.trim() ? { scale: 0.92 } : {}}
                  className={`w-8 h-8 rounded-xl border-2 grid place-items-center shrink-0 transition-all duration-150 ${
                    query.trim()
                      ? "bg-accent border-accent text-text-on-accent cursor-pointer shadow-sm"
                      : "bg-bg-deep border-border text-text-muted cursor-default"
                  }`}
                >
                  <ArrowRight size={13} strokeWidth={2.5} />
                </m.button>
              )}
              <button
                type="button"
                onClick={handleCollapse}
                className="w-7 h-7 rounded-lg border-2 border-border bg-surface-alt text-text-muted grid place-items-center cursor-pointer shrink-0 transition-all duration-150 hover:bg-surface-hover hover:text-ink hover:border-border-strong"
              >
                <X size={11} strokeWidth={2.5} />
              </button>
            </m.form>
          ) : (
            <m.button
              key="fab"
              onClick={handleExpand}
              aria-label="Quick dictionary lookup"
              title="Quick dictionary lookup"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.92 }}
              transition={{ type: "spring", stiffness: 350, damping: 20 }}
              className="w-12 h-12 rounded-2xl cursor-pointer bg-accent text-text-on-accent flex items-center justify-center border-2 border-accent shadow-lg hover:shadow-xl transition-shadow duration-200"
            >
              <BookOpen size={20} strokeWidth={2.2} />
            </m.button>
          )}
        </AnimatePresence>
      </div>

      {/* ─── Error tooltip ─── */}
      <AnimatePresence>
        {errorMsg && expanded && (
          <m.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            className="fixed text-[11px] font-bold rounded-xl w-[220px] z-[901] text-white py-2 px-3 shadow-lg bg-error border-2 border-error"
            style={{
              bottom: dictBottom + 52,
              right: 20,
            }}
          >
            {errorMsg}
          </m.div>
        )}
      </AnimatePresence>

      {/* ─── Result modal ─── */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="p-0 gap-0 w-[calc(100vw-2rem)] sm:w-[90vw] md:w-[860px] sm:max-w-[860px] max-h-[85vh] overflow-hidden flex flex-col">
          <DialogTitle className="sr-only">Dictionary Lookup</DialogTitle>
          {/* Modal header bar */}
          <div className="flex items-center justify-between bg-surface gap-2 sm:gap-3 py-2.5 sm:py-3 pl-4 sm:pl-5 pr-3 sm:pr-4 border-b-2 border-border shrink-0">
            {/* Inline search in modal */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const q = (
                  e.currentTarget.elements.namedItem("q") as HTMLInputElement
                )?.value?.trim();
                if (q) {
                  setModalOpen(false);
                  setTimeout(() => search(q), 80);
                }
              }}
              className="flex items-center gap-2 flex-1 min-w-0"
            >
              <Search size={14} className="text-text-muted shrink-0" />
              <input
                name="q"
                defaultValue={result?.headword ?? ""}
                key={result?.headword}
                placeholder="Search another word..."
                className="border-none bg-transparent text-[13px] font-body text-ink flex-1 min-w-0 outline-none"
              />
            </form>
            <button
              onClick={handleOpenFullPage}
              className="inline-flex items-center gap-1.5 rounded-lg bg-transparent text-text-muted text-[11px] font-bold cursor-pointer shrink-0 whitespace-nowrap py-1.5 px-2.5 sm:px-3 border-2 border-border transition-all duration-150 hover:text-accent hover:border-accent"
            >
              <span className="hidden sm:inline">Open full dictionary</span>
              <span className="sm:hidden">Full</span>
              <ArrowRight size={10} />
            </button>
          </div>

          {/* Dictionary result */}
          <div className="p-3 sm:p-4 overflow-y-auto flex-1 min-h-0">
            <DictionaryResultCard
              key={result?.headword ?? "loading"}
              vocabulary={result}
              hasSearched={true}
              isLoading={isSearching}
              saved={saved}
              onToggleSaved={handleToggleSaved}
              onSearch={handleSearchInModal}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
