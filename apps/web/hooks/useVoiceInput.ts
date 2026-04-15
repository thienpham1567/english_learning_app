"use client";

import { useState, useRef, useCallback, useEffect } from "react";

/**
 * useVoiceInput — OpenAI Whisper-powered speech-to-text hook.
 *
 * Records audio via MediaRecorder, sends to /api/voice/transcribe (Whisper API),
 * returns high-quality transcription.
 *
 * Falls back gracefully if:
 * - MediaRecorder not available (isSupported = false, mic button hidden)
 * - Microphone permission denied (error state)
 * - API key not configured (server returns 500, shown as error)
 */
export function useVoiceInput() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const [isSupported, setIsSupported] = useState(false);

  // Detect support after mount to avoid SSR hydration mismatch
  useEffect(() => {
    setIsSupported(
      !!navigator.mediaDevices?.getUserMedia &&
      typeof MediaRecorder !== "undefined"
    );
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mediaRecorderRef.current?.stop();
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const start = useCallback(async () => {
    if (!isSupported) return;
    setError(null);
    setTranscript("");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });
      streamRef.current = stream;

      // Prefer webm, fall back to mp4
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/mp4")
          ? "audio/mp4"
          : "";

      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        // Stop mic stream
        stream.getTracks().forEach((t) => t.stop());
        streamRef.current = null;

        if (chunksRef.current.length === 0) {
          setIsListening(false);
          return;
        }

        const audioBlob = new Blob(chunksRef.current, {
          type: mimeType || "audio/webm",
        });

        // Send to Whisper API
        setIsTranscribing(true);
        try {
          const formData = new FormData();
          formData.append("audio", audioBlob, "recording.webm");

          const res = await fetch("/api/voice/transcribe", {
            method: "POST",
            body: formData,
          });

          if (!res.ok) {
            const err = await res.json().catch(() => ({ error: "Transcription failed" }));
            throw new Error(err.error || "Transcription failed");
          }

          const result = (await res.json()) as { text: string };
          setTranscript(result.text);
        } catch (err) {
          console.warn("[useVoiceInput] Transcription error:", err);
          setError(err instanceof Error ? err.message : "Transcription failed");
        } finally {
          setIsTranscribing(false);
        }
      };

      mediaRecorderRef.current = recorder;
      recorder.start(200); // collect chunks every 200ms
      setIsListening(true);
    } catch (err) {
      console.warn("[useVoiceInput] Mic access error:", err);
      setError("Không thể truy cập microphone");
      setIsListening(false);
    }
  }, [isSupported]);

  const stop = useCallback(() => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    setIsListening(false);
  }, []);

  return {
    isListening,
    /** Whether audio is being sent to Whisper for transcription */
    isTranscribing,
    /** Final transcribed text from Whisper */
    transcript,
    /** Combined display text (shows "Đang nhận dạng..." while transcribing) */
    fullTranscript: isTranscribing ? "" : transcript,
    start,
    stop,
    isSupported,
    error,
  };
}
