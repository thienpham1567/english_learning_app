"use client";

import { useState, useCallback, useRef } from "react";
import { message } from "antd";
import { VOICES } from "../_data/voices";

export interface DialogueLine {
  speaker: string; // "A" | "B" | "C"
  name: string;
  text: string;
}

export interface Dialogue {
  title: string;
  context: string;
  lines: DialogueLine[];
}

interface VoiceAssignment {
  speaker: string;
  voiceRole: string;
  voiceName: string;
  flag: string;
}

/**
 * useDialogue — orchestrates multi-voice dialogue playback and generation.
 */
export function useDialogue() {
  const [dialogue, setDialogue] = useState<Dialogue | null>(null);
  const [generating, setGenerating] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeLineIndex, setActiveLineIndex] = useState(-1);
  const [voiceAssignments, setVoiceAssignments] = useState<VoiceAssignment[]>([]);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const stoppedRef = useRef(false);

  /* ── Auto-assign contrasting voices ── */
  const assignVoices = useCallback((lines: DialogueLine[], primaryRole: string) => {
    const speakers = [...new Set(lines.map((l) => l.speaker))];
    const primaryVoice = VOICES.find((v) => v.role === primaryRole) ?? VOICES[0];

    // Pick contrasting voices (different accent/gender from primary)
    const alternatives = VOICES.filter((v) => v.role !== primaryRole);
    const contrastingVoices = [
      // Prefer different gender first, then different accent
      alternatives.find((v) => v.gender !== primaryVoice.gender && v.accent !== primaryVoice.accent),
      alternatives.find((v) => v.gender !== primaryVoice.gender),
      alternatives.find((v) => v.accent !== primaryVoice.accent),
      alternatives[0],
    ].filter(Boolean);

    const assignments: VoiceAssignment[] = speakers.map((s, i) => {
      const voice = i === 0 ? primaryVoice : contrastingVoices[i - 1] ?? VOICES[i % VOICES.length];
      return {
        speaker: s,
        voiceRole: voice.role,
        voiceName: voice.name,
        flag: voice.flag,
      };
    });

    setVoiceAssignments(assignments);
    return assignments;
  }, []);

  /* ── Generate dialogue ── */
  const generate = useCallback(async (options: {
    topic?: string;
    speakers?: 2 | 3;
    length?: "short" | "medium" | "long";
    primaryVoice: string;
  }) => {
    setGenerating(true);
    try {
      const res = await fetch("/api/read-aloud/dialogue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: options.topic,
          speakers: options.speakers ?? 2,
          length: options.length ?? "medium",
        }),
      });

      if (!res.ok) throw new Error("Failed");
      const data: Dialogue = await res.json();
      setDialogue(data);
      assignVoices(data.lines, options.primaryVoice);
      message.success(`✨ Đã tạo hội thoại: ${data.title}`);
      return data;
    } catch {
      message.error("Không thể tạo hội thoại. Vui lòng thử lại.");
      return null;
    } finally {
      setGenerating(false);
    }
  }, [assignVoices]);

  /* ── TTS for a single line ── */
  const ttsLine = useCallback(async (text: string, voiceRole: string, speed: number, signal: AbortSignal): Promise<string> => {
    const res = await fetch("/api/read-aloud", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: text.trim(), voice: voiceRole, speed }),
      signal,
    });
    if (!res.ok) throw new Error("TTS failed");
    const blob = await res.blob();
    return URL.createObjectURL(blob);
  }, []);

  /* ── Play single audio ── */
  const playAudio = useCallback((url: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => resolve();
      audio.onerror = () => reject(new Error("Playback error"));
      audio.play().catch(reject);
    });
  }, []);

  /* ── Play all lines sequentially ── */
  const playAll = useCallback(async (speed: number, startIndex = 0) => {
    if (!dialogue || voiceAssignments.length === 0) return;

    stoppedRef.current = false;
    setIsPlaying(true);
    abortRef.current = new AbortController();

    try {
      for (let i = startIndex; i < dialogue.lines.length; i++) {
        if (stoppedRef.current) break;

        setActiveLineIndex(i);
        setIsLoading(true);

        const line = dialogue.lines[i];
        const assignment = voiceAssignments.find((a) => a.speaker === line.speaker) ?? voiceAssignments[0];

        const url = await ttsLine(line.text, assignment.voiceRole, speed, abortRef.current.signal);

        if (stoppedRef.current) break;
        setIsLoading(false);

        await playAudio(url);

        // Small gap between speakers
        if (i < dialogue.lines.length - 1 && !stoppedRef.current) {
          await new Promise((r) => setTimeout(r, 300));
        }
      }
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      message.error("Lỗi phát audio");
    } finally {
      setIsPlaying(false);
      setIsLoading(false);
      if (!stoppedRef.current) setActiveLineIndex(-1);
    }
  }, [dialogue, voiceAssignments, ttsLine, playAudio]);

  /* ── Play single line ── */
  const playSingleLine = useCallback(async (index: number, speed: number) => {
    if (!dialogue || voiceAssignments.length === 0) return;

    stoppedRef.current = false;
    setIsPlaying(true);
    setActiveLineIndex(index);
    abortRef.current = new AbortController();

    try {
      const line = dialogue.lines[index];
      const assignment = voiceAssignments.find((a) => a.speaker === line.speaker) ?? voiceAssignments[0];

      setIsLoading(true);
      const url = await ttsLine(line.text, assignment.voiceRole, speed, abortRef.current.signal);

      if (stoppedRef.current) return;
      setIsLoading(false);

      await playAudio(url);
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      message.error("Lỗi phát audio");
    } finally {
      setIsPlaying(false);
      setIsLoading(false);
    }
  }, [dialogue, voiceAssignments, ttsLine, playAudio]);

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
    setActiveLineIndex(-1);
  }, []);

  /* ── Reset ── */
  const reset = useCallback(() => {
    stop();
    setDialogue(null);
    setVoiceAssignments([]);
  }, [stop]);

  return {
    dialogue,
    generating,
    isPlaying,
    isLoading,
    activeLineIndex,
    voiceAssignments,
    generate,
    playAll,
    playSingleLine,
    stop,
    reset,
  };
}
