"use client";

import { useEffect, useRef, useState } from "react";
import { SearchOutlined, LoadingOutlined } from "@ant-design/icons";
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

  const [lookupOpen, setLookupOpen] = useState(false);
  const [lookupWord, setLookupWord] = useState<string | null>(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupResult, setLookupResult] = useState<VocabularyWithNearby | null>(null);
  const [lookupSaved, setLookupSaved] = useState<boolean | null>(null);
  const [lookupErr, setLookupErr] = useState<string | null>(null);
  const reqIdRef = useRef(0);

  useEffect(() => {
    if (!autoScroll || activeIdx < 0) return;
    const el = containerRef.current?.querySelector<HTMLElement>(`[data-seg="${activeIdx}"]`);
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [activeIdx, autoScroll]);

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

  return (
    <>
      <div
        ref={containerRef}
        style={{
          flex: 1, minHeight: 0, overflow: "auto",
          padding: "10px 12px",
          display: "flex", flexDirection: "column", gap: 4,
        }}
      >
        {segments.map((seg, i) => {
          const isActive = i === activeIdx;
          return (
            <div
              key={i}
              data-seg={i}
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
                {renderClickableText(seg.text, (w, e) => { e.stopPropagation(); handleWordClick(w); })}
              </p>
            </div>
          );
        })}
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
