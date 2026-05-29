"use client";

import { AlertCircle, ArrowDown } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useChatConversations } from "@/app/(app)/english-chatbot/_components/ChatConversationProvider";
import { ChatHeader } from "@/app/(app)/english-chatbot/_components/ChatHeader";
import { ChatInputBar } from "@/app/(app)/english-chatbot/_components/ChatInputBar";
import type { PageMessage } from "@/app/(app)/english-chatbot/_components/ChatMessage";
import { ChatMessage } from "@/app/(app)/english-chatbot/_components/ChatMessage";
import { EmptyState } from "@/app/(app)/english-chatbot/_components/EmptyState";
import { PronunciationFeedback } from "@/app/(app)/english-chatbot/_components/PronunciationFeedback";
import { TypingIndicator } from "@/app/(app)/english-chatbot/_components/TypingIndicator";

import { useChatMessages } from "@/hooks/useChatMessages";
import { useChatScroll } from "@/hooks/useChatScroll";
import { useChatVoice } from "@/hooks/useChatVoice";

import { DEFAULT_PERSONA_ID, PERSONAS } from "@/lib/chat/personas";

export function getMessageSpacingClass(
  currentMessage: PageMessage,
  previousMessage?: PageMessage,
): string {
  if (!previousMessage) return "";
  return currentMessage.role === previousMessage.role ? "mt-1.5" : "mt-6";
}

function ChatSkeleton() {
  return (
    <div className="max-w-2xl w-full mx-auto py-6 space-y-6">
      <div className="flex gap-3">
        <div className="w-8 h-8 rounded-full bg-chat-surface border-2 border-border shrink-0 animate-pulse" />
        <div className="flex-1 flex flex-col gap-2">
          <div className="h-4 w-[75%] rounded-lg bg-chat-surface border-2 border-border animate-pulse" />
          <div className="h-4 w-[50%] rounded-lg bg-chat-surface border-2 border-border animate-pulse" />
        </div>
      </div>
      <div className="flex justify-end">
        <div className="w-[66%] flex flex-col gap-2 items-end">
          <div className="h-4 w-full rounded-lg bg-chat-surface border-2 border-border animate-pulse" />
          <div className="h-4 w-[80%] rounded-lg bg-chat-surface border-2 border-border animate-pulse" />
        </div>
      </div>
    </div>
  );
}

interface ChatWindowProps {
  conversationId: string | null;
}

export function ChatWindow({ conversationId }: ChatWindowProps) {
  const { conversations } = useChatConversations();
  const [selectedPersonaId, setSelectedPersonaId] = useState(DEFAULT_PERSONA_ID);

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

  // ── Sync persona from conversation on load ──
  useEffect(() => {
    if (!conversationId) {
      setSelectedPersonaId(DEFAULT_PERSONA_ID);
      chatVoice.resetVoiceState();
      return;
    }
    const conv = conversations.find((c) => c.id === conversationId);
    if (conv?.personaId) {
      setSelectedPersonaId(conv.personaId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  // ── Persona change handler ──
  const handlePersonaChange = useCallback((personaId: string) => {
    setSelectedPersonaId(personaId);
    chat.setMessages((curr) => {
      if (curr.length === 0) return curr;
      const persona = PERSONAS.find((p) => p.id === personaId);
      if (!persona) return curr;
      return [
        ...curr,
        {
          id: crypto.randomUUID(),
          role: "divider" as const,
          text: `Switched to ${persona.label}`,
        },
      ];
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const activePersona = PERSONAS.find((p) => p.id === selectedPersonaId) ?? PERSONAS[0];
  const lastMsg = chat.messages.at(-1);
  const streamingHasStarted = chat.isLoading && lastMsg?.role === "assistant";
  const lastAssistantId = [...chat.messages].reverse().find((m) => m.role === "assistant")?.id;
  const hasMessages = chat.messages.length > 0;

  return (
    <div className="relative flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-chat-bg z-10">
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
          {chat.isLoadingMessages && conversationId && <ChatSkeleton />}

          {!hasMessages && !chat.isLoadingMessages && (
            <EmptyState
              selectedPersonaId={selectedPersonaId}
              onSelectPersona={setSelectedPersonaId}
              onSuggestedPrompt={(text) => {
                chat.setInput(text);
                setTimeout(() => chat.send(text), 50);
              }}
            />
          )}

          {hasMessages && !chat.isLoadingMessages && (
            <div className="flex flex-col">
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
                <div className="mt-6">
                  <TypingIndicator personaName={activePersona.label.split(" —")[0]} />
                </div>
              )}
            </div>
          )}

          {chat.error && (
            <div className="mt-5 flex gap-3 rounded-2xl border border-error bg-error/10 p-4 text-xs text-error animate-in fade-in slide-in-from-bottom-1 duration-200">
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

          <div ref={scroll.bottomRef} />
        </div>
      </div>

      {scroll.showScrollBtn && (
        <button
          onClick={scroll.scrollToBottom}
          className="absolute bottom-24 left-1/2 -translate-x-1/2 z-40 flex items-center gap-1.5 rounded-full border-2 border-border bg-chat-surface px-3.5 py-2 text-xs font-semibold text-text-secondary hover:text-ink shadow-lg cursor-pointer transition-all duration-200 active:scale-95 animate-in fade-in zoom-in-90"
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
        selectedPersonaId={selectedPersonaId}
        onPersonaChange={handlePersonaChange}
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
