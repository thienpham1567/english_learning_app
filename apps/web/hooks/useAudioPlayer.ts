"use client";

import { useCallback, useRef, useState } from "react";
import { api } from "@/lib/api-client";

/**
 * Encapsulates TTS audio playback with Groq Orpheus API + browser fallback.
 * Manages a single active audio stream at a time, properly cleaning up
 * object URLs and aborting in-flight requests on unmount or re-trigger.
 */
export function useAudioPlayer() {
  const [speakingLocale, setSpeakingLocale] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const urlRef = useRef<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const cleanup = useCallback(() => {
    audioRef.current?.pause();
    abortRef.current?.abort();
    if (urlRef.current) {
      URL.revokeObjectURL(urlRef.current);
      urlRef.current = null;
    }
    audioRef.current = null;
    abortRef.current = null;
  }, []);

  const speak = useCallback(
    async (text: string, locale: "en-US" | "en-GB") => {
      cleanup();

      const controller = new AbortController();
      abortRef.current = controller;
      const accent = locale === "en-GB" ? "uk" : "us";
      setSpeakingLocale(locale);

      try {
        const response = await api.post<Response>(
          "/voice/synthesize",
          { text, accent },
          { raw: true, signal: controller.signal },
        );
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        urlRef.current = url;
        const audio = new Audio(url);
        audioRef.current = audio;

        audio.onended = () => {
          setSpeakingLocale((curr) => (curr === locale ? null : curr));
          URL.revokeObjectURL(url);
          if (urlRef.current === url) urlRef.current = null;
        };
        audio.onerror = () => {
          setSpeakingLocale((curr) => (curr === locale ? null : curr));
          URL.revokeObjectURL(url);
          if (urlRef.current === url) urlRef.current = null;
        };

        await audio.play();
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          console.warn("[useAudioPlayer] TTS API failed, using browser fallback:", err);
          if (typeof window !== "undefined" && window.speechSynthesis) {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = locale;
            utterance.rate = 0.9;
            utterance.onend = () =>
              setSpeakingLocale((curr) => (curr === locale ? null : curr));
            utterance.onerror = () =>
              setSpeakingLocale((curr) => (curr === locale ? null : curr));
            window.speechSynthesis.cancel();
            window.speechSynthesis.speak(utterance);
            return;
          }
        }
        setSpeakingLocale((curr) => (curr === locale ? null : curr));
      }
    },
    [cleanup],
  );

  return { speakingLocale, speak, cleanup };
}
