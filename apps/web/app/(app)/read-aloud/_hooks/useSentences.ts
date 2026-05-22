"use client";

import { useState, useCallback, useRef } from "react";
import { message } from "antd";

/**
 * useSentences — splits text into sentences and manages per-sentence TTS playback
 * with karaoke-style highlighting.
 *
 * Flow: split text → TTS each sentence → play sequentially → highlight active
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

  /* ── Fetch audio for a single sentence ── */
  const fetchSentenceAudio = useCallback(async (
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
  const updateSentenceState = useCallback((index: number, state: SentenceState, audioUrl?: string) => {
    setSentences((prev) =>
      prev.map((s, i) => (i === index ? { ...s, state, ...(audioUrl ? { audioUrl } : {}) } : s)),
    );
  }, []);

  /* ── Play all sentences sequentially ── */
  const playAll = useCallback(async (voiceRole: string, speed: number, startIndex = 0) => {
    stoppedRef.current = false;
    setIsPlaying(true);
    abortRef.current = new AbortController();

    try {
      for (let i = startIndex; i < sentences.length; i++) {
        if (stoppedRef.current) break;

        setActiveSentenceIndex(i);
        updateSentenceState(i, "loading");
        setIsLoading(true);

        const url = await fetchSentenceAudio(
          sentences[i].text,
          voiceRole,
          speed,
          abortRef.current.signal,
        );

        if (stoppedRef.current) break;

        updateSentenceState(i, "playing", url);
        setIsLoading(false);

        await playOneSentence(url);

        if (stoppedRef.current) break;
        updateSentenceState(i, "done");
      }
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      message.error(err instanceof Error ? err.message : "Lỗi phát audio");
    } finally {
      setIsPlaying(false);
      setIsLoading(false);
      if (!stoppedRef.current) {
        setActiveSentenceIndex(-1);
      }
    }
  }, [sentences, fetchSentenceAudio, playOneSentence, updateSentenceState]);

  /* ── Play single sentence ── */
  const playSingle = useCallback(async (index: number, voiceRole: string, speed: number) => {
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
      message.error(err instanceof Error ? err.message : "Lỗi phát audio");
    } finally {
      setIsPlaying(false);
      setIsLoading(false);
    }
  }, [sentences, fetchSentenceAudio, playOneSentence, updateSentenceState]);

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
    init,
    playAll,
    playSingle,
    stop,
    reset,
  };
}
