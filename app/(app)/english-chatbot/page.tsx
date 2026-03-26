"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useEffect, useRef, useState } from "react";
import { Input, Button } from "antd";

import { ArrowUpOutlined } from "@ant-design/icons";
import { TypingIndicator } from "@/components/TypingIndicator";
import { ChatMessage } from "@/components/ChatMessage";

const SUGGESTED = [
  "Check my grammar: I goed to school.",
  "Give me a quick quiz!",
  "What's an Aussie slang word?",
  "Why is 'I am' correct, not 'I is'?",
];

export default function EnglishChatbotPage() {
  const { messages, sendMessage, status, error, clearError } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
    }),
  });
  const isLoading = status === "streaming" || status === "submitted";
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading, error]);

  const send = (text?: string) => {
    const t = (text ?? input).trim();
    if (!t || isLoading) return;
    sendMessage({ text: t });
    setInput("");
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        flex: 1,
        minHeight: 0,
        background: "var(--bg)",
      }}
    >
      {/* ── Header ── */}
      <header
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "14px 20px",
          borderBottom: "1px solid var(--border)",
          background: "var(--surface)",
          flexShrink: 0,
        }}
      >
        {/* Avatar */}
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: "50%",
            background: "var(--accent)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 20,
            flexShrink: 0,
          }}
        >
          👩‍🏫
        </div>
        <div>
          <div
            style={{
              fontWeight: 600,
              fontSize: 15,
              color: "var(--text-primary)",
            }}
          >
            Cô Minh English
          </div>
          <div style={{ fontSize: 12, color: "#4caf50" }}>● Online</div>
        </div>
      </header>

      {/* ── Messages ── */}
      <div
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: "auto",
          padding: "24px 16px",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Inner centering wrapper */}
        <div
          style={{
            maxWidth: 760,
            width: "100%",
            margin: "0 auto",
            display: "flex",
            flexDirection: "column",
            flex: 1,
            minHeight: 0,
          }}
        >
          {/* Welcome */}
          {messages.length === 0 && (
            <div
              className="message-bubble"
              style={{
                margin: "auto",
                textAlign: "center",
                maxWidth: 480,
                padding: "0 8px",
              }}
            >
              <div style={{ fontSize: 56, marginBottom: 16 }}>👩‍🏫</div>
              <h2
                style={{
                  margin: "0 0 8px",
                  fontSize: 22,
                  fontWeight: 700,
                  color: "var(--text-primary)",
                }}
              >
                Cô Minh is here! 😏
              </h2>
              <p
                style={{
                  margin: "0 0 28px",
                  color: "var(--text-secondary)",
                  fontSize: 15,
                  lineHeight: 1.6,
                }}
              >
                Ready to suffer… I mean, <em>learn</em>! Ask me anything in
                English. I&apos;ll correct you, tease you, and make you better.
                📚
              </p>
              <div
                style={{ display: "flex", flexDirection: "column", gap: 10 }}
              >
                {SUGGESTED.map((s) => (
                  <Button
                    key={s}
                    onClick={() => send(s)}
                    style={{
                      height: "auto",
                      padding: "12px 16px",
                      textAlign: "left",
                      borderRadius: 12,
                      fontSize: 14,
                      color: "var(--text-primary)",
                      background: "var(--surface)",
                      border: "1px solid var(--border)",
                      whiteSpace: "normal",
                      lineHeight: 1.5,
                      display: "block",
                      width: "100%",
                    }}
                  >
                    {s}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Chat history */}
          {messages
            .filter((m) => m.role !== "system")
            .map((m) => (
              <ChatMessage key={m.id} message={m} />
            ))}

          {isLoading && <TypingIndicator />}

          {/* Inline error */}
          {error && (
            <div className="message-bubble" style={{ marginBottom: 16 }}>
              <div
                style={{
                  background: "#fff5f2",
                  border: "1px solid #fdd0c0",
                  borderRadius: 14,
                  padding: "14px 18px",
                  color: "#b34020",
                  fontSize: 14,
                  lineHeight: 1.65,
                  maxWidth: 500,
                }}
              >
                <p style={{ margin: "0 0 10px" }}>
                  {error.message ||
                    "😤 Cô Minh đang gặp vấn đề kỹ thuật! Thử lại sau nha! 🥲"}
                </p>
                <button
                  onClick={clearError}
                  style={{
                    background: "transparent",
                    border: "1px solid #e07050",
                    color: "#b34020",
                    padding: "4px 12px",
                    borderRadius: 20,
                    cursor: "pointer",
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                >
                  Dismiss ✕
                </button>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* ── Input ── */}
      <div
        style={{
          padding: "12px 16px 20px",
          borderTop: "1px solid var(--border)",
          background: "var(--surface)",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            display: "flex",
            gap: 10,
            alignItems: "flex-end",
            background: "var(--bg)",
            border: "1px solid var(--border)",
            borderRadius: 20,
            padding: "8px 10px 8px 16px",
            maxWidth: 760,
            margin: "0 auto",
          }}
        >
          <Input.TextArea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            placeholder="Ask Cô Minh anything... 📚"
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
          <Button
            type="primary"
            shape="circle"
            icon={<ArrowUpOutlined />}
            onClick={() => send()}
            loading={isLoading}
            disabled={!input.trim() || isLoading}
            style={{
              background:
                input.trim() && !isLoading ? "var(--accent)" : "#d4cec8",
              border: "none",
              width: 36,
              height: 36,
              minWidth: 36,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              transition: "background 0.2s",
            }}
          />
        </div>
        <p
          style={{
            textAlign: "center",
            fontSize: 11,
            color: "var(--text-muted)",
            margin: "8px 0 0",
          }}
        >
          Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
