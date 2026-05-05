"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";
import { CloseOutlined, SendOutlined, LoadingOutlined } from "@ant-design/icons";
import { SimonAvatar } from "@/app/(app)/english-chatbot/_components/persona-avatars/SimonAvatar";
import { api } from "@/lib/api-client";
import { parseAssistantStream } from "@/lib/chat/parse-assistant-stream";

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
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  if (pathname?.startsWith("/english-chatbot")) return null;
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
      const res = await api.post<Response>(
        "/chat",
        { messages: apiMessages, personaId: "simon" },
        { raw: true, signal: ctrl.signal },
      );

      await parseAssistantStream(
        res,
        {
          onDelta: (delta) => {
            setMsgs((prev) =>
              prev.map((m) =>
                m.id === assistantId ? { ...m, text: m.text + delta } : m,
              ),
            );
          },
          onDone: () => {},
          onError: () => {
            setMsgs((prev) =>
              prev.map((m) =>
                m.id === assistantId
                  ? { ...m, text: "Gia sư đang gặp lỗi. Bạn thử lại nhé." }
                  : m,
              ),
            );
          },
        },
        ctrl.signal,
      );
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        setMsgs((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? { ...m, text: "Gia sư đang gặp lỗi. Bạn thử lại nhé." }
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
              background: "var(--surface)",
              flexShrink: 0,
            }}
          >
            <div
              className="fcw-input-wrap"
              style={{
                display: "flex",
                gap: 6,
                alignItems: "flex-end",
                border: "1.5px solid var(--border)",
                borderRadius: 14,
                padding: "6px 6px 6px 12px",
                background: "var(--bg)",
                transition: "border-color 0.18s, box-shadow 0.18s",
              }}
              onFocusCapture={(e) => {
                const el = e.currentTarget as HTMLDivElement;
                el.style.borderColor = "var(--accent)";
                el.style.boxShadow = "0 0 0 3px color-mix(in srgb, var(--accent) 14%, transparent)";
              }}
              onBlurCapture={(e) => {
                const el = e.currentTarget as HTMLDivElement;
                // delay so click on send button doesn't flicker
                setTimeout(() => {
                  if (!el.contains(document.activeElement)) {
                    el.style.borderColor = "var(--border)";
                    el.style.boxShadow = "none";
                  }
                }, 100);
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
                  border: "none",
                  background: "transparent",
                  padding: "5px 0",
                  fontSize: 13,
                  fontFamily: "var(--font-body)",
                  color: "var(--text-primary)",
                  outline: "none",
                  lineHeight: 1.55,
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
                  width: 30,
                  height: 30,
                  borderRadius: "50%",
                  border: "none",
                  cursor: input.trim() && !streaming ? "pointer" : "default",
                  background: input.trim() && !streaming
                    ? "linear-gradient(135deg, var(--accent), color-mix(in srgb, var(--accent) 75%, black))"
                    : "var(--bg-deep)",
                  color: input.trim() && !streaming ? "#fff" : "var(--text-muted)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  transition: "background 0.18s, transform 0.15s",
                  boxShadow: input.trim() && !streaming
                    ? "0 2px 8px color-mix(in srgb, var(--accent) 35%, transparent)"
                    : "none",
                }}
                onMouseEnter={(e) => { if (input.trim() && !streaming) (e.currentTarget as HTMLButtonElement).style.transform = "scale(1.1)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)"; }}
              >
                {streaming ? (
                  <LoadingOutlined spin style={{ fontSize: 12 }} />
                ) : (
                  <SendOutlined style={{ fontSize: 12 }} />
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
