"use client";

import { Headphones, MessageSquare, Mic } from "lucide-react";
import * as m from "motion/react-client";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { DialoguePlayer } from "./_components/DialoguePlayer";
import { HistoryPanel } from "./_components/HistoryPanel";
import { PassageBrowser } from "./_components/PassageBrowser";
import { PlaybackControls } from "./_components/PlaybackControls";
import { ShadowingMode } from "./_components/ShadowingMode";
import { TextInputPanel } from "./_components/TextInputPanel";
import { VoiceSelector } from "./_components/VoiceSelector";
import { getVoiceByRole, getVoicesByProvider, type TtsProvider } from "./_data/voices";
import { clearBlobCache, useAudioPlayback } from "./_hooks/useAudioPlayback";
import { useHistory } from "./_hooks/useHistory";

type AppMode = "listen" | "shadow" | "dialogue";

const MODE_TABS = [
  {
    key: "listen" as AppMode,
    label: "Listen",
    Icon: Headphones,
    desc: "Listen to native speakers read passages",
  },
  {
    key: "shadow" as AppMode,
    label: "Shadowing",
    Icon: Mic,
    desc: "Read along and get real-time feedback",
  },
  {
    key: "dialogue" as AppMode,
    label: "Dialogue",
    Icon: MessageSquare,
    desc: "Interactive roleplay conversation practice",
  },
];

export default function ReadAloudPage() {
  const [mode, setMode] = useState<AppMode>("listen");
  const [text, setText] = useState("");
  const [provider, setProvider] = useState<TtsProvider>("groq");
  const [selectedRole, setSelectedRole] = useState<string>("groq-us-m");
  const [speed, setSpeed] = useState(1);
  const [showHistory, setShowHistory] = useState(false);

  // Dialogue-specific: speaker count only (voices auto-assigned)
  const [dialogueSpeakers, setDialogueSpeakers] = useState<2 | 3>(2);

  const audio = useAudioPlayback();
  const history = useHistory();

  const selectedVoice = getVoiceByRole(selectedRole);

  /* ── Auto-select first voice when provider changes ── */
  const handleProviderChange = useCallback((p: TtsProvider) => {
    setProvider(p);
    const voices = getVoicesByProvider(p);
    if (voices.length > 0) {
      setSelectedRole(voices[0].role);
    }
  }, []);

  /* ── Generate handler ── */
  const handleGenerate = useCallback(async () => {
    const voice = getVoiceByRole(selectedRole);
    const wasCached = await audio.generate(
      text,
      selectedRole,
      speed,
      voice.provider,
      voice.voiceId,
    );
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
    <div className="read-aloud-page-root h-full overflow-y-auto p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* ─── Masthead ─── */}
        <m.header initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-5">
          <div className="flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-[0.28em] text-text-muted">
            <span className="inline-block h-2 w-2 rotate-45 bg-accent" />
            Read Aloud · Luyện nghe &amp; nói
          </div>
          <h1 className="m-0 mt-1.5 font-display text-[clamp(1.8rem,4vw,2.4rem)] font-black uppercase leading-[0.95] tracking-tight text-ink">
            Read{" "}
            <span className="relative inline-block">
              Aloud
              <span className="absolute -bottom-1 left-0 h-1.5 w-full bg-accent/60" />
            </span>
          </h1>
        </m.header>

        {/* ─── Mode Tabs ─── */}
        <div className="read-aloud-mode-tabs flex gap-1 bg-surface-alt p-1 border-2 border-border shadow-[3px_3px_0_var(--shadow-color)] mb-6 max-w-2xl overflow-x-auto scrollbar-none">
          {MODE_TABS.map((tab) => {
            const isActive = mode === tab.key;
            return (
              <m.button
                key={tab.key}
                type="button"
                onClick={() => setMode(tab.key)}
                whileTap={{ scale: 0.98 }}
                className={`flex-1 flex items-center gap-2.5 px-4 py-2.5 cursor-pointer transition-all duration-200 min-w-0 ${
                  isActive
                    ? "bg-accent text-text-on-accent border-2 border-border shadow-[2px_2px_0_var(--shadow-color)]"
                    : "bg-transparent border-2 border-transparent text-text-secondary hover:text-text-primary"
                }`}
              >
                <m.span
                  animate={{ scale: isActive ? 1.1 : 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 15 }}
                  className="inline-flex shrink-0"
                >
                  <tab.Icon size={18} />
                </m.span>
                <div className="text-left min-w-0">
                  <div
                    className={`mode-label font-display text-sm uppercase tracking-tight ${isActive ? "font-black" : "font-bold"}`}
                  >
                    {tab.label}
                  </div>
                  <div
                    className={`mode-desc text-[10px] truncate font-mono ${isActive ? "opacity-75" : "opacity-50"}`}
                  >
                    {tab.desc}
                  </div>
                </div>
              </m.button>
            );
          })}
        </div>

        {/* ── Listen Mode ── */}
        {mode === "listen" && (
          <div className="read-aloud-grid grid grid-cols-1 lg:grid-cols-[1fr_320px] xl:grid-cols-[1fr_380px] gap-5">
            <div className="flex flex-col gap-5">
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
            <div className="flex flex-col gap-5">
              <VoiceSelector
                selectedRole={selectedRole}
                onSelectRole={setSelectedRole}
                provider={provider}
                onProviderChange={handleProviderChange}
              />
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
          <div className="read-aloud-grid grid grid-cols-1 lg:grid-cols-[1fr_320px] xl:grid-cols-[1fr_380px] gap-5">
            <ShadowingMode
              text={text}
              onTextChange={setText}
              onClear={handleClear}
              voiceRole={selectedRole}
              speed={speed}
            />
            <div className="flex flex-col gap-5">
              <VoiceSelector
                selectedRole={selectedRole}
                onSelectRole={setSelectedRole}
                provider={provider}
                onProviderChange={handleProviderChange}
              />
            </div>
          </div>
        )}

        {/* ── Dialogue Mode ── */}
        {mode === "dialogue" && (
          <DialoguePlayer
            speed={speed}
            speakerCount={dialogueSpeakers}
            onSpeakerCountChange={setDialogueSpeakers}
          />
        )}
      </div>
    </div>
  );
}
