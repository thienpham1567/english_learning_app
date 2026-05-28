"use client";

import { toast } from "sonner";
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
      toast.warning("Please enter some text first.");
      return;
    }
    if (text.length > MAX_CHARS) {
      toast.warning(`Text is too long! Maximum ${MAX_CHARS.toLocaleString()} characters.`);
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
        toast.error("Audio playback failed. Please try again.");
      };
      try {
        await audio.play();
        setPlaying(true);
        setLoading(false);
        return true; // cached
      } catch {
        setPlaying(false);
        setLoading(false);
        toast.error("Could not play cached audio.");
        return;
      }
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
        const err = await res.json().catch(() => ({ error: "Unknown error" }));
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
        toast.error("Audio playback failed. Please try again.");
      };
      await audio.play();
      setPlaying(true);
      return false; // not cached
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") return;
      const message = err instanceof Error ? err.message : "Could not generate audio.";
      // Surface user-friendly messages for known errors
      if (message.includes("429") || message.includes("giới hạn") || message.includes("rate")) {
        toast.error("Rate limit reached. Please wait a moment and try again.", {
          description: "The voice synthesis service is temporarily busy.",
          duration: 6000,
        });
      } else if (message.includes("exhausted retries")) {
        toast.error("Voice service is overloaded. Please try again in a few minutes.", {
          description: "All retry attempts failed due to rate limiting.",
          duration: 8000,
        });
      } else {
        toast.error(message, { duration: 5000 });
      }
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
