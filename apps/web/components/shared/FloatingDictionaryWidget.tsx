"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Modal } from "antd";
import { SearchOutlined, CloseOutlined, LoadingOutlined, ArrowRightOutlined } from "@ant-design/icons";
import { AppError } from "@repo/shared";
import { api } from "@/lib/api-client";
import { normalizeDictionaryQuery } from "@/lib/dictionary/normalize-query";
import { DictionaryResultCard } from "@/app/(app)/dictionary/_components/DictionaryResultCard";
import { ThesaurusSheet } from "@/app/(app)/dictionary/_components/ThesaurusSheet";
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

  // Don't render on the dictionary page
  if (pathname?.startsWith("/dictionary")) return null;

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
      setErrorMsg("Chỉ hỗ trợ từ tiếng Anh.");
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
        setErrorMsg("Không tìm thấy từ này.");
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

  const bottomOffset = isMobile ? 90 : 24;
  // Position above the chat widget (52px button + 10px gap)
  const dictBottom = bottomOffset + 52 + 10;

  return (
    <>
      {/* Floating button / expanded input */}
      <div
        style={{
          position: "fixed",
          bottom: dictBottom,
          right: 20,
          zIndex: 900,
          display: "flex",
          alignItems: "center",
          gap: 0,
        }}
      >
        {expanded ? (
          <form
            onSubmit={handleSubmit}
            className="anim-scale-in"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: "var(--surface)",
              border: "1.5px solid var(--accent)",
              borderRadius: 28,
              padding: "5px 6px 5px 14px",
              boxShadow: "0 0 0 3px color-mix(in srgb, var(--accent) 15%, transparent), 0 6px 24px rgba(0,0,0,0.12)",
              transformOrigin: "bottom right",
            }}
          >
            <SearchOutlined style={{ fontSize: 13, color: "var(--accent)", flexShrink: 0 }} />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => { setQuery(e.target.value); setErrorMsg(null); }}
              placeholder="Tra từ..."
              className="fdw-input"
              style={{
                border: "none",
                outline: "none",
                boxShadow: "none",
                background: "transparent",
                fontSize: 14,
                fontFamily: "var(--font-body)",
                color: "var(--text-primary)",
                width: 148,
                letterSpacing: "0.01em",
              }}
            />
            {isSearching ? (
              <div style={{ width: 30, height: 30, display: "grid", placeItems: "center", flexShrink: 0 }}>
                <LoadingOutlined spin style={{ fontSize: 14, color: "var(--accent)" }} />
              </div>
            ) : (
              <button
                type="submit"
                disabled={!query.trim()}
                style={{
                  width: 30, height: 30, borderRadius: "50%", border: "none",
                  background: query.trim()
                    ? "linear-gradient(135deg, var(--accent), var(--accent-hover, color-mix(in srgb, var(--accent) 80%, black)))"
                    : "var(--bg-deep)",
                  color: query.trim() ? "#fff" : "var(--text-muted)",
                  display: "grid", placeItems: "center", cursor: query.trim() ? "pointer" : "default",
                  transition: "background 0.18s, transform 0.15s",
                  flexShrink: 0,
                  boxShadow: query.trim() ? "0 2px 8px color-mix(in srgb, var(--accent) 35%, transparent)" : "none",
                }}
                onMouseEnter={(e) => { if (query.trim()) (e.currentTarget as HTMLButtonElement).style.transform = "scale(1.1)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)"; }}
              >
                <ArrowRightOutlined style={{ fontSize: 11 }} />
              </button>
            )}
            <button
              type="button"
              onClick={handleCollapse}
              style={{
                width: 26, height: 26, borderRadius: "50%", border: "none",
                background: "var(--bg-deep)", color: "var(--text-muted)",
                display: "grid", placeItems: "center", cursor: "pointer",
                flexShrink: 0,
                transition: "background 0.15s, color 0.15s",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "var(--border)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "var(--bg-deep)"; }}
            >
              <CloseOutlined style={{ fontSize: 9 }} />
            </button>
          </form>
        ) : (
          <button
            onClick={handleExpand}
            aria-label="Tra từ nhanh"
            title="Tra từ nhanh"
            style={{
              width: 44,
              height: 44,
              borderRadius: "50%",
              border: "1.5px solid var(--border)",
              cursor: "pointer",
              background: "var(--surface)",
              color: "var(--text-secondary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 3px 14px rgba(0,0,0,0.14)",
              transition: "transform 0.18s, box-shadow 0.18s, border-color 0.18s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.transform = "scale(1.08)";
              (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--accent)";
              (e.currentTarget as HTMLButtonElement).style.color = "var(--accent)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)";
              (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border)";
              (e.currentTarget as HTMLButtonElement).style.color = "var(--text-secondary)";
            }}
          >
            <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
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
        <div style={{
          position: "fixed",
          bottom: dictBottom + 52,
          right: 20,
          zIndex: 901,
          background: "var(--error)",
          color: "#fff",
          fontSize: 11,
          padding: "5px 10px",
          borderRadius: 8,
          boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
          maxWidth: 220,
        }}>
          {errorMsg}
        </div>
      )}

      {/* Result modal */}
      <Modal
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        footer={null}
        width={isMobile ? "100%" : 860}
        style={{ top: isMobile ? 0 : 40 }}
        styles={{
          body: { padding: 0, maxHeight: isMobile ? "100dvh" : "82vh", overflowY: "auto" },
          mask: { backdropFilter: "blur(4px)", background: "rgba(0,0,0,0.3)" },
        }}
        closeIcon={
          <div style={{
            width: 28, height: 28, borderRadius: "50%",
            background: "var(--bg-deep)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "var(--text-muted)",
          }}>
            <CloseOutlined style={{ fontSize: 12 }} />
          </div>
        }
      >
        {/* Modal header bar */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 16px 12px 20px",
          borderBottom: "1px solid var(--border)",
          background: "var(--surface)",
          gap: 12,
        }}>
          {/* Inline search in modal */}
          <form
            onSubmit={(e) => { e.preventDefault(); const q = (e.currentTarget.elements.namedItem("q") as HTMLInputElement)?.value?.trim(); if (q) { setModalOpen(false); setTimeout(() => search(q), 80); } }}
            style={{ display: "flex", alignItems: "center", gap: 8, flex: 1 }}
          >
            <SearchOutlined style={{ fontSize: 13, color: "var(--text-muted)" }} />
            <input
              name="q"
              defaultValue={result?.headword ?? ""}
              key={result?.headword}
              placeholder="Tra từ khác..."
              style={{
                border: "none", outline: "none", background: "transparent",
                fontSize: 13, fontFamily: "var(--font-body)",
                color: "var(--text-primary)", flex: 1,
              }}
            />
          </form>
          <button
            onClick={handleOpenFullPage}
            style={{
              display: "inline-flex", alignItems: "center", gap: 5,
              padding: "5px 12px", borderRadius: 8,
              border: "1px solid var(--border)",
              background: "transparent",
              color: "var(--text-muted)",
              fontSize: 11, fontWeight: 600, cursor: "pointer",
              transition: "all 0.15s",
              flexShrink: 0,
              whiteSpace: "nowrap",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--accent)"; (e.currentTarget as HTMLButtonElement).style.color = "var(--accent)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border)"; (e.currentTarget as HTMLButtonElement).style.color = "var(--text-muted)"; }}
          >
            Mở trang từ điển <ArrowRightOutlined style={{ fontSize: 10 }} />
          </button>
        </div>

        {/* Dictionary result */}
        <div style={{ padding: 16 }}>
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
      </Modal>

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
