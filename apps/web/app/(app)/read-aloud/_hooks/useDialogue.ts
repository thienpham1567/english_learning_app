"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { message } from "antd";
import { api } from "@/lib/api-client";
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
/** Saved dialogue from DB */
export interface SavedDialogue {
  id: string;
  title: string;
  context: string | null;
  topic: string | null;
  speakerCount: number;
  linesJson: DialogueLine[];
  voiceConfigJson: VoiceAssignment[];
  rolePlayCount: number;
  bookmarked: boolean;
  createdAt: string;
}

export function useDialogue() {
  const [dialogue, setDialogue] = useState<Dialogue | null>(null);
  const [dialogueId, setDialogueId] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeLineIndex, setActiveLineIndex] = useState(-1);
  const [voiceAssignments, setVoiceAssignments] = useState<VoiceAssignment[]>([]);
  const [savedDialogues, setSavedDialogues] = useState<SavedDialogue[]>([]);
  const [loadingSaved, setLoadingSaved] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const stoppedRef = useRef(false);

  /* ── Auto-assign voices: match by character name → TTS voice name ── */
  const assignVoices = useCallback((lines: DialogueLine[], primaryRole: string) => {
    const speakers = [...new Set(lines.map((l) => l.speaker))];

    // Build a name → voice lookup from the 6 Groq voices
    const nameToVoice = new Map(VOICES.map((v) => [v.name.toLowerCase(), v]));

    // Try to find each speaker's character name in the dialogue lines
    const assignments: VoiceAssignment[] = speakers.map((s) => {
      const line = lines.find((l) => l.speaker === s);
      const charName = line?.name?.toLowerCase() ?? "";
      const matchedVoice = nameToVoice.get(charName);

      if (matchedVoice) {
        return {
          speaker: s,
          voiceRole: matchedVoice.role,
          voiceName: matchedVoice.name,
          flag: matchedVoice.flag,
        };
      }

      // Fallback: assign by index (for old dialogues with non-matching names)
      const fallback = VOICES[speakers.indexOf(s) % VOICES.length];
      return {
        speaker: s,
        voiceRole: fallback.role,
        voiceName: fallback.name,
        flag: fallback.flag,
      };
    });

    setVoiceAssignments(assignments);
    return assignments;
  }, []);

  /* ── Fetch saved dialogues ── */
  const fetchSavedDialogues = useCallback(async () => {
    setLoadingSaved(true);
    try {
      const data = await api.get<{ dialogues: SavedDialogue[] }>("/read-aloud/dialogues?limit=20");
      if (data?.dialogues) setSavedDialogues(data.dialogues);
    } catch { /* silent */ }
    finally { setLoadingSaved(false); }
  }, []);

  // Auto-fetch on mount
  useEffect(() => { fetchSavedDialogues(); }, [fetchSavedDialogues]);

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
      const assignments = assignVoices(data.lines, options.primaryVoice);
      message.success(`✨ Đã tạo hội thoại: ${data.title}`);

      // Auto-save to DB
      try {
        const saved = await api.post<{ id: string }>("/read-aloud/dialogues", {
          title: data.title,
          context: data.context,
          topic: options.topic,
          speakerCount: options.speakers ?? 2,
          lines: data.lines,
          voiceConfig: assignments,
        });
        if (saved?.id) {
          setDialogueId(saved.id);
          fetchSavedDialogues();
        }
      } catch { /* save failure is non-critical */ }

      return data;
    } catch {
      message.error("Không thể tạo hội thoại. Vui lòng thử lại.");
      return null;
    } finally {
      setGenerating(false);
    }
  }, [assignVoices, fetchSavedDialogues]);

  /* ── Load saved dialogue ── */
  const loadDialogue = useCallback((saved: SavedDialogue) => {
    setDialogue({
      title: saved.title,
      context: saved.context ?? "",
      lines: saved.linesJson,
    });
    setDialogueId(saved.id);
    setVoiceAssignments(saved.voiceConfigJson);
  }, []);

  /* ── Toggle bookmark ── */
  const toggleBookmark = useCallback(async (id: string) => {
    const dlg = savedDialogues.find((d) => d.id === id);
    if (!dlg) return;
    const newVal = !dlg.bookmarked;
    setSavedDialogues((prev) =>
      prev.map((d) => (d.id === id ? { ...d, bookmarked: newVal } : d)),
    );
    try {
      await api.patch("/read-aloud/dialogues", { id, bookmarked: newVal });
    } catch { /* silent */ }
  }, [savedDialogues]);

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
    setDialogueId(null);
    setVoiceAssignments([]);
  }, [stop]);

  return {
    dialogue,
    dialogueId,
    generating,
    isPlaying,
    isLoading,
    activeLineIndex,
    voiceAssignments,
    savedDialogues,
    loadingSaved,
    generate,
    playAll,
    playSingleLine,
    stop,
    reset,
    loadDialogue,
    toggleBookmark,
    fetchSavedDialogues,
  };
}
