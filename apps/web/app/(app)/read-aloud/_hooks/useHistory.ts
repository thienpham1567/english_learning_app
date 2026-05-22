"use client";

import { useState, useEffect, useCallback } from "react";

const HISTORY_KEY = "read-aloud-history";
const MAX_HISTORY = 50;

/* ── Types ── */
export interface HistoryEntry {
  id: string;
  text: string;
  voice: string;
  speed: number;
  createdAt: string; // ISO string
  wordCount: number;
  preview: string; // first ~80 chars
}

/* ── localStorage helpers ── */
function loadHistory(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? (JSON.parse(raw) as HistoryEntry[]) : [];
  } catch {
    return [];
  }
}

function saveHistory(entries: HistoryEntry[]) {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(entries.slice(0, MAX_HISTORY)));
  } catch { /* quota exceeded — ignore */ }
}

function addEntry(text: string, voice: string, speed: number, existing: HistoryEntry[]): HistoryEntry[] {
  const trimmed = text.trim();
  const entries = [...existing];

  // De-dup: if identical text+voice+speed exists, move to top
  const existingIdx = entries.findIndex(
    (e) => e.text === trimmed && e.voice === voice && e.speed === speed,
  );
  if (existingIdx >= 0) {
    const [item] = entries.splice(existingIdx, 1);
    item.createdAt = new Date().toISOString();
    entries.unshift(item);
  } else {
    const preview = trimmed.length > 80 ? trimmed.slice(0, 77) + "..." : trimmed;
    entries.unshift({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      text: trimmed,
      voice,
      speed,
      createdAt: new Date().toISOString(),
      wordCount: trimmed.split(/\s+/).length,
      preview,
    });
  }

  const sliced = entries.slice(0, MAX_HISTORY);
  saveHistory(sliced);
  return sliced;
}

/* ── Format time ago ── */
export function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffS = Math.floor((now - then) / 1000);
  if (diffS < 60) return "vừa xong";
  if (diffS < 3600) return `${Math.floor(diffS / 60)} phút trước`;
  if (diffS < 86400) return `${Math.floor(diffS / 3600)} giờ trước`;
  return `${Math.floor(diffS / 86400)} ngày trước`;
}

/* ── Hook ── */
export function useHistory() {
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  // Load on mount
  useEffect(() => {
    setHistory(loadHistory());
  }, []);

  const add = useCallback((text: string, voice: string, speed: number) => {
    setHistory((prev) => addEntry(text, voice, speed, prev));
  }, []);

  const remove = useCallback((id: string) => {
    setHistory((prev) => {
      const next = prev.filter((e) => e.id !== id);
      saveHistory(next);
      return next;
    });
  }, []);

  const clearAll = useCallback(() => {
    setHistory([]);
    saveHistory([]);
  }, []);

  return { history, add, remove, clearAll };
}
