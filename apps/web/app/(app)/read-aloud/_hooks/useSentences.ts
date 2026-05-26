"use client";

import { useCallback, useRef, useState } from "react";

/**
 * useSentences — splits text into sentences and manages per-sentence TTS playback
 * with karaoke-style highlighting.
 *
 * Uses batch TTS to fetch ALL sentence audio in a single API call,
 * preventing 429 rate-limit errors from concurrent/sequential requests.
 *
 * Flow: split text → batch TTS all sentences → play sequentially → highlight active
 */

/* ── Sentence splitting ── */
export function splitIntoSentences(text: string): string[] {
  if (!text.trim()) return [];
  // Split on sentence-ending punctuation followed by space or end-of-string
  const matches = text.trim().match(/[^.!?]*[.!?]+(?:\s+|$)/g);
  if (!matches) return [text.trim()];
  // Clean up and filter empty
  return matches.map((s) => s.trim()).filter(Boolean);
}

/* ── Per-sentence audio cache ── */
const sentenceAudioCache = new Map<string, string>(); // cacheKey → objectURL

function makeSentenceKey(sentence: string, voice: string, speed: number): string {
  return `sent|${voice}|${speed}|${sentence.trim()}`;
}

export type SentenceState = "idle" | "loading" | "ready" | "playing" | "done";

export interface SentenceItem {
  text: string;
  index: number;
  state: SentenceState;
  audioUrl?: string;
}

interface UseSentencesReturn {
  sentences: SentenceItem[];
  activeSentenceIndex: number;
  isPlaying: boolean;
  isLoading: boolean;
  batchProgress: { loaded: number; total: number } | null;
  /** Initialize sentences from text */
  init: (text: string) => void;
  /** Play all sentences sequentially from the start or a specific index */
  playAll: (voiceRole: string, speed: number, startIndex?: number) => Promise<void>;
  /** Play a single sentence (loop-friendly) */
  playSingle: (index: number, voiceRole: string, speed: number) => Promise<void>;
  /** Stop playback */
  stop: () => void;
  /** Reset all state */
  reset: () => void;
}

export function useSentences(): UseSentencesReturn {
  const [sentences, setSentences] = useState<SentenceItem[]>([]);
  const [activeSentenceIndex, setActiveSentenceIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [batchProgress, setBatchProgress] = useState<{ loaded: number; total: number } | null>(
    null,
  );

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const stoppedRef = useRef(false);

  /* ── Init ── */
  const init = useCallback((text: string) => {
    const parts = splitIntoSentences(text);
    setSentences(parts.map((t, i) => ({ text: t, index: i, state: "idle" })));
    setActiveSentenceIndex(-1);
    setIsPlaying(false);
    setIsLoading(false);
  }, []);

  /* ── Play one sentence (returns promise that resolves when done) ── */
  const playOneSentence = useCallback((url: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => resolve();
      audio.onerror = () => reject(new Error("Audio playback error"));
      audio.play().catch(reject);
    });
  }, []);

  /* ── Update sentence state helper ── */
  const updateSentenceState = useCallback(
    (index: number, state: SentenceState, audioUrl?: string) => {
      setSentences((prev) =>
        prev.map((s, i) => (i === index ? { ...s, state, ...(audioUrl ? { audioUrl } : {}) } : s)),
      );
    },
    [],
  );

  /* ── Batch fetch audio for multiple sentences ── */
  const batchFetchSentenceAudio = useCallback(
    async (
      sentenceTexts: string[],
      voiceRole: string,
      speed: number,
      signal: AbortSignal,
    ): Promise<string[]> => {
      // Check which sentences are already cached
      const uncachedIndices: number[] = [];
      for (let i = 0; i < sentenceTexts.length; i++) {
        const key = makeSentenceKey(sentenceTexts[i], voiceRole, speed);
        if (!sentenceAudioCache.has(key)) {
          uncachedIndices.push(i);
        }
      }

      // If everything is cached, return immediately
      if (uncachedIndices.length === 0) {
        return sentenceTexts.map((text) => {
          const key = makeSentenceKey(text, voiceRole, speed);
          return sentenceAudioCache.get(key)!;
        });
      }

      // Build batch request for uncached sentences
      const batchLines = uncachedIndices.map((i) => ({
        text: sentenceTexts[i],
        voice: voiceRole,
      }));

      setBatchProgress({
        loaded: sentenceTexts.length - uncachedIndices.length,
        total: sentenceTexts.length,
      });

      const res = await fetch("/api/read-aloud/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lines: batchLines, speed }),
        signal,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(err.error || `HTTP ${res.status}`);
      }

      const data: { segments: string[] } = await res.json();

      // Decode base64 → blob URLs and cache
      for (let j = 0; j < uncachedIndices.length; j++) {
        const i = uncachedIndices[j];
        const key = makeSentenceKey(sentenceTexts[i], voiceRole, speed);

        const binary = atob(data.segments[j]);
        const bytes = new Uint8Array(binary.length);
        for (let k = 0; k < binary.length; k++) bytes[k] = binary.charCodeAt(k);
        const blob = new Blob([bytes], { type: "audio/wav" });
        const url = URL.createObjectURL(blob);
        sentenceAudioCache.set(key, url);
      }

      setBatchProgress(null);

      // Return all URLs in order
      return sentenceTexts.map((text) => {
        const key = makeSentenceKey(text, voiceRole, speed);
        return sentenceAudioCache.get(key)!;
      });
    },
    [],
  );

  /* ── Fetch audio for a single sentence (fallback for playSingle) ── */
  const fetchSentenceAudio = useCallback(
    async (
      sentence: string,
      voiceRole: string,
      speed: number,
      signal: AbortSignal,
    ): Promise<string> => {
      const key = makeSentenceKey(sentence, voiceRole, speed);
      const cached = sentenceAudioCache.get(key);
      if (cached) return cached;

      const res = await fetch("/api/read-aloud", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: sentence.trim(), voice: voiceRole, speed }),
        signal,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(err.error || `HTTP ${res.status}`);
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      sentenceAudioCache.set(key, url);
      return url;
    },
    [],
  );

  /* ── Play all sentences — batch fetch first, then play sequentially ── */
  const playAll = useCallback(
    async (voiceRole: string, speed: number, startIndex = 0) => {
      stoppedRef.current = false;
      setIsPlaying(true);
      setIsLoading(true);
      abortRef.current = new AbortController();
      const signal = abortRef.current.signal;

      try {
        const sentenceTexts = sentences.slice(startIndex).map((s) => s.text);

        // Mark all as loading
        for (let i = startIndex; i < sentences.length; i++) {
          updateSentenceState(i, "loading");
        }

        // Batch fetch ALL audio in one API call
        const audioUrls = await batchFetchSentenceAudio(sentenceTexts, voiceRole, speed, signal);

        if (stoppedRef.current) return;

        // Mark all as ready
        for (let i = 0; i < sentenceTexts.length; i++) {
          updateSentenceState(startIndex + i, "ready", audioUrls[i]);
        }
        setIsLoading(false);

        // Play sequentially — all audio is already loaded
        for (let i = 0; i < sentenceTexts.length; i++) {
          if (stoppedRef.current) break;

          const actualIndex = startIndex + i;
          setActiveSentenceIndex(actualIndex);
          updateSentenceState(actualIndex, "playing", audioUrls[i]);

          await playOneSentence(audioUrls[i]);

          if (stoppedRef.current) break;
          updateSentenceState(actualIndex, "done");
        }
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return;
        /* toast: error */
      } finally {
        setIsPlaying(false);
        setIsLoading(false);
        setBatchProgress(null);
        if (!stoppedRef.current) {
          setActiveSentenceIndex(-1);
        }
      }
    },
    [sentences, batchFetchSentenceAudio, playOneSentence, updateSentenceState],
  );

  /* ── Play single sentence ── */
  const playSingle = useCallback(
    async (index: number, voiceRole: string, speed: number) => {
      stoppedRef.current = false;
      setIsPlaying(true);
      setActiveSentenceIndex(index);
      abortRef.current = new AbortController();

      try {
        updateSentenceState(index, "loading");
        setIsLoading(true);

        const url = await fetchSentenceAudio(
          sentences[index].text,
          voiceRole,
          speed,
          abortRef.current.signal,
        );

        if (stoppedRef.current) return;

        updateSentenceState(index, "playing", url);
        setIsLoading(false);

        await playOneSentence(url);

        if (!stoppedRef.current) {
          updateSentenceState(index, "done");
        }
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return;
        /* toast: error */
      } finally {
        setIsPlaying(false);
        setIsLoading(false);
      }
    },
    [sentences, fetchSentenceAudio, playOneSentence, updateSentenceState],
  );

  /* ── Stop ── */
  const stop = useCallback(() => {
    stoppedRef.current = true;
    if (abortRef.current) abortRef.current.abort();
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    setIsPlaying(false);
    setIsLoading(false);
    setBatchProgress(null);
    setActiveSentenceIndex(-1);
    setSentences((prev) => prev.map((s) => ({ ...s, state: "idle" })));
  }, []);

  /* ── Reset ── */
  const reset = useCallback(() => {
    stop();
    setSentences([]);
  }, [stop]);

  return {
    sentences,
    activeSentenceIndex,
    isPlaying,
    isLoading,
    batchProgress,
    init,
    playAll,
    playSingle,
    stop,
    reset,
  };
}
