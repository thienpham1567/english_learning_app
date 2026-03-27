"use client";

import { useEffect, useRef, useState } from "react";
import { Input, Button } from "antd";
import { ArrowUp } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

import { TypingIndicator } from "@/components/TypingIndicator";
import { ChatMessage } from "@/components/ChatMessage";
import type { ChatMessage as AppChatMessage } from "@/lib/chat/types";

const SUGGESTED = [
  "Sửa ngữ pháp giúp mình: I goed to school.",
  "Cho mình một bài luyện nhanh bằng tiếng Anh.",
  "Giải thích một từ lóng của người Úc nhé.",
  "Vì sao phải nói 'I am' chứ không phải 'I is'?",
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

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading, error]);

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

  return (
    <div className="chat-page">
      {/* ── Header ── */}
      <header className="chat-header">
        <div className="chat-header__avatar">
          👩‍🏫
          <span className="chat-header__status" />
        </div>
        <div className="chat-header__info">
          <h2>Cô Minh English</h2>
          <p>Gia sư tiếng Anh AI</p>
        </div>
      </header>

      {/* ── Messages ── */}
      <div className="chat-messages">
        <div className="chat-messages__inner">
          {/* Welcome */}
          <AnimatePresence>
            {messages.length === 0 && (
              <motion.div
                className="chat-welcome"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              >
                <motion.div
                  className="chat-welcome__icon"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.15, duration: 0.4, type: "spring", stiffness: 200 }}
                >
                  👩‍🏫
                </motion.div>
                <h2>Cô Minh đã sẵn sàng</h2>
                <p>
                  Hãy trả lời bằng tiếng Anh để luyện phản xạ. Cô sẽ sửa lỗi rõ
                  ràng, giải thích ngắn gọn và giữ cuộc trò chuyện tiếp tục.
                </p>
                <div className="chat-welcome__prompts">
                  {SUGGESTED.map((s, i) => (
                    <motion.div
                      key={s}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 + i * 0.08, duration: 0.3 }}
                    >
                      <Button
                        className="chat-welcome__prompt-btn"
                        onClick={() => send(s)}
                      >
                        {s}
                      </Button>
                    </motion.div>
                  ))}
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
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.25 }}
              >
                <div className="chat-error">
                  <p style={{ margin: "0 0 10px" }}>{error}</p>
                  <button
                    className="chat-error__dismiss"
                    onClick={() => setError(null)}
                  >
                    Đóng
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div ref={bottomRef} />
        </div>
      </div>

      {/* ── Input ── */}
      <div className="chat-input-bar">
        <div className="chat-input__wrapper">
          <Input.TextArea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            placeholder="Nhập câu hỏi hoặc câu trả lời bằng tiếng Anh..."
            autoSize={{ minRows: 1, maxRows: 6 }}
            disabled={isLoading}
            style={{
              background: "transparent",
              border: "none",
              boxShadow: "none",
              fontSize: 15,
              padding: "4px 0",
              resize: "none",
              flex: 1,
              color: "var(--text-primary)",
            }}
          />
          <motion.div whileTap={{ scale: 0.9 }}>
            <Button
              type="primary"
              shape="circle"
              icon={<ArrowUp size={18} strokeWidth={2.5} />}
              onClick={() => send()}
              loading={isLoading}
              disabled={!input.trim() || isLoading}
              className="chat-input__send-btn"
            />
          </motion.div>
        </div>
        <p className="chat-input__hint">
          Enter để gửi · Shift+Enter để xuống dòng
        </p>
      </div>
    </div>
  );
}
