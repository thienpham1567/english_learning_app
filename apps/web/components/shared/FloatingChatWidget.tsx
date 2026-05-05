"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { CloseOutlined, SendOutlined, LoadingOutlined } from "@ant-design/icons";
import { SimonAvatar } from "@/app/(app)/english-chatbot/_components/persona-avatars/SimonAvatar";

type Msg = { id: string; role: "user" | "assistant"; text: string };

const WELCOME: Msg = {
  id: "welcome",
  role: "assistant",
  text: "Hey! I'm Simon 👋 Got a quick English question? Ask me anything — grammar, vocabulary, pronunciation, or just want to chat in English!",
};

let idCounter = 0;
function nextId() {
  return `fcw-${++idCounter}`;
}

function useIsMobile(bp = 768) {
  const [m, setM] = useState(() =>
    typeof window === "undefined" ? false : window.innerWidth <= bp,
  );
  useEffect(() => {
    const h = () => setM(window.innerWidth <= bp);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, [bp]);
  return m;
}

export function FloatingChatWidget() {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([WELCOME]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const isMobile = useIsMobile();

  // Scroll to bottom whenever messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs]);

  // Focus input when panel opens
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 120);
  }, [open]);

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || streaming) return;

    setInput("");
    const userMsg: Msg = { id: nextId(), role: "user", text };
    const assistantId = nextId();
    const assistantMsg: Msg = { id: assistantId, role: "assistant", text: "" };

    setMsgs((prev) => [...prev, userMsg, assistantMsg]);
    setStreaming(true);

    const history = [...msgs, userMsg].filter((m) => m.role !== "divider" as string);
    const apiMessages = history.map((m) => ({ role: m.role, text: m.text }));

    const ctrl = new AbortController();
    abortRef.current = ctrl;

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: apiMessages, personaId: "simon" }),
        signal: ctrl.signal,
      });

      if (!res.ok || !res.body) throw new Error("Stream failed");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const event = JSON.parse(line.slice(6));
            if (event.type === "assistant_delta" && event.delta) {
              setMsgs((prev) =>
                prev.map((m) =>
                  m.id === assistantId ? { ...m, text: m.text + event.delta } : m,
                ),
              );
            }
          } catch {
            // ignore malformed SSE lines
          }
        }
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        setMsgs((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? { ...m, text: "Sorry, something went wrong. Please try again." }
              : m,
          ),
        );
      }
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  }, [input, msgs, streaming]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const bottomOffset = isMobile ? 90 : 24;

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Đóng chat" : "Mở chat"}
        style={{
          position: "fixed",
          bottom: bottomOffset,
          right: 20,
          zIndex: 900,
          width: 52,
          height: 52,
          borderRadius: "50%",
          border: "none",
          cursor: "pointer",
          background: "linear-gradient(135deg, var(--accent, #C84B31), var(--secondary, #4A7C6F))",
          color: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 4px 20px rgba(0,0,0,0.25)",
          transition: "transform 0.2s, box-shadow 0.2s",
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(1.08)"; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)"; }}
      >
        {open ? (
          <CloseOutlined style={{ fontSize: 18 }} />
        ) : (
          <svg viewBox="0 0 24 24" width={22} height={22} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        )}
      </button>

      {/* Chat panel */}
      {open && (
        <div
          className="anim-scale-in"
          style={{
            position: "fixed",
            bottom: bottomOffset + 64,
            right: 20,
            zIndex: 901,
            width: isMobile ? "calc(100vw - 40px)" : 360,
            maxWidth: 360,
            height: 480,
            borderRadius: 20,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            boxShadow: "0 8px 40px rgba(0,0,0,0.22)",
            border: "1px solid var(--border)",
            background: "var(--surface)",
            transformOrigin: "bottom right",
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: "14px 16px",
              background: "linear-gradient(135deg, var(--accent, #C84B31), var(--secondary, #4A7C6F))",
              display: "flex",
              alignItems: "center",
              gap: 10,
              flexShrink: 0,
            }}
          >
            <div style={{ borderRadius: "50%", overflow: "hidden", flexShrink: 0 }}>
              <SimonAvatar size={36} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#fff", fontFamily: "var(--font-display)" }}>
                Simon
              </div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.8)" }}>
                English conversation coach
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.8)", padding: 4, borderRadius: 6 }}
              aria-label="Đóng"
            >
              <CloseOutlined style={{ fontSize: 14 }} />
            </button>
          </div>

          {/* Messages */}
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "12px 14px",
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >
            {msgs.map((msg) => (
              <div
                key={msg.id}
                style={{
                  display: "flex",
                  gap: 8,
                  justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
                  alignItems: "flex-end",
                }}
              >
                {msg.role === "assistant" && (
                  <div style={{ borderRadius: "50%", overflow: "hidden", flexShrink: 0 }}>
                    <SimonAvatar size={26} />
                  </div>
                )}
                <div
                  style={{
                    maxWidth: "78%",
                    padding: "9px 12px",
                    borderRadius: msg.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                    fontSize: 13,
                    lineHeight: 1.55,
                    ...(msg.role === "user"
                      ? {
                          background: "var(--accent, #C84B31)",
                          color: "#fff",
                        }
                      : {
                          background: "var(--bg-deep, var(--bg))",
                          color: "var(--text-primary)",
                          border: "1px solid var(--border)",
                        }),
                  }}
                >
                  {msg.text
                  ? msg.text
                  : streaming && msg.role === "assistant" && msgs[msgs.length - 1].id === msg.id
                    ? <LoadingOutlined spin style={{ fontSize: 12, opacity: 0.5 }} />
                    : null
                }
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div
            style={{
              padding: "10px 12px",
              borderTop: "1px solid var(--border)",
              display: "flex",
              gap: 8,
              alignItems: "flex-end",
              background: "var(--surface)",
              flexShrink: 0,
            }}
          >
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Nhập tin nhắn..."
              rows={1}
              style={{
                flex: 1,
                resize: "none",
                border: "1px solid var(--border)",
                borderRadius: 12,
                padding: "8px 12px",
                fontSize: 13,
                fontFamily: "var(--font-body)",
                background: "var(--bg)",
                color: "var(--text-primary)",
                outline: "none",
                lineHeight: 1.5,
                maxHeight: 80,
                overflowY: "auto",
              }}
              onInput={(e) => {
                const t = e.currentTarget;
                t.style.height = "auto";
                t.style.height = `${Math.min(t.scrollHeight, 80)}px`;
              }}
            />
            <button
              onClick={send}
              disabled={!input.trim() || streaming}
              aria-label="Gửi"
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                border: "none",
                cursor: input.trim() && !streaming ? "pointer" : "not-allowed",
                background: input.trim() && !streaming
                  ? "var(--accent, #C84B31)"
                  : "var(--border)",
                color: input.trim() && !streaming ? "#fff" : "var(--text-muted)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                transition: "background 0.2s",
              }}
            >
              {streaming ? (
                <LoadingOutlined spin style={{ fontSize: 13 }} />
              ) : (
                <SendOutlined style={{ fontSize: 13 }} />
              )}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
