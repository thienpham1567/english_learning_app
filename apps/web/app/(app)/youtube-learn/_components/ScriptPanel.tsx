"use client";

import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { SearchOutlined, LoadingOutlined, CloseOutlined } from "@ant-design/icons";
import { Modal } from "antd";
import { api } from "@/lib/api-client";
import { AppError } from "@repo/shared";
import { DictionaryResultCard } from "@/app/(app)/dictionary/_components/DictionaryResultCard";
import type { VocabularyWithNearby } from "@/lib/schemas/vocabulary";

export type Segment = { start: number; duration: number; text: string };

type Props = {
  segments: Segment[];
  currentSec: number;
  onSeek: (sec: number) => void;
  autoScroll: boolean;
};

function formatTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

const WORD_PATTERN = /[A-Za-z][A-Za-z'-]{1,40}/g;

export function ScriptPanel({ segments, currentSec, onSeek, autoScroll }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const activeIdx = findActiveIndex(segments, currentSec);

  // ── Transcript search ──
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  const filteredSegments = useMemo(() => {
    if (!searchQuery.trim()) return null; // null = show all
    const q = searchQuery.toLowerCase();
    return segments
      .map((seg, i) => ({ seg, idx: i }))
      .filter(({ seg }) => seg.text.toLowerCase().includes(q));
  }, [segments, searchQuery]);

  const toggleSearch = useCallback(() => {
    setSearchOpen((v) => {
      if (!v) setTimeout(() => searchInputRef.current?.focus(), 50);
      else setSearchQuery("");
      return !v;
    });
  }, []);

  // Ctrl+F intercept for transcript search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "f") {
        // Only intercept if the script panel is visible
        if (containerRef.current) {
          e.preventDefault();
          setSearchOpen(true);
          setTimeout(() => searchInputRef.current?.focus(), 50);
        }
      }
      if (e.key === "Escape" && searchOpen) {
        setSearchOpen(false);
        setSearchQuery("");
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [searchOpen]);

  // ── Dictionary lookup ──
  const [lookupOpen, setLookupOpen] = useState(false);
  const [lookupWord, setLookupWord] = useState<string | null>(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupResult, setLookupResult] = useState<VocabularyWithNearby | null>(null);
  const [lookupSaved, setLookupSaved] = useState<boolean | null>(null);
  const [lookupErr, setLookupErr] = useState<string | null>(null);
  const reqIdRef = useRef(0);

  useEffect(() => {
    if (!autoScroll || activeIdx < 0 || searchQuery.trim()) return;
    const el = containerRef.current?.querySelector<HTMLElement>(`[data-seg="${activeIdx}"]`);
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [activeIdx, autoScroll, searchQuery]);

  const handleWordClick = async (word: string) => {
    const cleaned = word.toLowerCase().replace(/[^a-z'-]/g, "");
    if (!cleaned) return;
    setLookupWord(cleaned);
    setLookupOpen(true);
    setLookupResult(null);
    setLookupErr(null);
    setLookupSaved(null);
    setLookupLoading(true);

    const reqId = ++reqIdRef.current;
    try {
      const payload = await api.post<{ data: VocabularyWithNearby; saved: boolean }>("/dictionary", { word: cleaned });
      if (reqId !== reqIdRef.current) return;
      setLookupResult(payload.data);
      setLookupSaved(payload.saved);
    } catch (err) {
      if (reqId !== reqIdRef.current) return;
      setLookupErr(err instanceof AppError && err.message ? err.message : "Không tìm thấy từ này.");
    } finally {
      if (reqId === reqIdRef.current) setLookupLoading(false);
    }
  };

  const handleToggleSaved = async () => {
    if (!lookupWord || lookupSaved === null) return;
    const next = !lookupSaved;
    setLookupSaved(next);
    try {
      await api.patch(`/vocabulary/${encodeURIComponent(lookupWord)}/saved`, { saved: next });
    } catch {
      setLookupSaved(!next);
    }
  };

  // Determine what to render
  const displaySegments = filteredSegments
    ? filteredSegments.map(({ seg, idx }) => ({ seg, idx }))
    : segments.map((seg, idx) => ({ seg, idx }));

  return (
    <>
      {/* ── Search header ── */}
      {searchOpen && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 14px",
            borderBottom: "1px solid var(--border)",
            background: "color-mix(in srgb, var(--accent) 4%, var(--bg))",
          }}
        >
          <SearchOutlined style={{ fontSize: 12, color: "var(--accent)", flexShrink: 0 }} />
          <input
            ref={searchInputRef}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm trong transcript..."
            style={{
              flex: 1,
              border: "none",
              outline: "none",
              background: "transparent",
              fontSize: 13,
              color: "var(--text-primary)",
              fontFamily: "inherit",
            }}
          />
          {searchQuery && (
            <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600, flexShrink: 0 }}>
              {filteredSegments ? filteredSegments.length : segments.length} kết quả
            </span>
          )}
          <button
            onClick={() => { setSearchOpen(false); setSearchQuery(""); }}
            style={{
              border: "none",
              background: "transparent",
              cursor: "pointer",
              color: "var(--text-muted)",
              fontSize: 11,
              padding: 4,
              borderRadius: 4,
              display: "grid",
              placeItems: "center",
            }}
          >
            <CloseOutlined />
          </button>
        </div>
      )}

      {/* ── Segments list ── */}
      <div
        ref={containerRef}
        style={{
          flex: 1, minHeight: 0, overflow: "auto",
          padding: "10px 12px",
          display: "flex", flexDirection: "column", gap: 4,
        }}
      >
        {displaySegments.map(({ seg, idx }) => {
          const isActive = idx === activeIdx;
          return (
            <div
              key={idx}
              data-seg={idx}
              style={{
                padding: "10px 14px",
                borderRadius: 10,
                background: isActive
                  ? "color-mix(in srgb, var(--accent) 12%, var(--surface))"
                  : "transparent",
                borderLeft: `3px solid ${isActive ? "var(--accent)" : "transparent"}`,
                transition: "background 0.18s, border-color 0.18s",
                cursor: "pointer",
                display: "flex",
                gap: 10,
                alignItems: "flex-start",
              }}
              onClick={() => onSeek(seg.start)}
            >
              <span style={{
                fontSize: 11, fontWeight: 700, color: "var(--text-muted)",
                fontVariantNumeric: "tabular-nums",
                flexShrink: 0, marginTop: 2,
                minWidth: 36, textAlign: "right",
              }}>
                {formatTime(seg.start)}
              </span>
              <p style={{
                margin: 0, fontSize: 14, lineHeight: 1.65,
                color: isActive ? "var(--text-primary)" : "var(--text-secondary)",
                fontWeight: isActive ? 500 : 400,
                flex: 1,
              }}>
                {searchQuery.trim()
                  ? highlightMatch(seg.text, searchQuery, (w, e) => { e.stopPropagation(); handleWordClick(w); })
                  : renderClickableText(seg.text, (w, e) => { e.stopPropagation(); handleWordClick(w); })}
              </p>
            </div>
          );
        })}
        {displaySegments.length === 0 && searchQuery.trim() && (
          <div style={{ padding: 32, textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>
            Không tìm thấy &quot;{searchQuery}&quot; trong transcript.
          </div>
        )}
        {segments.length === 0 && (
          <div style={{ padding: 32, textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>
            Chưa có script.
          </div>
        )}
      </div>

      <Modal
        open={lookupOpen}
        onCancel={() => setLookupOpen(false)}
        footer={null}
        width={720}
        styles={{
          body: { padding: 0, maxHeight: "80vh", overflowY: "auto" },
          mask: { backdropFilter: "blur(4px)", background: "rgba(0,0,0,0.3)" },
        }}
      >
        <div style={{ padding: 16 }}>
          {lookupErr ? (
            <div style={{ padding: 24, textAlign: "center", color: "var(--error)" }}>
              {lookupErr}
            </div>
          ) : (
            <DictionaryResultCard
              vocabulary={lookupResult}
              hasSearched={true}
              isLoading={lookupLoading}
              saved={lookupSaved}
              onToggleSaved={handleToggleSaved}
              onSearch={handleWordClick}
            />
          )}
        </div>
      </Modal>
    </>
  );
}

/* ── Search icon button — exported for parent to use in header ── */
export function TranscriptSearchButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        border: "none",
        background: "transparent",
        cursor: "pointer",
        color: "var(--text-muted)",
        fontSize: 12,
        padding: "4px 8px",
        borderRadius: 6,
        display: "flex",
        alignItems: "center",
        gap: 4,
        transition: "color 0.15s",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.color = "var(--accent)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-muted)"; }}
      title="Tìm trong transcript (⌘F)"
    >
      <SearchOutlined style={{ fontSize: 12 }} />
    </button>
  );
}

function findActiveIndex(segments: Segment[], t: number): number {
  if (segments.length === 0) return -1;
  let lo = 0, hi = segments.length - 1, ans = -1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    const s = segments[mid]!;
    if (s.start <= t && t < s.start + s.duration) return mid;
    if (s.start <= t) { ans = mid; lo = mid + 1; }
    else hi = mid - 1;
  }
  return ans;
}

function renderClickableText(
  text: string,
  onWord: (word: string, e: React.MouseEvent) => void,
): React.ReactNode {
  const parts: React.ReactNode[] = [];
  let lastIdx = 0;
  let key = 0;

  text.replace(WORD_PATTERN, (match, offset: number) => {
    if (offset > lastIdx) parts.push(text.slice(lastIdx, offset));
    parts.push(
      <span
        key={key++}
        onClick={(e) => onWord(match, e)}
        style={{ cursor: "pointer", borderRadius: 3, transition: "background 0.12s" }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLSpanElement).style.background = "color-mix(in srgb, var(--accent) 18%, transparent)"; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLSpanElement).style.background = "transparent"; }}
      >
        {match}
      </span>,
    );
    lastIdx = offset + match.length;
    return match;
  });
  if (lastIdx < text.length) parts.push(text.slice(lastIdx));
  return parts;
}

function highlightMatch(
  text: string,
  query: string,
  onWord: (word: string, e: React.MouseEvent) => void,
): React.ReactNode {
  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();
  const parts: React.ReactNode[] = [];
  let lastIdx = 0;
  let key = 0;
  let searchIdx = lowerText.indexOf(lowerQuery);

  while (searchIdx !== -1) {
    // Add text before match
    if (searchIdx > lastIdx) {
      parts.push(
        ...renderClickableTextAsArray(text.slice(lastIdx, searchIdx), onWord, key),
      );
      key += 100;
    }
    // Add highlighted match
    const matchText = text.slice(searchIdx, searchIdx + query.length);
    parts.push(
      <span
        key={`hl-${key++}`}
        style={{
          background: "color-mix(in srgb, var(--accent) 25%, transparent)",
          borderRadius: 3,
          padding: "1px 2px",
          fontWeight: 600,
          cursor: "pointer",
        }}
        onClick={(e) => {
          e.stopPropagation();
          const word = matchText.replace(/[^a-zA-Z'-]/g, "");
          if (word) onWord(word, e);
        }}
      >
        {matchText}
      </span>,
    );
    lastIdx = searchIdx + query.length;
    searchIdx = lowerText.indexOf(lowerQuery, lastIdx);
  }

  // Add remaining text
  if (lastIdx < text.length) {
    parts.push(...renderClickableTextAsArray(text.slice(lastIdx), onWord, key));
  }

  return parts;
}

function renderClickableTextAsArray(
  text: string,
  onWord: (word: string, e: React.MouseEvent) => void,
  startKey: number,
): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  let lastIdx = 0;
  let key = startKey;

  text.replace(WORD_PATTERN, (match, offset: number) => {
    if (offset > lastIdx) parts.push(text.slice(lastIdx, offset));
    parts.push(
      <span
        key={key++}
        onClick={(e) => onWord(match, e)}
        style={{ cursor: "pointer", borderRadius: 3, transition: "background 0.12s" }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLSpanElement).style.background = "color-mix(in srgb, var(--accent) 18%, transparent)"; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLSpanElement).style.background = "transparent"; }}
      >
        {match}
      </span>,
    );
    lastIdx = offset + match.length;
    return match;
  });
  if (lastIdx < text.length) parts.push(text.slice(lastIdx));
  return parts;
}
