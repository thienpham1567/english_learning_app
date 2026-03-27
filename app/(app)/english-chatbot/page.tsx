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
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
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
    <div className="chat-page">
      {/* ── Messages ── */}
      <div className="chat-messages">
        <div className="chat-messages__inner">
          {/* Welcome */}
          <AnimatePresence>
            {!hasMessages && (
              <motion.div
                className="chat-welcome"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.98 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
              >
                <motion.div
                  className="chat-welcome__avatar"
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.1, duration: 0.5, type: "spring", stiffness: 180, damping: 14 }}
                >
                  <span className="chat-welcome__emoji">👩‍🏫</span>
                  <span className="chat-welcome__status" />
                </motion.div>

                <motion.h2
                  className="chat-welcome__title"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.4 }}
                >
                  Xin chào! Cô Minh đây
                </motion.h2>

                <motion.p
                  className="chat-welcome__subtitle"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.4 }}
                >
                  Hãy trả lời bằng tiếng Anh để luyện phản xạ. Cô sẽ sửa lỗi
                  rõ ràng, giải thích ngắn gọn và giữ cuộc trò chuyện tiếp tục.
                </motion.p>

                <div className="chat-welcome__prompts">
                  {SUGGESTED.map((s, i) => {
                    const Icon = s.icon;
                    return (
                      <motion.button
                        key={s.text}
                        className="chat-prompt-card"
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
                        <span className="chat-prompt-card__icon">
                          <Icon size={16} strokeWidth={2} />
                        </span>
                        <span className="chat-prompt-card__text">{s.text}</span>
                      </motion.button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Chat history */}
          {messages.map((m) => (
            <ChatMessage key={m.id} message={m} />
          ))}

          {isLoading && <TypingIndicator />}

          {/* Inline error */}
          <AnimatePresence>
            {error && (
              <motion.div
                className="chat-error"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.25 }}
              >
                <p>{error}</p>
                <button
                  className="chat-error__dismiss"
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

      {/* ── Input ── */}
      <div className={`chat-input-bar ${hasMessages ? "has-messages" : ""}`}>
        <div className="chat-input__wrapper">
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
            className="chat-input__textarea"
          />
          <motion.button
            className={`chat-input__send ${input.trim() && !isLoading ? "is-active" : ""}`}
            onClick={() => send()}
            disabled={!input.trim() || isLoading}
            whileTap={{ scale: 0.88 }}
          >
            <ArrowUp size={18} strokeWidth={2.5} />
          </motion.button>
        </div>
        <p className="chat-input__hint">
          Enter để gửi · Shift+Enter để xuống dòng
        </p>
      </div>
    </div>
  );
}
