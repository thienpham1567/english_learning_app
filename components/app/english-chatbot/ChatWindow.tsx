"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowDownOutlined, ArrowUpOutlined } from "@ant-design/icons";

import { TypingIndicator } from "@/components/TypingIndicator";
import { ChatMessage } from "@/components/ChatMessage";
import type { PageMessage } from "@/components/ChatMessage";
import { useChatConversations } from "@/components/app/english-chatbot/ChatConversationProvider";
import { PersonaSwitcher } from "@/components/app/english-chatbot/PersonaSwitcher";
import { ChatHeader } from "@/components/app/english-chatbot/ChatHeader";
import { MiniDictionary } from "@/components/app/shared";
import { useMiniDictionary } from "@/hooks/useMiniDictionary";
import { useVoiceInput } from "@/hooks/useVoiceInput";
import { useTextToSpeech } from "@/hooks/useTextToSpeech";
import { deriveTitle } from "@/lib/chat/derive-title";
import { DEFAULT_PERSONA_ID, PERSONAS } from "@/lib/chat/personas";
import type { Persona } from "@/lib/chat/personas";
import type { ChatMessage as AppChatMessage } from "@/lib/chat/types";
import http from "@/lib/http";

export function sampleSuggestions(
  persona: Persona,
  count: number,
): (typeof persona.suggestions)[number][] {
  const pool = [...persona.suggestions];
  const n = Math.min(count, pool.length);
  for (let i = pool.length - 1; i > pool.length - n - 1 && i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(pool.length - n);
}

const CHAT_ERROR_MESSAGE = "Gia sư đang gặp lỗi kỹ thuật. Bạn thử lại sau nhé.";

type AssistantStreamEvent =
  | { type: "assistant_start" }
  | { type: "assistant_delta"; delta: string }
  | { type: "assistant_done" }
  | { type: "assistant_error"; message: string };

function parseSsePayloads(chunk: string) {
  return chunk
    .split("\n")
    .filter((line) => line.startsWith("data:"))
    .map((line) => line.slice(5).trim())
    .filter(Boolean);
}

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
            width: 32,
            height: 32,
            borderRadius: "50%",
            background: "var(--bg-deep)",
            flexShrink: 0,
            animation: "pulse 1.5s infinite",
          }}
        />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
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
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 24 }}>
        <div style={{ width: "66%", display: "flex", flexDirection: "column", gap: 8 }}>
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
  const { conversations, setConversations, loadConversations } = useChatConversations();
  const [messages, setMessages] = useState<PageMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPersonaId, setSelectedPersonaId] = useState(DEFAULT_PERSONA_ID);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isNearBottomRef = useRef(true);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const justCreatedRef = useRef(false);
  const lastMsg = messages.at(-1);
  const streamingHasStarted = isLoading && lastMsg?.role === "assistant";
  const activePersona = PERSONAS.find((p) => p.id === selectedPersonaId) ?? PERSONAS[0];
  const ActiveAvatar = activePersona.avatar;

  // Voice hooks (Story 7.1 + 7.2)
  const voice = useVoiceInput();
  const tts = useTextToSpeech();
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);

  const [suggestions, setSuggestions] = useState<(typeof activePersona.suggestions)[number][]>([]);
  useEffect(() => {
    setSuggestions(sampleSuggestions(activePersona, 4));
  }, [activePersona]);

  // MiniDictionary integration (Story 4.2)
  const miniDict = useMiniDictionary();
  const [savedWords, setSavedWords] = useState<Set<string>>(new Set());

  // Fetch saved vocabulary on mount (AC: #5)
  useEffect(() => {
    http
      .get<Array<{ query: string; saved: boolean }>>("/vocabulary")
      .then(({ data }) => {
        const saved = new Set(data.filter((v) => v.saved).map((v) => v.query.toLowerCase()));
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
        const { data: rows } = await http.get<
          Array<{
            id: string;
            role: "user" | "assistant";
            content: string;
          }>
        >(`/conversations/${conversationId}/messages`);
        if (cancelled) return;
        if (!cancelled) {
          setMessages(rows.map((r) => ({ id: r.id, role: r.role, text: r.content })));
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
    if (isNearBottomRef.current && bottom && typeof bottom.scrollIntoView === "function") {
      bottom.scrollIntoView({ behavior: "smooth" });
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
      curr.filter((m) => m.id !== messageId || (m.role !== "divider" && m.text.trim().length > 0)),
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
        const { data: created } = await http.post<{
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

    const userMessage: AppChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      text: t,
    };
    const assistantMessageId = crypto.randomUUID();

    const requestMessages = [...messages, userMessage].filter(
      (m): m is AppChatMessage => m.role === "user" || m.role === "assistant",
    );

    setMessages((curr) => [
      ...curr,
      userMessage,
      { id: assistantMessageId, role: "assistant", text: "" },
    ]);
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: requestMessages,
          conversationId: convId,
          personaId: selectedPersonaId,
        }),
      });

      if (!response.ok || !response.body) {
        throw new Error(CHAT_ERROR_MESSAGE);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let finished = false;

      while (!finished) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        let eventBoundary = buffer.indexOf("\n\n");

        while (eventBoundary !== -1) {
          const rawEvent = buffer.slice(0, eventBoundary);
          buffer = buffer.slice(eventBoundary + 2);

          for (const payload of parseSsePayloads(rawEvent)) {
            const event = JSON.parse(payload) as AssistantStreamEvent;

            if (event.type === "assistant_delta" && event.delta) {
              setMessages((curr) =>
                curr.map((m) =>
                  m.id === assistantMessageId ? { ...m, text: m.text + event.delta } : m,
                ),
              );
            }

            if (event.type === "assistant_error") {
              setError(event.message);
              removeEmptyAssistantMessage(assistantMessageId);
              finished = true;
            }

            if (event.type === "assistant_done") {
              if (convId) {
                loadConversations();
              }
              finished = true;
            }
          }

          eventBoundary = buffer.indexOf("\n\n");
        }
      }
    } catch (streamError) {
      console.error("Chat page stream error:", streamError);
      setError(CHAT_ERROR_MESSAGE);
      removeEmptyAssistantMessage(assistantMessageId);
    } finally {
      setIsLoading(false);
    }
  };

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
              "radial-gradient(ellipse 60% 40% at 50% 0%, rgba(154,177,122,0.07) 0%, transparent 70%)",
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
                Mỗi gia sư có phong cách riêng — chọn người phù hợp nhất với bạn.
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
                        border: isSelected ? "2px solid var(--accent)" : "1px solid var(--border)",
                        background: isSelected ? "var(--accent-light)" : "var(--surface)",
                        padding: "20px 16px",
                        textAlign: "center",
                        boxShadow: isSelected ? "0 0 0 1px var(--accent)" : "var(--shadow-sm)",
                        transition: "border-color 0.2s, background 0.2s, box-shadow 0.2s, transform 0.15s",
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
                          background: isSelected ? "var(--accent)" : "var(--bg-deep)",
                          color: isSelected ? "#fff" : "var(--text-secondary)",
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

              {/* Suggestion cards for selected persona */}
              <div
                style={{
                  marginTop: 24,
                  display: "grid",
                  width: "100%",
                  gap: 12,
                  gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                }}
              >
                {suggestions.map((s, i) => {
                  const Icon = s.icon;
                  return (
                    <button
                      key={s.text}
                      className={`anim-fade-up anim-delay-${Math.min(i + 4, 8)}`}
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 12,
                        borderRadius: "var(--radius)",
                        border: "1px solid var(--border)",
                        background: "var(--surface)",
                        padding: 16,
                        textAlign: "left",
                        boxShadow: "var(--shadow-sm)",
                        transition: "transform 0.2s, border-color 0.2s, background 0.2s",
                        cursor: "pointer",
                      }}
                      onClick={() => send(s.text)}
                    >
                      <span
                        style={{
                          marginTop: 2,
                          display: "grid",
                          width: 32,
                          height: 32,
                          flexShrink: 0,
                          placeItems: "center",
                          borderRadius: "50%",
                          background: "var(--accent-light)",
                          color: "var(--accent)",
                        }}
                      >
                        <Icon style={{ fontSize: 16 }} />
                      </span>
                      <span
                        style={{
                          fontSize: 14,
                          lineHeight: 1.6,
                          color: "var(--text-primary)",
                        }}
                      >
                        {s.text}
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
                <div key={m.id} style={getMessageSpacingStyle(m, messages[index - 1])}>
                  <ChatMessage
                    message={m}
                    persona={activePersona}
                    isStreaming={
                      isLoading && index === messages.length - 1 && m.role === "assistant"
                    }
                    onWordClick={miniDict.openForWord}
                    savedWords={savedWords}
                    onSpeak={tts.isSupported ? (text) => {
                      setSpeakingMsgId(m.id);
                      tts.speak(text);
                    } : undefined}
                    isSpeaking={tts.isSpeaking && speakingMsgId === m.id}
                    onStopSpeak={tts.isSupported ? () => {
                      tts.stop();
                      setSpeakingMsgId(null);
                    } : undefined}
                  />
                </div>
              ))}
              {isLoading && !streamingHasStarted && (
                <div className="anim-fade-in" style={{ marginTop: 28 }}>
                  <TypingIndicator personaName={activePersona.label.split(" —")[0]} />
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
                border: "1px solid rgba(239,68,68,0.16)",
                background: "rgba(239,68,68,0.08)",
                padding: "12px 16px",
                fontSize: 14,
                color: "rgb(153,27,27)",
              }}
            >
              <p>{error}</p>
              <button
                style={{
                  marginTop: 8,
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
            {/* Mic Button (Story 7.1) */}
            {voice.isSupported && (
              <button
                style={{
                  display: "grid",
                  width: 44,
                  height: 44,
                  flexShrink: 0,
                  placeItems: "center",
                  borderRadius: "50%",
                  border: voice.isListening ? "2px solid #ef4444" : "1.5px solid var(--border)",
                  color: voice.isListening ? "#ef4444" : "var(--text-muted)",
                  background: voice.isListening ? "rgba(239,68,68,0.08)" : "transparent",
                  cursor: isLoading ? "not-allowed" : "pointer",
                  transition: "all 0.2s",
                  animation: voice.isListening ? "pulse 1.5s infinite" : "none",
                }}
                onClick={() => {
                  if (voice.isListening) {
                    voice.stop();
                    // Populate input with transcript
                    if (voice.fullTranscript.trim()) {
                      setInput(voice.fullTranscript.trim());
                    }
                  } else {
                    voice.start();
                  }
                }}
                disabled={isLoading}
                aria-label={voice.isListening ? "Dừng ghi âm" : "Nói tiếng Anh"}
              >
                <span style={{ fontSize: 18 }}>
                  {voice.isListening ? "⏹" : "🎙️"}
                </span>
              </button>
            )}
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
                cursor: input.trim() && !isLoading ? "pointer" : "not-allowed",
                background: input.trim() && !isLoading ? "var(--accent)" : "var(--ink)",
                transition: "background 0.2s, transform 0.15s",
                opacity: !input.trim() || isLoading ? 0.6 : 1,
              }}
              onClick={() => send()}
              disabled={!input.trim() || isLoading}
            >
              <ArrowUpOutlined style={{ fontSize: 18 }} />
            </button>
          </div>
          <p style={{ fontSize: 14, color: "var(--text-muted)", textAlign: "center" }}>
            Enter để gửi · Shift+Enter để xuống dòng{voice.isSupported ? " · 🎙️ để nói" : ""}
          </p>
        </div>
      </div>

      {/* MiniDictionary floating popup */}
      <MiniDictionary
        word={miniDict.word}
        anchorRect={miniDict.anchorRect}
        visible={miniDict.visible}
        onClose={miniDict.close}
        onSave={(w) => setSavedWords((prev) => new Set(prev).add(w.toLowerCase()))}
      />
    </div>
  );
}
