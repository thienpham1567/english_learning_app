"use client";

import { Check, Loader2, Mic, MicOff, Send, Square, Volume2 } from "lucide-react";
import { useCallback, useRef } from "react";
import type { useTextToSpeech } from "@/hooks/useTextToSpeech";
import type { useVoiceInput } from "@/hooks/useVoiceInput";
import { PersonaSwitcher } from "./PersonaSwitcher";

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
  if (!input && textareaRef.current) {
    textareaRef.current.style.height = "auto";
  }

  const hasInput = input.trim().length > 0;

  return (
    <div className="flex-shrink-0 z-25 relative">
      {/* Gradient fade from chat area */}
      <div className="absolute -top-8 left-0 right-0 h-8 bg-gradient-to-t from-chat-bg to-transparent pointer-events-none" />

      <div className="px-4 pb-4 pt-2 md:px-6 md:pb-6">
        <div className="mx-auto max-w-2xl flex flex-col gap-2.5">
          {/* ── Main Input Container ── */}
          <div className="rounded-2xl border-2 border-border bg-chat-surface shadow-lg focus-within:border-accent/50 focus-within:shadow-accent/5 transition-all duration-200">
            {/* Textarea */}
            <div className="flex items-end gap-2 p-3">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="Message..."
                disabled={isLoading}
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
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border-2 transition-all duration-200 cursor-pointer active:scale-95 ${
                      voice.isListening
                        ? "border-error text-error bg-error/10 animate-pulse"
                        : voice.isTranscribing
                          ? "border-accent text-accent bg-accent/10"
                          : "border-border text-text-muted bg-transparent hover:text-text-primary hover:border-border-strong"
                    } disabled:opacity-40 disabled:cursor-not-allowed`}
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
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-error text-white transition-all duration-200 cursor-pointer active:scale-95 shadow-sm"
                    aria-label="Stop response"
                  >
                    <Square className="h-3.5 w-3.5 fill-current" />
                  </button>
                ) : (
                  <button
                    onClick={onSend}
                    disabled={!hasInput}
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-all duration-200 cursor-pointer active:scale-95 ${
                      hasInput
                        ? "bg-accent text-white shadow-sm hover:brightness-110"
                        : "bg-transparent border-2 border-border text-text-muted cursor-not-allowed opacity-40"
                    }`}
                  >
                    <Send className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* ── Bottom toolbar ── */}
            <div className="flex items-center justify-between border-t border-border/50 px-3 py-2">
              <div className="flex items-center gap-2">
                <PersonaSwitcher
                  value={selectedPersonaId}
                  onChange={onPersonaChange}
                  disabled={isLoading}
                />

                {/* Voice Mode pill */}
                {voice.isSupported && tts.isSupported && (
                  <button
                    onClick={onToggleVoiceMode}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border-2 text-[10px] font-bold tracking-wide transition-all cursor-pointer ${
                      voiceMode
                        ? "border-accent/50 bg-accent/10 text-accent"
                        : "border-border bg-transparent text-text-muted hover:text-text-primary hover:border-border-strong"
                    }`}
                  >
                    <Mic className="h-3 w-3" />
                    <span>{voiceMode ? `Voice (${voiceExchanges})` : "Voice"}</span>
                  </button>
                )}

                {/* Pronunciation pill */}
                {voiceMode && (
                  <button
                    onClick={onTogglePronEnabled}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border-2 text-[10px] font-bold tracking-wide transition-all cursor-pointer ${
                      pronEnabled
                        ? "border-success/50 bg-success/10 text-success"
                        : "border-border bg-transparent text-text-muted hover:text-text-primary hover:border-border-strong"
                    }`}
                  >
                    <Volume2 className="h-3 w-3" />
                    <span>Pronunciation</span>
                    {pronEnabled && <Check className="h-3 w-3" />}
                  </button>
                )}
              </div>

              <span className="hidden sm:inline text-[10px] text-text-muted font-mono">
                ↵ Send · ⇧↵ New line
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
