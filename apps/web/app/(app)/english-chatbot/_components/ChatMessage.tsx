"use client";

import { useState, type ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import { CheckOutlined, CopyOutlined, TrophyOutlined, SoundOutlined, PauseCircleOutlined, ReloadOutlined } from "@ant-design/icons";
import { useUser } from "@/components/shared/UserContext";
import { HighlightedText } from "@/app/(app)/english-chatbot/_components/HighlightedText";
import type { ChatMessage as AppChatMessage } from "@/lib/chat/types";
import type { Persona } from "@/lib/chat/personas";

export type DividerMessage = {
  id: string;
  role: "divider";
  text: string;
};

export type PageMessage = AppChatMessage | DividerMessage;

function formatTime() {
  try {
    return new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <button
      style={{
        borderRadius: "50%",
        padding: 4,
        color: "var(--text-muted)",
        background: "none",
        border: "none",
        cursor: "pointer",
        transition: "color 0.2s",
      }}
      onClick={handleCopy}
      aria-label="Sao chép"
    >
      {copied ? (
        <CheckOutlined style={{ fontSize: 13 }} />
      ) : (
        <CopyOutlined style={{ fontSize: 13 }} />
      )}
    </button>
  );
}

function SpeakButton({ text, onSpeak, isSpeaking, isLoading, onStop }: {
  text: string;
  onSpeak: (text: string) => void;
  isSpeaking: boolean;
  isLoading?: boolean;
  onStop: () => void;
}) {
  const active = isSpeaking || isLoading;
  return (
    <button
      style={{
        borderRadius: "50%",
        padding: 4,
        color: active ? "var(--accent)" : "var(--text-muted)",
        background: "none",
        border: "none",
        cursor: isLoading ? "wait" : "pointer",
        transition: "color 0.2s",
        animation: isSpeaking ? "pulse 1.5s infinite" : "none",
      }}
      onClick={() => active ? onStop() : onSpeak(text)}
      disabled={isLoading}
      aria-label={isSpeaking ? "Dừng phát" : isLoading ? "Đang tải..." : "Nghe phát âm"}
    >
      {isLoading ? (
        <span style={{ fontSize: 12 }}>⏳</span>
      ) : isSpeaking ? (
        <PauseCircleOutlined style={{ fontSize: 13 }} />
      ) : (
        <SoundOutlined style={{ fontSize: 13 }} />
      )}
    </button>
  );
}

function UserAvatar() {
  const user = useUser();

  if (user.image) {
    return (
      <img
        src={user.image}
        alt={user.name}
        style={{ width: 40, height: 40, borderRadius: "50%", objectFit: "cover" }}
        referrerPolicy="no-referrer"
      />
    );
  }

  const initials = user.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      style={{
        display: "grid",
        placeItems: "center",
        width: 40,
        height: 40,
        borderRadius: "50%",
        background: "var(--ink)",
        fontSize: 12,
        fontWeight: 600,
        color: "#fff",
      }}
    >
      {initials}
    </div>
  );
}

// Recursively process ReactMarkdown children to inject word highlighting
function highlightChildren(
  children: ReactNode,
  onWordClick: (word: string, rect: DOMRect) => void,
  savedWords?: Set<string>,
): ReactNode {
  if (typeof children === "string") {
    return <HighlightedText text={children} onWordClick={onWordClick} savedWords={savedWords} />;
  }
  if (Array.isArray(children)) {
    return children.map((child, i) =>
      typeof child === "string" ? (
        <HighlightedText key={i} text={child} onWordClick={onWordClick} savedWords={savedWords} />
      ) : (
        child
      ),
    );
  }
  return children;
}

function extractText(children: ReactNode): string {
  if (typeof children === "string") return children;
  if (typeof children === "number") return String(children);
  if (Array.isArray(children)) return children.map(extractText).join("");
  if (children && typeof children === "object" && "props" in children) {
    // biome-ignore lint/suspicious/noExplicitAny: ReactNode shape
    return extractText((children as any).props?.children);
  }
  return "";
}

function InlineCode({ children }: { children: ReactNode }) {
  return (
    <code
      style={{
        padding: "2px 6px",
        borderRadius: 6,
        background: "var(--bg-deep)",
        fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
        fontSize: "0.9em",
        color: "var(--ink)",
      }}
    >
      {children}
    </code>
  );
}

function CodeBlock({ children, className }: { children: ReactNode; className?: string }) {
  const [copied, setCopied] = useState(false);
  const text = extractText(children);
  const lang = className?.replace(/^language-/, "") || "";

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard blocked — no-op */
    }
  };

  return (
    <div
      style={{
        position: "relative",
        margin: "8px 0",
        borderRadius: 12,
        border: "1px solid var(--border)",
        background: "var(--bg-deep)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "6px 12px",
          borderBottom: "1px solid var(--border)",
          fontSize: 11,
          color: "var(--text-muted)",
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
          textTransform: "uppercase",
          letterSpacing: 0.5,
        }}
      >
        <span>{lang || "code"}</span>
        <button
          onClick={onCopy}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            padding: "2px 6px",
            border: "none",
            background: "none",
            color: "var(--text-muted)",
            cursor: "pointer",
            fontSize: 11,
          }}
          aria-label="Sao chép"
        >
          {copied ? <CheckOutlined /> : <CopyOutlined />}
          {copied ? "Đã chép" : "Sao chép"}
        </button>
      </div>
      <pre
        style={{
          margin: 0,
          padding: "12px 14px",
          overflowX: "auto",
          fontSize: 13,
          lineHeight: 1.55,
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
          color: "var(--text-primary)",
        }}
      >
        <code className={className}>{children}</code>
      </pre>
    </div>
  );
}

function RegenerateButton({ onRegenerate }: { onRegenerate: () => void }) {
  return (
    <button
      style={{
        borderRadius: "50%",
        padding: 4,
        color: "var(--text-muted)",
        background: "none",
        border: "none",
        cursor: "pointer",
        transition: "color 0.2s",
      }}
      onClick={onRegenerate}
      aria-label="Tạo lại"
      title="Tạo lại phản hồi"
    >
      <ReloadOutlined style={{ fontSize: 13 }} />
    </button>
  );
}

export function ChatMessage({
  message,
  isStreaming = false,
  persona,
  onWordClick,
  savedWords,
  onSpeak,
  isSpeaking = false,
  isTtsLoading = false,
  onStopSpeak,
  onRegenerate,
  isLastAssistant = false,
}: {
  message: PageMessage;
  className?: string;
  isStreaming?: boolean;
  persona?: Persona;
  onWordClick?: (word: string, rect: DOMRect) => void;
  savedWords?: Set<string>;
  onSpeak?: (text: string) => void;
  isSpeaking?: boolean;
  isTtsLoading?: boolean;
  onStopSpeak?: () => void;
  onRegenerate?: () => void;
  isLastAssistant?: boolean;
}) {
  if (message.role === "divider") {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0" }}>
        <div style={{ height: 1, flex: 1, background: "var(--border)" }} />
        <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{message.text}</span>
        <div style={{ height: 1, flex: 1, background: "var(--border)" }} />
      </div>
    );
  }

  const isUser = message.role === "user";
  const text = message.text.trim();
  if (!text && !isStreaming) return null;

  const time = formatTime();

  return (
    <div
      className="anim-fade-up"
      style={{
        display: "flex",
        alignItems: "flex-end",
        gap: 12,
        justifyContent: isUser ? "flex-end" : "flex-start",
      }}
    >
      {!isUser && (
        <div
          style={{
            display: "grid",
            placeItems: "center",
            width: 32,
            height: 32,
            flexShrink: 0,
            borderRadius: "50%",
            background: "var(--ink)",
            color: "#fff",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          {persona ? <persona.avatar size={5} /> : <TrophyOutlined style={{ fontSize: 14 }} />}
        </div>
      )}

      <div
        style={{
          display: "flex",
          maxWidth: "min(42rem, 80%)",
          flexDirection: "column",
          gap: 8,
          alignItems: isUser ? "flex-end" : "flex-start",
        }}
      >
        <div
          style={{
            borderRadius: 22,
            padding: "12px 16px",
            boxShadow: "var(--shadow-sm)",
            ...(isUser
              ? { borderBottomRightRadius: 6, background: "var(--bubble-user)", color: "#fff" }
              : {
                  borderBottomLeftRadius: 6,
                  border: "1px solid var(--border)",
                  background: "var(--bubble-ai)",
                  color: "var(--text-primary)",
                }),
          }}
        >
          {isUser ? (
            <span style={{ whiteSpace: "pre-wrap" }}>{text}</span>
          ) : (
            <div
              className="chat-markdown"
              style={{ fontSize: 15, lineHeight: 2, color: "var(--text-primary)" }}
            >
              <ReactMarkdown
                components={{
                  ...(onWordClick
                    ? {
                        p: ({ children }) => <p>{highlightChildren(children, onWordClick, savedWords)}</p>,
                        li: ({ children }) => <li>{highlightChildren(children, onWordClick, savedWords)}</li>,
                        strong: ({ children }) => <strong>{highlightChildren(children, onWordClick, savedWords)}</strong>,
                        em: ({ children }) => <em>{highlightChildren(children, onWordClick, savedWords)}</em>,
                      }
                    : {}),
                  code: ({ className, children }) =>
                    className ? (
                      <CodeBlock className={className}>{children}</CodeBlock>
                    ) : (
                      <InlineCode>{children}</InlineCode>
                    ),
                  pre: ({ children }) => <>{children}</>,
                }}
              >
                {text}
              </ReactMarkdown>
              {isStreaming && (
                <span
                  style={{
                    marginLeft: 2,
                    display: "inline-block",
                    height: "1em",
                    width: 2,
                    transform: "translateY(2px)",
                    borderRadius: 1,
                    background: "var(--accent)",
                    verticalAlign: "middle",
                    animation: "textCursor 0.7s ease-in-out infinite",
                  }}
                  aria-hidden="true"
                />
              )}
            </div>
          )}
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontSize: 12,
            color: "var(--text-muted)",
            opacity: 0,
            transition: "opacity 0.2s",
          }}
          className="chat-meta"
        >
          {time && <span>{time}</span>}
          {!isUser && onSpeak && onStopSpeak && (
            <SpeakButton text={text} onSpeak={onSpeak} isSpeaking={isSpeaking} isLoading={isTtsLoading} onStop={onStopSpeak} />
          )}
          {!isUser && isLastAssistant && onRegenerate && !isStreaming && (
            <RegenerateButton onRegenerate={onRegenerate} />
          )}
          {!isUser && <CopyButton text={text} />}
        </div>
      </div>

      {isUser && (
        <div
          style={{
            display: "grid",
            placeItems: "center",
            width: 40,
            height: 40,
            flexShrink: 0,
            overflow: "hidden",
            borderRadius: "50%",
            background: "var(--ink)",
            fontSize: 12,
            fontWeight: 600,
            color: "#fff",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <UserAvatar />
        </div>
      )}
    </div>
  );
}
