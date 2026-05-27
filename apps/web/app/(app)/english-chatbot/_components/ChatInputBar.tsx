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
    <div className="flex-shrink-0 px-4 py-4 md:px-6 md:pb-6 z-25 border-t-2 border-border bg-chat-surface/60 backdrop-blur-md">
      <div className="mx-auto max-w-3xl flex flex-col gap-3">
        {/* Input Bar Container */}
        <div className="flex items-end gap-2.5 rounded-2xl border-2 border-border bg-chat-input-bg p-3 shadow-md focus-within:border-accent/40 focus-within:ring-1 focus-within:ring-accent/40 transition-all duration-200">
          <div className="pb-1">
            <PersonaSwitcher
              value={selectedPersonaId}
              onChange={onPersonaChange}
              disabled={isLoading}
            />
          </div>

          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Ask in English or choose a tutor on the left..."
            disabled={isLoading}
            rows={1}
            className="flex-1 min-h-[38px] max-h-[160px] resize-none border-0 bg-transparent py-2 px-2 text-xs md:text-sm leading-relaxed text-ink placeholder-text-muted outline-none focus:ring-0 focus:outline-none"
          />

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
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition-all duration-200 cursor-pointer shadow-sm relative active:scale-95 ${
                voice.isListening
                  ? "border-red-500 text-red-500 bg-red-950/20 animate-pulse"
                  : voice.isTranscribing
                    ? "border-accent text-accent bg-accent/10"
                    : "border-border text-text-secondary bg-chat-surface-hover hover:border-border-strong hover:text-text-primary"
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
                <MicOff className="h-4 w-4" />
              ) : voice.isTranscribing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Mic className="h-4 w-4" />
              )}
            </button>
          )}

          {/* Send / Stop button */}
          {isLoading ? (
            <button
              onClick={onStop}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-500 hover:bg-red-600 text-white transition-all duration-200 cursor-pointer shadow-sm active:scale-95"
              aria-label="Stop response"
              title="Stop response"
            >
              <Square className="h-4 w-4 fill-current" />
            </button>
          ) : (
            <button
              onClick={onSend}
              disabled={!input.trim()}
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-all duration-200 cursor-pointer shadow-sm active:scale-95 ${
                input.trim()
                  ? "bg-accent text-white hover:bg-accent-hover"
                  : "bg-chat-surface-hover border-2 border-border text-text-muted cursor-not-allowed opacity-50"
              }`}
            >
              <Send className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Hints and pill controls row */}
        <div className="flex items-center justify-between gap-4 flex-wrap text-[10px] text-text-muted font-semibold px-1">
          <span className="hidden sm:inline font-mono">
            Enter to send · Shift+Enter for new line
          </span>
          <span className="sm:hidden font-mono">Press Enter to send</span>

          <div className="flex items-center gap-2">
            {/* Voice Mode toggle pill */}
            {voice.isSupported && tts.isSupported && (
              <button
                onClick={onToggleVoiceMode}
                className={`inline-flex items-center gap-1 px-3 py-1 rounded-full border text-[10px] font-bold tracking-wide transition-all cursor-pointer ${
                  voiceMode
                    ? "border-accent bg-accent/10 text-accent font-bold"
                    : "border-border bg-chat-surface-hover text-text-secondary hover:border-border-strong hover:text-text-primary"
                }`}
              >
                <Mic className="h-3 w-3" />
                <span>{voiceMode ? `Voice Mode (${voiceExchanges})` : "Voice Mode"}</span>
              </button>
            )}

            {/* Pronunciation Feedback toggle pill */}
            {voiceMode && (
              <button
                onClick={onTogglePronEnabled}
                className={`inline-flex items-center gap-1 px-3 py-1 rounded-full border text-[10px] font-bold tracking-wide transition-all cursor-pointer ${
                  pronEnabled
                    ? "border-emerald-500/50 bg-emerald-950/20 text-emerald-450 font-bold"
                    : "border-border bg-chat-surface-hover text-text-secondary hover:border-border-strong hover:text-text-primary"
                }`}
              >
                <Volume2 className="h-3 w-3" />
                <span>Pronunciation feedback</span>
                {pronEnabled && <Check className="h-3 w-3 text-emerald-400" />}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
