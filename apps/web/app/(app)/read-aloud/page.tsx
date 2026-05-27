"use client";

import { toast } from "sonner";
import { useCallback, useState } from "react";
import { DialoguePlayer } from "./_components/DialoguePlayer";
import { HistoryPanel } from "./_components/HistoryPanel";
import { PassageBrowser } from "./_components/PassageBrowser";
import { PlaybackControls } from "./_components/PlaybackControls";
import { ShadowingMode } from "./_components/ShadowingMode";
import { TextInputPanel } from "./_components/TextInputPanel";
import { VoiceSelector } from "./_components/VoiceSelector";
import { getVoiceByRole } from "./_data/voices";
import { clearBlobCache, useAudioPlayback } from "./_hooks/useAudioPlayback";
import { useHistory } from "./_hooks/useHistory";
import { Headphones, Mic, MessageSquare, Lightbulb } from "lucide-react";
import { motion } from "motion/react";


type AppMode = "listen" | "shadow" | "dialogue";

const MODE_TABS = [
  { key: "listen" as AppMode, label: "Listen", Icon: Headphones, desc: "Listen to native speakers read passages" },
  { key: "shadow" as AppMode, label: "Shadowing", Icon: Mic, desc: "Read along and get real-time feedback" },
  { key: "dialogue" as AppMode, label: "Dialogue", Icon: MessageSquare, desc: "Interactive roleplay conversation practice" },
];

export default function ReadAloudPage() {
  const [mode, setMode] = useState<AppMode>("listen");
  const [text, setText] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("us-m");
  const [speed, setSpeed] = useState(1);
  const [showHistory, setShowHistory] = useState(false);

  const audio = useAudioPlayback();
  const history = useHistory();

  const selectedVoice = getVoiceByRole(selectedRole);

  /* ── Generate handler ── */
  const handleGenerate = useCallback(async () => {
    const wasCached = await audio.generate(text, selectedRole, speed);
    // Add to history (whether cached or fresh)
    if (wasCached !== undefined) {
      history.add(text, selectedRole, speed);
    }
  }, [text, selectedRole, speed, audio, history]);

  /* ── Clear handler ── */
  const handleClear = useCallback(() => {
    audio.stop();
    setText("");
  }, [audio]);

  /* ── History replay ── */
  const handleReplayHistory = useCallback((entry: (typeof history.history)[number]) => {
    setText(entry.text);
    setSelectedRole(entry.voice);
    setSpeed(entry.speed);
    setShowHistory(false);
    toast.info('Passage reloaded — click "Start listening" to play');
  }, []);

  /* ── History clear all ── */
  const handleClearAllHistory = useCallback(() => {
    history.clearAll();
    clearBlobCache();
    toast.success("Successfully cleared all history");
  }, [history]);

  return (
    <div className="anim-fade-up read-aloud-page-root h-full overflow-y-auto p-6">
      <div className="max-w-[1080px] mx-auto">
        {/* Mode Tabs */}
        <div className="read-aloud-mode-tabs flex gap-2 flex-wrap">
          {MODE_TABS.map((tab) => {
            const isActive = mode === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setMode(tab.key)}
                className={`flex items-center gap-2 px-4.5 py-2.5 rounded-xl transition-all duration-200 font-body cursor-pointer ${
                  isActive
                    ? "border-2 border-border bg-accent text-ink shadow"
                    : "border border-border/30 bg-surface text-text-primary hover:bg-surface-hover hover:border-border/60"
                }`}
              >
                <motion.span
                  animate={{ scale: isActive ? 1.1 : 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 15 }}
                  className={`inline-flex ${isActive ? "text-ink" : "text-text-muted"}`}
                >
                  <tab.Icon size={18} />
                </motion.span>
                <div className="text-left">
                  <div
                    className={`mode-label text-sm ${
                      isActive ? "font-black text-ink" : "font-bold text-text-primary"
                    }`}
                  >
                    {tab.label}
                  </div>
                  <div
                    className={`mode-desc text-[11px] ${
                      isActive ? "text-ink/75" : "text-text-muted"
                    }`}
                  >
                    {tab.desc}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* ── Listen Mode (existing functionality) ── */}
        {mode === "listen" && (
          <div className="read-aloud-grid mt-6 grid grid-cols-1 md:grid-cols-[1fr_340px] gap-5">
            {/* Left: Input & Samples */}
            <div>
              <TextInputPanel
                text={text}
                onTextChange={setText}
                onClear={handleClear}
                historyCount={history.history.length}
                showHistory={showHistory}
                onToggleHistory={() => setShowHistory(!showHistory)}
                speed={speed}
              />

              <HistoryPanel
                history={history.history}
                show={showHistory}
                onClose={() => setShowHistory(false)}
                onReplay={handleReplayHistory}
                onDelete={history.remove}
                onClearAll={handleClearAllHistory}
              />

              <PassageBrowser onSelectPassage={(passageText) => setText(passageText)} />
            </div>

            {/* Right: Voice & Playback */}
            <div>
              <VoiceSelector selectedRole={selectedRole} onSelectRole={setSelectedRole} />

              <PlaybackControls
                loading={audio.loading}
                playing={audio.playing}
                audioUrl={audio.audioUrl}
                text={text}
                selectedVoice={selectedVoice}
                speed={speed}
                onSpeedChange={setSpeed}
                onGenerate={handleGenerate}
                onTogglePlayback={audio.togglePlayback}
                onStop={audio.stop}
              />
            </div>
          </div>
        )}

        {/* ── Shadow Mode ── */}
        {mode === "shadow" && (
          <div className="read-aloud-grid mt-6 grid grid-cols-1 md:grid-cols-[1fr_340px] gap-5">
            <ShadowingMode text={text} voiceRole={selectedRole} speed={speed} />
            <div>
              <VoiceSelector selectedRole={selectedRole} onSelectRole={setSelectedRole} />
              <div className="bg-surface rounded-xl border border-border p-4 shadow-sm">
                <span className="text-xs font-bold text-text-muted flex items-center gap-1.5 mb-2">
                  <motion.span
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ repeat: Infinity, duration: 2, repeatDelay: 4 }}
                    className="inline-flex text-accent-hover"
                  >
                    <Lightbulb size={14} />
                  </motion.span>
                  Shadowing Guide
                </span>
                {[
                  "1. Enter text in the Listen tab",
                  "2. Switch to the Shadowing tab",
                  "3. Listen to the model sentence → Read along",
                  "4. AI grades your pronunciation",
                  "5. Retry or move to the next sentence",
                ].map((tip, i) => (
                  <span key={i} className="text-xs text-text-secondary block mb-1 font-semibold">
                    {tip}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Dialogue Mode ── */}
        {mode === "dialogue" && (
          <div className="read-aloud-grid mt-6 grid grid-cols-1 md:grid-cols-[1fr_340px] gap-5">
            <DialoguePlayer voiceRole={selectedRole} speed={speed} />
            <div>
              <VoiceSelector selectedRole={selectedRole} onSelectRole={setSelectedRole} />
              <div className="bg-surface rounded-xl border border-border p-4 shadow-sm">
                <span className="text-xs font-bold text-text-muted flex items-center gap-1.5 mb-2">
                  <motion.span
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ repeat: Infinity, duration: 2, repeatDelay: 4 }}
                    className="inline-flex text-accent-hover"
                  >
                    <Lightbulb size={14} />
                  </motion.span>
                  Dialogue Guide
                </span>
                {[
                  "1. Select topic and number of speakers",
                  '2. Click "Create conversation"',
                  "3. Listen to the whole dialogue or sentence-by-sentence",
                  "4. Roleplay as a character",
                  "5. Read your part and get graded",
                ].map((tip, i) => (
                  <span key={i} className="text-xs text-text-secondary block mb-1 font-semibold">
                    {tip}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* CSS adjustments */}
      <style>{`
        .read-aloud-textarea {
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          color: var(--text-primary);
          background: var(--surface-alt);
          transition: border-color 0.25s ease, box-shadow 0.25s ease, background-color 0.25s ease;
        }
        .read-aloud-textarea:focus {
          border-color: var(--accent);
          box-shadow: 0 0 0 4px color-mix(in srgb, var(--accent) 15%, transparent);
          background: var(--surface);
        }
        .voice-grid {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        /* ── Medium screens (tablet landscape) ── */
        @media (max-width: 860px) {
          .read-aloud-grid {
            grid-template-columns: 1fr !important;
          }
        }

        /* ── Tablet (portrait) ── */
        @media (max-width: 768px) {
          .read-aloud-page-root {
            padding: var(--space-4) !important;
          }
          .read-aloud-panel {
            padding: var(--space-4) !important;
          }
          .read-aloud-mode-tabs {
            display: grid !important;
            grid-template-columns: 1fr 1fr 1fr !important;
          }
          .read-aloud-mode-tabs button {
            padding: 8px 10px !important;
          }
          .read-aloud-mode-tabs .mode-desc {
            display: none !important;
          }
          .read-aloud-textarea {
            min-height: 220px !important;
          }
          .voice-grid {
            display: grid !important;
            grid-template-columns: 1fr 1fr !important;
            gap: 10px !important;
          }
          .dialogue-bubbles {
            padding: 14px 10px !important;
          }
          .dialogue-bubble-content {
            max-width: 85% !important;
          }
          .dialogue-header-actions {
            flex-direction: column !important;
            align-items: stretch !important;
          }
          .dialogue-header-buttons {
            justify-content: flex-start !important;
          }
        }

        /* ── Mobile ── */
        @media (max-width: 480px) {
          .read-aloud-page-root {
            padding: var(--space-3) !important;
          }
          .read-aloud-panel {
            padding: var(--space-3) !important;
          }
          .read-aloud-mode-tabs {
            gap: 6px !important;
          }
          .read-aloud-mode-tabs button {
            padding: 8px !important;
            border-radius: 10px !important;
            gap: 4px !important;
          }
          .read-aloud-mode-tabs .mode-label {
            font-size: 12px !important;
          }
          .read-aloud-textarea {
            min-height: 180px !important;
            font-size: 14px !important;
          }
          .read-aloud-text-stats {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 6px !important;
          }
          .read-aloud-text-actions {
            flex-wrap: wrap !important;
          }
          .voice-grid {
            grid-template-columns: 1fr !important;
          }
          .dialogue-bubbles {
            padding: 10px 8px !important;
            gap: 10px !important;
          }
          .dialogue-bubble-content {
            max-width: 88% !important;
            padding: 10px 12px !important;
          }
          .dialogue-avatar {
            width: 34px !important;
            height: 34px !important;
          }
          .dialogue-avatar img {
            width: 34px !important;
            height: 34px !important;
          }
          .dialogue-speaker-badges {
            flex-wrap: wrap !important;
          }
          .role-play-buttons {
            flex-direction: column !important;
          }
          .listen-cta-buttons {
            flex-direction: column !important;
            align-items: stretch !important;
          }
          .waveform-container {
            flex-direction: column !important;
            gap: 10px !important;
          }
          .waveform-bars {
            justify-content: center !important;
          }
        }
      `}</style>
    </div>
  );
}
