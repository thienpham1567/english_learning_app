"use client";

import { useState, useRef, useCallback, useEffect } from "react";

export function useTextToSpeech() {
  const [isSpeaking, setSpeaking] = useState(false);
  const [rate, setRate] = useState<1 | 0.8>(1);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const isSupported = typeof window !== "undefined" && "speechSynthesis" in window;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isSupported) {
        window.speechSynthesis.cancel();
      }
    };
  }, [isSupported]);

  const speak = useCallback(
    (text: string) => {
      if (!isSupported) return;

      // Cancel any current speech
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "en-US";
      utterance.rate = rate;
      utterance.pitch = 1;

      // Try to find a good English voice
      const voices = window.speechSynthesis.getVoices();
      const englishVoice = voices.find(
        (v) => v.lang.startsWith("en") && v.name.includes("Google")
      ) ?? voices.find((v) => v.lang.startsWith("en-US"))
        ?? voices.find((v) => v.lang.startsWith("en"));

      if (englishVoice) {
        utterance.voice = englishVoice;
      }

      utterance.onstart = () => setSpeaking(true);
      utterance.onend = () => setSpeaking(false);
      utterance.onerror = () => setSpeaking(false);

      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    },
    [isSupported, rate],
  );

  const stop = useCallback(() => {
    if (!isSupported) return;
    window.speechSynthesis.cancel();
    setSpeaking(false);
  }, [isSupported]);

  const toggleRate = useCallback(() => {
    setRate((prev) => (prev === 1 ? 0.8 : 1));
  }, []);

  return {
    speak,
    stop,
    isSpeaking,
    isSupported,
    /** Current playback rate: 1 (normal) or 0.8 (slow) */
    rate,
    toggleRate,
  };
}
