"use client";

import { Flex, message, Typography } from "antd";
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
import { motion } from "framer-motion";

const { Title, Paragraph, Text } = Typography;

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
    message.info('Passage reloaded — click "Start listening" to play');
  }, []);

  /* ── History clear all ── */
  const handleClearAllHistory = useCallback(() => {
    history.clearAll();
    clearBlobCache();
    message.success("Successfully cleared all history");
  }, [history]);

  return (
    <div
      style={{ height: "100%", overflowY: "auto", padding: "var(--space-6)" }}
      className="anim-fade-up read-aloud-page-root"
    >
      <Flex vertical gap="var(--space-5)" style={{ maxWidth: 1080, margin: "0 auto" }}>
        {/* Mode Tabs */}
        <div className="read-aloud-mode-tabs" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {MODE_TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setMode(tab.key)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 18px",
                borderRadius: 14,
                border: mode === tab.key ? "2px solid var(--accent)" : "1px solid var(--border)",
                background:
                  mode === tab.key
                    ? "color-mix(in srgb, var(--accent) 10%, var(--surface))"
                    : "var(--surface)",
                cursor: "pointer",
                transition: "all 0.2s",
                fontFamily: "var(--font-body)",
                boxShadow: mode === tab.key ? "0 2px 12px var(--accent-muted)" : "var(--shadow-sm)",
              }}
            >
              <motion.span
                animate={{ scale: mode === tab.key ? 1.1 : 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 15 }}
                style={{ display: "inline-flex", color: mode === tab.key ? "var(--accent)" : "var(--text-muted)" }}
              >
                <tab.Icon size={18} />
              </motion.span>
              <div style={{ textAlign: "left" }}>
                <div
                  className="mode-label"
                  style={{
                    fontSize: 14,
                    fontWeight: mode === tab.key ? 800 : 600,
                    color: mode === tab.key ? "var(--accent)" : "var(--text-primary)",
                  }}
                >
                  {tab.label}
                </div>
                <div className="mode-desc" style={{ fontSize: 11, color: "var(--text-muted)" }}>
                  {tab.desc}
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* ── Listen Mode (existing functionality) ── */}
        {mode === "listen" && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 340px",
              gap: "var(--space-5)",
            }}
            className="read-aloud-grid"
          >
            {/* Left: Input & Samples */}
            <Flex vertical gap="var(--space-4)">
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
            </Flex>

            {/* Right: Voice & Playback */}
            <Flex vertical gap="var(--space-4)">
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
            </Flex>
          </div>
        )}

        {/* ── Shadow Mode ── */}
        {mode === "shadow" && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 340px",
              gap: "var(--space-5)",
            }}
            className="read-aloud-grid"
          >
            <ShadowingMode text={text} voiceRole={selectedRole} speed={speed} />
            <Flex vertical gap="var(--space-4)">
              <VoiceSelector selectedRole={selectedRole} onSelectRole={setSelectedRole} />
              <div
                style={{
                  background: "var(--surface)",
                  borderRadius: "var(--radius-xl)",
                  border: "1px solid var(--border)",
                  padding: "var(--space-4)",
                }}
              >
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: "var(--text-muted)",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    marginBottom: 8,
                  }}
                >
                  <motion.span
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ repeat: Infinity, duration: 2, repeatDelay: 4 }}
                    style={{ display: "inline-flex", color: "var(--accent)" }}
                  >
                    <Lightbulb size={14} />
                  </motion.span>
                  Shadowing Guide
                </Text>
                {[
                  "1. Enter text in the Listen tab",
                  "2. Switch to the Shadowing tab",
                  "3. Listen to the model sentence → Read along",
                  "4. AI grades your pronunciation",
                  "5. Retry or move to the next sentence",
                ].map((tip, i) => (
                  <Text
                    key={i}
                    style={{
                      fontSize: 12,
                      color: "var(--text-secondary)",
                      display: "block",
                      marginBottom: 4,
                    }}
                  >
                    {tip}
                  </Text>
                ))}
              </div>
            </Flex>
          </div>
        )}

        {/* ── Dialogue Mode ── */}
        {mode === "dialogue" && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 340px",
              gap: "var(--space-5)",
            }}
            className="read-aloud-grid"
          >
            <DialoguePlayer voiceRole={selectedRole} speed={speed} />
            <Flex vertical gap="var(--space-4)">
              <VoiceSelector selectedRole={selectedRole} onSelectRole={setSelectedRole} />
              <div
                style={{
                  background: "var(--surface)",
                  borderRadius: "var(--radius-xl)",
                  border: "1px solid var(--border)",
                  padding: "var(--space-4)",
                  boxShadow: "var(--shadow-sm)",
                }}
              >
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: "var(--text-muted)",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    marginBottom: 8,
                  }}
                >
                  <motion.span
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ repeat: Infinity, duration: 2, repeatDelay: 4 }}
                    style={{ display: "inline-flex", color: "var(--accent)" }}
                  >
                    <Lightbulb size={14} />
                  </motion.span>
                  Dialogue Guide
                </Text>
                {[
                  "1. Select topic and number of speakers",
                  '2. Click "Create conversation"',
                  "3. Listen to the whole dialogue or sentence-by-sentence",
                  "4. Roleplay as a character",
                  "5. Read your part and get graded",
                ].map((tip, i) => (
                  <Text
                    key={i}
                    style={{
                      fontSize: 12,
                      color: "var(--text-secondary)",
                      display: "block",
                      marginBottom: 4,
                    }}
                  >
                    {tip}
                  </Text>
                ))}
              </div>
            </Flex>
          </div>
        )}
      </Flex>

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
