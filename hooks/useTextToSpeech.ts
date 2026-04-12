"use client";

import { useState, useRef, useCallback, useEffect } from "react";

/**
 * useTextToSpeech — OpenAI TTS-powered text-to-speech hook.
 *
 * Sends text to /api/voice/synthesize (OpenAI TTS API),
 * receives MP3 audio and plays it via HTMLAudioElement.
 *
 * Voice: "nova" (natural female English voice, good for teaching)
 * Speed: toggleable between 1.0 (normal) and 0.8 (slow)
 */
export function useTextToSpeech() {
  const [isSpeaking, setSpeaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [rate, setRate] = useState<1 | 0.8>(1);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Always supported — it's server-side, just needs fetch
  const isSupported = typeof window !== "undefined";

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      audioRef.current?.pause();
      abortRef.current?.abort();
    };
  }, []);

  const speak = useCallback(
    async (text: string) => {
      if (!isSupported || !text.trim()) return;

      // Stop any current playback
      audioRef.current?.pause();
      abortRef.current?.abort();

      const abortController = new AbortController();
      abortRef.current = abortController;

      setIsLoading(true);
      setSpeaking(false);

      try {
        const response = await fetch("/api/voice/synthesize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: text.slice(0, 4000), speed: rate }),
          signal: abortController.signal,
        });

        if (!response.ok) {
          throw new Error("TTS API error");
        }

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
    [isSupported, rate],
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
  };
}
