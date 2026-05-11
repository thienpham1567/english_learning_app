"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";
import { CloseOutlined, SendOutlined, LoadingOutlined } from "@ant-design/icons";
import { SimonAvatar } from "@/app/(app)/english-chatbot/_components/persona-avatars/SimonAvatar";
import { api } from "@/lib/api-client";
import { parseAssistantStream } from "@/lib/chat/parse-assistant-stream";
import * as m from "motion/react-client";
import { AnimatePresence } from "motion/react";

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

  if (pathname?.startsWith("/english-chatbot")) return null;

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
      <m.button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Đóng chat" : "Mở chat"}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        style={{
          position: "fixed",
          bottom: bottomOffset,
          right: 20,
          zIndex: 900,
          width: 56,
          height: 56,
          borderRadius: "50%",
          border: "none",
          cursor: "pointer",
          background: "linear-gradient(135deg, var(--accent), #4A7C6F)",
          color: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 4px 20px rgba(0,0,0,0.25)",
        }}
      >
        <AnimatePresence mode="wait" initial={false}>
          {open ? (
            <m.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <CloseOutlined style={{ fontSize: 20 }} />
            </m.div>
          ) : (
            <m.div
              key="chat"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <svg viewBox="0 0 24 24" width={24} height={24} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </m.div>
          )}
        </AnimatePresence>
      </m.button>

      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <m.div
            initial={{ opacity: 0, scale: 0.8, y: 20, transformOrigin: "bottom right" }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ type: "spring", stiffness: 350, damping: 25 }}
            style={{
              position: "fixed",
              bottom: bottomOffset + 68,
              right: 20,
              zIndex: 901,
              width: isMobile ? "calc(100vw - 40px)" : 380,
              maxWidth: 380,
              height: 520,
              borderRadius: 24,
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              boxShadow: "0 12px 48px rgba(0,0,0,0.25)",
              border: "1px solid var(--border)",
              background: "var(--surface)",
            }}
          >
            {/* Header */}
            <div
              style={{
                padding: "16px 20px",
                background: "linear-gradient(135deg, var(--accent), #4A7C6F)",
                display: "flex",
                alignItems: "center",
                gap: 12,
                flexShrink: 0,
              }}
            >
              <m.div
                initial={{ scale: 0.8, rotate: -10 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.2 }}
                style={{ borderRadius: "50%", overflow: "hidden", flexShrink: 0, border: "2px solid rgba(255,255,255,0.2)" }}
              >
                <SimonAvatar size={40} />
              </m.div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <m.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.25 }}
                  style={{ fontSize: 16, fontWeight: 700, color: "#fff", fontFamily: "var(--font-display)" }}
                >
                  Simon
                </m.div>
                <m.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  style={{ fontSize: 12, color: "rgba(255,255,255,0.85)", letterSpacing: "0.01em" }}
                >
                  English conversation coach
                </m.div>
              </div>
              <m.button
                whileHover={{ background: "rgba(255,255,255,0.1)" }}
                onClick={() => setOpen(false)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.9)", padding: 6, borderRadius: 8, transition: "background 0.2s" }}
                aria-label="Đóng"
              >
                <CloseOutlined style={{ fontSize: 16 }} />
              </m.button>
            </div>

            {/* Messages */}
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "20px",
                display: "flex",
                flexDirection: "column",
                gap: 12,
                background: "var(--bg-deep)",
              }}
            >
              {msgs.map((msg, idx) => (
                <m.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.3, delay: idx === msgs.length - 1 ? 0 : 0.05 }}
                  style={{
                    display: "flex",
                    gap: 10,
                    justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
                    alignItems: "flex-end",
                  }}
                >
                  {msg.role === "assistant" && (
                    <div style={{ borderRadius: "50%", overflow: "hidden", flexShrink: 0, boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
                      <SimonAvatar size={28} />
                    </div>
                  )}
                  <div
                    style={{
                      maxWidth: "85%",
                      padding: "10px 14px",
                      borderRadius: msg.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                      fontSize: 14,
                      lineHeight: 1.6,
                      boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
                      ...(msg.role === "user"
                        ? {
                            background: "var(--accent)",
                            color: "#fff",
                          }
                        : {
                            background: "var(--surface)",
                            color: "var(--ink)",
                            border: "1px solid var(--border)",
                          }),
                    }}
                  >
                    {msg.text
                      ? msg.text
                      : streaming && msg.role === "assistant" && msgs[msgs.length - 1].id === msg.id
                        ? <LoadingOutlined spin style={{ fontSize: 14, opacity: 0.5 }} />
                        : null
                    }
                  </div>
                </m.div>
              ))}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div
              style={{
                padding: "14px 16px",
                borderTop: "1px solid var(--border)",
                background: "var(--surface)",
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  alignItems: "flex-end",
                  border: "2px solid var(--border)",
                  borderRadius: 16,
                  padding: "6px 6px 6px 14px",
                  background: "var(--bg-deep)",
                  transition: "border-color 0.2s",
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
                    padding: "6px 0",
                    fontSize: 14,
                    fontFamily: "var(--font-body)",
                    color: "var(--ink)",
                    outline: "none",
                    boxShadow: "none",
                    lineHeight: 1.5,
                    maxHeight: 100,
                    overflowY: "auto",
                  }}
                  onInput={(e) => {
                    const t = e.currentTarget;
                    t.style.height = "auto";
                    t.style.height = `${Math.min(t.scrollHeight, 100)}px`;
                  }}
                />
                <m.button
                  whileHover={input.trim() && !streaming ? { scale: 1.1 } : {}}
                  whileTap={input.trim() && !streaming ? { scale: 0.9 } : {}}
                  onClick={send}
                  disabled={!input.trim() || streaming}
                  aria-label="Gửi"
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    border: "none",
                    cursor: input.trim() && !streaming ? "pointer" : "default",
                    background: input.trim() && !streaming
                      ? "linear-gradient(135deg, var(--accent), color-mix(in srgb, var(--accent) 70%, black))"
                      : "var(--border)",
                    color: input.trim() && !streaming ? "#fff" : "var(--text-muted)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    transition: "background 0.2s",
                    boxShadow: input.trim() && !streaming ? "0 4px 12px rgba(0,0,0,0.15)" : "none",
                  }}
                >
                  {streaming ? (
                    <LoadingOutlined spin style={{ fontSize: 14 }} />
                  ) : (
                    <SendOutlined style={{ fontSize: 14 }} />
                  )}
                </m.button>
              </div>
            </div>
          </m.div>
        )}
      </AnimatePresence>
    </>
  );
}
