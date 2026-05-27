"use client";

import { AppError } from "@repo/shared";
import { ArrowRight, Loader2, Search, X } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { DictionaryResultCard } from "@/app/(app)/dictionary/_components/DictionaryResultCard";
import { ThesaurusSheet } from "@/app/(app)/dictionary/_components/ThesaurusSheet";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { api } from "@/lib/api-client";
import { normalizeDictionaryQuery } from "@/lib/dictionary/normalize-query";
import type { VocabularyWithNearby } from "@/lib/schemas/vocabulary";

const QUERY_PATTERN = /^[A-Za-z][A-Za-z\s'-]{0,79}$/;

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
  const [result, setResult] = useState<VocabularyWithNearby | null>(null);
  const [saved, setSaved] = useState<boolean | null>(null);
  const [currentQuery, setCurrentQuery] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [isThesaurusOpen, setIsThesaurusOpen] = useState(false);
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
      const payload = await api.post<{ data: VocabularyWithNearby; saved: boolean }>(
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
      {/* Floating button / expanded input */}
      <div
        className="fixed flex items-center z-[900]"
        style={{ bottom: dictBottom, right: 20 }}
      >
        {expanded ? (
          <form
            onSubmit={handleSubmit}
            className="anim-scale-in flex items-center gap-1.5 bg-surface rounded-[28px] py-[5px] pl-3.5 pr-1.5 origin-bottom-right"
            style={{
              border: "1.5px solid var(--accent)",
              boxShadow:
                "0 0 0 3px color-mix(in srgb, var(--accent) 15%, transparent), 0 6px 24px rgba(0,0,0,0.12)",
            }}
          >
            <Search className="text-[13px] text-accent shrink-0" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setErrorMsg(null);
              }}
              placeholder="Look up a word..."
              className="fdw-input border-none bg-transparent text-sm font-body text-text-primary w-[148px] outline-none shadow-none tracking-tight"
            />
            {isSearching ? (
              <div className="w-[30px] h-[30px] grid place-items-center shrink-0">
                <Loader2 className="animate-spin text-accent" size={14} />
              </div>
            ) : (
              <button
                type="submit"
                disabled={!query.trim()}
                className="w-[30px] h-[30px] rounded-full border-none grid place-items-center shrink-0 transition-all duration-150"
                style={{
                  background: query.trim()
                    ? "linear-gradient(135deg, var(--accent), var(--accent-hover, color-mix(in srgb, var(--accent) 80%, black)))"
                    : "var(--bg-deep)",
                  color: query.trim() ? "#fff" : "var(--text-muted)",
                  cursor: query.trim() ? "pointer" : "default",
                  boxShadow: query.trim()
                    ? "0 2px 8px color-mix(in srgb, var(--accent) 35%, transparent)"
                    : "none",
                }}
              >
                <ArrowRight size={11} />
              </button>
            )}
            <button
              type="button"
              onClick={handleCollapse}
              className="w-[26px] h-[26px] rounded-full border-none bg-[var(--bg-deep)] text-text-muted grid place-items-center cursor-pointer shrink-0 transition-colors duration-150 hover:bg-border"
            >
              <X size={9} />
            </button>
          </form>
        ) : (
          <button
            onClick={handleExpand}
            aria-label="Quick dictionary lookup"
            title="Quick dictionary lookup"
            className="w-11 h-11 rounded-full cursor-pointer bg-surface text-text-secondary flex items-center justify-center transition-all duration-150 hover:scale-105 hover:border-accent hover:text-accent"
            style={{
              border: "1.5px solid var(--border)",
              boxShadow: "0 3px 14px rgba(0,0,0,0.14)",
            }}
          >
            <svg
              viewBox="0 0 24 24"
              width="19"
              height="19"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              <line x1="10" y1="8" x2="16" y2="8" />
              <line x1="10" y1="12" x2="14" y2="12" />
            </svg>
          </button>
        )}
      </div>

      {/* Inline error tooltip */}
      {errorMsg && expanded && (
        <div
          className="fixed text-[11px] rounded-lg w-[220px] z-[901] text-white py-[5px] px-2.5 shadow-md"
          style={{
            bottom: dictBottom + 52,
            right: 20,
            background: "var(--error)",
          }}
        >
          {errorMsg}
        </div>
      )}

      {/* Result modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent
          className="p-0 gap-0 max-w-[860px] max-h-[82vh] overflow-hidden"
          style={{ width: isMobile ? "100%" : 860 }}
        >
          <DialogTitle className="sr-only">Dictionary Lookup</DialogTitle>
          {/* Modal header bar */}
          <div
            className="flex items-center justify-between bg-surface gap-3 py-3 pl-5 pr-4 border-b-2 border-border"
          >
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
              className="flex items-center gap-2 flex-1"
            >
              <Search size={13} className="text-text-muted" />
              <input
                name="q"
                defaultValue={result?.headword ?? ""}
                key={result?.headword}
                placeholder="Search another word..."
                className="border-none bg-transparent text-[13px] font-body text-text-primary flex-1 outline-none"
              />
            </form>
            <button
              onClick={handleOpenFullPage}
              className="inline-flex items-center gap-1.5 rounded bg-transparent text-text-muted text-[11px] font-semibold cursor-pointer shrink-0 whitespace-nowrap py-[5px] px-3 border-2 border-border transition-all duration-150 hover:text-accent hover:border-accent"
            >
              Open full dictionary <ArrowRight size={10} />
            </button>
          </div>

          {/* Dictionary result */}
          <div className="p-4 overflow-y-auto max-h-[calc(82vh-60px)]">
            <DictionaryResultCard
              key={result?.headword ?? "loading"}
              vocabulary={result}
              hasSearched={true}
              isLoading={isSearching}
              saved={saved}
              onToggleSaved={handleToggleSaved}
              onOpenThesaurus={() => setIsThesaurusOpen(true)}
              onSearch={handleSearchInModal}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Thesaurus sheet */}
      <ThesaurusSheet
        vocabulary={result}
        isOpen={isThesaurusOpen}
        onClose={() => setIsThesaurusOpen(false)}
        onWordClick={(word) => {
          setIsThesaurusOpen(false);
          handleSearchInModal(word);
        }}
      />
    </>
  );
}
