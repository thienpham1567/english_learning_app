"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { PronFeedbackData } from "@/app/(app)/english-chatbot/_components/PronunciationFeedback";
import { useVoiceInput } from "@/hooks/useVoiceInput";
import { useTextToSpeech } from "@/hooks/useTextToSpeech";
import type { PageMessage } from "@/app/(app)/english-chatbot/_components/ChatMessage";
import { api } from "@/lib/api-client";

export type UseChatVoiceOptions = {
  /** Called when voice transcription finishes. Parent should call markVoiceText + send. */
  onTranscript: (text: string) => void;
};

export function useChatVoice({ onTranscript }: UseChatVoiceOptions) {
  const voice = useVoiceInput();
  const tts = useTextToSpeech();

  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);
  const [pronFeedback, setPronFeedback] = useState<Map<string, PronFeedbackData>>(new Map());
  const [pronEnabled, setPronEnabled] = useState(true);
  const [voiceMode, setVoiceMode] = useState(false);
  const [voiceExchanges, setVoiceExchanges] = useState(0);

  const voiceMessageIds = useRef<Set<string>>(new Set());
  const voiceModeRef = useRef(false);
  voiceModeRef.current = voiceMode;

  // When Whisper transcription completes, notify parent
  useEffect(() => {
    if (voice.transcript && !voice.isTranscribing) {
      onTranscript(voice.transcript);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [voice.transcript, voice.isTranscribing]);

  /** Mark a user message ID as voice-originated. */
  const trackVoiceMessage = useCallback((messageId: string) => {
    voiceMessageIds.current.add(messageId);
  }, []);

  /** Fire pronunciation evaluation for a voice message (non-blocking). */
  const evaluatePronunciation = useCallback(
    (messageId: string, text: string) => {
      if (!pronEnabled) return;
      setPronFeedback((prev) => new Map(prev).set(messageId, { status: "loading" }));
      api
        .post<{
          score: number;
          accuracy: number;
          fluency: number;
          wordAnalysis: PronFeedbackData["wordAnalysis"];
          tips: string[];
          feedback: string;
        }>("/pronunciation/evaluate", { targetText: text, spokenText: text })
        .then((result) => {
          setPronFeedback((prev) =>
            new Map(prev).set(messageId, {
              status: "done",
              score: result.score,
              accuracy: result.accuracy,
              fluency: result.fluency,
              wordAnalysis: result.wordAnalysis,
              tips: result.tips,
              feedback: result.feedback,
            }),
          );
        })
        .catch(() => {
          setPronFeedback((prev) => new Map(prev).set(messageId, { status: "error" }));
        });
    },
    [pronEnabled],
  );

  /** Auto-speak the last assistant message (voice mode). */
  const autoSpeakAssistant = useCallback(
    (messages: PageMessage[]) => {
      if (!voiceModeRef.current || !tts.isSupported) return;
      setTimeout(() => {
        const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant");
        if (lastAssistant && "text" in lastAssistant && lastAssistant.text) {
          tts.speak(lastAssistant.text);
          setVoiceExchanges((c) => c + 1);
        }
      }, 300);
    },
    [tts],
  );

  /** Speak a specific message. */
  const speakMessage = useCallback(
    (messageId: string, text: string) => {
      setSpeakingMsgId(messageId);
      tts.speak(text);
    },
    [tts],
  );

  /** Stop speaking. */
  const stopSpeaking = useCallback(() => {
    tts.stop();
    setSpeakingMsgId(null);
  }, [tts]);

  /** Toggle voice conversation mode. */
  const toggleVoiceMode = useCallback(() => {
    setVoiceMode((v) => {
      if (!v) setVoiceExchanges(0);
      return !v;
    });
  }, []);

  /** Reset voice state when conversation changes. */
  const resetVoiceState = useCallback(() => {
    setPronFeedback(new Map());
    voiceMessageIds.current.clear();
  }, []);

  /** Check if a message ID came from voice input. */
  const isVoiceMessage = useCallback((messageId: string) => {
    return voiceMessageIds.current.has(messageId);
  }, []);

  return {
    voice,
    tts,
    speakingMsgId,
    pronFeedback,
    pronEnabled,
    setPronEnabled,
    voiceMode,
    voiceExchanges,
    trackVoiceMessage,
    evaluatePronunciation,
    autoSpeakAssistant,
    speakMessage,
    stopSpeaking,
    toggleVoiceMode,
    resetVoiceState,
    isVoiceMessage,
  };
}
