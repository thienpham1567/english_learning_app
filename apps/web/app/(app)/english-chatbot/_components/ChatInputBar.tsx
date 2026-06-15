"use client";

import { Check, Loader2, Mic, MicOff, Send, Square, Volume2 } from "lucide-react";
import { useCallback, useEffect, useRef } from "react";
import type { useTextToSpeech } from "@/hooks/useTextToSpeech";
import type { useVoiceInput } from "@/hooks/useVoiceInput";

type Props = {
  input: string;
  onInputChange: (value: string) => void;
  onSend: () => void;
  onStop: () => void;
  isLoading: boolean;

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
    el.style.height = Math.min(el.scrollHeight, 200) + "px";
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
  useEffect(() => {
    if (!input && textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }, [input]);

  const hasInput = input.trim().length > 0;

  return (
    <div className="flex-shrink-0 z-25 relative">
      {/* Gradient fade from chat area */}
      <div className="absolute -top-8 left-0 right-0 h-8 bg-gradient-to-t from-[var(--bg)] to-transparent pointer-events-none" />

      <div className="px-4 pb-4 pt-2 md:px-6 md:pb-6">
        <div className="mx-auto max-w-2xl flex flex-col gap-2.5">
          {/* ── Main Input Container ── */}
          <div className="border-2 border-border bg-chat-surface shadow-[4px_4px_0_var(--shadow-color)] focus-within:border-accent focus-within:shadow-[5px_5px_0_var(--shadow-color)] transition-all duration-200">
            {/* Textarea */}
            <div className="flex items-end gap-2 p-3">
              <span
                aria-hidden
                className="select-none pb-2.5 pl-1 font-mono text-sm font-black text-accent"
              >
                ▶
              </span>
              <textarea
                ref={textareaRef}
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="Nhắn cho Aria…"
                rows={1}
                className="flex-1 min-h-[42px] max-h-[200px] resize-none border-0 bg-transparent py-2 px-1 text-sm leading-relaxed text-ink placeholder-text-muted outline-none focus:ring-0 focus:outline-none"
              />

              {/* Right-side buttons */}
              <div className="flex items-center gap-1.5 pb-1">
                {/* Mic Button */}
                {voice.isSupported && (
                  <button
                    onClick={() => {
                      if (voice.isListening) {
                        voice.stop();
                      } else if (!voice.isTranscribing) {
                        voice.start();
                      }
                    }}
                    disabled={isLoading || voice.isTranscribing}
                    className={`flex h-9 w-9 shrink-0 items-center justify-center border-2 transition-all duration-150 cursor-pointer active:translate-x-px active:translate-y-px ${
                      voice.isListening
                        ? "border-error text-error bg-error/10 animate-pulse shadow-[2px_2px_0_var(--shadow-color)]"
                        : voice.isTranscribing
                          ? "border-accent text-accent-active bg-accent-light shadow-[2px_2px_0_var(--shadow-color)]"
                          : "border-border text-text-muted bg-surface hover:text-ink shadow-[2px_2px_0_var(--shadow-color)]"
                    } disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none`}
                    aria-label={
                      voice.isListening
                        ? "Stop recording"
                        : voice.isTranscribing
                          ? "Transcribing..."
                          : "Speak English"
                    }
                  >
                    {voice.isListening ? (
                      <MicOff className="h-3.5 w-3.5" />
                    ) : voice.isTranscribing ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Mic className="h-3.5 w-3.5" />
                    )}
                  </button>
                )}

                {/* Send / Stop */}
                {isLoading ? (
                  <button
                    onClick={onStop}
                    className="flex h-9 w-9 shrink-0 items-center justify-center border-2 border-border bg-error text-white transition-all duration-150 cursor-pointer shadow-[2px_2px_0_var(--shadow-color)] active:translate-x-px active:translate-y-px active:shadow-none"
                    aria-label="Stop response"
                  >
                    <Square className="h-3.5 w-3.5 fill-current" />
                  </button>
                ) : (
                  <button
                    onClick={onSend}
                    disabled={!hasInput}
                    className={`flex h-9 w-9 shrink-0 items-center justify-center border-2 transition-all duration-150 cursor-pointer ${
                      hasInput
                        ? "border-border bg-accent text-text-on-accent shadow-[2px_2px_0_var(--shadow-color)] hover:-translate-x-px hover:-translate-y-px hover:shadow-[3px_3px_0_var(--shadow-color)] active:translate-x-0 active:translate-y-0 active:shadow-none"
                        : "border-border bg-surface text-text-muted cursor-not-allowed opacity-40"
                    }`}
                  >
                    <Send className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* ── Bottom toolbar ── */}
            <div className="flex items-center justify-between border-t-2 border-border bg-surface-alt px-3 py-2">
              <div className="flex items-center gap-2">
                {/* Voice Mode pill */}
                {voice.isSupported && tts.isSupported && (
                  <button
                    onClick={onToggleVoiceMode}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 border-2 font-mono text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                      voiceMode
                        ? "border-accent bg-accent-light text-accent-active shadow-[2px_2px_0_var(--shadow-color)]"
                        : "border-border bg-surface text-text-muted hover:text-ink"
                    }`}
                  >
                    <Mic className="h-3 w-3" />
                    <span>{voiceMode ? `Voice · ${voiceExchanges}` : "Voice"}</span>
                  </button>
                )}

                {/* Pronunciation pill */}
                {voiceMode && (
                  <button
                    onClick={onTogglePronEnabled}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 border-2 font-mono text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                      pronEnabled
                        ? "border-success bg-success/10 text-success shadow-[2px_2px_0_var(--shadow-color)]"
                        : "border-border bg-surface text-text-muted hover:text-ink"
                    }`}
                  >
                    <Volume2 className="h-3 w-3" />
                    <span>Phát âm</span>
                    {pronEnabled && <Check className="h-3 w-3" />}
                  </button>
                )}
              </div>

              <span className="hidden sm:inline font-mono text-[10px] font-bold uppercase tracking-wider text-text-muted">
                ↵ Gửi · ⇧↵ Xuống dòng
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
