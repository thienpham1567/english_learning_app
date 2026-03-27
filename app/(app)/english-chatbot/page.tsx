"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUp, Sparkles, BookOpen, MessageCircle, Lightbulb } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

import { TypingIndicator } from "@/components/TypingIndicator";
import { ChatMessage } from "@/components/ChatMessage";
import type { ChatMessage as AppChatMessage } from "@/lib/chat/types";

const SUGGESTED = [
  {
    text: "Sửa ngữ pháp giúp mình: I goed to school.",
    icon: BookOpen,
  },
  {
    text: "Cho mình một bài luyện nhanh bằng tiếng Anh.",
    icon: Sparkles,
  },
  {
    text: "Giải thích một từ lóng của người Úc nhé.",
    icon: MessageCircle,
  },
  {
    text: "Vì sao phải nói 'I am' chứ không phải 'I is'?",
    icon: Lightbulb,
  },
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

export default function EnglishChatbotPage() {
  const [messages, setMessages] = useState<AppChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const bottom = bottomRef.current;
    if (bottom && typeof bottom.scrollIntoView === "function") {
      bottom.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isLoading, error]);

  const autoResize = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 160) + "px";
  };

  const removeEmptyAssistantMessage = (messageId: string) => {
    setMessages((currentMessages) =>
      currentMessages.filter(
        (message) => message.id !== messageId || message.text.trim().length > 0,
      ),
    );
  };

  const send = async (text?: string) => {
    const t = (text ?? input).trim();
    if (!t || isLoading) return;

    const userMessage: AppChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      text: t,
    };
    const assistantMessageId = crypto.randomUUID();
    const requestMessages = [...messages, userMessage];

    setMessages([
      ...requestMessages,
      {
        id: assistantMessageId,
        role: "assistant",
        text: "",
      },
    ]);
    setInput("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ messages: requestMessages }),
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

        if (done) {
          break;
        }

        buffer += decoder.decode(value, { stream: true });

        let eventBoundary = buffer.indexOf("\n\n");
        while (eventBoundary !== -1) {
          const rawEvent = buffer.slice(0, eventBoundary);
          buffer = buffer.slice(eventBoundary + 2);

          for (const payload of parseSsePayloads(rawEvent)) {
            const event = JSON.parse(payload) as AssistantStreamEvent;

            if (event.type === "assistant_delta" && event.delta) {
              setMessages((currentMessages) =>
                currentMessages.map((message) =>
                  message.id === assistantMessageId
                    ? { ...message, text: message.text + event.delta }
                    : message,
                ),
              );
            }

            if (event.type === "assistant_error") {
              setError(event.message);
              removeEmptyAssistantMessage(assistantMessageId);
              finished = true;
            }

            if (event.type === "assistant_done") {
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
    <div className="relative flex min-h-[calc(100vh-8rem)] flex-col overflow-hidden rounded-[var(--radius-2xl)] border border-[var(--border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.82),rgba(255,255,255,0.7))] shadow-[var(--shadow-md)]">
      <div className="flex-1 px-4 py-6 md:px-8">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-5">
          <AnimatePresence>
            {!hasMessages && (
              <motion.div
                className="mx-auto flex max-w-3xl flex-col items-center text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.98 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
              >
                <motion.div
                  className="relative grid size-24 place-items-center rounded-full bg-[var(--surface)] text-4xl shadow-[var(--shadow-lg)]"
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.1, duration: 0.5, type: "spring", stiffness: 180, damping: 14 }}
                >
                  <span>👩‍🏫</span>
                  <span className="absolute bottom-2 right-2 size-3 rounded-full bg-[var(--sage)] ring-4 ring-[var(--surface)]" />
                </motion.div>

                <motion.h2
                  className="mt-6 text-4xl [font-family:var(--font-display)] text-[var(--ink)]"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.4 }}
                >
                  Xin chào! Cô Minh đây
                </motion.h2>

                <motion.p
                  className="mt-3 max-w-2xl text-base text-[var(--text-secondary)]"
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
                        className="flex items-start gap-3 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-4 text-left shadow-[var(--shadow-sm)] transition hover:-translate-y-0.5 hover:border-[var(--border-strong)] hover:bg-[var(--surface-hover)]"
                        onClick={() => send(s.text)}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                          delay: 0.35 + i * 0.08,
                          duration: 0.35,
                          ease: "easeOut",
                        }}
                        whileHover={{ y: -2 }}
                        whileTap={{ scale: 0.97 }}
                      >
                        <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-full bg-[var(--accent-light)] text-[var(--accent)]">
                          <Icon size={16} strokeWidth={2} />
                        </span>
                        <span className="text-sm leading-6 text-[var(--text-primary)]">
                          {s.text}
                        </span>
                      </motion.button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {messages.map((m) => (
            <ChatMessage key={m.id} message={m} />
          ))}

          {isLoading && <TypingIndicator />}

          <AnimatePresence>
            {error && (
              <motion.div
                className="rounded-[var(--radius)] border border-[rgba(239,68,68,0.16)] bg-[rgba(239,68,68,0.08)] px-4 py-3 text-sm text-[rgb(153,27,27)]"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.25 }}
              >
                <p>{error}</p>
                <button
                  className="mt-2 font-medium underline underline-offset-2"
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

      <div className="border-t border-[var(--border)] bg-[rgba(255,255,255,0.72)] px-4 py-4 backdrop-blur md:px-8">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-3">
          <div className="flex items-end gap-3 rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--surface)] p-3 shadow-[var(--shadow-sm)]">
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
              className="min-h-[44px] flex-1 resize-none border-0 bg-transparent px-2 py-2 text-[15px] leading-6 text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)] disabled:cursor-not-allowed"
            />
            <motion.button
              className="grid size-11 shrink-0 place-items-center rounded-full bg-[var(--ink)] text-white shadow-[var(--shadow-sm)] transition enabled:hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:bg-[var(--border-strong)]"
              onClick={() => send()}
              disabled={!input.trim() || isLoading}
              whileTap={{ scale: 0.88 }}
            >
              <ArrowUp size={18} strokeWidth={2.5} />
            </motion.button>
          </div>
          <p className="text-sm text-[var(--text-muted)]">
            Enter để gửi · Shift+Enter để xuống dòng
          </p>
        </div>
      </div>
    </div>
  );
}
