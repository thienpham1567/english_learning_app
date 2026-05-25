"use client";

import { useState, type ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import { motion } from "motion/react";
import { Copy, Check, Volume2, Pause, RotateCcw, Loader2 } from "lucide-react";
import { useUser } from "@/components/shared/UserContext";
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
      className="rounded-full p-1.5 text-slate-500 hover:bg-slate-800 hover:text-slate-200 transition-all cursor-pointer"
      onClick={handleCopy}
      aria-label="Sao chép"
    >
      {copied ? (
        <Check className="h-3 w-3" />
      ) : (
        <Copy className="h-3 w-3" />
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
      className={`rounded-full p-1.5 transition-all cursor-pointer ${
        active ? "text-accent bg-accent/10 animate-pulse" : "text-slate-500 hover:bg-slate-800 hover:text-slate-200"
      }`}
      onClick={() => active ? onStop() : onSpeak(text)}
      disabled={isLoading}
      aria-label={isSpeaking ? "Dừng phát" : isLoading ? "Đang tải..." : "Nghe phát âm"}
    >
      {isLoading ? (
        <Loader2 className="h-3 w-3 animate-spin" />
      ) : isSpeaking ? (
        <Pause className="h-3 w-3" />
      ) : (
        <Volume2 className="h-3 w-3" />
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
        className="w-8 h-8 rounded-full object-cover border border-slate-850 shadow-sm"
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
    <div className="grid place-items-center w-8 h-8 rounded-full bg-slate-900 border border-slate-850 text-[10px] font-bold text-slate-300 shadow-sm">
      {initials}
    </div>
  );
}

// Helper to extract text content safely for copy/tts functions
function extractText(children: ReactNode): string {
  if (typeof children === "string") return children;
  if (typeof children === "number") return String(children);
  if (Array.isArray(children)) return children.map(extractText).join("");
  if (children && typeof children === "object" && "props" in children) {
    return extractText((children as unknown as { props?: { children?: ReactNode } }).props?.children);
  }
  return "";
}

function InlineCode({ children }: { children: ReactNode }) {
  return (
    <code className="px-1.5 py-0.5 rounded bg-slate-805 text-slate-100 font-mono text-[0.85em]">
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
      /* clipboard blocked */
    }
  };

  return (
    <div className="relative my-2.5 rounded-xl border border-slate-850 bg-slate-900 overflow-hidden shadow-sm">
      <div className="flex items-center justify-between px-4 py-2 border-b border-slate-850 bg-slate-950/40 text-[10px] text-slate-500 font-mono font-bold uppercase tracking-wider">
        <span>{lang || "code"}</span>
        <button
          onClick={onCopy}
          className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer"
          aria-label="Sao chép"
        >
          {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
          <span>{copied ? "Đã chép" : "Sao chép"}</span>
        </button>
      </div>
      <pre className="m-0 p-3.5 overflow-x-auto text-[12px] leading-relaxed font-mono text-slate-200">
        <code className={className}>{children}</code>
      </pre>
    </div>
  );
}

function RegenerateButton({ onRegenerate }: { onRegenerate: () => void }) {
  return (
    <button
      className="rounded-full p-1.5 text-slate-500 hover:bg-slate-800 hover:text-slate-200 transition-all cursor-pointer"
      onClick={onRegenerate}
      aria-label="Tạo lại"
      title="Tạo lại phản hồi"
    >
      <RotateCcw className="h-3 w-3" />
    </button>
  );
}

export function ChatMessage({
  message,
  isStreaming = false,
  persona,
  onSpeak,
  isSpeaking = false,
  isTtsLoading = false,
  onStopSpeak,
  onRegenerate,
  isLastAssistant = false,
}: {
  message: PageMessage;
  isStreaming?: boolean;
  persona?: Persona;
  onSpeak?: (text: string) => void;
  isSpeaking?: boolean;
  isTtsLoading?: boolean;
  onStopSpeak?: () => void;
  onRegenerate?: () => void;
  isLastAssistant?: boolean;
}) {
  if (message.role === "divider") {
    return (
      <div className="flex items-center gap-4 py-3">
        <div className="h-px flex-1 bg-slate-850" />
        <span className="text-[10px] font-bold tracking-wider uppercase text-slate-500 font-mono">{message.text}</span>
        <div className="h-px flex-1 bg-slate-850" />
      </div>
    );
  }

  const isUser = message.role === "user";
  const text = message.text.trim();
  if (!text && !isStreaming) return null;

  const time = formatTime();

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 260, damping: 25 }}
      className={`group flex items-end gap-3 w-full ${isUser ? "justify-end" : "justify-start"}`}
    >
      {!isUser && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full overflow-hidden border border-slate-850 shadow-sm">
          {persona ? <persona.avatar size={32} /> : <div className="bg-slate-900 w-full h-full" />}
        </div>
      )}

      <div className={`flex flex-col gap-1.5 max-w-[80%] ${isUser ? "items-end" : "items-start"}`}>
        <div
          className={`rounded-2xl px-4 py-3 text-sm shadow-sm leading-relaxed ${
            isUser
              ? "rounded-br-sm bg-accent text-white font-medium"
              : "rounded-bl-sm border border-slate-850 bg-slate-900/40 text-slate-100"
          }`}
        >
          {isUser ? (
            <span className="whitespace-pre-wrap">{text}</span>
          ) : (
            <div className="chat-markdown prose prose-invert prose-sm max-w-none text-slate-200">
              <ReactMarkdown
                components={{
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
                  className="inline-block h-3.5 w-1.5 bg-accent ml-0.5 align-middle animate-pulse rounded-sm"
                  aria-hidden="true"
                />
              )}
            </div>
          )}
        </div>
        
        {/* Metadata section (fades in on hover of message container) */}
        <div className="flex items-center gap-2 text-[10px] font-semibold text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity duration-200 mt-0.5">
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
        <div className="shrink-0">
          <UserAvatar />
        </div>
      )}
    </motion.div>
  );
}
