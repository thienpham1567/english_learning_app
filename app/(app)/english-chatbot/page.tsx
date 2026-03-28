"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowUp, Sparkles, BookOpen, MessageCircle, Lightbulb } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

import { TypingIndicator } from "@/components/TypingIndicator";
import { ChatMessage } from "@/components/ChatMessage";
import { ConversationList } from "@/components/app/ConversationList";
import type { ConversationItem } from "@/components/app/ConversationList";
import { deriveTitle } from "@/lib/chat/derive-title";
import type { ChatMessage as AppChatMessage } from "@/lib/chat/types";

const SUGGESTED = [
  { text: "Sửa ngữ pháp giúp mình: I goed to school.", icon: BookOpen },
  { text: "Cho mình một bài luyện nhanh bằng tiếng Anh.", icon: Sparkles },
  { text: "Giải thích một từ lóng của người Úc nhé.", icon: MessageCircle },
  { text: "Vì sao phải nói 'I am' chứ không phải 'I is'?", icon: Lightbulb },
];

const CHAT_ERROR_MESSAGE =
  "Cô Minh đang gặp lỗi kỹ thuật. Bạn thử lại sau nhé.";

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
  currentMessage: AppChatMessage,
  previousMessage?: AppChatMessage,
) {
  if (!previousMessage) return "";
  return currentMessage.role === previousMessage.role ? "mt-[4px]" : "mt-[28px]";
}

export default function EnglishChatbotPage() {
  const [messages, setMessages] = useState<AppChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isNearBottomRef = useRef(true);
  const [showScrollBtn, setShowScrollBtn] = useState(false);

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
      curr.filter((m) => m.id !== messageId || m.text.trim().length > 0),
    );
  };

  const handleNewChat = () => {
    setMessages([]);
    setInput("");
    setError(null);
    setActiveConversationId(null);
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  };

  const handleSelectConversation = async (id: string) => {
    setActiveConversationId(id);
    setError(null);
    try {
      const res = await fetch(`/api/conversations/${id}/messages`);
      if (!res.ok) return;
      const rows = await res.json() as Array<{
        id: string;
        role: "user" | "assistant";
        content: string;
      }>;
      setMessages(rows.map((r) => ({ id: r.id, role: r.role, text: r.content })));
    } catch {
      setError("Không thể tải cuộc trò chuyện này.");
    }
  };

  const handleDeleteConversation = async (id: string) => {
    await fetch(`/api/conversations/${id}`, { method: "DELETE" });
    setConversations((curr) => curr.filter((c) => c.id !== id));
    if (activeConversationId === id) {
      handleNewChat();
    }
  };

  const send = async (text?: string) => {
    const t = (text ?? input).trim();
    if (!t || isLoading) return;

    let convId = activeConversationId;
    if (!convId) {
      try {
        const res = await fetch("/api/conversations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: deriveTitle(t) }),
        });
        if (res.ok) {
          const created = await res.json() as { id: string; title: string };
          convId = created.id;
          setActiveConversationId(convId);
          setConversations((curr) => [
            {
              id: created.id,
              title: created.title,
              updatedAt: new Date().toISOString(),
            },
            ...curr,
          ]);
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
    const requestMessages = [...messages, userMessage];

    setMessages([
      ...requestMessages,
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
        body: JSON.stringify({ messages: requestMessages, conversationId: convId }),
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
    <div className="flex min-h-0 flex-1 overflow-hidden rounded-2xl border border-(--border) bg-[linear-gradient(180deg,rgba(255,255,255,0.82),rgba(255,255,255,0.7))] shadow-(--shadow-md)">
      {/* Thread list */}
      <ConversationList
        conversations={conversations}
        activeId={activeConversationId}
        onSelect={handleSelectConversation}
        onNew={handleNewChat}
        onDelete={handleDeleteConversation}
      />

      {/* Chat area */}
      <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex-1 min-h-0 overflow-y-auto px-4 py-6 md:px-8"
        >
          <div className="mx-auto flex min-h-full w-full max-w-5xl flex-col">
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
                    className="relative grid size-24 place-items-center rounded-full bg-(--surface) text-4xl shadow-(--shadow-lg)"
                    initial={{ scale: 0.6, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.1, duration: 0.5, type: "spring", stiffness: 180, damping: 14 }}
                  >
                    <span>👩‍🏫</span>
                    <span className="absolute bottom-2 right-2 size-3 rounded-full bg-(--sage) ring-4 ring-(--surface)" />
                  </motion.div>

                  <motion.h2
                    className="mt-6 text-4xl [font-family:var(--font-display)] text-(--ink)"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.4 }}
                  >
                    Xin chào! Cô Minh đây
                  </motion.h2>

                  <motion.p
                    className="mt-3 max-w-2xl text-base text-(--text-secondary)"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.4 }}
                  >
                    Hãy trả lời bằng tiếng Anh để luyện phản xạ. Cô sẽ sửa lỗi rõ
                    ràng, giải thích ngắn gọn và giữ cuộc trò chuyện tiếp tục.
                  </motion.p>

                  <div className="mt-8 grid w-full gap-3 md:grid-cols-2">
                    {SUGGESTED.map((s, i) => {
                      const Icon = s.icon;
                      return (
                        <motion.button
                          key={s.text}
                          className="flex items-start gap-3 rounded-lg border border-(--border) bg-(--surface) p-4 text-left shadow-(--shadow-sm) transition hover:-translate-y-0.5 hover:border-(--border-strong) hover:bg-(--surface-hover) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--accent)"
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
                {isLoading && (
                  <div className="mt-[22px]">
                    <TypingIndicator />
                  </div>
                )}
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
              className="absolute bottom-[88px] left-1/2 z-10 flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-(--border) bg-(--surface) px-3 py-1.5 text-xs font-medium text-(--text-secondary) shadow-(--shadow-md) transition hover:bg-(--surface-hover) hover:text-(--ink)"
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

        <div className="border-t border-(--border) bg-[rgba(255,255,255,0.72)] px-4 py-4 backdrop-blur md:px-8">
          <div className="mx-auto flex w-full max-w-5xl flex-col gap-3">
            <div className="flex items-end gap-3 rounded-xl border border-(--border) bg-(--surface) p-3 shadow-(--shadow-sm) transition-[border-color,box-shadow] duration-200 focus-within:border-(--accent) focus-within:ring-2 focus-within:ring-(--accent-muted) focus-within:shadow-(--shadow-md)">
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
