"use client";

import { toast } from "sonner";
import {
  Loader2,
  Mic,
  PauseCircle,
  PlayCircle,
  Redo,
  Star,
  StopCircle,
  Volume2,
  MessageSquare,
  Users,
  Bookmark,
  Sparkles,
  Trash2,
  Headphones,
  Pin,
  Lightbulb,
} from "lucide-react";
import { AnimatePresence } from "motion/react";
import * as m from "motion/react-client";
import { useCallback, useState } from "react";
import { useVoiceInput } from "@/hooks/useVoiceInput";
import { useDialogue } from "../_hooks/useDialogue";
import { type EvalResult, ShadowResult } from "./shadowing/ShadowResult";
import { GROQ_VOICES } from "../_data/voices";

const SPEAKER_COLORS: Record<
  string,
  { bg: string; border: string; text: string; accent: string; shadow: string; tw: string }
> = {
  A: {
    bg: "color-mix(in srgb, var(--secondary) 8%, transparent)",
    border: "color-mix(in srgb, var(--secondary) 25%, transparent)",
    text: "var(--secondary)",
    accent: "var(--secondary)",
    shadow: "0 2px 8px color-mix(in srgb, var(--secondary) 10%, transparent)",
    tw: "border-secondary/25 bg-secondary/8",
  },
  B: {
    bg: "color-mix(in srgb, var(--error) 8%, transparent)",
    border: "color-mix(in srgb, var(--error) 25%, transparent)",
    text: "var(--error)",
    accent: "var(--error)",
    shadow: "0 2px 8px color-mix(in srgb, var(--error) 10%, transparent)",
    tw: "border-error/25 bg-error/8",
  },
  C: {
    bg: "color-mix(in srgb, var(--success) 8%, transparent)",
    border: "color-mix(in srgb, var(--success) 25%, transparent)",
    text: "var(--success)",
    accent: "var(--success)",
    shadow: "0 2px 8px color-mix(in srgb, var(--success) 10%, transparent)",
    tw: "border-success/25 bg-success/8",
  },
};

interface DialoguePlayerProps {
  speed: number;
  speakerCount: 2 | 3;
  onSpeakerCountChange: (count: 2 | 3) => void;
}

export function DialoguePlayer({ speed, speakerCount, onSpeakerCountChange }: DialoguePlayerProps) {
  const dlg = useDialogue();
  const [topic, setTopic] = useState("");
  const [length, setLength] = useState<"short" | "medium" | "long">("medium");

  // Role-play state
  const [rolePlaySpeaker, setRolePlaySpeaker] = useState<string | null>(null);
  const [rolePlayStep, setRolePlayStep] = useState<
    "idle" | "listening" | "recording" | "evaluating" | "result"
  >("idle");
  const [rolePlayLineIndex, setRolePlayLineIndex] = useState(-1);
  const [rolePlayResult, setRolePlayResult] = useState<EvalResult | null>(null);
  const [hasListenedOnce, setHasListenedOnce] = useState(false);
  const [isListeningPreview, setIsListeningPreview] = useState(false);
  const voice = useVoiceInput({ autoTranscribe: false });

  const handleGenerate = useCallback(async () => {
    setHasListenedOnce(false);
    setIsListeningPreview(false);
    await dlg.generate({
      topic: topic || undefined,
      speakers: speakerCount,
      length,
      primaryVoice: GROQ_VOICES[0].role,
    });
  }, [dlg, topic, speakerCount, length]);

  /* ── Listen preview: hear full dialogue before role-playing ── */
  const listenPreview = useCallback(async () => {
    setIsListeningPreview(true);
    await dlg.playAll(speed);
    setIsListeningPreview(false);
    setHasListenedOnce(true);
  }, [dlg, speed]);

  const skipListenPreview = useCallback(() => {
    setHasListenedOnce(true);
  }, []);

  /* ── Role-play: play non-user lines, record user lines ── */
  const startRolePlay = useCallback(
    async (speakerKey: string) => {
      if (!dlg.dialogue) return;
      setRolePlaySpeaker(speakerKey);
      setRolePlayStep("idle");
      setRolePlayLineIndex(0);
      setRolePlayResult(null);
    },
    [dlg.dialogue],
  );

  const playRolePlayLine = useCallback(
    async (lineIndex: number) => {
      if (!dlg.dialogue) return;
      const line = dlg.dialogue.lines[lineIndex];
      if (!line) return;

      if (line.speaker === rolePlaySpeaker) {
        // User's turn — record
        setRolePlayStep("recording");
        setRolePlayLineIndex(lineIndex);
        await voice.start();
      } else {
        // AI's turn — play TTS
        setRolePlayStep("listening");
        setRolePlayLineIndex(lineIndex);
        await dlg.playSingleLine(lineIndex, speed);
        // Auto-advance to next
        const nextIdx = lineIndex + 1;
        if (nextIdx < dlg.dialogue.lines.length) {
          setTimeout(() => playRolePlayLine(nextIdx), 500);
        } else {
          setRolePlayStep("idle");
        }
      }
    },
    [dlg, rolePlaySpeaker, speed, voice],
  );

  const stopAndEvaluateRolePlay = useCallback(async () => {
    voice.stop();
    setRolePlayStep("evaluating");

    await new Promise((r) => setTimeout(r, 300));

    const audioBlob = voice.blob;
    if (!audioBlob || !dlg.dialogue) {
      toast.error("No audio recording found");
      setRolePlayStep("idle");
      return;
    }

    const line = dlg.dialogue.lines[rolePlayLineIndex];

    try {
      const formData = new FormData();
      formData.append("audio", audioBlob, "roleplay.webm");
      formData.append("referenceText", line.text.trim());
      formData.append("durationMs", String(Math.round(voice.durationMs)));

      const res = await fetch("/api/read-aloud/evaluate", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Unknown" }));
        if (err.error === "no-speech") {
          toast.warning("Speech not recognized. Please try again.");
          setRolePlayStep("idle");
          return;
        }
        throw new Error(err.error || "Failed");
      }

      const result: EvalResult = await res.json();
      setRolePlayResult(result);
      setRolePlayStep("result");
    } catch {
      toast.error("AI grading failed");
      setRolePlayStep("idle");
    }
  }, [voice, dlg, rolePlayLineIndex]);

  const continueAfterRolePlay = useCallback(() => {
    if (!dlg.dialogue) return;
    const nextIdx = rolePlayLineIndex + 1;
    setRolePlayResult(null);
    if (nextIdx < dlg.dialogue.lines.length) {
      playRolePlayLine(nextIdx);
    } else {
      setRolePlayStep("idle");
      setRolePlaySpeaker(null);
      toast.success("Dialogue practice completed successfully!");
    }
  }, [dlg, rolePlayLineIndex, playRolePlayLine]);

  /* ── Setup screen ── */
  if (!dlg.dialogue) {
    return (
      <div className="flex flex-col gap-4">
        <m.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-surface rounded-xl border-2 border-border flex flex-col gap-4 p-6 shadow-md"
        >
          <h3 className="m-0 text-text-primary flex items-center gap-1.5">
            <MessageSquare size={16} className="text-accent-hover" /> Create New Conversation
          </h3>

          {/* Topic input */}
          <div>
            <span className="text-xs font-bold text-text-muted block mb-1.5">Topic (optional)</span>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g., ordering coffee, job interview..."
              className="w-full rounded-xl border-2 border-border bg-surface-alt text-text-primary text-sm font-body px-3.5 py-2.5 outline-none focus:border-accent"
            />
          </div>

          {/* Speaker count */}
          <div>
            <span className="text-xs font-bold text-text-muted block mb-1.5">Speakers</span>
            <div className="flex gap-2">
              {([2, 3] as const).map((n) => {
                const isActive = speakerCount === n;
                return (
                  <button
                    key={n}
                    type="button"
                    onClick={() => onSpeakerCountChange(n)}
                    className={`flex-1 rounded-xl font-extrabold text-sm cursor-pointer font-body py-2.5 transition-all ${
                      isActive
                        ? "border-2 border-border bg-accent text-ink shadow-sm"
                        : "border-2 border-border/40 bg-surface-alt text-text-secondary hover:bg-surface-hover"
                    }`}
                  >
                    {n === 2 ? "2 Speakers" : "3 Speakers"}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Length */}
          <div>
            <span className="text-xs font-bold text-text-muted block mb-1.5">Length</span>
            <div className="flex gap-2">
              {(["short", "medium", "long"] as const).map((len) => {
                const isActive = length === len;
                return (
                  <button
                    key={len}
                    type="button"
                    onClick={() => setLength(len)}
                    className={`flex-1 rounded-xl font-extrabold text-[13px] cursor-pointer font-body py-2.5 transition-all ${
                      isActive
                        ? "border-2 border-border bg-accent text-ink shadow-sm"
                        : "border-2 border-border/40 bg-surface-alt text-text-secondary hover:bg-surface-hover"
                    }`}
                  >
                    {len === "short"
                      ? "Short (~5 lines)"
                      : len === "medium"
                        ? "Medium (~10 lines)"
                        : "Long (~16 lines)"}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Generate button */}
          <m.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleGenerate}
            disabled={dlg.generating}
            className={`flex items-center justify-center gap-2.5 border-2 border-border text-[15px] font-black font-body py-3.5 px-5 rounded-2xl transition-all shadow ${
              dlg.generating
                ? "bg-bg-deep text-text-muted cursor-wait shadow-none"
                : "bg-accent text-ink cursor-pointer hover:bg-accent-hover active:shadow-none"
            }`}
          >
            {dlg.generating ? (
              <>
                <Loader2 className="animate-spin" /> Generating conversation...
              </>
            ) : (
              <>
                <Sparkles size={16} /> Generate Conversation
              </>
            )}
          </m.button>
        </m.div>

        {/* Saved dialogues */}
        {dlg.savedDialogues.length > 0 && (
          <m.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-surface rounded-xl border-2 border-border p-5 shadow"
          >
            <span className="text-xs font-bold text-text-muted block mb-3 uppercase tracking-wider">
              <Bookmark size={13} className="text-accent-hover" /> Saved Conversations (
              {dlg.savedDialogues.length})
            </span>
            <div className="flex flex-col gap-2">
              {dlg.savedDialogues.map((saved, idx) => (
                <m.div
                  key={saved.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  whileHover={{ y: -1, boxShadow: "var(--shadow-sm)" }}
                  onClick={() => dlg.loadDialogue(saved)}
                  className="flex items-center gap-3 rounded-xl border-2 border-border bg-surface-alt cursor-pointer p-3 transition-all duration-150"
                >
                  {/* Speaker flags */}
                  <div className="flex shrink-0 gap-0.5">
                    {saved.voiceConfigJson.map((v) => (
                      <span key={v.speaker} className="text-base">
                        {v.flag}
                      </span>
                    ))}
                  </div>

                  {/* Info */}
                  <div className="flex-1 w-[0px]">
                    <span className="text-[13px] font-bold text-text-primary block overflow-hidden truncate">
                      {saved.title}
                    </span>
                    <div className="flex gap-2 items-center mt-0.5">
                      {saved.topic && (
                        <span className="text-[11px] text-text-muted font-medium">
                          <Pin size={10} /> {saved.topic}
                        </span>
                      )}
                      <span className="text-text-muted text-[11px]">
                        {saved.linesJson.length} lines
                      </span>
                      {saved.rolePlayCount > 0 && (
                        <span className="text-[11px] text-accent-active font-semibold">
                          🎙️ {saved.rolePlayCount}x
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Bookmark */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      dlg.toggleBookmark(saved.id);
                    }}
                    className={`bg-transparent border-none text-lg cursor-pointer p-1 transition-all duration-150 ${
                      saved.bookmarked
                        ? "text-warning opacity-100"
                        : "text-text-muted opacity-40 hover:opacity-100"
                    }`}
                  >
                    <m.span
                      animate={saved.bookmarked ? { scale: [1, 1.3, 1] } : { scale: 1 }}
                      transition={{ duration: 0.3 }}
                      className="flex items-center"
                    >
                      {saved.bookmarked ? (
                        <Star size={16} fill="currentColor" />
                      ) : (
                        <Star size={16} />
                      )}
                    </m.span>
                  </button>

                  {/* Delete */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      dlg.deleteDialogue(saved.id);
                    }}
                    className="bg-transparent border-none text-sm cursor-pointer p-1 text-destructive opacity-40 transition-all duration-150 hover:opacity-100"
                  >
                    <Trash2 size={13} />
                  </button>

                  {/* Time */}
                  <span className="text-[10px] text-text-muted shrink-0">
                    {new Date(saved.createdAt).toLocaleDateString("en-US", {
                      day: "numeric",
                      month: "short",
                    })}
                  </span>
                </m.div>
              ))}
            </div>
          </m.div>
        )}
      </div>
    );
  }

  /* ── Dialogue view ── */
  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="bg-surface rounded-xl border-2 border-border py-4 px-5 shadow-md">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <span className="text-base font-extrabold text-text-primary block">
              <MessageSquare size={16} className="text-accent-hover" /> {dlg.dialogue.title}
            </span>
            <span className="text-text-muted text-xs">
              {dlg.dialogue.context} • {dlg.dialogue.lines.length} lines
            </span>
          </div>
          <div className="flex gap-2 shrink-0">
            <m.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={dlg.isPlaying ? dlg.stop : () => dlg.playAll(speed)}
              className={`flex items-center gap-1.5 py-2 px-4 rounded-xl text-[13px] font-black cursor-pointer font-body border-2 transition-all ${
                dlg.isPlaying
                  ? "border-error bg-error/15 text-error"
                  : "border-border bg-accent text-ink shadow-sm hover:bg-accent-hover"
              }`}
            >
              {dlg.isLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Loading...
                </>
              ) : dlg.isPlaying ? (
                <>
                  <PauseCircle size={16} /> Stop
                </>
              ) : (
                <>
                  <PlayCircle size={16} /> Play All
                </>
              )}
            </m.button>
            <m.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={dlg.reset}
              className="flex items-center gap-1.5 rounded-xl border-2 border-border bg-surface-alt text-text-secondary text-[13px] font-bold cursor-pointer font-body py-2 px-3.5"
            >
              <Redo size={14} /> Reset
            </m.button>
          </div>
        </div>

        {/* Speaker badges */}
        <div className="flex flex-wrap gap-2 mt-3">
          {dlg.voiceAssignments.map((a) => {
            const colors = SPEAKER_COLORS[a.speaker] ?? SPEAKER_COLORS.A;
            return (
              <div
                key={a.speaker}
                className={`flex items-center gap-2 py-1.5 pr-3 pl-1 rounded-xl border-2 ${colors.tw}`}
              >
                <img
                  src={a.avatar}
                  alt={a.voiceName}
                  width={24}
                  height={24}
                  className="rounded-lg object-cover"
                />
                <span className="text-xs font-bold" style={{ color: colors.text }}>
                  {a.voiceName}
                </span>
                <span className="text-xs">{a.flag}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Chat bubbles */}
      <div className="flex flex-col gap-3.5 bg-surface-alt rounded-2xl border-2 border-border p-5 shadow-sm">
        {dlg.dialogue.lines.map((line, i) => {
          const isLeft = line.speaker === "A";
          const colors = SPEAKER_COLORS[line.speaker] ?? SPEAKER_COLORS.A;
          const isActive = dlg.activeLineIndex === i;
          const isRolePlayLine =
            rolePlaySpeaker && line.speaker === rolePlaySpeaker && rolePlayLineIndex === i;
          const assignment = dlg.voiceAssignments.find((a) => a.speaker === line.speaker);

          return (
            <m.div
              key={i}
              initial={{ opacity: 0, x: isLeft ? -10 : 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`flex gap-3 items-start ${isLeft ? "flex-row" : "flex-row-reverse"}`}
            >
              {/* Avatar */}
              <div
                className="dialogue-avatar w-[42px] h-[42px] rounded-full overflow-hidden shrink-0 border-2"
                style={{ borderColor: colors.border, boxShadow: colors.shadow }}
              >
                <img
                  src={assignment?.avatar ?? "/avatars/austin.png"}
                  alt={assignment?.voiceName ?? "Speaker"}
                  width={42}
                  height={42}
                  className="block object-cover"
                />
              </div>

              {/* Bubble */}
              <div
                className="dialogue-bubble-content relative max-w-[78%] py-3.5 px-4.5 transition-all duration-200"
                onClick={() => !dlg.isPlaying && dlg.playSingleLine(i, speed)}
                style={{
                  borderRadius: isLeft ? "4px 18px 18px 18px" : "18px 4px 18px 18px",
                  background: isActive
                    ? `color-mix(in srgb, ${colors.accent} 14%, var(--surface))`
                    : "var(--surface)",
                  border: isActive ? `2px solid ${colors.accent}` : `1px solid ${colors.border}`,
                  borderLeft: isLeft ? `3px solid ${colors.accent}` : undefined,
                  borderRight: !isLeft ? `3px solid ${colors.accent}` : undefined,
                  cursor: dlg.isPlaying ? "default" : "pointer",
                  boxShadow: isActive
                    ? `0 4px 16px color-mix(in srgb, ${colors.accent} 20%, transparent)`
                    : colors.shadow,
                }}
              >
                <div className="flex items-center gap-1.5 mb-1.5">
                  <div
                    className="w-[6px] h-[6px] rounded-full shrink-0"
                    style={{ backgroundColor: colors.accent }}
                  />
                  <span
                    className="text-xs font-extrabold tracking-wide"
                    style={{ color: colors.text }}
                  >
                    {line.name}
                  </span>
                  <span className="text-[11px]">{assignment?.flag ?? ""}</span>
                </div>
                <span className="text-[15px] text-text-primary block font-medium leading-relaxed">
                  {line.text}
                </span>
                {isActive && dlg.isLoading && (
                  <Loader2
                    className="animate-spin absolute text-sm top-2.5 right-2.5"
                    style={{ color: colors.accent }}
                  />
                )}
                {isActive && !dlg.isLoading && dlg.isPlaying && (
                  <Volume2
                    className="absolute text-sm top-2.5 right-2.5"
                    style={{ color: colors.accent }}
                  />
                )}
              </div>
            </m.div>
          );
        })}
      </div>

      {/* ── Step 1: Listen first CTA ── */}
      {!hasListenedOnce && !rolePlaySpeaker && (
        <m.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl text-center border-2 border-border p-5 shadow bg-accent-light"
        >
          <div className="flex justify-center mb-2.5">
            <m.div
              animate={{ y: [0, -4, 0] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="inline-flex text-accent-active"
            >
              <Headphones size={36} />
            </m.div>
          </div>
          <span className="text-base font-extrabold text-text-primary block mb-1">
            Listen to the Dialogue First
          </span>
          <span className="mx-auto mb-4 text-xs text-text-muted max-w-[360px] block">
            Listen to the conversation between native speakers before you start roleplaying!
          </span>

          <div className="flex items-center justify-center gap-3">
            <m.button
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.97 }}
              onClick={isListeningPreview ? dlg.stop : listenPreview}
              disabled={dlg.isLoading}
              className={`w-[200px] justify-center flex items-center gap-2 text-[15px] font-black font-body py-3.5 px-6 rounded-2xl border-2 border-border transition-all shadow ${
                isListeningPreview
                  ? "bg-error text-white hover:bg-error-hover"
                  : "bg-accent text-ink hover:bg-accent-hover"
              }`}
            >
              {dlg.isLoading ? (
                <>
                  <Loader2 size={18} className="animate-spin" /> Loading...
                </>
              ) : isListeningPreview ? (
                <>
                  <PauseCircle size={18} /> Stop Listening
                </>
              ) : (
                <>
                  <PlayCircle size={18} /> Listen to Dialogue
                </>
              )}
            </m.button>

            <m.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={skipListenPreview}
              className="flex items-center gap-1.5 border-2 border-border bg-surface text-text-muted text-[13px] font-semibold cursor-pointer font-body py-3 px-5 rounded-xl hover:bg-surface-hover transition-colors"
            >
              Skip →
            </m.button>
          </div>

          {/* Listening / batch-loading progress indicator */}
          {isListeningPreview && dlg.dialogue && (
            <m.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center justify-center gap-2 mt-3.5"
            >
              <m.div
                animate={{ scale: [1, 1.4, 1], opacity: [0.5, 1, 0.5] }}
                transition={{ repeat: Infinity, duration: 1.2 }}
                className="w-2 h-2 rounded-full bg-accent-hover"
              />
              <span className="text-xs font-bold text-accent-active">
                {dlg.isLoading && dlg.batchProgress
                  ? `Loading audio ${dlg.batchProgress.loaded}/${dlg.batchProgress.total}...`
                  : dlg.isLoading
                    ? `Loading audio ${dlg.dialogue.lines.length} lines...`
                    : `Playing line ${Math.max(1, (dlg.activeLineIndex ?? 0) + 1)} of ${dlg.dialogue.lines.length}`}
              </span>
            </m.div>
          )}
        </m.div>
      )}

      {/* ── Step 2: Role-play controls (after listening) ── */}
      {hasListenedOnce && !rolePlaySpeaker && !dlg.isPlaying && (
        <m.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-surface rounded-xl border-2 border-border py-4 px-5 shadow"
        >
          {/* Replay button */}
          <div className="mb-3">
            <span className="text-xs font-bold text-text-muted">
              <Mic size={14} className="text-accent" /> Roleplay — Select the character you want to
              practice
            </span>
            <m.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={listenPreview}
              className="flex items-center gap-1 rounded-lg border-2 border-border bg-surface-alt text-text-muted text-[11px] font-semibold cursor-pointer font-body py-1 px-3"
            >
              <PlayCircle size={12} /> Replay
            </m.button>
          </div>
          <div className="flex gap-2 flex-wrap">
            {dlg.voiceAssignments.map((a) => {
              const line = dlg.dialogue!.lines.find((l) => l.speaker === a.speaker);
              return (
                <m.button
                  key={a.speaker}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => startRolePlay(a.speaker)}
                  className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold cursor-pointer font-body"
                  style={{
                    border: `1px solid ${SPEAKER_COLORS[a.speaker]?.border ?? "var(--border)"}`,
                    background: SPEAKER_COLORS[a.speaker]?.bg ?? "var(--surface-alt)",
                    color: SPEAKER_COLORS[a.speaker]?.text ?? "var(--text-primary)",
                  }}
                >
                  {a.flag} Roleplay as {line?.name ?? a.voiceName}
                </m.button>
              );
            })}
          </div>
        </m.div>
      )}

      {/* Role-play active */}
      <AnimatePresence>
        {rolePlaySpeaker && (
          <m.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="bg-surface rounded-xl border-2 border-accent py-4 px-5 flex flex-col gap-3 shadow-md"
          >
            <div className="flex justify-between items-center">
              <span className="text-sm font-extrabold text-accent-active flex items-center gap-1.5">
                <Mic size={14} /> Roleplay Active — You are{" "}
                {dlg.dialogue!.lines.find((l) => l.speaker === rolePlaySpeaker)?.name ?? "..."}
              </span>
              <m.button
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setRolePlaySpeaker(null);
                  setRolePlayStep("idle");
                  dlg.stop();
                }}
                className="rounded-lg border-2 border-border bg-surface-alt text-text-muted text-xs font-semibold cursor-pointer py-1 px-3"
              >
                Exit
              </m.button>
            </div>

            {rolePlayStep === "idle" && (
              <m.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => playRolePlayLine(0)}
                className="w-full p-3 rounded-xl border-2 border-border bg-accent text-ink text-sm font-black cursor-pointer font-body shadow-sm hover:bg-accent-hover"
              >
                Start Dialogue
              </m.button>
            )}

            {rolePlayStep === "listening" && (
              <div className="p-3 flex items-center gap-2">
                <m.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  className="w-[12px] h-[12px] rounded-sm bg-accent"
                />
                <span className="text-sm font-black text-accent-active">
                  Listening to speaker...
                </span>
              </div>
            )}

            {rolePlayStep === "recording" && (
              <div className="p-3 flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <m.div
                    animate={{ scale: [1, 1.3, 1], opacity: [1, 0.5, 1] }}
                    transition={{ repeat: Infinity, duration: 1 }}
                    className="w-[14px] h-[14px] rounded-sm bg-error"
                  />
                  <span className="text-sm font-bold text-destructive">
                    Your turn! Read your line
                  </span>
                </div>
                <span className="text-text-secondary text-[13px] italic font-medium">
                  &quot;{dlg.dialogue!.lines[rolePlayLineIndex]?.text}&quot;
                </span>
                <m.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={stopAndEvaluateRolePlay}
                  className="flex items-center gap-2 rounded-xl text-destructive text-sm font-extrabold cursor-pointer font-body py-2.5 px-6 border-2 border-error bg-error/10 hover:bg-error/20 transition-colors"
                >
                  <StopCircle size={16} /> Stop & Grade
                </m.button>
              </div>
            )}

            {rolePlayStep === "evaluating" && (
              <div className="p-4 flex items-center gap-2">
                <Loader2 className="animate-spin text-accent-active" size={20} />
                <span className="text-sm font-black text-accent-active">🤖 AI Grading...</span>
              </div>
            )}

            {rolePlayStep === "result" && rolePlayResult && (
              <>
                <ShadowResult
                  result={rolePlayResult}
                  referenceText={dlg.dialogue!.lines[rolePlayLineIndex]?.text ?? ""}
                />
                <m.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={continueAfterRolePlay}
                  className="w-full p-3 rounded-xl border-2 border-border bg-accent text-ink text-sm font-black cursor-pointer font-body shadow-sm hover:bg-accent-hover"
                >
                  {rolePlayLineIndex < dlg.dialogue!.lines.length - 1 ? "Continue" : "Finish"}
                </m.button>
              </>
            )}
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}
