"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api-client";

/* ── Types ── */
export interface HistoryEntry {
  id: string;
  mode: string;
  text: string | null;
  dialogueId: string | null;
  voiceRole: string;
  speed: number;
  wordCount: number;
  shadowScore: number | null;
  preview: string | null;
  createdAt: string;
}

/** Compat alias — maps DB fields to old shape for HistoryPanel */
export interface HistoryEntryCompat {
  id: string;
  text: string;
  voice: string;
  speed: number;
  createdAt: string;
  wordCount: number;
  preview: string;
  mode?: string;
  shadowScore?: number | null;
}

/* ── Format time ago ── */
export function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffS = Math.floor((now - then) / 1000);
  if (diffS < 60) return "just now";
  if (diffS < 3600) return `${Math.floor(diffS / 60)}m ago`;
  if (diffS < 86400) return `${Math.floor(diffS / 3600)}h ago`;
  return `${Math.floor(diffS / 86400)}d ago`;
}

function toCompat(entry: HistoryEntry): HistoryEntryCompat {
  return {
    id: entry.id,
    text: entry.text ?? "",
    voice: entry.voiceRole,
    speed: entry.speed,
    createdAt: entry.createdAt,
    wordCount: entry.wordCount,
    preview: entry.preview ?? (entry.text ? entry.text.slice(0, 80) : "(Dialogue)"),
    mode: entry.mode,
    shadowScore: entry.shadowScore,
  };
}

/* ── Hook ── */
export function useHistory() {
  const [rawEntries, setRawEntries] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const history = rawEntries.map(toCompat);

  // Load on mount
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const data = await api.get<{ sessions: HistoryEntry[] }>("/read-aloud/history?limit=50");
        if (data?.sessions) {
          setRawEntries(data.sessions);
        }
      } catch {
        // Fallback: try localStorage for backwards compat
        try {
          const raw = localStorage.getItem("read-aloud-history");
          if (raw) {
            const old = JSON.parse(raw) as Array<{
              id: string;
              text: string;
              voice: string;
              speed: number;
              createdAt: string;
              wordCount: number;
              preview: string;
            }>;
            setRawEntries(
              old.map((o) => ({
                id: o.id,
                mode: "listen",
                text: o.text,
                dialogueId: null,
                voiceRole: o.voice,
                speed: o.speed,
                wordCount: o.wordCount,
                shadowScore: null,
                preview: o.preview,
                createdAt: o.createdAt,
              })),
            );
          }
        } catch {
          /* ignore */
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const add = useCallback(async (text: string, voice: string, speed: number) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    // Optimistic update
    const tempId = `temp-${Date.now()}`;
    const preview = trimmed.length > 80 ? trimmed.slice(0, 77) + "..." : trimmed;
    const tempEntry: HistoryEntry = {
      id: tempId,
      mode: "listen",
      text: trimmed,
      dialogueId: null,
      voiceRole: voice,
      speed,
      wordCount: trimmed.split(/\s+/).length,
      shadowScore: null,
      preview,
      createdAt: new Date().toISOString(),
    };

    setRawEntries((prev) => [tempEntry, ...prev]);

    try {
      const result = await api.post<{ id: string }>("/read-aloud/history", {
        mode: "listen",
        text: trimmed,
        voiceRole: voice,
        speed,
        wordCount: trimmed.split(/\s+/).length,
        preview,
      });
      if (result?.id) {
        // Replace temp with real id
        setRawEntries((prev) => prev.map((e) => (e.id === tempId ? { ...e, id: result.id } : e)));
      }
    } catch {
      // If API fails, keep optimistic entry
    }
  }, []);

  const remove = useCallback(async (id: string) => {
    setRawEntries((prev) => prev.filter((e) => e.id !== id));

    try {
      await fetch(`/api/read-aloud/history`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
    } catch {
      /* silent */
    }
  }, []);

  const clearAll = useCallback(async () => {
    // Delete all by removing one-by-one (or could add bulk endpoint later)
    const ids = rawEntries.map((e) => e.id);
    setRawEntries([]);

    for (const id of ids.slice(0, 10)) {
      try {
        await fetch(`/api/read-aloud/history`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id }),
        });
      } catch {
        /* silent */
      }
    }

    // Also clear old localStorage
    try {
      localStorage.removeItem("read-aloud-history");
    } catch {
      /* */
    }
  }, [rawEntries]);

  return { history, loading, add, remove, clearAll };
}
