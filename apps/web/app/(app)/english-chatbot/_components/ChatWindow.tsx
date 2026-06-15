"use client";

import { AlertCircle, ArrowDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { ChatHeader } from "@/app/(app)/english-chatbot/_components/ChatHeader";
import { ChatInputBar } from "@/app/(app)/english-chatbot/_components/ChatInputBar";
import type { PageMessage } from "@/app/(app)/english-chatbot/_components/ChatMessage";
import { ChatMessage } from "@/app/(app)/english-chatbot/_components/ChatMessage";
import { EmptyState } from "@/app/(app)/english-chatbot/_components/EmptyState";
import { PronunciationFeedback } from "@/app/(app)/english-chatbot/_components/PronunciationFeedback";
import { SessionSummary } from "@/app/(app)/english-chatbot/_components/SessionSummary";
import { TypingIndicator } from "@/app/(app)/english-chatbot/_components/TypingIndicator";

import { useChatMessages } from "@/hooks/useChatMessages";
import { useChatScroll } from "@/hooks/useChatScroll";
import { useChatVoice } from "@/hooks/useChatVoice";

import { DEFAULT_PERSONA_ID, PERSONAS } from "@/lib/chat/personas";

export function getMessageSpacingClass(
  _currentMessage: PageMessage,
  _previousMessage?: PageMessage,
): string {
  // Full-width layout — messages handle their own vertical padding
  return "";
}

function ChatSkeleton() {
  return (
    <div className="max-w-2xl w-full mx-auto py-6 space-y-4">
      <div className="flex gap-3">
        <div className="w-6 h-6 rounded-lg bg-chat-surface border-2 border-border shrink-0 animate-pulse" />
        <div className="flex-1 flex flex-col gap-2">
          <div className="h-3 w-20 rounded-lg bg-chat-surface border-2 border-border animate-pulse" />
          <div className="h-4 w-[75%] rounded-lg bg-chat-surface border-2 border-border animate-pulse" />
          <div className="h-4 w-[50%] rounded-lg bg-chat-surface border-2 border-border animate-pulse" />
        </div>
      </div>
      <div className="flex gap-3">
        <div className="w-6 h-6 rounded-lg bg-chat-surface border-2 border-border shrink-0 animate-pulse" />
        <div className="flex-1 flex flex-col gap-2">
          <div className="h-3 w-12 rounded-lg bg-chat-surface border-2 border-border animate-pulse" />
          <div className="h-4 w-[60%] rounded-lg bg-chat-surface border-2 border-border animate-pulse" />
        </div>
      </div>
    </div>
  );
}

interface ChatWindowProps {
  conversationId: string | null;
}

export function ChatWindow({ conversationId }: ChatWindowProps) {
  const [selectedPersonaId] = useState(DEFAULT_PERSONA_ID);

  // ── Voice hook (needs sendRef for auto-send in voice mode) ──
  const sendRef = useRef<(text?: string) => Promise<void>>(
    null as unknown as (text?: string) => Promise<void>,
  );
  const messagesRef = useRef<PageMessage[]>([]);

  const chatVoice = useChatVoice({
    onTranscript: (text) => {
      chat.setInput(text);
      chat.markVoiceText(text);
      if (chatVoice.voiceMode) {
        setTimeout(() => sendRef.current(text), 100);
      }
    },
  });

  // ── Messages hook ──
  const chat = useChatMessages({
    conversationId,
    selectedPersonaId,
    onSendComplete: ({ userMessageId, userText, isVoiceMessage, assistantMessageId: _aid }) => {
      if (isVoiceMessage) {
        chatVoice.trackVoiceMessage(userMessageId);
        chatVoice.evaluatePronunciation(userMessageId, userText);
      }
      chatVoice.autoSpeakAssistant(messagesRef.current);
    },
  });

  // Keep refs in sync
  sendRef.current = chat.send;
  messagesRef.current = chat.messages;

  // ── Scroll hook ──
  const scroll = useChatScroll({
    messagesLength: chat.messages.length,
    isLoading: chat.isLoading,
    error: chat.error,
  });

  // ── Reset voice state when switching conversations ──
  useEffect(() => {
    if (!conversationId) {
      chatVoice.resetVoiceState();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  const activePersona = PERSONAS.find((p) => p.id === selectedPersonaId) ?? PERSONAS[0];
  const lastMsg = chat.messages.at(-1);
  const streamingHasStarted = chat.isLoading && lastMsg?.role === "assistant";
  const lastAssistantId = [...chat.messages].reverse().find((m) => m.role === "assistant")?.id;
  const hasMessages = chat.messages.length > 0;

  return (
    <div className="relative flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-[var(--bg)] z-10">
      {/* Dot pattern background */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(color-mix(in_srgb,var(--border)_15%,transparent)_1px,transparent_1px)] bg-[size:22px_22px] z-0" />

      <ChatHeader personaId={selectedPersonaId} isLoading={chat.isLoading} />

      <div
        ref={scroll.scrollContainerRef}
        onScroll={scroll.handleScroll}
        className="relative flex-1 min-h-0 overflow-y-auto px-4 py-6 md:px-6 md:py-8 z-10"
      >
        {/* Grain overlay */}
        <div className="grain-overlay opacity-30" />

        {/* Warm radial glow behind the conversations */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_0%,color-mix(in srgb, var(--warning) 6%, transparent),transparent_70%)] z-0" />

        <div className="relative mx-auto flex min-h-full w-full max-w-2xl flex-col z-10">
          {/* Skeleton only for truly empty loads (no cached messages to show) */}
          {chat.isLoadingMessages && !hasMessages && conversationId && <ChatSkeleton />}

          {!hasMessages && !chat.isLoadingMessages && (
            <EmptyState
              onSuggestedPrompt={(text) => {
                chat.setInput(text);
                setTimeout(() => chat.send(text), 50);
              }}
            />
          )}

          {hasMessages && (
            <div
              role="log"
              aria-live="polite"
              aria-relevant="additions text"
              className="flex flex-col transition-opacity duration-200"
              style={{ opacity: chat.isLoadingMessages ? 0.4 : 1 }}
            >
              {chat.messages.map((m, index) => (
                <div key={m.id} className={getMessageSpacingClass(m, chat.messages[index - 1])}>
                  <ChatMessage
                    message={m}
                    persona={activePersona}
                    isStreaming={
                      chat.isLoading && index === chat.messages.length - 1 && m.role === "assistant"
                    }
                    onSpeak={
                      chatVoice.tts.isSupported
                        ? (text) => chatVoice.speakMessage(m.id, text)
                        : undefined
                    }
                    isSpeaking={chatVoice.tts.isSpeaking && chatVoice.speakingMsgId === m.id}
                    isTtsLoading={chatVoice.tts.isLoading && chatVoice.speakingMsgId === m.id}
                    onStopSpeak={
                      chatVoice.tts.isSupported ? () => chatVoice.stopSpeaking() : undefined
                    }
                    isLastAssistant={m.id === lastAssistantId}
                    onRegenerate={chat.regenerate}
                    onSendMessage={(text) => {
                      chat.setInput(text);
                      setTimeout(() => chat.send(text), 50);
                    }}
                    isChatLoading={chat.isLoading}
                  />

                  {/* Inline pronunciation feedback for voice messages */}
                  {m.role === "user" &&
                    chatVoice.isVoiceMessage(m.id) &&
                    chatVoice.pronFeedback.has(m.id) && (
                      <div className="flex justify-end pr-8">
                        <PronunciationFeedback
                          data={chatVoice.pronFeedback.get(m.id)!}
                          onListenCorrect={
                            chatVoice.tts.isSupported
                              ? () => chatVoice.tts.speak(m.text)
                              : undefined
                          }
                        />
                      </div>
                    )}
                </div>
              ))}

              {chat.isLoading && !streamingHasStarted && (
                <div className="py-3">
                  <div className="mx-auto max-w-2xl px-2">
                    <div className="flex gap-3">
                      <div className="w-6" />
                      <TypingIndicator personaName={activePersona.label.split(" —")[0]} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {chat.error && (
            <div className="mt-5 flex gap-3 rounded-2xl border-2 border-error bg-error/10 p-4 text-xs text-error animate-in fade-in slide-in-from-bottom-1 duration-200">
              <AlertCircle className="h-4.5 w-4.5 shrink-0" />
              <div className="flex-1 flex flex-col gap-2">
                <p className="font-semibold leading-relaxed">{chat.error}</p>
                <div className="flex gap-4">
                  {chat.lastSendRef.current && !chat.isLoading && (
                    <button
                      onClick={chat.retryLast}
                      className="font-bold underline cursor-pointer text-error hover:text-error transition-colors"
                    >
                      Try again
                    </button>
                  )}
                  <button
                    onClick={() => chat.setError(null)}
                    className="font-bold underline cursor-pointer text-text-secondary hover:text-text-primary transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Session Report Card — appears after 5+ exchanges */}
          {!chat.isLoading && hasMessages && (
            <SessionSummary conversationId={conversationId} messageCount={chat.messages.length} />
          )}

          <div ref={scroll.bottomRef} />
        </div>
      </div>

      {scroll.showScrollBtn && (
        <button
          onClick={scroll.scrollToBottom}
          className="absolute bottom-24 left-1/2 -translate-x-1/2 z-40 flex items-center gap-1.5 rounded-lg border-2 border-border bg-chat-surface px-3.5 py-2 text-xs font-semibold text-text-secondary hover:text-ink shadow-lg cursor-pointer transition-all duration-200 active:scale-95 animate-in fade-in zoom-in-90"
        >
          <ArrowDown className="h-3.5 w-3.5" />
          <span>Scroll to bottom</span>
        </button>
      )}

      <ChatInputBar
        input={chat.input}
        onInputChange={chat.setInput}
        onSend={() => chat.send()}
        onStop={chat.stopStreaming}
        isLoading={chat.isLoading}
        voice={chatVoice.voice}
        tts={chatVoice.tts}
        voiceMode={chatVoice.voiceMode}
        voiceExchanges={chatVoice.voiceExchanges}
        pronEnabled={chatVoice.pronEnabled}
        onToggleVoiceMode={chatVoice.toggleVoiceMode}
        onTogglePronEnabled={() => chatVoice.setPronEnabled((v) => !v)}
      />
    </div>
  );
}
