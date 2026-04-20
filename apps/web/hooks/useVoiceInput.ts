"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { api } from "@/lib/api-client";

export type VoiceWord = { word: string; startMs: number; endMs: number };

export type UseVoiceInputOptions = {
  /** When false, the hook records and exposes the blob but does not POST to /voice/transcribe.
   *  Consumers (e.g. pronunciation scoring) can forward the blob to their own endpoint. */
  autoTranscribe?: boolean;
};

/**
 * useVoiceInput — Whisper-powered speech-to-text hook.
 *
 * Records via MediaRecorder, optionally posts to /api/voice/transcribe.
 * Exposes the raw blob, measured duration, and word-level timestamps so later
 * surfaces (pronunciation scoring, fluency metrics) can consume them directly.
 */
export function useVoiceInput(options: UseVoiceInputOptions = {}) {
  const { autoTranscribe = true } = options;

  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [durationMs, setDurationMs] = useState(0);
  const [words, setWords] = useState<VoiceWord[]>([]);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const startedAtRef = useRef<number>(0);
  const mountedRef = useRef(true);

  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    setIsSupported(
      !!navigator.mediaDevices?.getUserMedia &&
      typeof MediaRecorder !== "undefined"
    );
  }, []);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
      mediaRecorderRef.current?.stop();
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const start = useCallback(async () => {
    if (!isSupported) return;
    setError(null);
    setTranscript("");
    setBlob(null);
    setDurationMs(0);
    setWords([]);

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
        const measuredMs = Math.max(0, performance.now() - startedAtRef.current);
        stream.getTracks().forEach((t) => t.stop());
        streamRef.current = null;

        if (!mountedRef.current) return;

        if (chunksRef.current.length === 0) {
          setIsListening(false);
          return;
        }

        const audioBlob = new Blob(chunksRef.current, {
          type: mimeType || "audio/webm",
        });
        setBlob(audioBlob);
        setDurationMs(measuredMs);

        if (!autoTranscribe) {
          setIsListening(false);
          return;
        }

        setIsTranscribing(true);
        try {
          const formData = new FormData();
          formData.append("audio", audioBlob, "recording.webm");
          formData.append("durationMs", String(Math.round(measuredMs)));

          const res = await api.post<{
            text: string;
            durationSec: number;
            words: VoiceWord[];
          }>("/voice/transcribe", formData);
          if (!mountedRef.current) return;
          setTranscript(res.text);
          setWords(res.words ?? []);
        } catch (err) {
          if (!mountedRef.current) return;
          console.warn("[useVoiceInput] Transcription error:", err);
          setError(err instanceof Error ? err.message : "Transcription failed");
        } finally {
          if (mountedRef.current) setIsTranscribing(false);
        }
      };

      mediaRecorderRef.current = recorder;
      startedAtRef.current = performance.now();
      recorder.start(200);
      setIsListening(true);
    } catch (err) {
      console.warn("[useVoiceInput] Mic access error:", err);
      setError("Không thể truy cập microphone");
      setIsListening(false);
    }
  }, [isSupported, autoTranscribe]);

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
    /** Raw audio blob from the last recording (null until stop completes) */
    blob,
    /** Measured recording duration in milliseconds */
    durationMs,
    /** Word-level timestamps from verbose_json Whisper response (empty if provider omitted) */
    words,
    start,
    stop,
    isSupported,
    error,
  };
}
