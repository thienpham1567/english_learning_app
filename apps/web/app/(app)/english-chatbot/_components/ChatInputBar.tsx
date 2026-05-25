"use client";

import { useRef, useCallback } from "react";
import {
  ArrowUpOutlined,
  AudioOutlined,
  PauseOutlined,
  LoadingOutlined,
  SoundOutlined,
  CheckOutlined,
} from "@ant-design/icons";

import { PersonaSwitcher } from "@/app/(app)/english-chatbot/_components/PersonaSwitcher";
import type { useVoiceInput } from "@/hooks/useVoiceInput";
import type { useTextToSpeech } from "@/hooks/useTextToSpeech";

type Props = {
  input: string;
  onInputChange: (value: string) => void;
  onSend: () => void;
  onStop: () => void;
  isLoading: boolean;

  // Persona
  selectedPersonaId: string;
  onPersonaChange: (id: string) => void;

  // Voice
  voice: ReturnType<typeof useVoiceInput>;
  tts: ReturnType<typeof useTextToSpeech>;
  voiceMode: boolean;
  voiceExchanges: number;
  pronEnabled: boolean;
  onToggleVoiceMode: () => void;
  onTogglePronEnabled: () => void;
};

export function ChatInputBar({
  input,
  onInputChange,
  onSend,
  onStop,
  isLoading,
  selectedPersonaId,
  onPersonaChange,
  voice,
  tts,
  voiceMode,
  voiceExchanges,
  pronEnabled,
  onToggleVoiceMode,
  onTogglePronEnabled,
}: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const autoResize = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 160) + "px";
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        onSend();
      }
    },
    [onSend],
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onInputChange(e.target.value);
      autoResize();
    },
    [onInputChange, autoResize],
  );

  // Reset textarea height when input is cleared externally (after send)
  if (!input && textareaRef.current) {
    textareaRef.current.style.height = "auto";
  }

  return (
    <div
      style={{
        flexShrink: 0,
        background: "var(--bg)",
        padding: "16px",
        backdropFilter: "blur(12px)",
      }}
    >
      <div
        style={{
          margin: "0 auto",
          maxWidth: 900,
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        <div
          className="chat-input-container"
          style={{
            display: "flex",
            alignItems: "flex-end",
            gap: 12,
            borderRadius: "var(--radius-lg)",
            border: "1px solid var(--border)",
            background: "var(--surface)",
            padding: 12,
            boxShadow: "var(--shadow-md)",
            transition: "border-color 0.2s, box-shadow 0.2s",
          }}
        >
          <PersonaSwitcher
            value={selectedPersonaId}
            onChange={onPersonaChange}
            disabled={isLoading}
          />
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Nhập câu hỏi hoặc câu trả lời bằng tiếng Anh..."
            disabled={isLoading}
            rows={1}
            style={{
              minHeight: 44,
              flex: 1,
              resize: "none",
              border: 0,
              background: "transparent",
              padding: "8px",
              fontSize: 15,
              lineHeight: 1.6,
              color: "var(--text-primary)",
              outline: "none",
            }}
          />

          {/* Mic Button */}
          {voice.isSupported && (
            <button
              style={{
                display: "grid",
                width: 44,
                height: 44,
                flexShrink: 0,
                placeItems: "center",
                borderRadius: "50%",
                border: voice.isListening
                  ? "2px solid var(--error)"
                  : voice.isTranscribing
                    ? "2px solid var(--accent)"
                    : "1.5px solid var(--border)",
                color: voice.isListening
                  ? "var(--error)"
                  : voice.isTranscribing
                    ? "var(--accent)"
                    : "var(--text-muted)",
                background: voice.isListening
                  ? "var(--error-bg)"
                  : voice.isTranscribing
                    ? "var(--accent-muted)"
                    : "transparent",
                cursor:
                  isLoading || voice.isTranscribing
                    ? "not-allowed"
                    : "pointer",
                transition: "all 0.2s",
                animation: voice.isListening || voice.isTranscribing
                  ? "pulse 1.5s infinite"
                  : "none",
              }}
              onClick={() => {
                if (voice.isListening) {
                  voice.stop();
                } else if (!voice.isTranscribing) {
                  voice.start();
                }
              }}
              disabled={isLoading || voice.isTranscribing}
              aria-label={
                voice.isListening
                  ? "Dừng ghi âm"
                  : voice.isTranscribing
                    ? "Đang nhận dạng..."
                    : "Nói tiếng Anh"
              }
            >
              <span style={{ fontSize: 18 }}>
                {voice.isListening ? (
                  <PauseOutlined />
                ) : voice.isTranscribing ? (
                  <LoadingOutlined spin />
                ) : (
                  <AudioOutlined />
                )}
              </span>
            </button>
          )}

          {/* Send / Stop button */}
          {isLoading ? (
            <button
              style={{
                display: "grid",
                width: 44,
                height: 44,
                flexShrink: 0,
                placeItems: "center",
                borderRadius: "50%",
                border: "none",
                color: "var(--text-on-accent)",
                boxShadow: "var(--shadow-sm)",
                cursor: "pointer",
                background: "var(--error)",
                transition: "background 0.2s, transform 0.15s",
              }}
              onClick={onStop}
              aria-label="Dừng trả lời"
              title="Dừng trả lời"
            >
              <PauseOutlined style={{ fontSize: 14 }} />
            </button>
          ) : (
            <button
              style={{
                display: "grid",
                width: 44,
                height: 44,
                flexShrink: 0,
                placeItems: "center",
                borderRadius: "50%",
                border: "none",
                color: "var(--text-on-accent)",
                boxShadow: "var(--shadow-sm)",
                cursor: input.trim() ? "pointer" : "not-allowed",
                background: input.trim() ? "var(--accent)" : "var(--ink)",
                transition: "background 0.2s, transform 0.15s",
                opacity: !input.trim() ? 0.6 : 1,
              }}
              onClick={onSend}
              disabled={!input.trim()}
            >
              <ArrowUpOutlined style={{ fontSize: 18 }} />
            </button>
          )}
        </div>

        {/* Hints row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            flexWrap: "wrap",
            fontSize: 12,
            color: "var(--text-muted)",
          }}
        >
          <span>
            Enter để gửi · Shift+Enter xuống dòng
            {voice.isSupported ? " · nói" : ""}
          </span>
          {voice.isSupported && tts.isSupported && (
            <button
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                padding: "3px 10px",
                borderRadius: 999,
                border: voiceMode
                  ? "1.5px solid var(--accent)"
                  : "1px solid var(--border)",
                background: voiceMode
                  ? "color-mix(in srgb, var(--accent) 10%, var(--surface))"
                  : "var(--surface)",
                color: voiceMode ? "var(--accent)" : "var(--text-muted)",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.2s",
              }}
              onClick={onToggleVoiceMode}
            >
              <AudioOutlined />{" "}
              {voiceMode
                ? `Chế độ nói (${voiceExchanges})`
                : "Chế độ nói"}
            </button>
          )}
          {voiceMode && (
            <button
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                padding: "3px 10px",
                borderRadius: 999,
                border: pronEnabled
                  ? "1.5px solid var(--success)"
                  : "1px solid var(--border)",
                background: pronEnabled
                  ? "color-mix(in srgb, var(--success) 8%, transparent)"
                  : "var(--surface)",
                color: pronEnabled
                  ? "var(--success)"
                  : "var(--text-muted)",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.2s",
              }}
              onClick={onTogglePronEnabled}
            >
              <SoundOutlined />{" "}
              {pronEnabled ? (
                <>
                  Phản hồi phát âm <CheckOutlined />
                </>
              ) : (
                "Phản hồi phát âm"
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
