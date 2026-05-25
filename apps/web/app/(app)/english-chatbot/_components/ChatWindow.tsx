"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowDownOutlined } from "@ant-design/icons";

import { TypingIndicator } from "@/app/(app)/english-chatbot/_components/TypingIndicator";
import { ChatMessage } from "@/app/(app)/english-chatbot/_components/ChatMessage";
import type { PageMessage } from "@/app/(app)/english-chatbot/_components/ChatMessage";
import { useChatConversations } from "@/app/(app)/english-chatbot/_components/ChatConversationProvider";
import { ChatHeader } from "@/app/(app)/english-chatbot/_components/ChatHeader";
import { ChatInputBar } from "@/app/(app)/english-chatbot/_components/ChatInputBar";
import { EmptyState } from "@/app/(app)/english-chatbot/_components/EmptyState";
import { PronunciationFeedback } from "@/app/(app)/english-chatbot/_components/PronunciationFeedback";

import { useChatMessages } from "@/hooks/useChatMessages";
import { useChatScroll } from "@/hooks/useChatScroll";
import { useChatVoice } from "@/hooks/useChatVoice";

import { DEFAULT_PERSONA_ID, PERSONAS } from "@/lib/chat/personas";
import type { ChatMessage as AppChatMessage } from "@/lib/chat/types";

export function getMessageSpacingStyle(
  currentMessage: PageMessage,
  previousMessage?: PageMessage,
): React.CSSProperties {
  if (!previousMessage) return {};
  return { marginTop: currentMessage.role === previousMessage.role ? 4 : 28 };
}

function ChatSkeleton() {
  return (
    <div style={{ maxWidth: 900, width: "100%", margin: "0 auto", padding: "24px 0" }}>
      <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
        <div
          style={{
            width: 32, height: 32, borderRadius: "50%",
            background: "var(--bg-deep)", flexShrink: 0,
            animation: "pulse 1.5s infinite",
          }}
        />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ height: 16, width: "75%", borderRadius: 8, background: "var(--bg-deep)", animation: "pulse 1.5s infinite" }} />
          <div style={{ height: 16, width: "50%", borderRadius: 8, background: "var(--bg-deep)", animation: "pulse 1.5s infinite" }} />
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 24 }}>
        <div style={{ width: "66%", display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ height: 16, width: "100%", borderRadius: 8, background: "var(--bg-deep)", animation: "pulse 1.5s infinite" }} />
          <div style={{ height: 16, width: "80%", borderRadius: 8, background: "var(--bg-deep)", animation: "pulse 1.5s infinite" }} />
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
  const sendRef = useRef<(text?: string) => Promise<void>>(null as unknown as (text?: string) => Promise<void>);
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
    <div
      style={{
        position: "relative",
        display: "flex",
        height: "100%",
        minHeight: 0,
        flex: 1,
        flexDirection: "column",
        overflow: "hidden",
        background: "linear-gradient(135deg, var(--surface), var(--bg))",
      }}
    >
      <ChatHeader personaId={selectedPersonaId} isLoading={chat.isLoading} />

      <div
        ref={scroll.scrollContainerRef}
        onScroll={scroll.handleScroll}
        style={{
          position: "relative",
          flex: 1,
          minHeight: 0,
          overflowY: "auto",
          padding: "24px 16px",
        }}
      >
        {/* Grain overlay */}
        <div className="grain-overlay" />
        {/* Warm radial glow */}
        <div
          style={{
            pointerEvents: "none",
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(ellipse 60% 40% at 50% 0%, color-mix(in srgb, var(--accent) 7%, transparent) 0%, transparent 70%)",
          }}
        />

        <div
          style={{
            position: "relative",
            margin: "0 auto",
            display: "flex",
            minHeight: "100%",
            width: "100%",
            maxWidth: 900,
            flexDirection: "column",
          }}
        >
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
            <div style={{ display: "flex", flexDirection: "column" }}>
              {chat.messages.map((m, index) => (
                <div
                  key={m.id}
                  style={getMessageSpacingStyle(m, chat.messages[index - 1])}
                >
                  <ChatMessage
                    message={m}
                    persona={activePersona}
                    isStreaming={
                      chat.isLoading &&
                      index === chat.messages.length - 1 &&
                      m.role === "assistant"
                    }
                    onSpeak={
                      chatVoice.tts.isSupported
                        ? (text) => chatVoice.speakMessage(m.id, text)
                        : undefined
                    }
                    isSpeaking={chatVoice.tts.isSpeaking && chatVoice.speakingMsgId === m.id}
                    isTtsLoading={chatVoice.tts.isLoading && chatVoice.speakingMsgId === m.id}
                    onStopSpeak={
                      chatVoice.tts.isSupported
                        ? () => chatVoice.stopSpeaking()
                        : undefined
                    }
                    isLastAssistant={m.id === lastAssistantId}
                    onRegenerate={chat.regenerate}
                  />
                  {/* Inline pronunciation feedback for voice messages */}
                  {m.role === "user" &&
                    chatVoice.isVoiceMessage(m.id) &&
                    chatVoice.pronFeedback.has(m.id) && (
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "flex-end",
                          paddingRight: 4,
                        }}
                      >
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
                <div className="anim-fade-in" style={{ marginTop: 28 }}>
                  <TypingIndicator
                    personaName={activePersona.label.split(" —")[0]}
                  />
                </div>
              )}
            </div>
          )}

          {chat.error && (
            <div
              className="anim-fade-up"
              style={{
                marginTop: 20,
                borderRadius: "var(--radius)",
                border: "1px solid color-mix(in srgb, var(--error) 16%, transparent)",
                background: "var(--error-bg)",
                padding: "12px 16px",
                fontSize: 14,
                color: "var(--error)",
              }}
            >
              <p>{chat.error}</p>
              <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
                {chat.lastSendRef.current && !chat.isLoading && (
                  <button
                    style={{
                      fontWeight: 500, textDecoration: "underline",
                      background: "none", border: "none", cursor: "pointer", color: "inherit",
                    }}
                    onClick={chat.retryLast}
                  >
                    Thử lại
                  </button>
                )}
                <button
                  style={{
                    fontWeight: 500, textDecoration: "underline",
                    background: "none", border: "none", cursor: "pointer", color: "inherit",
                  }}
                  onClick={() => chat.setError(null)}
                >
                  Đóng
                </button>
              </div>
            </div>
          )}

          <div ref={scroll.bottomRef} />
        </div>
      </div>

      {scroll.showScrollBtn && (
        <button
          className="anim-scale-in"
          style={{
            position: "absolute",
            bottom: 88,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 10,
            display: "flex",
            alignItems: "center",
            gap: 6,
            borderRadius: 999,
            border: "1px solid var(--border)",
            background: "var(--surface)",
            padding: "6px 12px",
            fontSize: 12,
            fontWeight: 500,
            color: "var(--text-secondary)",
            boxShadow: "var(--shadow-lg)",
            cursor: "pointer",
            transition: "background 0.2s, color 0.2s",
          }}
          onClick={scroll.scrollToBottom}
        >
          <ArrowDownOutlined style={{ fontSize: 12 }} />
          Xuống cuối
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
