"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { api } from "@/lib/api-client";
import { VOICES, type TtsProvider } from "../_data/voices";
import { getCachedAudio, setCachedAudio, makeCacheKey } from "../_lib/audio-cache";

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
  voiceId?: string;
  provider?: TtsProvider;
  flag: string;
  avatar: string;
}

/**
 * useDialogue — orchestrates multi-voice dialogue playback and generation.
 *
 * Uses batch TTS to fetch ALL dialogue audio in a single API call,
 * preventing 429 rate-limit errors from concurrent requests.
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
  /** Progress: how many lines have been pre-loaded so far */
  const [batchProgress, setBatchProgress] = useState<{ loaded: number; total: number } | null>(
    null,
  );

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const stoppedRef = useRef(false);

  /* ── Audio cache: lineIndex → objectURL ── */
  const audioCacheRef = useRef<Map<string, string>>(new Map());

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
          avatar: matchedVoice.avatar,
        };
      }

      // Fallback: assign by index (for old dialogues with non-matching names)
      const fallback = VOICES[speakers.indexOf(s) % VOICES.length];
      return {
        speaker: s,
        voiceRole: fallback.role,
        voiceName: fallback.name,
        flag: fallback.flag,
        avatar: fallback.avatar,
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
    } catch {
      /* silent */
    } finally {
      setLoadingSaved(false);
    }
  }, []);

  // Auto-fetch on mount
  useEffect(() => {
    fetchSavedDialogues();
  }, [fetchSavedDialogues]);

  /* ── Generate dialogue ── */
  const generate = useCallback(
    async (options: {
      topic?: string;
      speakers?: 2 | 3;
      length?: "short" | "medium" | "long";
      primaryVoice: string;
      voiceConfig?: VoiceAssignment[];
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
        // Use pre-configured voiceConfig if provided, otherwise auto-assign
        const assignments = options.voiceConfig
          ? (() => { setVoiceAssignments(options.voiceConfig); return options.voiceConfig; })()
          : assignVoices(data.lines, options.primaryVoice);
        /* toast: success */

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
        } catch {
          /* save failure is non-critical */
        }

        return data;
      } catch {
        /* toast: error */
        return null;
      } finally {
        setGenerating(false);
      }
    },
    [assignVoices, fetchSavedDialogues],
  );

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
  const toggleBookmark = useCallback(
    async (id: string) => {
      const dlg = savedDialogues.find((d) => d.id === id);
      if (!dlg) return;
      const newVal = !dlg.bookmarked;
      setSavedDialogues((prev) =>
        prev.map((d) => (d.id === id ? { ...d, bookmarked: newVal } : d)),
      );
      try {
        await api.patch("/read-aloud/dialogues", { id, bookmarked: newVal });
      } catch {
        /* silent */
      }
    },
    [savedDialogues],
  );

  /* ── Delete saved dialogue ── */
  const deleteDialogue = useCallback(async (id: string) => {
    setSavedDialogues((prev) => prev.filter((d) => d.id !== id));
    try {
      await fetch("/api/read-aloud/dialogues", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
    } catch {
      /* silent */
    }
  }, []);

  /* ── Batch TTS: fetch ALL lines, routing per provider ── */
  const batchFetchAudio = useCallback(
    async (
      lines: DialogueLine[],
      assignments: VoiceAssignment[],
      speed: number,
      signal: AbortSignal,
    ): Promise<string[]> => {
      const getAssignment = (line: DialogueLine) =>
        assignments.find((a) => a.speaker === line.speaker) ?? assignments[0];

      // Check which lines are already cached (L0 in-memory + L1 IndexedDB + L2 DB)
      const uncachedIndices: number[] = [];
      const resolvedUrls: (string | null)[] = new Array(lines.length).fill(null);

      for (let i = 0; i < lines.length; i++) {
        const a = getAssignment(lines[i]);
        const memKey = `${lines[i].speaker}|${lines[i].text}|${a.voiceRole}|${speed}`;
        // L0: in-memory
        if (audioCacheRef.current.has(memKey)) {
          resolvedUrls[i] = audioCacheRef.current.get(memKey)!;
          continue;
        }
        // L1+L2: persistent cache
        const persistKey = makeCacheKey(lines[i].text, a.voiceRole, speed);
        const cached = await getCachedAudio(persistKey);
        if (cached) {
          const url = URL.createObjectURL(cached.blob);
          audioCacheRef.current.set(memKey, url);
          resolvedUrls[i] = url;
          continue;
        }
        uncachedIndices.push(i);
      }

      // If everything is cached, return immediately
      if (uncachedIndices.length === 0) {
        return resolvedUrls as string[];
      }

      setBatchProgress({ loaded: lines.length - uncachedIndices.length, total: lines.length });

      // Split uncached by provider
      const groqIndices = uncachedIndices.filter((i) => getAssignment(lines[i]).provider !== "kokoro");
      const kokoroIndices = uncachedIndices.filter((i) => getAssignment(lines[i]).provider === "kokoro");

      // Helper to cache a decoded blob
      const cacheBlob = (i: number, blob: Blob) => {
        const line = lines[i];
        const a = getAssignment(line);
        const memKey = `${line.speaker}|${line.text}|${a.voiceRole}|${speed}`;
        const url = URL.createObjectURL(blob);
        audioCacheRef.current.set(memKey, url);
        resolvedUrls[i] = url;
        const persistKey = makeCacheKey(line.text, a.voiceRole, speed);
        setCachedAudio(persistKey, blob, { text: line.text, voiceRole: a.voiceRole, speed }).catch(() => {});
      };

      // Fetch Groq lines via batch API
      if (groqIndices.length > 0) {
        const batchLines = groqIndices.map((i) => ({
          text: lines[i].text,
          voice: getAssignment(lines[i]).voiceRole,
        }));

        const res = await fetch("/api/read-aloud/batch", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lines: batchLines, speed }),
          signal,
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: "Unknown error" }));
          throw new Error(err.error || `HTTP ${res.status}`);
        }

        const data: { segments: string[] } = await res.json();

        for (let j = 0; j < groqIndices.length; j++) {
          const binary = atob(data.segments[j]);
          const bytes = new Uint8Array(binary.length);
          for (let k = 0; k < binary.length; k++) bytes[k] = binary.charCodeAt(k);
          const blob = new Blob([bytes], { type: "audio/wav" });
          cacheBlob(groqIndices[j], blob);
        }
      }

      // Fetch Kokoro lines individually (no batch API for Kokoro)
      for (const i of kokoroIndices) {
        if (signal.aborted) break;
        const a = getAssignment(lines[i]);
        const res = await fetch("/api/read-aloud/kokoro", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: lines[i].text.trim(), voice: a.voiceId || "af_heart", speed }),
          signal,
        });
        if (!res.ok) throw new Error("Kokoro TTS failed");
        const blob = await res.blob();
        cacheBlob(i, blob);
        setBatchProgress({ loaded: lines.length - uncachedIndices.length + kokoroIndices.indexOf(i) + 1, total: lines.length });
      }

      setBatchProgress(null);
      return resolvedUrls as string[];
    },
    [],
  );

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

  /* ── TTS for a single line (still needed for playSingleLine) ── */
  const ttsLine = useCallback(
    async (
      text: string,
      voiceRole: string,
      speed: number,
      signal: AbortSignal,
      provider?: TtsProvider,
      voiceId?: string,
    ): Promise<string> => {
      // Check persistent cache first
      const persistKey = makeCacheKey(text, voiceRole, speed);
      const cached = await getCachedAudio(persistKey);
      if (cached) {
        return URL.createObjectURL(cached.blob);
      }

      // Route to correct API based on provider
      const isKokoro = provider === "kokoro";
      const endpoint = isKokoro ? "/api/read-aloud/kokoro" : "/api/read-aloud";
      const voice = isKokoro && voiceId ? voiceId : voiceRole;

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: text.trim(), voice, speed }),
        signal,
      });
      if (!res.ok) throw new Error("TTS failed");
      const blob = await res.blob();

      // Save to persistent cache (fire-and-forget)
      setCachedAudio(persistKey, blob, { text, voiceRole, speed }).catch(() => {});

      return URL.createObjectURL(blob);
    },
    [],
  );

  /* ── Play all lines — batch fetch first, then play sequentially ── */
  const playAll = useCallback(
    async (speed: number, startIndex = 0) => {
      if (!dialogue || voiceAssignments.length === 0) return;

      stoppedRef.current = false;
      setIsPlaying(true);
      setIsLoading(true);
      abortRef.current = new AbortController();
      const signal = abortRef.current.signal;

      try {
        // Get the lines we need to play
        const linesToPlay = dialogue.lines.slice(startIndex);

        // Batch fetch ALL audio in one API call
        const audioUrls = await batchFetchAudio(linesToPlay, voiceAssignments, speed, signal);

        if (stoppedRef.current) return;
        setIsLoading(false);

        // Play all lines sequentially — audio is already loaded, no more API calls
        for (let i = 0; i < linesToPlay.length; i++) {
          if (stoppedRef.current) break;

          setActiveLineIndex(startIndex + i);
          await playAudio(audioUrls[i]);

          // Small gap between speakers
          if (i < linesToPlay.length - 1 && !stoppedRef.current) {
            await new Promise((r) => setTimeout(r, 200));
          }
        }
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return;
        /* toast: error */
      } finally {
        setIsPlaying(false);
        setIsLoading(false);
        setBatchProgress(null);
        if (!stoppedRef.current) setActiveLineIndex(-1);
      }
    },
    [dialogue, voiceAssignments, batchFetchAudio, playAudio],
  );

  /* ── Play single line ── */
  const playSingleLine = useCallback(
    async (index: number, speed: number) => {
      if (!dialogue || voiceAssignments.length === 0) return;

      stoppedRef.current = false;
      setIsPlaying(true);
      setActiveLineIndex(index);
      abortRef.current = new AbortController();

      try {
        const line = dialogue.lines[index];
        const assignment =
          voiceAssignments.find((a) => a.speaker === line.speaker) ?? voiceAssignments[0];

        // Check client cache first
        const cacheKey = `${line.speaker}|${line.text}|${assignment.voiceRole}|${speed}`;
        let url = audioCacheRef.current.get(cacheKey);

        if (!url) {
          setIsLoading(true);
          url = await ttsLine(
            line.text,
            assignment.voiceRole,
            speed,
            abortRef.current.signal,
            assignment.provider,
            assignment.voiceId,
          );
          audioCacheRef.current.set(cacheKey, url);
        }

        if (stoppedRef.current) return;
        setIsLoading(false);

        await playAudio(url);
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return;
        /* toast: error */
      } finally {
        setIsPlaying(false);
        setIsLoading(false);
      }
    },
    [dialogue, voiceAssignments, ttsLine, playAudio],
  );

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
    setBatchProgress(null);
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
    batchProgress,
    generate,
    playAll,
    playSingleLine,
    stop,
    reset,
    loadDialogue,
    toggleBookmark,
    deleteDialogue,
    fetchSavedDialogues,
  };
}
