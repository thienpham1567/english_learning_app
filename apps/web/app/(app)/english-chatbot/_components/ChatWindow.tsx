"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowDownOutlined, ArrowUpOutlined } from "@ant-design/icons";

import { TypingIndicator } from "@/app/(app)/english-chatbot/_components/TypingIndicator";
import { ChatMessage } from "@/app/(app)/english-chatbot/_components/ChatMessage";
import type { PageMessage } from "@/app/(app)/english-chatbot/_components/ChatMessage";
import { useChatConversations } from "@/app/(app)/english-chatbot/_components/ChatConversationProvider";
import { PersonaSwitcher } from "@/app/(app)/english-chatbot/_components/PersonaSwitcher";
import { ChatHeader } from "@/app/(app)/english-chatbot/_components/ChatHeader";
import { MiniDictionary } from "@/components/shared";
import { useMiniDictionary } from "@/hooks/useMiniDictionary";
import { useVoiceInput } from "@/hooks/useVoiceInput";
import { useTextToSpeech } from "@/hooks/useTextToSpeech";
import { PronunciationFeedback } from "@/app/(app)/english-chatbot/_components/PronunciationFeedback";
import type { PronFeedbackData } from "@/app/(app)/english-chatbot/_components/PronunciationFeedback";
import { deriveTitle } from "@/lib/chat/derive-title";
import { parseAssistantStream } from "@/lib/chat/parse-assistant-stream";
import { DEFAULT_PERSONA_ID, PERSONAS } from "@/lib/chat/personas";
import type { Persona } from "@/lib/chat/personas";
import type { ChatMessage as AppChatMessage } from "@/lib/chat/types";
import { api } from "@/lib/api-client";

const CHAT_ERROR_MESSAGE = "Gia sư đang gặp lỗi kỹ thuật. Bạn thử lại sau nhé.";

export function getMessageSpacingStyle(
  currentMessage: PageMessage,
  previousMessage?: PageMessage,
): React.CSSProperties {
  if (!previousMessage) return {};
  return { marginTop: currentMessage.role === previousMessage.role ? 4 : 28 };
}

function ChatSkeleton() {
  return (
    <div
      style={{
        maxWidth: 900,
        width: "100%",
        margin: "0 auto",
        padding: "24px 0",
      }}
    >
      <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: "50%",
            background: "var(--bg-deep)",
            flexShrink: 0,
            animation: "pulse 1.5s infinite",
          }}
        />
        <div
          style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}
        >
          <div
            style={{
              height: 16,
              width: "75%",
              borderRadius: 8,
              background: "var(--bg-deep)",
              animation: "pulse 1.5s infinite",
            }}
          />
          <div
            style={{
              height: 16,
              width: "50%",
              borderRadius: 8,
              background: "var(--bg-deep)",
              animation: "pulse 1.5s infinite",
            }}
          />
        </div>
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          marginBottom: 24,
        }}
      >
        <div
          style={{
            width: "66%",
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          <div
            style={{
              height: 16,
              width: "100%",
              borderRadius: 8,
              background: "var(--bg-deep)",
              animation: "pulse 1.5s infinite",
            }}
          />
          <div
            style={{
              height: 16,
              width: "80%",
              borderRadius: 8,
              background: "var(--bg-deep)",
              animation: "pulse 1.5s infinite",
            }}
          />
        </div>
      </div>
    </div>
  );
}

interface ChatWindowProps {
  conversationId: string | null;
}

export function ChatWindow({ conversationId }: ChatWindowProps) {
  const router = useRouter();
  const { conversations, setConversations, loadConversations } =
    useChatConversations();
  const [messages, setMessages] = useState<PageMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPersonaId, setSelectedPersonaId] =
    useState(DEFAULT_PERSONA_ID);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isNearBottomRef = useRef(true);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const justCreatedRef = useRef(false);
  const abortCtrlRef = useRef<AbortController | null>(null);
  const lastSendRef = useRef<string | null>(null);
  const lastMsg = messages.at(-1);
  const streamingHasStarted = isLoading && lastMsg?.role === "assistant";
  const activePersona =
    PERSONAS.find((p) => p.id === selectedPersonaId) ?? PERSONAS[0];
  const ActiveAvatar = activePersona.avatar;

  // Voice hooks (Story 7.1 + 7.2)
  const voice = useVoiceInput();
  const tts = useTextToSpeech();
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);

  // Pronunciation inline feedback (Story 13.3)
  const [pronFeedback, setPronFeedback] = useState<
    Map<string, PronFeedbackData>
  >(new Map());
  const [pronEnabled, setPronEnabled] = useState(true);
  // Track which message IDs came from voice input
  const voiceMessageIds = useRef<Set<string>>(new Set());
  // F2: Track last voice transcript for robust detection
  const lastVoiceTextRef = useRef<string | null>(null);

  // Voice Conversation Mode (Story 7.3)
  const [voiceMode, setVoiceMode] = useState(false);
  const [voiceExchanges, setVoiceExchanges] = useState(0);
  const voiceModeRef = useRef(false);
  voiceModeRef.current = voiceMode;
  const messagesRef = useRef(messages);
  messagesRef.current = messages;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sendRef = useRef<(text?: string) => Promise<void>>(null as any);

  // When Whisper transcription completes, populate input (or auto-send in voice mode)
  useEffect(() => {
    if (voice.transcript && !voice.isTranscribing) {
      setInput(voice.transcript);
      lastVoiceTextRef.current = voice.transcript; // F2: mark as voice-originated
      if (voiceModeRef.current) {
        setTimeout(() => sendRef.current(voice.transcript), 100);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [voice.transcript, voice.isTranscribing]);

  // MiniDictionary integration (Story 4.2)
  const miniDict = useMiniDictionary();
  const [savedWords, setSavedWords] = useState<Set<string>>(new Set());

  // Fetch saved vocabulary on mount (AC: #5)
  useEffect(() => {
    api
      .get<Array<{ query: string; saved: boolean }>>("/vocabulary")
      .then((data) => {
        const saved = new Set(
          data.filter((v) => v.saved).map((v) => v.query.toLowerCase()),
        );
        setSavedWords(saved);
      })
      .catch(() => {}); // non-critical — highlighting still works without
  }, []);

  const conversationsRef = useRef(conversations);
  conversationsRef.current = conversations;

  // Load messages when conversationId changes (from URL)
  useEffect(() => {
    if (!conversationId) {
      setMessages([]);
      setError(null);
      setSelectedPersonaId(DEFAULT_PERSONA_ID);
      // F1: Clear pronunciation feedback state on conversation switch
      setPronFeedback(new Map());
      voiceMessageIds.current.clear();
      return;
    }

    if (justCreatedRef.current) {
      justCreatedRef.current = false;
      return;
    }

    const conv = conversationsRef.current.find((c) => c.id === conversationId);
    if (conv?.personaId) {
      setSelectedPersonaId(conv.personaId);
    }

    let cancelled = false;
    setIsLoadingMessages(true);
    (async () => {
      try {
        const rows = await api.get<
          Array<{
            id: string;
            role: "user" | "assistant";
            content: string;
          }>
        >(`/conversations/${conversationId}/messages`);
        if (cancelled) return;
        if (!cancelled) {
          setMessages(
            rows.map((r) => ({ id: r.id, role: r.role, text: r.content })),
          );
          setError(null);
        }
      } catch {
        if (!cancelled) {
          setError("Không thể tải cuộc trò chuyện này.");
        }
      } finally {
        if (!cancelled) {
          setIsLoadingMessages(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [conversationId]);

  useEffect(() => {
    const bottom = bottomRef.current;
    if (
      isNearBottomRef.current &&
      bottom &&
      typeof bottom.scrollIntoView === "function"
    ) {
      // Use instant scroll while streaming to avoid jitter from smooth animations
      // stacking on every delta; smooth only for discrete events.
      bottom.scrollIntoView({ behavior: isLoading ? "instant" : "smooth" });
    }
  }, [messages, isLoading, error]);

  const handleScroll = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    isNearBottomRef.current = distFromBottom < 80;
    setShowScrollBtn(distFromBottom > 200);
  }, []);

  const scrollToBottom = () => {
    isNearBottomRef.current = true;
    const bottom = bottomRef.current;
    if (bottom && typeof bottom.scrollIntoView === "function") {
      bottom.scrollIntoView({ behavior: "smooth" });
    }
  };

  const autoResize = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 160) + "px";
  };

  const removeEmptyAssistantMessage = (messageId: string) => {
    setMessages((curr) =>
      curr.filter(
        (m) =>
          m.id !== messageId ||
          (m.role !== "divider" && m.text.trim().length > 0),
      ),
    );
  };

  const handlePersonaChange = useCallback((personaId: string) => {
    setSelectedPersonaId(personaId);
    setMessages((curr) => {
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
  }, []);

  const send = async (text?: string) => {
    const t = (text ?? input).trim();
    if (!t || isLoading) return;

    let convId = conversationId;
    if (!convId) {
      try {
        const created = await api.post<{
          id: string;
          title: string;
          personaId: string;
        }>("/conversations", {
          title: deriveTitle(t),
          personaId: selectedPersonaId,
        });
        convId = created.id;
        setConversations((curr) => [
          {
            id: created.id,
            title: created.title,
            updatedAt: new Date().toISOString(),
            personaId: created.personaId,
          },
          ...curr,
        ]);
        justCreatedRef.current = true;
        router.replace(`/english-chatbot/${created.id}`);
      } catch {
        // proceed without persistence if conversation creation fails
      }
    }

    const isVoiceMessage = lastVoiceTextRef.current === t;
    if (isVoiceMessage) lastVoiceTextRef.current = null; // F2: consume after use
    const userMessage: AppChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      text: t,
    };
    if (isVoiceMessage) {
      voiceMessageIds.current.add(userMessage.id);
    }
    const assistantMessageId = crypto.randomUUID();

    const requestMessages = [...messages, userMessage].filter(
      (m): m is AppChatMessage => m.role === "user" || m.role === "assistant",
    );
    const isFirstExchange = messages.length === 0;

    setMessages((curr) => [
      ...curr,
      userMessage,
      { id: assistantMessageId, role: "assistant", text: "" },
    ]);
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    setError(null);
    setIsLoading(true);
    lastSendRef.current = t;

    const controller = new AbortController();
    abortCtrlRef.current = controller;

    try {
      const response = await api.post<Response>(
        "/chat",
        {
          messages: requestMessages,
          conversationId: convId,
          personaId: selectedPersonaId,
        },
        { raw: true, signal: controller.signal },
      );

      if (!response.body) {
        throw new Error(CHAT_ERROR_MESSAGE);
      }

      await parseAssistantStream(
        response,
        {
          onDelta: (delta) => {
            setMessages((curr) =>
              curr.map((m) =>
                m.id === assistantMessageId
                  ? { ...m, text: m.text + delta }
                  : m,
              ),
            );
          },
          onDone: () => {
            if (convId) {
              loadConversations();
              // First exchange just finished → ask server for an LLM-generated title.
              if (isFirstExchange) {
                api
                  .post(`/conversations/${convId}/title`)
                  .then(() => loadConversations())
                  .catch(() => {});
              }
            }
          },
          onError: (msg) => {
            setError(msg);
            removeEmptyAssistantMessage(assistantMessageId);
          },
          onPersistError: (msg) => {
            setError(msg);
          },
        },
        controller.signal,
      );
    } catch (streamError) {
      if (controller.signal.aborted) {
        // User cancelled — keep whatever was streamed so far.
      } else {
        console.error("Chat page stream error:", streamError);
        setError(CHAT_ERROR_MESSAGE);
        removeEmptyAssistantMessage(assistantMessageId);
      }
    } finally {
      abortCtrlRef.current = null;
      setIsLoading(false);

      // Fire async pronunciation evaluation for voice messages (non-blocking)
      if (isVoiceMessage && pronEnabled) {
        const msgId = userMessage.id;
        setPronFeedback((prev) =>
          new Map(prev).set(msgId, { status: "loading" }),
        );
        api
          .post<{
            score: number;
            accuracy: number;
            fluency: number;
            wordAnalysis: PronFeedbackData["wordAnalysis"];
            tips: string[];
            feedback: string;
          }>("/pronunciation/evaluate", { targetText: t, spokenText: t })
          .then((result) => {
            setPronFeedback((prev) =>
              new Map(prev).set(msgId, {
                status: "done",
                score: result.score,
                accuracy: result.accuracy,
                fluency: result.fluency,
                wordAnalysis: result.wordAnalysis,
                tips: result.tips,
                feedback: result.feedback,
              }),
            );
          })
          .catch(() => {
            setPronFeedback((prev) =>
              new Map(prev).set(msgId, { status: "error" }),
            );
          });
      }

      // Voice mode: auto-speak the last assistant message after streaming done
      if (voiceModeRef.current && tts.isSupported) {
        // Use ref to get latest messages (closure would be stale)
        setTimeout(() => {
          const latest = messagesRef.current;
          const lastAssistant = [...latest]
            .reverse()
            .find((m) => m.role === "assistant");
          if (lastAssistant && "text" in lastAssistant && lastAssistant.text) {
            tts.speak(lastAssistant.text);
            setVoiceExchanges((c) => c + 1);
          }
        }, 300);
      }
    }
  };
  sendRef.current = send;

  const stopStreaming = useCallback(() => {
    abortCtrlRef.current?.abort();
  }, []);

  const regenerate = useCallback(() => {
    if (isLoading) return;
    // Find last user message text, drop last assistant bubble, replay send().
    const lastUserIdx = [...messages]
      .map((m) => m.role)
      .lastIndexOf("user");
    if (lastUserIdx < 0) return;
    const last = messages[lastUserIdx];
    if (last.role !== "user") return;
    setMessages((curr) => curr.slice(0, lastUserIdx));
    void send(last.text);
  }, [isLoading, messages]);

  const retryLast = useCallback(() => {
    const text = lastSendRef.current;
    if (!text || isLoading) return;
    setError(null);
    void send(text);
  }, [isLoading]);

  const lastAssistantId = [...messages].reverse().find((m) => m.role === "assistant")?.id;

  const hasMessages = messages.length > 0;

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
      <ChatHeader personaId={selectedPersonaId} />
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
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
          {isLoadingMessages && conversationId && <ChatSkeleton />}

          {!hasMessages && !isLoadingMessages && (
            <div
              className="anim-fade-in"
              style={{
                margin: "auto",
                display: "flex",
                maxWidth: 760,
                flexDirection: "column",
                alignItems: "center",
                textAlign: "center",
              }}
            >
              <h2
                className="anim-fade-up anim-delay-1"
                style={{
                  fontSize: 36,
                  fontStyle: "italic",
                  fontFamily: "var(--font-display)",
                  color: "var(--ink)",
                }}
              >
                Chọn gia sư để bắt đầu
              </h2>
              <p
                className="anim-fade-up anim-delay-2"
                style={{
                  marginTop: 8,
                  maxWidth: 400,
                  fontSize: 15,
                  color: "var(--text-secondary)",
                }}
              >
                Mỗi gia sư có phong cách riêng — chọn người phù hợp nhất với
                bạn.
              </p>

              {/* Persona cards grid (AC: #1) */}
              <div
                style={{
                  marginTop: 24,
                  display: "grid",
                  width: "100%",
                  gap: 12,
                  gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
                }}
              >
                {PERSONAS.map((persona, i) => {
                  const Avatar = persona.avatar;
                  const isSelected = persona.id === selectedPersonaId;
                  return (
                    <button
                      key={persona.id}
                      className={`anim-fade-up anim-delay-${Math.min(i + 3, 8)}`}
                      onClick={() => setSelectedPersonaId(persona.id)}
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 8,
                        borderRadius: "var(--radius-lg)",
                        border: isSelected
                          ? "2px solid var(--accent)"
                          : "1px solid var(--border)",
                        background: isSelected
                          ? "var(--accent-light)"
                          : "var(--surface)",
                        padding: "20px 16px",
                        textAlign: "center",
                        boxShadow: isSelected
                          ? "0 0 0 1px var(--accent)"
                          : "var(--shadow-sm)",
                        transition:
                          "border-color 0.2s, background 0.2s, box-shadow 0.2s, transform 0.15s",
                        cursor: "pointer",
                      }}
                    >
                      <Avatar size={48} />
                      <span
                        style={{
                          marginTop: 4,
                          fontSize: 15,
                          fontWeight: 600,
                          color: "var(--ink)",
                        }}
                      >
                        {persona.label}
                      </span>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "2px 10px",
                          borderRadius: 999,
                          fontSize: 11,
                          fontWeight: 500,
                          background: isSelected
                            ? "var(--accent)"
                            : "var(--bg-deep)",
                          color: isSelected ? "var(--text-on-accent)" : "var(--text-secondary)",
                          transition: "background 0.2s, color 0.2s",
                        }}
                      >
                        {persona.specialty}
                      </span>
                      <span
                        style={{
                          marginTop: 2,
                          fontSize: 13,
                          lineHeight: 1.5,
                          color: "var(--text-secondary)",
                        }}
                      >
                        {persona.description}
                      </span>
                    </button>
                  );
                })}
              </div>

            </div>
          )}

          {hasMessages && !isLoadingMessages && (
            <div style={{ display: "flex", flexDirection: "column" }}>
              {messages.map((m, index) => (
                <div
                  key={m.id}
                  style={getMessageSpacingStyle(m, messages[index - 1])}
                >
                  <ChatMessage
                    message={m}
                    persona={activePersona}
                    isStreaming={
                      isLoading &&
                      index === messages.length - 1 &&
                      m.role === "assistant"
                    }
                    onWordClick={miniDict.openForWord}
                    savedWords={savedWords}
                    onSpeak={
                      tts.isSupported
                        ? (text) => {
                            setSpeakingMsgId(m.id);
                            tts.speak(text);
                          }
                        : undefined
                    }
                    isSpeaking={tts.isSpeaking && speakingMsgId === m.id}
                    isTtsLoading={tts.isLoading && speakingMsgId === m.id}
                    onStopSpeak={
                      tts.isSupported
                        ? () => {
                            tts.stop();
                            setSpeakingMsgId(null);
                          }
                        : undefined
                    }
                    isLastAssistant={m.id === lastAssistantId}
                    onRegenerate={regenerate}
                  />
                  {/* Inline pronunciation feedback for voice messages */}
                  {m.role === "user" &&
                    voiceMessageIds.current.has(m.id) &&
                    pronFeedback.has(m.id) && (
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "flex-end",
                          paddingRight: 4,
                        }}
                      >
                        <PronunciationFeedback
                          data={pronFeedback.get(m.id)!}
                          onListenCorrect={
                            tts.isSupported
                              ? () => {
                                  tts.speak(m.text);
                                }
                              : undefined
                          }
                        />
                      </div>
                    )}
                </div>
              ))}
              {isLoading && !streamingHasStarted && (
                <div className="anim-fade-in" style={{ marginTop: 28 }}>
                  <TypingIndicator
                    personaName={activePersona.label.split(" —")[0]}
                  />
                </div>
              )}
            </div>
          )}

          {error && (
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
              <p>{error}</p>
              <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
                {lastSendRef.current && !isLoading && (
                  <button
                    style={{
                      fontWeight: 500,
                      textDecoration: "underline",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "inherit",
                    }}
                    onClick={retryLast}
                  >
                    Thử lại
                  </button>
                )}
                <button
                  style={{
                    fontWeight: 500,
                    textDecoration: "underline",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "inherit",
                  }}
                  onClick={() => setError(null)}
                >
                  Đóng
                </button>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      {showScrollBtn && (
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
          onClick={scrollToBottom}
        >
          <ArrowDownOutlined style={{ fontSize: 12 }} />
          Xuống cuối
        </button>
      )}

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
              onChange={handlePersonaChange}
              disabled={isLoading}
            />
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                autoResize();
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
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
            {/* Mic Button (Story 7.1 — Whisper-powered) */}
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
                  animation: voice.isListening
                    ? "pulse 1.5s infinite"
                    : voice.isTranscribing
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
                  {voice.isListening ? "⏹" : voice.isTranscribing ? "⏳" : "🎙️"}
                </span>
              </button>
            )}
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
                  color: "#fff",
                  boxShadow: "var(--shadow-sm)",
                  cursor: "pointer",
                  background: "var(--error)",
                  transition: "background 0.2s, transform 0.15s",
                }}
                onClick={stopStreaming}
                aria-label="Dừng trả lời"
                title="Dừng trả lời"
              >
                <span style={{ fontSize: 14, lineHeight: 1 }}>⏹</span>
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
                  color: "#fff",
                  boxShadow: "var(--shadow-sm)",
                  cursor: input.trim() ? "pointer" : "not-allowed",
                  background: input.trim() ? "var(--accent)" : "var(--ink)",
                  transition: "background 0.2s, transform 0.15s",
                  opacity: !input.trim() ? 0.6 : 1,
                }}
                onClick={() => send()}
                disabled={!input.trim()}
              >
                <ArrowUpOutlined style={{ fontSize: 18 }} />
              </button>
            )}
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 12,
              fontSize: 14,
              color: "var(--text-muted)",
            }}
          >
            <span>
              Enter để gửi · Shift+Enter xuống dòng
              {voice.isSupported ? " · 🎙️ nói" : ""}
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
                onClick={() => {
                  setVoiceMode((v) => !v);
                  if (!voiceMode) setVoiceExchanges(0);
                }}
              >
                🎙️ {voiceMode ? `Chế độ nói (${voiceExchanges})` : "Chế độ nói"}
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
                  background: pronEnabled ? "color-mix(in srgb, var(--success) 8%, transparent)" : "var(--surface)",
                  color: pronEnabled ? "var(--success)" : "var(--text-muted)",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
                onClick={() => setPronEnabled((v) => !v)}
              >
                🎤 {pronEnabled ? "Phản hồi phát âm ✓" : "Phản hồi phát âm"}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* MiniDictionary floating popup */}
      <MiniDictionary
        word={miniDict.word}
        anchorRect={miniDict.anchorRect}
        visible={miniDict.visible}
        onClose={miniDict.close}
        onSave={(w) =>
          setSavedWords((prev) => new Set(prev).add(w.toLowerCase()))
        }
      />
    </div>
  );
}
