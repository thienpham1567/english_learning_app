"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { api } from "@/lib/api-client";

export type TtsAccent = "us" | "uk" | "au";

/**
 * useTextToSpeech — Groq Orpheus TTS-powered text-to-speech hook.
 *
 * Sends text to /api/voice/synthesize (Groq Orpheus TTS),
 * receives WAV audio and plays it via HTMLAudioElement.
 *
 * Accent: "us" | "uk" | "au" — native neural voices per locale.
 * Speed: toggleable between 1.0 (normal) and 0.8 (slow).
 */
export function useTextToSpeech(defaultAccent: TtsAccent = "us") {
  const [isSpeaking, setSpeaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [rate, setRate] = useState<1 | 0.8>(1);
  const [accent, setAccent] = useState<TtsAccent>(defaultAccent);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const [isSupported] = useState(() => typeof window !== "undefined");

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
      abortRef.current?.abort();
    };
  }, []);

  const speak = useCallback(
    async (text: string, opts?: { accent?: TtsAccent }) => {
      if (!isSupported || !text.trim()) return;

      audioRef.current?.pause();
      abortRef.current?.abort();

      const abortController = new AbortController();
      abortRef.current = abortController;

      setIsLoading(true);
      setSpeaking(false);

      try {
        const response = await api.post<Response>("/voice/synthesize",
          {
            text: text.slice(0, 200),
            speed: rate,
            accent: opts?.accent ?? accent,
          },
          { raw: true, signal: abortController.signal },
        );

        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);

        const audio = new Audio(audioUrl);
        audioRef.current = audio;

        audio.onplay = () => {
          setIsLoading(false);
          setSpeaking(true);
        };
        audio.onended = () => {
          setSpeaking(false);
          URL.revokeObjectURL(audioUrl);
        };
        audio.onerror = () => {
          setSpeaking(false);
          setIsLoading(false);
          URL.revokeObjectURL(audioUrl);
        };

        await audio.play();
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          console.warn("[useTextToSpeech] Error:", err);
        }
        setIsLoading(false);
        setSpeaking(false);
      }
    },
    [isSupported, rate, accent],
  );

  const stop = useCallback(() => {
    audioRef.current?.pause();
    abortRef.current?.abort();
    setSpeaking(false);
    setIsLoading(false);
  }, []);

  const toggleRate = useCallback(() => {
    setRate((prev) => (prev === 1 ? 0.8 : 1));
  }, []);

  return {
    speak,
    stop,
    isSpeaking,
    /** Whether audio is being fetched from the API */
    isLoading,
    isSupported,
    /** Current playback rate: 1 (normal) or 0.8 (slow) */
    rate,
    toggleRate,
    accent,
    setAccent,
  };
}
