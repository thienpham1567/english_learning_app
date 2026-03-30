"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, Sparkles, BookOpen, MessageCircle, Lightbulb } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

import { TypingIndicator } from "@/components/TypingIndicator";
import { ChatMessage } from "@/components/ChatMessage";
import type { PageMessage } from "@/components/ChatMessage";
import { ConversationList } from "@/components/app/ConversationList";
import type { ConversationItem } from "@/components/app/ConversationList";
import { PersonaSwitcher } from "@/components/app/PersonaSwitcher";
import { ChatHeader } from "@/components/app/ChatHeader";
import { deriveTitle } from "@/lib/chat/derive-title";
import { DEFAULT_PERSONA_ID, PERSONAS } from "@/lib/chat/personas";
import type { ChatMessage as AppChatMessage } from "@/lib/chat/types";

const SUGGESTED = [
  { text: "Sửa ngữ pháp giúp mình: I goed to school.", icon: BookOpen },
  { text: "Cho mình một bài luyện nhanh bằng tiếng Anh.", icon: Sparkles },
  { text: "Giải thích một từ lóng của người Úc nhé.", icon: MessageCircle },
  { text: "Vì sao phải nói 'I am' chứ không phải 'I is'?", icon: Lightbulb },
];

const CHAT_ERROR_MESSAGE =
  "Gia sư đang gặp lỗi kỹ thuật. Bạn thử lại sau nhé.";

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

export function getMessageSpacingClassName(
  currentMessage: PageMessage,
  previousMessage?: PageMessage,
) {
  if (!previousMessage) return "";
  return currentMessage.role === previousMessage.role ? "mt-[4px]" : "mt-[28px]";
}

interface EnglishChatbotViewProps {
  conversationId: string | null;
}

export function EnglishChatbotView({ conversationId }: EnglishChatbotViewProps) {
  const router = useRouter();
  const [messages, setMessages] = useState<PageMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [selectedPersonaId, setSelectedPersonaId] = useState(DEFAULT_PERSONA_ID);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isNearBottomRef = useRef(true);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const lastMsg = messages.at(-1);
  const streamingHasStarted = isLoading && lastMsg?.role === "assistant";
  const activePersona = PERSONAS.find((p) => p.id === selectedPersonaId) ?? PERSONAS[0];

  const loadConversations = useCallback(async () => {
    try {
      const res = await fetch("/api/conversations");
      if (res.ok) {
        const data = await res.json() as ConversationItem[];
        setConversations(data);
      }
    } catch {
      // non-fatal: thread list just won't show
    }
  }, []);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Load messages when conversationId changes (from URL)
  useEffect(() => {
    if (!conversationId) {
      setMessages([]);
      setError(null);
      setSelectedPersonaId(DEFAULT_PERSONA_ID);
      return;
    }

    const conv = conversations.find((c) => c.id === conversationId);
    if (conv?.personaId) {
      setSelectedPersonaId(conv.personaId);
    }

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/conversations/${conversationId}/messages`);
        if (!res.ok || cancelled) return;
        const rows = await res.json() as Array<{
          id: string;
          role: "user" | "assistant";
          content: string;
        }>;
        if (!cancelled) {
          setMessages(rows.map((r) => ({ id: r.id, role: r.role, text: r.content })));
          setError(null);
        }
      } catch {
        if (!cancelled) {
          setError("Không thể tải cuộc trò chuyện này.");
        }
      }
    })();

    return () => { cancelled = true; };
  }, [conversationId, conversations]);

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

  const handleNewChat = useCallback(() => {
    setMessages([]);
    setInput("");
    setError(null);
    setSelectedPersonaId(DEFAULT_PERSONA_ID);
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    router.push("/english-chatbot");
  }, [router]);

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

  const handleDeleteConversation = async (id: string) => {
    await fetch(`/api/conversations/${id}`, { method: "DELETE" });
    setConversations((curr) => curr.filter((c) => c.id !== id));
    if (conversationId === id) {
      router.push("/english-chatbot");
    }
  };

  const send = async (text?: string) => {
    const t = (text ?? input).trim();
    if (!t || isLoading) return;

    let convId = conversationId;
    if (!convId) {
      try {
        const res = await fetch("/api/conversations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: deriveTitle(t), personaId: selectedPersonaId }),
        });
        if (res.ok) {
          const created = await res.json() as { id: string; title: string; personaId: string };
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
          router.replace(`/english-chatbot/${created.id}`);
        }
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

    // Filter out client-only dividers before sending to API
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
                  m.id === assistantMessageId
                    ? { ...m, text: m.text + event.delta }
                    : m,
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
    <div className="flex h-full max-h-full min-h-0 flex-1 overflow-hidden rounded-2xl border border-(--border) bg-[linear-gradient(180deg,rgba(255,255,255,0.82),rgba(255,255,255,0.7))] shadow-(--shadow-md)">
      {/* Thread list */}
      <ConversationList
        conversations={conversations}
        activeId={conversationId}

        onNew={handleNewChat}
        onDelete={handleDeleteConversation}
      />

      {/* Chat area */}
      <div className="relative flex h-full min-h-0 flex-1 flex-col overflow-hidden">
        <ChatHeader personaId={selectedPersonaId} />
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="relative flex-1 min-h-0 overflow-y-auto px-4 py-6 md:px-8"
        >
          {/* Grain overlay */}
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
              backgroundRepeat: "repeat",
              backgroundSize: "128px 128px",
            }}
          />
          {/* Warm radial glow */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse 60% 40% at 50% 0%, rgba(196,109,46,0.07) 0%, transparent 70%)",
            }}
          />
          <div className="relative mx-auto flex min-h-full w-full max-w-5xl flex-col">
            <AnimatePresence>
              {!hasMessages && (
                <motion.div
                  className="mx-auto my-auto flex max-w-3xl flex-col items-center text-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 0.98 }}
                  transition={{ duration: 0.35, ease: "easeOut" }}
                >
                  <motion.div
                    className="relative"
                    initial={{ scale: 0.6, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.1, duration: 0.5, type: "spring", stiffness: 180, damping: 14 }}
                  >
                    <Image
                      src="/english-logo-app.svg"
                      alt="English Tutor"
                      width={250}
                      height={150}
                      className="h-16 w-auto rounded-2xl shadow-(--shadow-lg)"
                    />
                    <span className="absolute bottom-1 right-1 size-3 rounded-full bg-(--sage) ring-2 ring-(--bg)" />
                  </motion.div>

                  <motion.h2
                    className="mt-6 text-5xl italic [font-family:var(--font-display)] text-(--ink)"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.4 }}
                  >
                    Xin chào! Chọn gia sư để bắt đầu
                  </motion.h2>

                  <motion.p
                    className="mt-3 max-w-sm text-base text-(--text-secondary)"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.4 }}
                  >
                    Chọn gia sư phù hợp với mục tiêu của bạn, rồi bắt đầu luyện tập nhé.
                  </motion.p>

                  <div className="mt-8 grid w-full gap-3 md:grid-cols-2">
                    {SUGGESTED.map((s, i) => {
                      const Icon = s.icon;
                      return (
                        <motion.button
                          key={s.text}
                          className="flex items-start gap-3 rounded-lg border border-(--border) bg-(--surface) p-4 text-left shadow-(--shadow-sm) transition hover:-translate-y-0.5 hover:border-(--accent)/40 hover:bg-(--surface-hover) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--accent)"
                          onClick={() => send(s.text)}
                          initial={{ opacity: 0, y: 16 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.35 + i * 0.08, duration: 0.35, ease: "easeOut" }}
                          whileHover={{ y: -2 }}
                          whileTap={{ scale: 0.97 }}
                        >
                          <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-full bg-(--accent-light) text-(--accent)">
                            <Icon size={16} strokeWidth={2} />
                          </span>
                          <span className="text-sm leading-6 text-(--text-primary)">
                            {s.text}
                          </span>
                        </motion.button>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {hasMessages && (
              <div className="flex flex-col">
                {messages.map((m, index) => (
                  <ChatMessage
                    key={m.id}
                    message={m}
                    className={getMessageSpacingClassName(m, messages[index - 1])}
                    isStreaming={isLoading && index === messages.length - 1 && m.role === "assistant"}
                  />
                ))}
                <AnimatePresence>
                  {isLoading && !streamingHasStarted && (
                    <motion.div
                      className="mt-[28px]"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <TypingIndicator personaName={activePersona.label.split(" —")[0]} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            <AnimatePresence>
              {error && (
                <motion.div
                  className="mt-5 rounded-(--radius) border border-[rgba(239,68,68,0.16)] bg-[rgba(239,68,68,0.08)] px-4 py-3 text-sm text-[rgb(153,27,27)]"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.25 }}
                >
                  <p>{error}</p>
                  <button
                    className="mt-2 font-medium underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--accent)"
                    onClick={() => setError(null)}
                  >
                    Đóng
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            <div ref={bottomRef} />
          </div>
        </div>

        <AnimatePresence>
          {showScrollBtn && (
            <motion.button
              className="absolute bottom-[88px] left-1/2 z-10 flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-(--border) bg-(--surface) px-3 py-1.5 text-xs font-medium text-(--text-secondary) shadow-(--shadow-lg) transition hover:bg-(--surface-hover) hover:text-(--ink)"
              onClick={scrollToBottom}
              initial={{ opacity: 0, y: 8, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.92 }}
              transition={{ duration: 0.18 }}
            >
              <ArrowDown size={12} strokeWidth={2.5} />
              Xuống cuối
            </motion.button>
          )}
        </AnimatePresence>

        <div className="shrink-0 bg-(--bg)/80 px-4 py-4 backdrop-blur-md md:px-8">
          <div className="mx-auto flex w-full max-w-5xl flex-col gap-3">
            <div className="flex items-end gap-3 rounded-2xl border border-(--border) bg-(--surface) p-3 shadow-(--shadow-md) transition-[border-color,box-shadow] duration-200 focus-within:border-(--accent) focus-within:ring-2 focus-within:ring-(--accent-muted) focus-within:shadow-(--shadow-lg)">
              <PersonaSwitcher
                value={selectedPersonaId}
                onChange={handlePersonaChange}
                disabled={isLoading}
              />
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => { setInput(e.target.value); autoResize(); }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                }}
                placeholder="Nhập câu hỏi hoặc câu trả lời bằng tiếng Anh..."
                disabled={isLoading}
                rows={1}
                className="min-h-11 flex-1 resize-none border-0 bg-transparent px-2 py-2 text-[15px] leading-6 text-(--text-primary) outline-none placeholder:text-(--text-muted) disabled:cursor-not-allowed focus:outline-none"
              />
              <motion.button
                className={[
                  "grid size-11 shrink-0 place-items-center rounded-full text-white shadow-(--shadow-sm) transition-[background-color,transform] duration-200 enabled:hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--accent) disabled:cursor-not-allowed disabled:bg-(--border-strong)",
                  input.trim() && !isLoading ? "bg-(--accent)" : "bg-(--ink)",
                ].join(" ")}
                onClick={() => send()}
                disabled={!input.trim() || isLoading}
                whileTap={{ scale: 0.88 }}
              >
                <ArrowUp size={18} strokeWidth={2.5} />
              </motion.button>
            </div>
            <p className="text-sm text-(--text-muted)">
              Enter để gửi · Shift+Enter để xuống dòng
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
