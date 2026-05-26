"use client";

import { useCallback, useRef, useState } from "react";


const MAX_CHARS = 10_000;
const LRU_MAX = 15;

/* ── LRU blob cache ── */
const lruKeys: string[] = [];
const blobCache = new Map<string, string>(); // cacheKey → objectURL

function makeCacheKey(text: string, voice: string, speed: number): string {
  return `${voice}|${speed}|${text.trim()}`;
}

function setCached(key: string, url: string) {
  // If already exists, move to end (most recent)
  const idx = lruKeys.indexOf(key);
  if (idx >= 0) lruKeys.splice(idx, 1);
  lruKeys.push(key);
  blobCache.set(key, url);

  // Evict oldest if over limit
  while (lruKeys.length > LRU_MAX) {
    const evictKey = lruKeys.shift()!;
    const evictUrl = blobCache.get(evictKey);
    if (evictUrl) URL.revokeObjectURL(evictUrl);
    blobCache.delete(evictKey);
  }
}

function getCached(key: string): string | undefined {
  return blobCache.get(key);
}

export function clearBlobCache() {
  for (const [, url] of blobCache) {
    URL.revokeObjectURL(url);
  }
  blobCache.clear();
  lruKeys.length = 0;
}

export function isCached(text: string, voice: string, speed: number): boolean {
  return blobCache.has(makeCacheKey(text, voice, speed));
}

/* ── Hook ── */
export function useAudioPlayback() {
  const [loading, setLoading] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const generate = useCallback(async (text: string, voiceRole: string, speed: number) => {
    if (!text.trim()) {
      /* toast: warning */
      return;
    }
    if (text.length > MAX_CHARS) {
      console.warn(`Văn bản quá dài! Tối đa ${MAX_CHARS.toLocaleString()} ký tự.`);
      return;
    }

    // Stop current playback
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setAudioUrl(null);
    setLoading(true);
    setPlaying(false);

    const cacheKey = makeCacheKey(text, voiceRole, speed);

    // Check client blob cache first
    const cachedUrl = getCached(cacheKey);
    if (cachedUrl) {
      setAudioUrl(cachedUrl);
      const audio = new Audio(cachedUrl);
      audioRef.current = audio;
      audio.onended = () => setPlaying(false);
      audio.onerror = () => {
        setPlaying(false);
        /* toast: error */
      };
      await audio.play();
      setPlaying(true);
      setLoading(false);
      /* toast: success */
      return true; // cached
    }

    abortRef.current = new AbortController();

    try {
      const res = await fetch("/api/read-aloud", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: text.trim(),
          voice: voiceRole,
          speed,
        }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Lỗi không xác định" }));
        throw new Error(err.error || `HTTP ${res.status}`);
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setAudioUrl(url);
      setCached(cacheKey, url);

      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => setPlaying(false);
      audio.onerror = () => {
        setPlaying(false);
        /* toast: error */
      };
      await audio.play();
      setPlaying(true);
      return false; // not cached
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") return;
      /* toast: error */
    } finally {
      setLoading(false);
    }
  }, []);

  const togglePlayback = useCallback(() => {
    if (!audioRef.current) return;
    if (playing) {
      audioRef.current.pause();
      setPlaying(false);
    } else {
      audioRef.current.play();
      setPlaying(true);
    }
  }, [playing]);

  const stop = useCallback(() => {
    if (abortRef.current) abortRef.current.abort();
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    setAudioUrl(null);
    setPlaying(false);
    setLoading(false);
  }, []);

  return {
    loading,
    playing,
    audioUrl,
    generate,
    togglePlayback,
    stop,
  };
}
