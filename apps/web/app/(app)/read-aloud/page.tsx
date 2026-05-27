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
import * as m from "motion/react-client";


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
    <div className="read-aloud-page-root h-full overflow-y-auto p-4 md:p-6">
      <div className="max-w-[1080px] mx-auto">
        {/* ─── Mode Tabs ─── */}
        <div className="read-aloud-mode-tabs flex gap-1.5 bg-surface-alt rounded-2xl p-1 border-2 border-border shadow-sm mb-6 max-w-2xl overflow-x-auto scrollbar-none">
          {MODE_TABS.map((tab) => {
            const isActive = mode === tab.key;
            return (
              <m.button
                key={tab.key}
                type="button"
                onClick={() => setMode(tab.key)}
                whileTap={{ scale: 0.98 }}
                className={`flex-1 flex items-center gap-2.5 px-4 py-2.5 rounded-xl cursor-pointer transition-all duration-200 min-w-0 ${
                  isActive
                    ? "bg-accent text-text-on-accent border-none shadow-sm"
                    : "bg-transparent text-text-secondary hover:text-text-primary"
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
                  <div className={`mode-label text-sm ${isActive ? "font-black" : "font-bold"}`}>
                    {tab.label}
                  </div>
                  <div className={`mode-desc text-[10px] truncate ${isActive ? "opacity-75" : "opacity-50"}`}>
                    {tab.desc}
                  </div>
                </div>
              </m.button>
            );
          })}
        </div>

        {/* ── Listen Mode ── */}
        {mode === "listen" && (
          <div className="read-aloud-grid grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5">
            {/* Left: Input & Samples */}
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

            {/* Right: Voice & Playback */}
            <div className="flex flex-col gap-5">
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
          <div className="read-aloud-grid grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5">
            <ShadowingMode text={text} voiceRole={selectedRole} speed={speed} />
            <div className="flex flex-col gap-5">
              <VoiceSelector selectedRole={selectedRole} onSelectRole={setSelectedRole} />
              <GuideCard
                title="Shadowing Guide"
                steps={[
                  "Enter text in the Listen tab",
                  "Switch to the Shadowing tab",
                  "Listen to the model sentence → Read along",
                  "AI grades your pronunciation",
                  "Retry or move to the next sentence",
                ]}
              />
            </div>
          </div>
        )}

        {/* ── Dialogue Mode ── */}
        {mode === "dialogue" && (
          <div className="read-aloud-grid grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5">
            <DialoguePlayer voiceRole={selectedRole} speed={speed} />
            <div className="flex flex-col gap-5">
              <VoiceSelector selectedRole={selectedRole} onSelectRole={setSelectedRole} />
              <GuideCard
                title="Dialogue Guide"
                steps={[
                  "Select topic and number of speakers",
                  'Click "Create conversation"',
                  "Listen to the whole dialogue or sentence-by-sentence",
                  "Roleplay as a character",
                  "Read your part and get graded",
                ]}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Guide Card component ─── */
function GuideCard({ title, steps }: { title: string; steps: string[] }) {
  return (
    <div className="bg-surface rounded-2xl border-2 border-border p-5 shadow-sm">
      <span className="text-[10px] font-extrabold text-text-muted uppercase tracking-widest flex items-center gap-2 mb-3 font-display">
        <m.span
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ repeat: Infinity, duration: 2, repeatDelay: 4 }}
          className="inline-flex text-accent"
        >
          <Lightbulb size={14} />
        </m.span>
        {title}
      </span>
      <ol className="flex flex-col gap-1.5 list-none p-0 m-0">
        {steps.map((step, i) => (
          <li key={i} className="flex items-start gap-2.5 text-[12px] text-text-secondary font-semibold leading-relaxed">
            <span className="w-5 h-5 rounded-lg bg-accent-light border border-accent/15 text-accent text-[10px] font-black grid place-items-center shrink-0 mt-px">
              {i + 1}
            </span>
            <span>{step}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
