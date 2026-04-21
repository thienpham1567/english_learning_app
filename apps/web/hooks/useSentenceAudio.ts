"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { api } from "@/lib/api-client";

/**
 * useSentenceAudio — synthesizes a sentence via /api/voice/synthesize
 * and returns a blob URL for use with AudioPlayer.
 *
 * Manages its own loading state and cleans up object URLs on unmount
 * or when a new sentence is synthesized.
 */
export function useSentenceAudio(accent: "us" | "uk" | "au" = "us") {
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const urlRef = useRef<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Revoke the previous URL to free memory
  const revokePrevious = useCallback(() => {
    if (urlRef.current) {
      URL.revokeObjectURL(urlRef.current);
      urlRef.current = null;
    }
  }, []);

  const synthesize = useCallback(
    async (text: string): Promise<string | null> => {
      if (!text.trim()) return null;

      // Abort any in-flight request
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      revokePrevious();
      setIsLoading(true);
      setAudioUrl(null);

      try {
        const response = await api.post<Response>("/voice/synthesize",
          { text: text.slice(0, 4000), speed: 1, accent },
          { raw: true, signal: controller.signal },
        );

        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        urlRef.current = url;
        setAudioUrl(url);
        setIsLoading(false);
        return url;
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          console.warn("[useSentenceAudio] Synthesis failed:", err);
        }
        setIsLoading(false);
        return null;
      }
    },
    [accent, revokePrevious],
  );

  const clear = useCallback(() => {
    abortRef.current?.abort();
    revokePrevious();
    setAudioUrl(null);
    setIsLoading(false);
  }, [revokePrevious]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    };
  }, []);

  return { audioUrl, isLoading, synthesize, clear };
}
