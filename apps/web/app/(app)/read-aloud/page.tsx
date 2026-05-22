"use client";

import { useState, useCallback } from "react";
import { Flex, Typography, message } from "antd";
import { SoundOutlined } from "@ant-design/icons";
import { ModuleHeader } from "@/components/shared/ModuleHeader";

import { getVoiceByRole } from "./_data/voices";
import { useAudioPlayback, clearBlobCache } from "./_hooks/useAudioPlayback";
import { useHistory } from "./_hooks/useHistory";

import { TextInputPanel } from "./_components/TextInputPanel";
import { VoiceSelector } from "./_components/VoiceSelector";
import { PlaybackControls } from "./_components/PlaybackControls";
import { PassageBrowser } from "./_components/PassageBrowser";
import { HistoryPanel } from "./_components/HistoryPanel";
import { ShadowingMode } from "./_components/ShadowingMode";
import { DialoguePlayer } from "./_components/DialoguePlayer";

const { Title, Paragraph, Text } = Typography;

type AppMode = "listen" | "shadow" | "dialogue";

const MODE_TABS: { key: AppMode; label: string; icon: string; desc: string }[] = [
  { key: "listen", label: "Nghe", icon: "🎧", desc: "Nghe giọng bản xứ đọc đoạn văn" },
  { key: "shadow", label: "Shadowing", icon: "🎙️", desc: "Đọc theo & được chấm điểm" },
  { key: "dialogue", label: "Hội thoại", icon: "💬", desc: "Nghe & đóng vai hội thoại" },
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
  const handleReplayHistory = useCallback((entry: typeof history.history[number]) => {
    setText(entry.text);
    setSelectedRole(entry.voice);
    setSpeed(entry.speed);
    setShowHistory(false);
    message.info("Đã tải lại đoạn văn — nhấn \"Bắt đầu nghe đọc\" để phát");
  }, []);

  /* ── History clear all ── */
  const handleClearAllHistory = useCallback(() => {
    history.clearAll();
    clearBlobCache();
    message.success("Đã xóa toàn bộ lịch sử");
  }, [history]);

  return (
    <div
      style={{ height: "100%", overflowY: "auto", padding: "var(--space-6)" }}
      className="anim-fade-up"
    >
      <Flex vertical gap="var(--space-5)" style={{ maxWidth: 1080, margin: "0 auto" }}>
        {/* Header */}
        <ModuleHeader
          icon={<SoundOutlined />}
          gradient="linear-gradient(135deg, #4c1d95, #6d28d9 50%, #7c3aed)"
          title="Đọc to — Read Aloud"
          subtitle="Luyện nghe & nói tiếng Anh với giọng bản xứ — shadowing, chấm điểm phát âm, hội thoại đa giọng"
        />

        {/* Mode Tabs */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
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
                background: mode === tab.key
                  ? "color-mix(in srgb, var(--accent) 10%, var(--surface))"
                  : "var(--surface)",
                cursor: "pointer",
                transition: "all 0.2s",
                fontFamily: "var(--font-body)",
              }}
            >
              <span style={{ fontSize: 18 }}>{tab.icon}</span>
              <div style={{ textAlign: "left" }}>
                <div style={{
                  fontSize: 14,
                  fontWeight: mode === tab.key ? 800 : 600,
                  color: mode === tab.key ? "var(--accent)" : "var(--text-primary)",
                }}>
                  {tab.label}
                </div>
                <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{tab.desc}</div>
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

              <PassageBrowser
                onSelectPassage={(passageText) => setText(passageText)}
              />
            </Flex>

            {/* Right: Voice & Playback */}
            <Flex vertical gap="var(--space-4)">
              <VoiceSelector
                selectedRole={selectedRole}
                onSelectRole={setSelectedRole}
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
              <div style={{
                background: "var(--surface)",
                borderRadius: "var(--radius-xl)",
                border: "1px solid var(--border)",
                padding: "var(--space-4)",
              }}>
                <Text style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", display: "block", marginBottom: 8 }}>
                  💡 Hướng dẫn Shadowing
                </Text>
                {[
                  "1. Nhập văn bản ở tab Nghe",
                  "2. Chuyển sang tab Shadowing",
                  "3. Nghe câu mẫu → Đọc theo",
                  "4. AI chấm điểm phát âm",
                  "5. Thử lại hoặc sang câu tiếp",
                ].map((tip, i) => (
                  <Text key={i} style={{ fontSize: 12, color: "var(--text-secondary)", display: "block", marginBottom: 4 }}>
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
              <div style={{
                background: "var(--surface)",
                borderRadius: "var(--radius-xl)",
                border: "1px solid var(--border)",
                padding: "var(--space-4)",
              }}>
                <Text style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", display: "block", marginBottom: 8 }}>
                  💡 Hướng dẫn Hội thoại
                </Text>
                {[
                  "1. Chọn chủ đề & số người",
                  "2. Nhấn \"Tạo hội thoại\"",
                  "3. Nghe toàn bộ hoặc từng câu",
                  "4. Đóng vai 1 nhân vật",
                  "5. Đọc vai của mình & được chấm điểm",
                ].map((tip, i) => (
                  <Text key={i} style={{ fontSize: 12, color: "var(--text-secondary)", display: "block", marginBottom: 4 }}>
                    {tip}
                  </Text>
                ))}
              </div>
            </Flex>
          </div>
        )}

        {/* Feature Highlights */}
        <div
          style={{
            background: "var(--surface)",
            borderRadius: "var(--radius-xl)",
            border: "1px solid var(--border)",
            padding: "var(--space-5)",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <Title level={5} style={{ margin: "0 0 16px 0", color: "var(--text-primary)", fontSize: 15 }}>
            🚀 Luyện phát âm & luyện nghe hiệu quả cùng Read Aloud
          </Title>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 16,
            }}
          >
            {[
              {
                title: "So sánh các giọng đọc",
                desc: "Nghe cùng một đoạn văn với accent Mỹ, Anh hoặc Úc giúp bạn dễ nhận diện sự khác biệt ngữ điệu.",
                emoji: "🌏",
              },
              {
                title: "Bộ nhớ đệm thông minh",
                desc: "Đoạn văn đã nghe sẽ được cache cả trên server và trình duyệt. Nghe lại không tốn thêm token AI!",
                emoji: "⚡",
              },
              {
                title: "Điều chỉnh tốc độ",
                desc: "Giảm tốc độ đọc xuống 0.8x để nghe chi tiết nối âm, tăng tốc lên 1.2x - 1.5x để thử thách phản xạ.",
                emoji: "🎚️",
              },
              {
                title: "Lịch sử & tái sử dụng",
                desc: "Mọi đoạn văn bạn đã nghe đều được lưu lại. Mở lại bất kỳ lúc nào mà không cần nhập lại từ đầu.",
                emoji: "📋",
              },
            ].map((card, i) => (
              <div
                key={i}
                style={{
                  background: "var(--surface-alt)",
                  padding: "14px 16px",
                  borderRadius: "var(--radius-lg)",
                  border: "1px solid var(--border)",
                }}
              >
                <div style={{ fontSize: 20, marginBottom: 8 }}>{card.emoji}</div>
                <Text strong style={{ fontSize: 13, display: "block", marginBottom: 4, color: "var(--text-primary)" }}>
                  {card.title}
                </Text>
                <Paragraph style={{ fontSize: 12, color: "var(--text-secondary)", margin: 0, lineHeight: 1.5 }}>
                  {card.desc}
                </Paragraph>
              </div>
            ))}
          </div>
        </div>
      </Flex>

      {/* Responsive adjustments */}
      <style>{`
        @media (max-width: 860px) {
          .read-aloud-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
