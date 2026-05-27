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
import { type EvalResult, ShadowResult } from "./ShadowResult";


const SPEAKER_COLORS: Record<
  string,
  { bg: string; border: string; text: string; accent: string; shadow: string }
> = {
  A: {
    bg: "rgba(59, 130, 246, 0.08)",
    border: "rgba(59, 130, 246, 0.2)",
    text: "#3b82f6",
    accent: "#3b82f6",
    shadow: "0 2px 8px rgba(59, 130, 246, 0.1)",
  },
  B: {
    bg: "rgba(236, 72, 153, 0.08)",
    border: "rgba(236, 72, 153, 0.2)",
    text: "#db2777",
    accent: "#ec4899",
    shadow: "0 2px 8px rgba(236, 72, 153, 0.1)",
  },
  C: {
    bg: "rgba(16, 185, 129, 0.08)",
    border: "rgba(16, 185, 129, 0.2)",
    text: "#10b981",
    accent: "#10b981",
    shadow: "0 2px 8px rgba(16, 185, 129, 0.1)",
  },
};

interface DialoguePlayerProps {
  voiceRole: string;
  speed: number;
}

export function DialoguePlayer({ voiceRole, speed }: DialoguePlayerProps) {
  const dlg = useDialogue();
  const [topic, setTopic] = useState("");
  const [speakers, setSpeakers] = useState<2 | 3>(2);
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
    await dlg.generate({ topic: topic || undefined, speakers, length, primaryVoice: voiceRole });
  }, [dlg, topic, speakers, length, voiceRole]);

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
          className="bg-(--surface) rounded-(--radius-xl) border-2 border-border flex flex-col gap-4"
          style={{ padding: "24px 20px", boxShadow: "var(--shadow-md)" }}
        >
          <h3 className="m-0 text-text-primary">
            <MessageSquare size={16} className="text-accent" /> Create New Conversation
          </h3>

          {/* Topic input */}
          <div>
            <span className="text-xs font-bold text-text-muted block mb-1.5">
              Topic (optional)
            </span>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g., ordering coffee, job interview..."
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "var(--accent)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "var(--border)";
              }}
              className="w-full rounded-xl border-2 border-border bg-surface-alt text-text-primary text-sm font-body"
              style={{ padding: "10px 14px", outline: "none" }}
            />
          </div>

          {/* Speaker count */}
          <div>
            <span className="text-xs font-bold text-text-muted block mb-1.5">Speakers</span>
            <div>
              {([2, 3] as const).map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setSpeakers(n)}
                  className="flex-1 rounded-xl font-bold text-sm cursor-pointer font-body"
                  style={{
                    padding: "10px",
                    border: speakers === n ? "2px solid var(--accent)" : "1px solid var(--border)",
                    background: speakers === n ? "var(--accent-light)" : "var(--surface-alt)",
                    color: speakers === n ? "var(--accent)" : "var(--text-secondary)",
                  }}
                >
                  {n === 2 ? "2 Speakers" : "3 Speakers"}
                </button>
              ))}
            </div>
          </div>

          {/* Length */}
          <div>
            <span className="text-xs font-bold text-text-muted block mb-1.5">Length</span>
            <div>
              {(["short", "medium", "long"] as const).map((len) => (
                <button
                  key={len}
                  type="button"
                  onClick={() => setLength(len)}
                  className="flex-1 rounded-xl font-bold text-[13px] cursor-pointer font-body"
                  style={{
                    padding: "10px",
                    border: length === len ? "2px solid var(--accent)" : "1px solid var(--border)",
                    background: length === len ? "var(--accent-light)" : "var(--surface-alt)",
                    color: length === len ? "var(--accent)" : "var(--text-secondary)",
                  }}
                >
                  {len === "short"
                    ? "Short (~5 lines)"
                    : len === "medium"
                      ? "Medium (~10 lines)"
                      : "Long (~16 lines)"}
                </button>
              ))}
            </div>
          </div>

          {/* Generate button */}
          <m.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleGenerate}
            disabled={dlg.generating}
            className="flex items-center justify-center gap-2.5 border-none text-[15px] font-extrabold font-body"
            style={{
              padding: "14px 20px",
              borderRadius: 14,
              background: dlg.generating
                ? "var(--border)"
                : "linear-gradient(135deg, var(--accent), var(--accent-hover))",
              color: dlg.generating ? "var(--text-muted)" : "var(--text-on-accent)",
              cursor: dlg.generating ? "wait" : "pointer",
              boxShadow: dlg.generating ? "none" : "0 4px 14px var(--accent-muted)",
            }}
          >
            {dlg.generating ? (
              <>
                <Loader2 className="animate-spin" /> Generating conversation...
              </>
            ) : (
              <><Sparkles size={16} /> Generate Conversation</>
            )}
          </m.button>
        </m.div>

        {/* Saved dialogues */}
        {dlg.savedDialogues.length > 0 && (
          <m.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-(--surface) rounded-(--radius-xl) border-2 border-border"
            style={{ padding: "20px", boxShadow: "var(--shadow)" }}
          >
            <span
              className="text-xs font-bold text-text-muted block mb-3 uppercase"
              style={{ letterSpacing: "0.06em" }}
            >
              <Bookmark size={13} className="text-accent" /> Saved Conversations ({dlg.savedDialogues.length})
            </span>
            <div className="flex flex-col gap-2 h-[300px] overflow-y-auto">
              {dlg.savedDialogues.map((saved, idx) => (
                <m.div
                  key={saved.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  whileHover={{ y: -1, boxShadow: "var(--shadow-sm)" }}
                  onClick={() => dlg.loadDialogue(saved)}
                  className="flex items-center gap-3 rounded-xl border-2 border-border bg-surface-alt cursor-pointer"
                  style={{ padding: "12px 14px", transition: "all 0.15s" }}
                >
                  {/* Speaker flags */}
                  <div className="flex shrink-0" style={{ gap: 2 }}>
                    {saved.voiceConfigJson.map((v) => (
                      <span key={v.speaker} className="text-base">
                        {v.flag}
                      </span>
                    ))}
                  </div>

                  {/* Info */}
                  <div className="flex-1 w-[0px]">
                    <span
                      className="text-[13px] font-bold text-text-primary block overflow-hidden"
                      style={{ textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                    >
                      {saved.title}
                    </span>
                    <div className="flex gap-2 items-center" style={{ marginTop: 2 }}>
                      {saved.topic && (
                        <span className="text-[11px] text-text-muted font-medium">
                          <Pin size={10} /> {saved.topic}
                        </span>
                      )}
                      <span className="text-text-muted text-[11px]">
                        {saved.linesJson.length} lines
                      </span>
                      {saved.rolePlayCount > 0 && (
                        <span className="text-[11px] text-accent font-semibold">
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
                    className="bg-transparent border-none text-lg cursor-pointer p-1"
                    style={{
                      color: saved.bookmarked
                        ? "var(--warning, var(--accent))"
                        : "var(--text-muted)",
                      opacity: saved.bookmarked ? 1 : 0.4,
                      transition: "all 0.15s",
                    }}
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
                    onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => {
                      e.currentTarget.style.opacity = "1";
                    }}
                    onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => {
                      e.currentTarget.style.opacity = "0.4";
                    }}
                    className="bg-transparent border-none text-sm cursor-pointer p-1 text-destructive"
                    style={{ opacity: 0.4, transition: "all 0.15s" }}
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
      <div className="bg-(--surface) rounded-(--radius-xl) border-2 border-border py-4 px-5"
        style={{ boxShadow: "var(--shadow-md)" }}
      >
        <div className="dialogue-header-actions"  >
          <div>
            <span className="text-base font-extrabold text-text-primary block">
              <MessageSquare size={16} className="text-accent" /> {dlg.dialogue.title}
            </span>
            <span className="text-text-muted text-xs">
              {dlg.dialogue.context} • {dlg.dialogue.lines.length} lines
            </span>
          </div>
          <div className="dialogue-header-buttons">
            <m.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={dlg.isPlaying ? dlg.stop : () => dlg.playAll(speed)}
              className="flex items-center gap-1.5 py-2 px-4 rounded-xl text-[13px] font-bold cursor-pointer font-body"
              style={{
                border: dlg.isPlaying ? "1px solid var(--error)" : "1px solid var(--accent)",
                background: dlg.isPlaying ? "rgba(239,68,68,0.08)" : "var(--accent-light)",
                color: dlg.isPlaying ? "var(--error)" : "var(--accent)",
              }}
            >
              {dlg.isLoading ? (
                <>
                  <Loader2 className="animate-spin" /> Loading...
                </>
              ) : dlg.isPlaying ? (
                <>
                  <PauseCircle /> Stop
                </>
              ) : (
                <>
                  <PlayCircle /> Play All
                </>
              )}
            </m.button>
            <m.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={dlg.reset}
              className="flex items-center gap-1.5 rounded-xl border-2 border-border bg-surface-alt text-text-secondary text-[13px] font-bold cursor-pointer font-body"
              style={{ padding: "8px 14px" }}
            >
              <Redo /> Reset
            </m.button>
          </div>
        </div>

        {/* Speaker badges */}
        <div className="dialogue-speaker-badges mt-3">
          {dlg.voiceAssignments.map((a) => {
            const colors = SPEAKER_COLORS[a.speaker] ?? SPEAKER_COLORS.A;
            return (
              <div
                key={a.speaker}
                className="flex items-center gap-2"
                style={{
                  padding: "4px 12px 4px 4px",
                  borderRadius: 10,
                  background: colors.bg,
                  border: `1px solid ${colors.border}`,
                }}
              >
                <img
                  src={a.avatar}
                  alt={a.voiceName}
                  width={24}
                  height={24}
                  className="rounded-lg"
                  style={{ objectFit: "cover" }}
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
      <div className="dialogue-bubbles flex flex-col gap-3.5 bg-surface-alt rounded-(--radius-xl) border-2 border-border"
        style={{ padding: "20px 16px", boxShadow: "var(--shadow)" }}
      >
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
              className="flex gap-3 items-start"
              style={{ flexDirection: isLeft ? "row" : "row-reverse" }}
            >
              {/* Avatar */}
              <div className="dialogue-avatar w-[42px] h-[42px] rounded-full overflow-hidden shrink-0"
                style={{ border: `2px solid ${colors.border}`, boxShadow: colors.shadow }}
              >
                <img
                  src={assignment?.avatar ?? "/avatars/austin.png"}
                  alt={assignment?.voiceName ?? "Speaker"}
                  width={42}
                  height={42}
                  className="block"
                  style={{ objectFit: "cover" }}
                />
              </div>

              {/* Bubble */}
              <div className="dialogue-bubble-content relative"
                onClick={() => !dlg.isPlaying && dlg.playSingleLine(i, speed)}
                style={{
                  maxWidth: "78%",
                  padding: "14px 18px",
                  borderRadius: isLeft ? "4px 18px 18px 18px" : "18px 4px 18px 18px",
                  background: isActive
                    ? `color-mix(in srgb, ${colors.accent} 14%, var(--surface))`
                    : "var(--surface)",
                  border: isActive ? `2px solid ${colors.accent}` : `1px solid ${colors.border}`,
                  borderLeft: isLeft ? `3px solid ${colors.accent}` : undefined,
                  borderRight: !isLeft ? `3px solid ${colors.accent}` : undefined,
                  cursor: dlg.isPlaying ? "default" : "pointer",
                  transition: "all 0.2s",
                  boxShadow: isActive
                    ? `0 4px 16px color-mix(in srgb, ${colors.accent} 20%, transparent)`
                    : colors.shadow,
                }}
              >
                <div className="flex items-center gap-1.5 mb-1.5">
                  <div className="w-[6px] h-[6px] rounded-full shrink-0"
                    style={{ background: colors.accent }}
                  />
                  <span
                    className="text-xs font-extrabold"
                    style={{ color: colors.text, letterSpacing: "0.02em" }}
                  >
                    {line.name}
                  </span>
                  <span className="text-[11px]">{assignment?.flag ?? ""}</span>
                </div>
                <span
                  className="text-[15px] text-text-primary block font-medium"
                  style={{ lineHeight: 1.7 }}
                >
                  {line.text}
                </span>
                {isActive && dlg.isLoading && (
                  <Loader2
                    className="animate-spin absolute text-sm"
                    style={{ top: 10, right: 10, color: colors.accent }}
                  />
                )}
                {isActive && !dlg.isLoading && dlg.isPlaying && (
                  <Volume2
                    className="absolute text-sm"
                    style={{ top: 10, right: 10, color: colors.accent }}
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
          className="rounded-(--radius-xl) text-center"
          style={{
            background:
              "linear-gradient(135deg, color-mix(in srgb, var(--accent) 8%, var(--surface)), color-mix(in srgb, var(--secondary, #a78bfa) 5%, var(--surface)))",
            border: "2px solid color-mix(in srgb, var(--accent) 25%, var(--border))",
            padding: "20px",
            boxShadow: "0 4px 20px var(--accent-muted), var(--shadow)",
          }}
        >
          <div className="flex justify-center mb-2.5"><m.div animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 2 }} style={{ display: "inline-flex", color: "var(--accent)" }}><Headphones size={36} /></m.div></div>
          <span className="text-base font-extrabold text-text-primary block mb-1">
            Listen to the Dialogue First
          </span>
          <span
            className="text-[13px] text-text-muted block mb-4 w-[360px]"
            style={{ margin: "0 auto 16px" }}
          >
            Listen to the conversation between native speakers before you start roleplaying!
          </span>

          <div className="listen-cta-buttons">
            <m.button
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.97 }}
              onClick={isListeningPreview ? dlg.stop : listenPreview}
              disabled={dlg.isLoading}
              className="flex items-center gap-2 border-none text-[15px] font-extrabold cursor-pointer font-body w-[200px] justify-center"
              style={{
                padding: "14px 28px",
                borderRadius: 14,
                background: isListeningPreview
                  ? "linear-gradient(135deg, var(--error), color-mix(in srgb, var(--error) 80%, #000))"
                  : "linear-gradient(135deg, var(--accent), var(--accent-hover))",
                color: "#fff",
                boxShadow: isListeningPreview
                  ? "0 4px 14px rgba(239, 68, 68, 0.3)"
                  : "0 4px 14px var(--accent-muted)",
              }}
            >
              {dlg.isLoading ? (
                <>
                  <Loader2 className="animate-spin" /> Loading...
                </>
              ) : isListeningPreview ? (
                <>
                  <PauseCircle /> Stop Listening
                </>
              ) : (
                <>
                  <PlayCircle /> Listen to Dialogue
                </>
              )}
            </m.button>

            <m.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={skipListenPreview}
              className="flex items-center gap-1.5 border-2 border-border bg-(--surface) text-text-muted text-[13px] font-semibold cursor-pointer font-body"
              style={{ padding: "14px 20px", borderRadius: 14 }}
            >
              Skip →
            </m.button>
          </div>

          {/* Listening / batch-loading progress indicator */}
          {isListeningPreview && dlg.dialogue && (
            <m.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center justify-center gap-2"
              style={{ marginTop: 14 }}
            >
              <m.div
                animate={{ scale: [1, 1.4, 1], opacity: [0.5, 1, 0.5] }}
                transition={{ repeat: Infinity, duration: 1.2 }}
                className="w-[8px] h-[8px] rounded-full"
                style={{ background: "var(--accent)" }}
              />
              <span className="text-xs font-bold text-accent">
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
          className="bg-(--surface) rounded-(--radius-xl) border-2 border-border py-4 px-5"
          style={{ boxShadow: "var(--shadow)" }}
        >
          {/* Replay button */}
          <div className="mb-3">
            <span className="text-xs font-bold text-text-muted">
              <Mic size={14} className="text-accent" /> Roleplay — Select the character you want to practice
            </span>
            <m.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={listenPreview}
              className="flex items-center gap-1 rounded-lg border-2 border-border bg-surface-alt text-text-muted text-[11px] font-semibold cursor-pointer font-body"
              style={{ padding: "4px 12px" }}
            >
              <PlayCircle /> Replay
            </m.button>
          </div>
          <div className="role-play-buttons">
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
            className="bg-(--surface) rounded-(--radius-xl) py-4 px-5 flex flex-col gap-3"
            style={{
              border: "2px solid var(--accent)",
              boxShadow: "0 4px 20px var(--accent-muted), var(--shadow-md)",
            }}
          >
            <div>
              <span className="text-sm font-extrabold text-accent">
                <Mic size={14} /> Roleplay Active — You are{" "}
                {dlg.dialogue.lines.find((l) => l.speaker === rolePlaySpeaker)?.name ?? "..."}
              </span>
              <m.button
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setRolePlaySpeaker(null);
                  setRolePlayStep("idle");
                  dlg.stop();
                }}
                className="rounded-lg border-2 border-border bg-surface-alt text-text-muted text-xs font-semibold cursor-pointer"
                style={{ padding: "4px 12px" }}
              >
                Exit
              </m.button>
            </div>

            {rolePlayStep === "idle" && (
              <m.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => playRolePlayLine(0)}
                className="w-full p-3 rounded-xl border-none text-sm font-extrabold cursor-pointer font-body"
                style={{
                  background: "linear-gradient(135deg, var(--accent), var(--accent-hover))",
                  color: "var(--text-on-accent)",
                }}
              >
                Start Dialogue
              </m.button>
            )}

            {rolePlayStep === "listening" && (
              <div className="p-3">
                <m.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  className="w-[12px] h-[12px] rounded-full"
                  style={{ background: "var(--accent)" }}
                />
                <span className="text-sm font-bold text-accent">Listening to speaker...</span>
              </div>
            )}

            {rolePlayStep === "recording" && (
              <div className="p-3">
                <div>
                  <m.div
                    animate={{ scale: [1, 1.3, 1], opacity: [1, 0.5, 1] }}
                    transition={{ repeat: Infinity, duration: 1 }}
                    className="w-[14px] h-[14px] rounded-full"
                    style={{ background: "var(--error)" }}
                  />
                  <span className="text-sm font-bold text-destructive">
                    Your turn! Read your line
                  </span>
                </div>
                <span className="text-text-secondary text-[13px]">
                  &quot;{dlg.dialogue.lines[rolePlayLineIndex]?.text}&quot;
                </span>
                <m.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={stopAndEvaluateRolePlay}
                  className="flex items-center gap-2 rounded-xl text-destructive text-sm font-extrabold cursor-pointer font-body"
                  style={{
                    padding: "10px 24px",
                    border: "2px solid var(--error)",
                    background: "rgba(239,68,68,0.08)",
                  }}
                >
                  <StopCircle /> Stop & Grade
                </m.button>
              </div>
            )}

            {rolePlayStep === "evaluating" && (
              <div className="p-4">
                <Loader2 className="animate-spin text-accent" size={20} />
                <span className="text-sm font-bold text-accent">🤖 AI Grading...</span>
              </div>
            )}

            {rolePlayStep === "result" && rolePlayResult && (
              <>
                <ShadowResult
                  result={rolePlayResult}
                  referenceText={dlg.dialogue.lines[rolePlayLineIndex]?.text ?? ""}
                />
                <m.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={continueAfterRolePlay}
                  className="w-full p-3 rounded-xl border-none text-sm font-extrabold cursor-pointer font-body"
                  style={{
                    background: "linear-gradient(135deg, var(--accent), var(--accent-hover))",
                    color: "var(--text-on-accent)",
                  }}
                >
                  {rolePlayLineIndex < dlg.dialogue.lines.length - 1
                    ? "Continue"
                    : "Finish"}
                </m.button>
              </>
            )}
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}
